import ejs from 'ejs';
import { readFileSync } from 'fs';
import path from 'path';
import { CompetitionInfo } from '../../config/types';
import { sendInfoEmail } from '../../services/email';
import config from '../../config/config';
import juice from 'juice';
import { render } from '../renderer';
import { Util } from '../../util/util';

// Type for template data
interface EmailData {
    community: { id: number; name: string };
}

export function sendCommunityRequestedEmail(data: EmailData) {
    render(data, 'community-requested').then((html) => {
        sendInfoEmail({
            body: {
                to: `Staff <${config.staff_email}>`,
                subject: `(Action required) Hunter: New community requested`,
                html: html,
            },
        });
    });
}
