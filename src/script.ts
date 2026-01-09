import 'dotenv/config';
import { Account, RpcProvider } from 'starknet';
import cron from 'node-cron';

interface CronTask {
    name: string;
    schedule: string;
    func: () => Promise<void> | void;
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
        // TODO: Agregar lógica de notificaciones
        console.log('[Notifications] Ejecutando...');
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
