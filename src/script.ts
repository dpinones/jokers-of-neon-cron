import './shared/config';
import cron from 'node-cron';
import { CronTask } from './shared/types';
import { dailyMissionsTask } from './crons/dailyMissions';
import { notificationsTask } from './crons/notifications';

const tasks: CronTask[] = [
    dailyMissionsTask,
    notificationsTask,
];

tasks.forEach(task => {
    cron.schedule(task.schedule, task.func);
    console.log(`${task.name} programado: ${task.schedule}`);
});

console.log('Todos los crons iniciados. Proceso corriendo...');
