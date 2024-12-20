import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';

var client = new DatabaseProvider().client();

async function main() {}

client.$connect().then(() => main());
