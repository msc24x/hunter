import { UserInfo } from '../../config/types';
import { sendRenderedEmail } from '../../services/email';
import config from '../../config/config';
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

    sendRenderedEmail(data, 'announcement', {
        to: `${user!.name || 'Hunter'} <${user!.email}>`,
        subject: `Unlock More with Hunter 🚀: Latest Product Release Notes`,
    });
}
