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
    community: { name: string; url: string };
    competitions: Array<{
        id: number;
        title: string;
        description: string;
        url: string;
    }>;
}

export function sendNewCompetitionsInCommunity(data: EmailData) {
    data.competitions.forEach((c) => {
        c.description =
            c.description.substring(0, 56) || 'No description provided';

        c.description = c.description + '...';
        c.title = c.title || 'Untitled';
    });
    let p = new Promise<void>((resolve, reject) => {
        render(data, 'new-community-contests').then((html) => {
            sendInfoEmail({
                body: {
                    to: `${data.user.name || 'Hunter user'} <${
                        data.user.email
                    }>`,
                    subject: `🏆 Fresh Opportunities to Hunt & Win - Community Contests Alert`,
                    html: html,
                },
            })
                .then(
                    () => resolve(),
                    (err) => reject(err)
                )
                .catch((err) => reject(err));
        });
    });

    return p;
}
