import { sendRenderedEmail } from '../../services/email';
import config from '../../config/config';

// Type for template data
interface EmailData {
    community: { id: number; name: string };
}

export function sendCommunityRequestedEmail(data: EmailData) {
    sendRenderedEmail(data, 'community-requested', {
        to: `Staff <${config.staff_email}>`,
        subject: `(Action required) Hunter: New community requested`,
    });
}
