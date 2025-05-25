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
            competition.host_user!.name || 'Anonymous Hunter user'
        ),
    };

    const client = Container.get(DatabaseProvider).client();

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
