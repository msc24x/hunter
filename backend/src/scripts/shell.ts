import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';

var client = new DatabaseProvider().client();

async function main() {
    await client.results.delete({
        where: {
            id: 52,
        },
    });
}

client.$connect().then(() => main());
