import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';
import { Competitions } from '../database/models/Competitions';
import Container from 'typedi';
import 'reflect-metadata';
import { sendAnnouncementEmail } from '../emails/announcement/sender';
import { UserInfo } from '../config/types';

var client = Container.get(DatabaseProvider).client();

async function main() {
    client.users.findMany().then((users) => {
        users.forEach((user) => {
            sendAnnouncementEmail(user as UserInfo);
        });
    });
}

client.$connect().then(() => main());
