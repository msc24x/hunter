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
    community_data: Array<{
        id: number;
        name: string;
        count: number;
        url: string;
    }>;
}

export function sendCommunityMembershipsRequest(data: EmailData) {
    let p = new Promise<void>((resolve, reject) => {
        render(data, 'new-community-memberships-request').then((html) => {
            sendInfoEmail({
                body: {
                    to: `${data.user.name || 'Hunter user'} <${
                        data.user.email
                    }>`,
                    subject: `New pending requests to join your Hunter Communities - ${data.total} new`,
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
