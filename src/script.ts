import './shared/config';
import cron from 'node-cron';
import { CronTask } from './shared/types';
import { generateMissionsTask } from './crons/generateMissions';
import { missionsReminderTask } from './crons/missionsReminder';
import { freePacksTask } from './crons/freePacks';
import { customNotificationsTask } from './crons/customNotifications';

const tasks: CronTask[] = [
    generateMissionsTask,
    missionsReminderTask,
    freePacksTask,
    customNotificationsTask,
];

tasks.forEach(task => {
    cron.schedule(task.schedule, task.func);
    console.log(`${task.name} programado: ${task.schedule}`);
});

console.log('Todos los crons iniciados. Proceso corriendo...');
