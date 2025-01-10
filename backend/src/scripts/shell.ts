import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';

var client = new DatabaseProvider().client();

async function main() {
    await client.results.deleteMany({
        where: {
            question_id: 107,
        },
    });
}

client.$connect().then(() => main());
