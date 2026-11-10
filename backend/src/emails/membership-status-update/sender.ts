import { sendInfoEmail } from '../../services/email';
import { render } from '../renderer';
// Type for template data
interface EmailData {
    user: { email: string; name: string };
    status: 'Rejected' | 'Disabled' | 'Accepted';
    community_data: {
        id: number;
        name: string;
        url: string;
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
                () => reject(),
            );
        });
    });

    return p;
}
