import ejs from 'ejs';
import { readFileSync } from 'fs';
import path from 'path';
import { CompetitionInfo, UserInfo } from '../../config/types';
import { sendInfoEmail } from '../../services/email';
import config from '../../config/config';
import juice from 'juice';
import { render } from '../renderer';
import { Util } from '../../util/util';

// Type for template data
interface EmailData {
    user: {
        id: number;
        name: string;
        email: string;
    };
    url: string;
}

export function sendAnnouncementEmail(user: UserInfo) {
    var data: EmailData = {} as EmailData;

    data.user = {
        id: user!.id,
        email: user!.email,
        name: Util.getFirstName(user!.name || user.email.split('@')[0]),
    };

    data.url = `${config.protocol}://${config.frontend}`;

    render(data, 'announcement').then((html) => {
        sendInfoEmail({
            body: {
                to: `${user!.name || 'Hunter'} <${user!.email}>`,
                subject: `Unlock More with Hunter 🚀: Latest Product Release Notes`,
                html: html,
            },
        });
    });
}
