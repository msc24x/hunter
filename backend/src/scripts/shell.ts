import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';

var client = new DatabaseProvider().client();

async function main() {
    await client.competition_session.deleteMany({
        where: {
            competition_id: 154,
            user_id: 1,
        },
    });
}

client.$connect().then(() => main());
