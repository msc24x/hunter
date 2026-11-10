import { Community, UserInfo } from '../../config/types';
import { sendRenderedEmail } from '../../services/email';
import config from '../../config/config';

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

    return sendRenderedEmail(data, 'community-status-changed', {
        to: `${data.user.name || 'Hunter user'} <${data.user.email}>`,
        subject: `Hunter Communities: Community status changed `,
    });
}
