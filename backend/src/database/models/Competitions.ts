import mysql, { Connection, PoolConnection, QueryError } from 'mysql2';
import { CompetitionInfo, CompetitionInvite } from '../../config/types';
import { DatabaseProvider } from '../../services/databaseProvider';
import Container, { Inject, Service } from 'typedi';
import { sendContentInviteEmail } from '../../emails/contest-invite/sender';

export class Competitions {
    private db: DatabaseProvider;
    private dbConnection!: PoolConnection;

    constructor() {
        this.db = Container.get(DatabaseProvider);
        this.db.getInstance().then((conn) => {
            this.dbConnection = conn;
        });
    }

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
        vis: 'PRIVATE' | 'PUBLIC' | 'INVITE'
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

    add(
        host_user_id: number,
        title: string,
        callback: (err: QueryError | null, rows: any) => void
    ) {
        this.dbConnection.query(
            ` insert into competitions( host_user_id, title, created_at, rating, public, scheduled_at) values( ?, ?, NOW() , 0, false, NOW() )  ;`,
            [host_user_id, title],
            (err) => {
                this.dbConnection.query(
                    `select * from competitions where host_user_id = ? order by created_at desc;`,
                    [host_user_id],
                    (err, rows) => {
                        callback(err, rows);
                    }
                );
            }
        );
    }

    findAll(
        params: any,
        dateOrder: 1 | 0 | -1,
        isPublic: true | false | -1,
        callback: (competitions: Array<CompetitionInfo>) => void,
        errCallback: (err: QueryError) => void
    ) {
        let query = `select
				competitions.*,
				users.id as host_user__id, users.name as host_user__name
				from competitions
					inner join users on users.id = competitions.host_user_id
				where true = true `;
        let args = [];

        if (params.id) {
            query += `and competitions.id = ? `;
            args.push(params.id);
        }

        if (params.title) {
            query += `and title LIKE ? `;
            args.push('%' + params.title + '%');
        }

        if (params.host_user_id) {
            query += `and host_user_id = ? `;
            args.push(params.host_user_id);
        }

        if (params.duration) {
            query += `and duration = ? `;
            args.push(params.duration);
        }

        if (isPublic != -1) {
            if (isPublic) query += `and visibility = PUBLIC `;
            else query += `and public != PUBLIC `;
        }

        switch (dateOrder) {
            case 1:
                query += `order by created_at `;
                break;
            case -1:
                query += `order by created_at desc`;
                break;
        }
        query += ';';

        this.dbConnection.query(query, args, (err, rows) => {
            if (err) {
                console.log(err);
                errCallback(err);
                return;
            }
            var competitions = rows as Array<CompetitionInfo>;

            rows = competitions.map((row: any) => {
                row.host_user_info = {
                    id: row.host_user__id,
                    name: row.host_user__name,
                    email: '',
                };
                delete row.host_user__id;
                delete row.host_user__name;
                return row;
            });
            callback(competitions);
        });
    }

    delete(params: any, callback: (err: QueryError | null) => void) {
        let args = [];
        let query = 'delete from competitions where ';

        if (params.id) {
            query += ' id = ?;';
            args.push(params.id);
        } else if (params.host_user_id) {
            query += ' host_user_id = ?;';
            args.push(params.host_user_id);
        } else {
            callback(null);
            return;
        }

        this.dbConnection.query(query, args, (err) => {
            callback(err);
        });
    }

    count(callback: (err: QueryError | null, rows: any) => void) {
        this.dbConnection.query(
            ' select count(*) as count from competitions;',
            (err, rows) => {
                if (err) {
                    console.log(err);
                    callback(err, null);
                    return;
                }

                callback(null, rows);
            }
        );
    }
}
