import { sendInfoEmail } from '../../services/email';
import { render } from '../renderer';
import { Util } from '../../util/util';

// Type for template data
interface EmailData {
    user: {
        name: string;
        email: string;
    };
    total: number;
    contests: {
        url: string;
        count: number;
        title: string;
    }[];
}

export function sendNewSubmissionsEmail(data: EmailData) {
    (data.user.name = Util.getFirstName(data.user.name || 'User')),
        render(data, 'new-submissions').then((html) => {
            sendInfoEmail({
                body: {
                    to: `${data.user.name} <${data.user.email}>`,
                    subject: `Contest activity: ${data.total} new submission${
                        data.total > 1 ? 's' : ''
                    }`,
                    html: html,
                },
            });
        });
}
