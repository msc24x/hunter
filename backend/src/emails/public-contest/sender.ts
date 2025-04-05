import ejs from 'ejs';
import { readFileSync } from 'fs';
import path from 'path';
import { CompetitionInfo } from '../../config/types';
import { sendInfoEmail } from '../../services/email';
import config from '../../config/config';
import juice from 'juice';
import { render } from '../renderer';

// Type for template data
interface EmailData {
    user: {
        name: string;
        email: string;
    };
    contest: {
        title: string;
        url: string;
        startDate: Date;
        endDate: Date;
        scoreboard: string;
    };
}

export function sendPublicContestEmail(competition: CompetitionInfo) {
    var data: EmailData = {} as EmailData;

    data.contest = {
        title: competition.title,
        url: `${config.protocol}://${config.frontend}/compete/p/${competition.id}`,
        scoreboard: `${config.protocol}://${config.frontend}/editor/${competition.id}/data/insights`,
        startDate: competition.scheduled_at,
        endDate: competition.scheduled_end_at,
    };

    data.user = {
        email: competition.host_user!.email,
        name: competition.host_user!.name || 'User',
    };

    render(data, 'public-contest').then((html) => {
        sendInfoEmail({
            body: {
                to: `${competition.host_user!.name} <${
                    competition.host_user!.email
                }>`,
                subject: `You contest is now public`,
                html: html,
            },
        });
    });
}
