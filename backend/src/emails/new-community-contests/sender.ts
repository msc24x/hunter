import { sendRenderedEmail } from '../../services/email';

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

    return sendRenderedEmail(data, 'new-community-contests', {
        to: `${data.user.name || 'Hunter user'} <${data.user.email}>`,
        subject: `🏆 Fresh Opportunities to Hunt & Win - Community Contests Alert`,
    });
}
