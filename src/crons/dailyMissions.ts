import { account } from '../shared/config';
import { CronTask } from '../shared/types';

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

export const dailyMissionsTask: CronTask = {
    name: 'Daily Missions',
    schedule: process.env.DAILY_MISSION_CRON_SCHEDULE || '1 0 * * *',
    func: generateDailyMissions
};
