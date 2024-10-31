import mysql, { Connection, QueryError } from 'mysql2';
import { CompetitionInfo } from '../../config/types';
import { DatabaseProvider } from '../../services/databaseProvider';
import Container, { Inject, Service } from 'typedi';

export class Competitions {
    private db: DatabaseProvider;
    private dbConnection: () => Connection;

    constructor() {
        this.db = Container.get(DatabaseProvider);
        this.dbConnection = () => this.db.getInstance();
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

    update(data: CompetitionInfo, callback: (err: any) => void) {
        this.db
            .client()
            .competitions.update({
                where: {
                    id: data.id,
                },
                data: {
                    title: data.title,
                    description: data.description,
                    public: data.public,
                },
            })
            .catch((err) => {
                callback(err);
            });
    }

    add(
        host_user_id: number,
        title: string,
        callback: (err: QueryError | null, rows: any) => void
    ) {
        this.dbConnection().query(
            ` insert into competitions( host_user_id, title, created_at, rating, public, scheduled_at) values( ?, ?, NOW() , 0, false, NOW() )  ;`,
            [host_user_id, title],
            (err) => {
                this.dbConnection().query(
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
            if (isPublic) query += `and public = 1 `;
            else query += `and public = 0 `;
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

        this.dbConnection().query(query, args, (err, rows) => {
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

        this.dbConnection().query(query, args, (err) => {
            callback(err);
        });
    }

    count(callback: (err: QueryError | null, rows: any) => void) {
        this.dbConnection().query(
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
