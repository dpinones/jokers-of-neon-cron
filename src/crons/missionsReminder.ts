import { supabase } from '../shared/config';
import { CronTask, DailyMissionsResponse, NotificationMessage } from '../shared/types';
import { sendPushNotification, getCurrentHourInTimezone, getEnabledDevices } from '../shared/utils';

const NOTIFICATION_HOUR = parseInt(process.env.DAILY_MISSIONS_NOTIFICATION_HOUR || '20', 10);

function getHoursUntilReset(): number {
    const now = new Date();
    const argentinaFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: 'numeric',
        hour12: false
    });
    const currentHourArgentina = parseInt(argentinaFormatter.format(now), 10);

    // Reset is at 3am Argentina time
    if (currentHourArgentina >= 3) {
        return 24 - currentHourArgentina + 3;
    }
    return 3 - currentHourArgentina;
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

async function sendMissionsReminder(): Promise<void> {
    try {
        console.log('[MissionsReminder] Ejecutando...');

        const devices = await getEnabledDevices();
        const apiUrl = `${process.env.DATA_API_URL!}/api/daily-missions`;
        let notifiedCount = 0;

        for (const device of devices) {
            try {
                const { data: userPrefs, error: userError } = await supabase
                    .from('user_preferences')
                    .select('push_reminders_enabled, timezone, language')
                    .eq('wallet', device.wallet)
                    .single();

                if (userError || !userPrefs) continue;
                if (!userPrefs.push_reminders_enabled) continue;

                const currentHour = getCurrentHourInTimezone(userPrefs.timezone);
                if (currentHour !== NOTIFICATION_HOUR) continue;

                const response = await fetch(`${apiUrl}?player=${device.wallet}`);
                const missionsData: DailyMissionsResponse = await response.json();

                const completed = missionsData.missions.map(m => m?.completed ?? false);
                const allCompleted = completed.every(c => c);

                if (allCompleted) continue;

                const pendingCount = completed.filter(c => !c).length;
                const hoursRemaining = getHoursUntilReset();
                const { title, body } = getLocalizedMessage(userPrefs.language, pendingCount, hoursRemaining);

                const sent = await sendPushNotification(device.fcm_token, title, body);

                if (sent) {
                    notifiedCount++;
                    console.log(`[MissionsReminder] Enviado a ${device.wallet} (${userPrefs.language})`);
                }
            } catch (fetchError) {
                console.error(`[MissionsReminder] Error processing ${device.wallet}:`, fetchError);
            }
        }

        console.log(`[MissionsReminder] ${notifiedCount} usuarios notificados`);
    } catch (error) {
        console.error('[MissionsReminder] Error:', error);
    }
}

export const missionsReminderTask: CronTask = {
    name: 'Missions Reminder',
    schedule: process.env.NOTIFICATIONS_CRON_SCHEDULE || '0 * * * *',
    func: sendMissionsReminder
};
