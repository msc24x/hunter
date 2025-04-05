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
    transport.sendMail(params.body, (error, info) => {
        if (error) {
            return console.error('[Email] failed', error);
        }

        console.info('[Email]', params.body.from, 'to', params.body.to);
    });
}

export function sendInfoEmail(params: {
    body: {
        to: string;
        subject: string;
        html: string;
    };
}) {
    sendEmail({
        body: {
            from: 'Hunter Contests <hunter@cambo.in>',
            ...params.body,
        },
    });
}
