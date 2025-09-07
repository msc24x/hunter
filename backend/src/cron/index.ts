import cron, { TaskContext } from 'node-cron';
import { newSubmissionsReminder } from './tasks';
import Container from 'typedi';
import { DatabaseProvider } from '../services/databaseProvider';

const client = Container.get(DatabaseProvider).client();

const logTask = (handler: (context: TaskContext) => void) => {
    return async (context: TaskContext) => {
        console.log(`[CRON] [${context.task?.name}] ${context.triggeredAt}`);
        await handler(context);
    };
};

const tasks = [
    {
        name: 'new_submissions_reminder',
        expression: '0 6 * * *', // Every day at 6 AM
        handler: logTask(newSubmissionsReminder),
    },
];

export function registerTasks() {
    tasks.forEach(async (task) => {
        try {
            cron.schedule(task.expression, task.handler, { name: task.name });

            let taskObj = await client.cron_job.findFirst({
                where: { name: task.name },
            });

            if (!taskObj) {
                taskObj = await client.cron_job.create({
                    data: { name: task.name, last_run_at: null },
                });
                console.log(`[CRON] New task created ${task.name}`);
            }

            console.log(`[CRON] Registered ${task.name}`);
        } catch (error) {
            console.error('[CRON] Failed to register task', task.name, error);
        }
    });
}
