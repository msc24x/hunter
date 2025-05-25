import nodemailer from 'nodemailer';
import config from '../config/config';

var transport = nodemailer.createTransport(config.smtp);

function sendEmail(params: {
    body: {
        from: string;
        to: string;
        subject: string;
        html: string;
    };
}) {
    return new Promise<void>((resolve, reject) => {
        transport.sendMail(params.body, (error, info) => {
            if (error) {
                reject();
                return console.error('[Email] failed', error);
            }

            resolve();
            console.info('[Email]', params.body.from, 'to', params.body.to);
        });
    });
}

export function sendInfoEmail(params: {
    body: {
        to: string;
        subject: string;
        html: string;
    };
}) {
    return sendEmail({
        body: {
            from: 'Hunter Contests <hunter@cambo.in>',
            ...params.body,
        },
    });
}
