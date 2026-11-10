import { sendRenderedEmail } from '../../services/email';

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
    return sendRenderedEmail(data, 'membership-status-update', {
        to: `${data.user.name || 'Hunter user'} <${data.user.email}>`,
        subject: `Update on ${data.community_data.name} Community membership`,
    });
}
