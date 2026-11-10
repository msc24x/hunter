import { CompetitionInvite } from '../../config/types';
import { sendInfoEmail } from '../../services/email';
import { render } from '../renderer';
import { Util } from '../../util/util';

// Type for template data
interface EmailData {
    user: {
        name: string;
        email: string;
    };
    contest: {
        title: string;
    };
}

export function sendInviteRemovedEmail(competition_invite: CompetitionInvite) {
    var data: EmailData = {} as EmailData;
    var competition = competition_invite.competition!;

    data.contest = {
        title: competition.title,
    };

    data.user = {
        email: competition.host_user!.email,
        name: Util.getFirstName(
            competition.host_user!.name || 'Anonymous Hunter user',
        ),
    };

    render(data, 'invite-removed').then((html) => {
        sendInfoEmail({
            body: {
                to: `${competition_invite!.email} <${
                    competition_invite!.email
                }>`,
                subject: `Invited contest access revoked`,
                html: html,
            },
        });
    });
}
