import { supabase } from '../shared/config';
import { CronTask } from '../shared/types';
import {
    sendPushNotification,
    getCurrentHourInTimezone,
    isWithinNotificationHours,
    getEnabledDevices,
    getTodayInTimezone
} from '../shared/utils';

interface LocalizedMessage {
    title: string;
    body: string;
}

interface CustomNotification {
    id: string;
    notification_type: 'push_reminders_enabled' | 'push_events_enabled';
    scheduled_date: string;
    scheduled_hour: number;
    messages: Record<string, LocalizedMessage>;
    active: boolean;
}

function getLocalizedMessage(messages: Record<string, LocalizedMessage>, language: string): LocalizedMessage {
    return messages[language] || messages['en'] || Object.values(messages)[0] || { title: '', body: '' };
}

async function sendCustomNotifications(): Promise<void> {
    try {
        console.log('[CustomNotifications] Ejecutando...');

        const { data: notifications, error: notifError } = await supabase
            .from('custom_notifications')
            .select('*')
            .eq('active', true);

        if (notifError) throw notifError;

        if (!notifications || notifications.length === 0) {
            console.log('[CustomNotifications] No hay notificaciones activas');
            return;
        }

        console.log(`[CustomNotifications] ${notifications.length} notificaciones activas`);

        const devices = await getEnabledDevices();
        let notifiedCount = 0;

        for (const notification of notifications as CustomNotification[]) {
            for (const device of devices) {
                try {
                    const { data: userPrefs, error: userError } = await supabase
                        .from('user_preferences')
                        .select('push_reminders_enabled, push_events_enabled, timezone, language')
                        .eq('wallet', device.wallet)
                        .single();

                    if (userError || !userPrefs) continue;

                    const prefEnabled = (userPrefs as Record<string, unknown>)[notification.notification_type];
                    if (!prefEnabled) continue;

                    const userTimezone = userPrefs.timezone;
                    const currentHour = getCurrentHourInTimezone(userTimezone);
                    const userToday = getTodayInTimezone(userTimezone);

                    if (!isWithinNotificationHours(currentHour)) continue;
                    if (userToday !== notification.scheduled_date) continue;
                    if (currentHour !== notification.scheduled_hour) continue;

                    const { title, body } = getLocalizedMessage(notification.messages, userPrefs.language);
                    const sent = await sendPushNotification(device.fcm_token, title, body);

                    if (sent) {
                        notifiedCount++;
                        console.log(`[CustomNotifications] Enviado a ${device.wallet}: ${title}`);
                    }
                } catch (fetchError) {
                    console.error(`[CustomNotifications] Error processing ${device.wallet}:`, fetchError);
                }
            }
        }

        console.log(`[CustomNotifications] ${notifiedCount} notificaciones enviadas`);
    } catch (error) {
        console.error('[CustomNotifications] Error:', error);
    }
}

export const customNotificationsTask: CronTask = {
    name: 'Custom Notifications',
    schedule: '* * * * *',
    func: sendCustomNotifications
};
