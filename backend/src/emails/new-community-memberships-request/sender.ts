import { sendRenderedEmail } from '../../services/email';

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
    return sendRenderedEmail(data, 'new-community-memberships-request', {
        to: `${data.user.name || 'Hunter user'} <${data.user.email}>`,
        subject: `New pending requests to join your Hunter Communities - ${data.total} new`,
    });
}
