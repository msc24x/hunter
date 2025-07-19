import { exit } from 'process';
import { DatabaseProvider } from '../services/databaseProvider';
import { Competitions } from '../database/models/Competitions';
import Container from 'typedi';
import 'reflect-metadata';
import { sendAnnouncementEmail } from '../emails/announcement/sender';
import { UserInfo } from '../config/types';

var client = Container.get(DatabaseProvider).client();

const readline = require('node:readline'); // Use 'node:readline' for Node.js 16+

// Create an interface for input and output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Prompts the user for a yes/no confirmation.
 * @param {string} question The question to ask the user.
 * @returns {Promise<boolean>} A promise that resolves to true for 'yes' and false for 'no'.
 */
function askConfirmation(question: string) {
    return new Promise((resolve) => {
        rl.question(`${question} (y/n): `, (answer: string) => {
            const lowerCaseAnswer = answer.toLowerCase();
            if (lowerCaseAnswer === 'y' || lowerCaseAnswer === 'yes') {
                resolve(true);
            } else if (lowerCaseAnswer === 'n' || lowerCaseAnswer === 'no') {
                resolve(false);
            } else {
                console.log('Invalid input. Please enter "y" or "n".');
                // Recursively ask again for valid input
                askConfirmation(question).then(resolve);
            }
        });
    });
}

/**
 * Prompts the user for input and returns the response as a string.
 * @param question The question to ask the user.
 * @returns A promise that resolves to the user's input.
 */
function askInput(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(`${question}: `, (answer: string) => {
            resolve(answer);
        });
    });
}

/**
 * Handles confirmation and sending emails to users.
 * @param users Array of UserInfo objects.
 */
async function confirmAndSend(users: UserInfo[]) {
    console.log('The following users will receive the email:');
    users.forEach((u) => {
        console.log(`ID: ${u.id}, Email: ${u.email}`);
    });

    const confirmed = await askConfirmation('Do you want to proceed?');
    if (confirmed) {
        for (const user of users) {
            await sendAnnouncementEmail(user);
        }
        console.log('Emails sent.');
    } else {
        console.log('Operation cancelled.');
    }
    rl.close();
}

/**
 * Main script logic.
 */
async function main() {
    // Step 1: Ask for single or range
    const isSingle = await askConfirmation(
        'Do you want to pick a single user id? (No for range)'
    );

    let users: UserInfo[] = [];

    if (isSingle) {
        // Step 2: Ask for user id
        const id = await askInput('Enter the user id');
        const user = await client.users.findFirst({
            where: { id: parseInt(id, 10), email_updates_disabled_at: null },
        });

        if (!user) {
            console.log('User not found, or has unsubscribed from mails.');
            rl.close();
            return;
        }

        users = [user as UserInfo];
    } else {
        // Step 2: Ask for range
        const input = await askInput(
            'Enter the user id range as two comma-separated integers (start,end)'
        );
        const [start, end] = input
            .split(',')
            .map((s) => parseInt(s.trim(), 10));

        if (isNaN(start) || isNaN(end) || start >= end) {
            console.error('Invalid range.');
            rl.close();
            return;
        }

        users = (await client.users.findMany({
            where: {
                id: {
                    gte: start,
                    lt: end,
                },
                email_updates_disabled_at: null,
            },
        })) as UserInfo[];

        if (users.length === 0) {
            console.error('No users found in the given range.');
            rl.close();
            return;
        }
    }

    await confirmAndSend(users);
}

client.$connect().then(() => main());
