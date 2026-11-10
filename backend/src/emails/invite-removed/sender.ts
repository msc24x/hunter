import { CompetitionInvite } from '../../config/types';
import { sendRenderedEmail } from '../../services/email';
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

    sendRenderedEmail(data, 'invite-removed', {
        to: `${competition_invite!.email} <${competition_invite!.email}>`,
        subject: `Invited contest access revoked`,
    });
}
