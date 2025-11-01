import { TaskContext } from 'node-cron';
import Container from 'typedi';
import { DatabaseProvider } from '../services/databaseProvider';
import { sendNewSubmissionsEmail } from '../emails/new-submissions/sender';
import { Util } from '../util/util';
import config from '../config/config';
import { sendCommunityMembershipsRequest } from '../emails/new-community-memberships-request/sender';

const client = Container.get(DatabaseProvider).client();

export async function newSubmissionsReminder(context: TaskContext) {
    let taskObj = await client.cron_job.findFirstOrThrow({
        where: {
            name: context.task!.name,
        },
    });

    let lastRun = taskObj.last_run_at;

    if (!lastRun) {
        // Set lastRun to 6 months ago if it doesn't exist
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        lastRun = sixMonthsAgo;
    }

    let results: Array<{
        host_user_id: number;
        competition_id: number;
        new_results_count: number;
        competition_title: string;
    }> = await client.$queryRaw`
        SELECT 
            c.host_user_id,
            c.id AS competition_id,
            c.title AS competition_title,
            COUNT(r.id) AS new_results_count
        FROM results r
        JOIN questions q 
            ON r.question_id = q.id
        JOIN competitions c 
            ON q.competition_id = c.id
        WHERE r.created_at > ${lastRun}
              AND q.deleted_at IS NULL 
              AND c.deleted_at IS NULL 
        GROUP BY c.host_user_id, c.id;
        `;

    let perUserData: any = {};

    results.forEach((result) => {
        if (!perUserData[result.host_user_id]) {
            perUserData[result.host_user_id] = {
                total: 0,
                contests: [],
            };
        }

        perUserData[result.host_user_id].total += Number(
            result.new_results_count
        );
        perUserData[result.host_user_id].contests.push({
            url: `${config.protocol}://${config.frontend}/editor/${result.competition_id}/data/insights`,
            count: Number(result.new_results_count),
            title: result.competition_title || '(An untitled contest)',
        });
    });

    Object.keys(perUserData).forEach((user_id) => {
        let userData = perUserData[user_id];

        client.users
            .findUniqueOrThrow({ where: { id: Number(user_id) } })
            .then((user) => {
                sendNewSubmissionsEmail({
                    user: {
                        name: user.name || 'User',
                        email: user.email!,
                    },
                    total: Number(userData.total),
                    contests: userData.contests,
                });
            });
    });

    await client.cron_job.update({
        where: { id: taskObj.id },
        data: { last_run_at: new Date() },
    });
}

export async function newCommunityMembershipsReminder(context: TaskContext) {
    // find cron job entry
    let taskObj = await client.cron_job.findFirstOrThrow({
        where: { name: context.task!.name },
    });

    let lastRun = taskObj.last_run_at;
    if (!lastRun) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        lastRun = sixMonthsAgo;
    }

    // collect pending membership requests created since last run,
    // grouped by community and admin user
    let results: Array<{
        admin_user_id: number;
        community_id: number;
        new_requests_count: number;
        community_title: string | null;
    }> = await client.$queryRaw`
        SELECT
            com.admin_user_id AS admin_user_id,
            cm.community_id AS community_id,
            com.name AS community_title,
            COUNT(cm.id) AS new_requests_count
        FROM community_member cm
        JOIN community com ON cm.community_id = com.id
        WHERE cm.status = 'PENDING_APPROVAL'
          AND cm.created_at > ${lastRun}
          AND com.status = 'APPROVED'
        GROUP BY com.admin_user_id, cm.community_id;
    `;

    // group per admin user
    let perUserData: any = {};
    results.forEach((row) => {
        const adminId = Number(row.admin_user_id);
        if (!perUserData[adminId]) {
            perUserData[adminId] = { total: 0, communities: [] };
        }
        perUserData[adminId].total += Number(row.new_requests_count);
        perUserData[adminId].communities.push({
            id: Number(row.community_id),
            name: row.community_title || '(Untitled community)',
            count: Number(row.new_requests_count),
            url: `${config.protocol}://${config.frontend}/communities/browse/${row.community_id}`,
        });
    });

    // send email to each admin
    Object.keys(perUserData).forEach((user_id) => {
        const userData = perUserData[user_id];
        client.users
            .findUniqueOrThrow({ where: { id: Number(user_id) } })
            .then((user) => {
                if (!user) {
                    return;
                }
                console.log(userData);

                sendCommunityMembershipsRequest({
                    user: { name: user.name!, email: user.email! },
                    community_data: userData.communities,
                    total: userData.total,
                });
            })
            .catch((e) => {
                console.error(
                    'Failed to load admin user for membership notification:',
                    e
                );
            });
    });

    // update cron job last run time
    await client.cron_job.update({
        where: { id: taskObj.id },
        data: { last_run_at: new Date() },
    });
}
