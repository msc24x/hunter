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

            console.info('[Email]', params.body.from, 'to', params.body.to);

            // Delay resolution, to have false rate limiting
            setTimeout(() => {
                resolve();
            }, 1000);
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
