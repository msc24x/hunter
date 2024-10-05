import { exit } from 'process';
import { DatabaseProvider } from './src/services/databaseProvider';

var client = new DatabaseProvider().client();

async function main() {
    var res = await client.results.findFirst();

    var data = {
        ...res,
    };

    delete data.id;

    var users = await client.results.findMany({
        where: {
            user: {
                name: {
                    startsWith: 'Sa',
                },
            },
        },
    });

    users.forEach((u) => {
        console.log(u.id);

        client.results
            .create({
                data: {
                    user_id: u.id,
                    question_id: 13,
                    result: 10,
                    created_at: res?.created_at,
                    accepted: true,
                    language: res?.language,
                    meta: res?.meta,
                    submission: res?.submission,
                },
            })
            .then(() => {
                console.log('created for ', u.id);
            })
            .catch((err) => {
                console.log('err', err);
            });
    });
}

client.$connect().then(() => main());
