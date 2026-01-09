import 'dotenv/config';
import { Account, RpcProvider } from 'starknet';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import cron from 'node-cron';
import { readFileSync } from 'fs';
import { join } from 'path';

interface CronTask {
    name: string;
    schedule: string;
    func: () => Promise<void> | void;
}

interface UserPreferences {
    wallet: string;
    push_daily_missions_enabled: boolean;
    push_reminders_enabled: boolean;
    push_events_enabled: boolean;
    push_daily_packs_enabled: boolean;
    push_extra1_enabled: boolean;
    push_extra2_enabled: boolean;
    timezone: string;
    language: string;
}

interface Mission {
    player: string;
    day: number;
    mission_id: string;
    completed: boolean;
}

interface DailyMissionsResponse {
    player: string;
    missions: Mission[];
}

interface PushDevice {
    fcm_token: string;
    wallet: string;
    platform: string;
    disabled: boolean;
}

const privateKey = process.env.PRIVATE_KEY;
const address = process.env.ADDRESS;
const rpcUrl = process.env.RPC_URL;

if (!privateKey || !address || !rpcUrl) {
    console.error('Error: Faltan variables de entorno requeridas (PRIVATE_KEY, ADDRESS, RPC_URL)');
    console.log('Copia .env.example a .env y configura tus valores');
    process.exit(1);
}

const provider = new RpcProvider({ nodeUrl: rpcUrl });
const account = new Account({
    provider,
    address,
    signer: privateKey
});

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

const firebaseCredentialsPath = process.env.FIREBASE_CREDENTIALS_PATH || './firebase-credentials.json';
const serviceAccount = JSON.parse(readFileSync(join(process.cwd(), firebaseCredentialsPath), 'utf-8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

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

async function generateDailyMissions(): Promise<void> {
    try {
        const myCall = {
            contractAddress: process.env.DAILY_MISSION_CONTRACT_ADDRESS!,
            entrypoint: 'generate_daily_missions',
            calldata: []
        };
        const nonce = await account.getNonce();
        const { transaction_hash } = await account.execute(myCall, { nonce });
        console.log(`[Daily Missions] tx: ${transaction_hash}`);
    } catch (error) {
        console.error('[Daily Missions] Error:', error);
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

interface NotificationMessage {
    title: string;
    body: string;
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

                if (currentHour !== 15) { // TODO: Cambiar a 20
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

const tasks: CronTask[] = [
    {
        name: 'Daily Missions',
        schedule: process.env.DAILY_MISSION_CRON_SCHEDULE || '1 0 * * *',
        func: generateDailyMissions
    },
    {
        name: 'Notifications',
        schedule: process.env.NOTIFICATIONS_CRON_SCHEDULE || '0 * * * *',
        func: sendNotifications
    },
];

tasks.forEach(task => {
    cron.schedule(task.schedule, task.func);
    console.log(`${task.name} programado: ${task.schedule}`);
});

console.log('Todos los crons iniciados. Proceso corriendo...');
