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
    user: UserInfo;
    community: Community;
    reason: string;
    community_link?: string;
}

export function sendCommunityStatusChangedEmail(data: EmailData) {
    data.community_link = `${config.protocol}://${config.frontend}/communities/browse/${data.community.id}`;

    data.reason = data.reason || '(No reason given)';

    let p = new Promise<void>((resolve, reject) => {
        render(data, 'community-status-changed').then((html) => {
            sendInfoEmail({
                body: {
                    to: `${data.user.name || 'Hunter user'} <${
                        data.user.email
                    }>`,
                    subject: `Hunter Communities: Community status changed `,
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
