import { account } from '../shared/config';
import { CronTask } from '../shared/types';

async function generateMissions(): Promise<void> {
    try {
        const myCall = {
            contractAddress: process.env.DAILY_MISSION_CONTRACT_ADDRESS!,
            entrypoint: 'generate_daily_missions',
            calldata: []
        };
        const nonce = await account.getNonce();
        const { transaction_hash } = await account.execute(myCall, { nonce });
        console.log(`[GenerateMissions] tx: ${transaction_hash}`);
    } catch (error) {
        console.error('[GenerateMissions] Error:', error);
    }
}

export const generateMissionsTask: CronTask = {
    name: 'Generate Missions',
    schedule: process.env.DAILY_MISSION_CRON_SCHEDULE || '1 0 * * *',
    func: generateMissions
};
