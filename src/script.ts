import 'dotenv/config';
import { Account, RpcProvider } from 'starknet';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

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

async function sendNotifications(): Promise<void> {
    try {
        console.log('[Notifications] Ejecutando...');

        const { data, error } = await supabase
            .from('user_preferences')
            .select('wallet, push_reminders_enabled');

        if (error) {
            throw error;
        }

        const users = data as Pick<UserPreferences, 'wallet' | 'push_reminders_enabled'>[];

        for (const user of users) {
            console.log(`wallet: ${user.wallet}, push_reminders_enabled: ${user.push_reminders_enabled}`);
        }

        console.log(`[Notifications] ${users.length} usuarios procesados`);
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
