import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';

var client = new DatabaseProvider().client();

async function main() {
    var users = await client.users.findMany({
        include: {
            competition_sessions: true,
            results: {
                orderBy: {
                    created_at: 'asc',
                },
                include: {
                    question: {
                        select: {
                            competitions: true,
                        },
                    },
                },
            },
        },
    });

    users.forEach((user) => {
        console.log('user', user.id, user.email);
        var seen_contests: number[] = [];

        user.results.forEach(async (res) => {
            var comp_id = res.question.competitions.id;
            var sessionExists =
                user.competition_sessions.filter(
                    (cs) => cs.competition_id === comp_id
                ).length > 0;

            if (sessionExists || seen_contests.includes(comp_id)) {
                // nothing to do
                return;
            }

            var last_success = user.results
                .filter(
                    (ur) =>
                        ur.question.competitions.id === comp_id && ur.accepted
                )
                .sort((p, q) => q.id - p.id)?.[0]?.created_at;

            var data = {
                competition_id: comp_id,
                user_id: user.id,
                created_at:
                    res.question.competitions.scheduled_at ??
                    res.question.competitions.created_at,
                last_success_at: last_success,
            };

            console.log(data);
            seen_contests.push(comp_id);

            var created_data = await client.competition_session.create({
                data: data,
            });
        });
    });
}

client.$connect().then(() => main());
