import ejs from 'ejs';
import { readFileSync } from 'fs';
import path from 'path';
import { CompetitionInfo, CompetitionInvite } from '../../config/types';
import { sendInfoEmail } from '../../services/email';
import config from '../../config/config';
import juice from 'juice';
import { render } from '../renderer';
import { Util } from '../../util/util';
import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';

// Type for template data
interface EmailData {
    user: {
        name: string;
        email: string;
    };
    contest: {
        title: string;
        url: string;
    };
}

export function sendContentInviteEmail(competition_invite: CompetitionInvite) {
    var data: EmailData = {} as EmailData;
    var competition = competition_invite.competition!;

    var inviteId = encodeURIComponent(
        btoa(`${competition_invite.id}-${competition_invite.uuid}`)
    );

    data.contest = {
        title: competition.title,
        url: `${config.protocol}://${config.frontend}/compete/i/${inviteId}`,
    };

    data.user = {
        email: competition.host_user!.email,
        name: Util.getFirstName(competition.host_user!.name || 'A Hunter user'),
    };

    const client = Container.get(DatabaseProvider).client();

    render(data, 'contest-invite').then((html) => {
        sendInfoEmail({
            body: {
                to: `${competition_invite!.email} <${
                    competition_invite!.email
                }>`,
                subject: `👋 ${data.user.name} is inviting you to contest on Hunter`,
                html: html,
            },
        }).then(() => {
            client.competition_invite
                .update({
                    where: {
                        id: competition_invite.id,
                    },
                    data: {
                        sent_at: new Date(),
                    },
                })
                .then(() => {});
        });
    });
}
