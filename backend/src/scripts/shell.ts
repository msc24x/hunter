import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';
import { Competitions } from '../database/models/Competitions';
import Container from 'typedi';
import 'reflect-metadata';

var client = Container.get(DatabaseProvider).client();

async function main() {
    Competitions.sendInviteEmailToPending(185);
}

client.$connect().then(() => main());
