import ejs from 'ejs';
import { readFileSync } from 'fs';
import path from 'path';
import { Community, CompetitionInfo, UserInfo } from '../../config/types';
import { sendInfoEmail } from '../../services/email';
import config from '../../config/config';
import juice from 'juice';
import { render } from '../renderer';
import { Util } from '../../util/util';

// Type for template data
interface EmailData {
    user: { email: string; name: string };
    total: number;
    community_data: {
        id: number;
        name: string;
    };
}

export function sendMembershipStatusEmail(data: EmailData) {
    let p = new Promise<void>((resolve, reject) => {
        render(data, 'membership-status-update').then((html) => {
            sendInfoEmail({
                body: {
                    to: `${data.user.name || 'Hunter user'} <${
                        data.user.email
                    }>`,
                    subject: `Update on ${data.community_data.name} Community membership`,
                    html: html,
                },
            }).then(
                () => resolve(),
                () => reject()
            );
        });
    });

    return p;
}
