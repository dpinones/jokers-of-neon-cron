import { supabase, admin } from '../shared/config';
import { CronTask, DailyMissionsResponse, NotificationMessage, PushDevice } from '../shared/types';

async function sendPushNotification(fcmToken: string, title: string, body: string): Promise<boolean> {
    try {
        await admin.messaging().send({
            token: fcmToken,
            notification: {
                title,
                body
            }
        });
        return true;
    } catch (error) {
        console.error(`[FCM] Error sending to ${fcmToken}:`, error);
        return false;
    }
}

function getCurrentHourInTimezone(timezone: string): number {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: false
        });
        return parseInt(formatter.format(now), 10);
    } catch {
        return -1;
    }
}

function getHoursUntilReset(): number {
    const now = new Date();
    const argentinaFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: 'numeric',
        hour12: false
    });
    const currentHourArgentina = parseInt(argentinaFormatter.format(now), 10);

    // Reset is at 3am Argentina time
    let hoursUntilReset: number;
    if (currentHourArgentina >= 3) {
        hoursUntilReset = 24 - currentHourArgentina + 3;
    } else {
        hoursUntilReset = 3 - currentHourArgentina;
    }

    return hoursUntilReset;
}

function getLocalizedMessage(language: string, pendingCount: number, hoursRemaining: number): NotificationMessage {
    const messages: Record<string, NotificationMessage> = {
        es: {
            title: '⏳ ¡Última llamada!',
            body: `Aún te esperan ${pendingCount} misiones diarias. Tenés ${hoursRemaining} horas para completarlas.`
        },
        en: {
            title: '⏳ Last call!',
            body: `You still have ${pendingCount} daily missions waiting. You have ${hoursRemaining} hours to complete them.`
        },
        pt: {
            title: '⏳ Última chamada!',
            body: `Ainda há ${pendingCount} missões diárias esperando por você. Restam ${hoursRemaining} horas para completá-las.`
        }
    };

    return messages[language] || messages['en'];
}

async function sendNotifications(): Promise<void> {
    try {
        console.log('[Notifications] Ejecutando...');

        const { data: devices, error: devicesError } = await supabase
            .from('push_devices')
            .select('fcm_token, wallet')
            .eq('disabled', false);

        if (devicesError) {
            throw devicesError;
        }

        const apiUrl = process.env.DAILY_MISSIONS_API_URL!;
        let notifiedCount = 0;

        for (const device of devices as Pick<PushDevice, 'fcm_token' | 'wallet'>[]) {
            try {
                const { data: userPrefs, error: userError } = await supabase
                    .from('user_preferences')
                    .select('push_reminders_enabled, timezone, language')
                    .eq('wallet', device.wallet)
                    .single();

                if (userError || !userPrefs) {
                    continue;
                }

                if (!userPrefs.push_reminders_enabled) {
                    continue;
                }

                const currentHour = getCurrentHourInTimezone(userPrefs.timezone);

                if (currentHour !== 20) {
                    continue;
                }

                const response = await fetch(`${apiUrl}?player=${device.wallet}`);
                const missionsData: DailyMissionsResponse = await response.json();

                const easyCompleted = missionsData.missions[0]?.completed ?? false;
                const mediumCompleted = missionsData.missions[1]?.completed ?? false;
                const hardCompleted = missionsData.missions[2]?.completed ?? false;

                const allCompleted = easyCompleted && mediumCompleted && hardCompleted;

                if (allCompleted) {
                    continue;
                }

                const pendingCount = [easyCompleted, mediumCompleted, hardCompleted].filter(c => !c).length;
                const hoursRemaining = getHoursUntilReset();
                const { title, body } = getLocalizedMessage(userPrefs.language, pendingCount, hoursRemaining);

                const sent = await sendPushNotification(device.fcm_token, title, body);

                if (sent) {
                    notifiedCount++;
                    console.log(`[Notifications] Enviado a ${device.wallet} (${userPrefs.language}): ${body}`);
                }
            } catch (fetchError) {
                console.error(`[Notifications] Error processing device ${device.wallet}:`, fetchError);
            }
        }

        console.log(`[Notifications] ${notifiedCount} usuarios notificados (8pm con misiones pendientes)`);
    } catch (error) {
        console.error('[Notifications] Error:', error);
    }
}

export const notificationsTask: CronTask = {
    name: 'Notifications',
    schedule: process.env.NOTIFICATIONS_CRON_SCHEDULE || '0 * * * *',
    func: sendNotifications
};
