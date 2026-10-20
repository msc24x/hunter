import nodemailer from 'nodemailer';
import config from '../config/config';

interface EmailBody {
    from: string;
    to: string;
    subject: string;
    html: string;
}

var providers = config.smtpProviders.map((options, index) => {
    const o = options as { label?: string; host?: string; service?: string };
    return {
        label: `provider[${index}] ${o.label || o.host || o.service || 'smtp'}`,
        transport: nodemailer.createTransport(options),
        failedAt: 0,
    };
});

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resending is only safe when the provider provably never queued the message:
// a definitive rejection, or a failure before the DATA phase. Anything else is
// ambiguous — retrying could send a duplicate.
function isSafeToResend(error: any): boolean {
    if (error.responseCode >= 400) {
        return true;
    }
    const preDataCommands = ['CONN', 'EHLO', 'HELO', 'STARTTLS', 'AUTH', 'MAIL FROM', 'RCPT TO'];
    if (error.command && preDataCommands.includes(error.command)) {
        return true;
    }
    return !error.command && error.code !== 'ESOCKET';
}

async function sendViaProvider(
    provider: (typeof providers)[number],
    body: EmailBody
): Promise<'sent' | 'exhausted' | 'unsafe'> {
    for (var attempt = 1; attempt <= config.smtpMaxRetries; attempt++) {
        try {
            await provider.transport.sendMail(body);
            provider.failedAt = 0;
            return 'sent';
        } catch (error: any) {
            if (!isSafeToResend(error)) {
                console.error(
                    `[Email] ${provider.label} failed after the message may have been queued; not resending to avoid duplicates`,
                    error
                );
                provider.failedAt = Date.now();
                return 'unsafe';
            }
            console.warn(
                `[Email] ${provider.label} attempt ${attempt}/${config.smtpMaxRetries} failed`,
                error.code || error
            );
            if (attempt < config.smtpMaxRetries) {
                await sleep(500 * attempt);
            }
        }
    }
    provider.failedAt = Date.now();
    return 'exhausted';
}

async function sendWithFailover(body: EmailBody): Promise<string> {
    for (const provider of providers) {
        if (provider.failedAt && Date.now() - provider.failedAt < config.smtpFailoverCooldownMs) {
            continue;
        }
        const result = await sendViaProvider(provider, body);
        if (result === 'sent') {
            return provider.label;
        }
        if (result === 'unsafe') {
            throw new Error('send aborted: message may already be queued');
        }
    }
    throw new Error('all SMTP providers exhausted');
}

function sendEmail(params: { body: EmailBody }) {
    return new Promise<void>((resolve, reject) => {
        sendWithFailover(params.body)
            .then((label) => {
                console.info('[Email]', params.body.from, 'to', params.body.to, 'via', label);

                // Delay resolution, to have false rate limiting
                setTimeout(() => {
                    resolve();
                }, 1000);
            })
            .catch((error) => {
                reject();
                console.error('[Email] failed', error);
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
