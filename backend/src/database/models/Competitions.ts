import { CompetitionInvite } from '../../config/types';
import { DatabaseProvider } from '../../services/databaseProvider';
import Container from 'typedi';
import { sendContentInviteEmail } from '../../emails/contest-invite/sender';

export class Competitions {
    isLiveNow(date: Date | null) {
        if (!date) {
            return true;
        }

        return date < new Date();
    }

    hasNotEnded(endDate: Date | null) {
        if (!endDate) return true;
        return new Date() < endDate;
    }

    static async getInvites(id: number, options?: { unsent: boolean }) {
        const client = Container.get(DatabaseProvider).client();

        return await client.competition_invite.findMany({
            where: { competition_id: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                    },
                },
            },
        });
    }

    static async setVisibility(
        id: number,
        vis: 'PRIVATE' | 'PUBLIC' | 'INVITE',
    ) {
        const client = Container.get(DatabaseProvider).client();

        return await client.competitions.update({
            where: { id: id },
            data: { visibility: vis },
        });
    }

    static sendInviteEmailToPending(competition_id: number) {
        const client = Container.get(DatabaseProvider).client();

        client.competition_invite
            .findMany({
                where: {
                    competition_id: competition_id,
                    // sent_at: null,
                    accepted_at: null,
                },
                include: {
                    competition: {
                        include: {
                            host_user: true,
                        },
                    },
                },
            })
            .then((invites) => {
                invites.forEach((invite) => {
                    sendContentInviteEmail(invite as CompetitionInvite);
                });
            });
    }
}
