import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';

var client = new DatabaseProvider().client();

async function main() {
    console.log(
        await client.results.findMany({
            where: {
                user_id: 33,
            },
        })
    );

    console.log(
        await client.competition_session.findMany({
            where: {
                user_id: 33,
            },
        })
    );
}

client.$connect().then(() => main());
