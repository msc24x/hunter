import { PoolConnection, QueryError } from 'mysql2';
import Container, { Inject, Service } from 'typedi';
import { Result, UserInfo } from '../../config/types';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Prisma } from '@prisma/client';

export class Results {
    dbConnection!: PoolConnection;
    client = Container.get(DatabaseProvider).client();

    dbService: DatabaseProvider = Container.get(DatabaseProvider);

    getScoresQuery(
        filterQuestion: boolean,
        queryParams: {
            id: string;
            after: number;
            question_id?: number;
        }
    ) {
        const questionQuery = Prisma.sql`AND q.id = ${queryParams.question_id}`;

        const scoresQuery = Prisma.sql`
            SELECT
                s.*,
                @curRank := @curRank + 1 AS user_rank
            FROM
                (SELECT @curRank := 0) currRankTable,
                (
                    SELECT
                        r.user_id, 
                        u.name AS user_name,
                        MAX(r.created_at) AS created_at,
                        SUM(case when r.result > 0 then r.result else 0 end) AS result,
                        SUM(case when r.result < 0 then r.result else 0 end) AS neg_result,
                        SUM(r.result) AS final_result,
                        COUNT(DISTINCT r.question_id) AS questions_attempted
                    FROM
                        results r
                    JOIN 
                        questions q ON r.question_id = q.id
                    JOIN 
                        competitions c ON q.competition_id = c.id
                    JOIN 
                        users u ON r.user_id = u.id
                    WHERE
                        q.deleted_at IS NULL 
                        AND c.deleted_at IS NULL 
                        AND q.competition_id = ${queryParams.id}
                        ${filterQuestion ? questionQuery : Prisma.empty}
                    GROUP BY 
                        r.user_id
                    ORDER BY
                        final_result DESC,
                        result DESC,
                        created_at DESC
                ) s
            ORDER BY
                user_rank ASC
            LIMIT
                ${queryParams.after}, 10
        `;

        return scoresQuery;
    }

    constructor() {
        this.dbService.getInstance().then((conn) => {
            this.dbConnection = conn;
        });
    }

    post(params: any, callback: (err: QueryError | null) => void) {
        let p = 0;

        if (params.result == 0) p = 1;

        this.dbConnection.query(
            `insert into results(user_id, question_id, competition_id, result, penalities) values(?, ?, ?, ?, ?);`,
            [
                params.user_id,
                params.question_id,
                params.competition_id,
                params.result,
                p,
            ],
            (err) => {
                callback(err);
            }
        );
    }

    update(
        id: string,
        result: string,
        callback: (err: QueryError | null) => void
    ) {
        let p = 0;

        if (result == '0') p = 1;

        this.dbConnection.query(
            `update results set result = ?, penalities = penalities + ? where id = ? ;`,
            [result, p, id],
            (err) => {
                callback(err);
            }
        );
    }

    getCompetitionScoresCount(
        callback: (res: any | null, err: QueryError | null) => void,
        id: string,
        question_id?: number
    ) {
        var params = [id];
        var question_where;

        if (question_id) {
            question_where = Prisma.sql`AND q.id = ${question_id}`;

            params.push(question_id.toString());
        }

        this.client.$queryRaw`
            SELECT
                COUNT(DISTINCT r.user_id) as total_count,
                COUNT(DISTINCT r.question_id) as questions_attempted
            FROM
                results r
            JOIN 
                questions q ON r.question_id = q.id
            JOIN 
                competitions c ON q.competition_id = c.id
            JOIN 
                users u ON r.user_id = u.id
            WHERE
                q.deleted_at IS NULL 
                AND c.deleted_at IS NULL 
                AND q.competition_id = ${id}
                ${question_id ? question_where : Prisma.empty}
                ;
            `
            .then((rows) => {
                callback((rows as Array<any>)[0], null);
            })
            .catch((err) => {
                if (err) {
                    callback(null, err);
                    return;
                }
            });
    }

    getCompetitionScores(
        callback: (
            res: { meta: any; rows: any } | null,
            err: QueryError | null
        ) => void,
        id: string,
        user?: UserInfo,
        after?: number,
        question_id?: number
    ) {
        after = after || 0;

        var params: {
            id: string;
            after: number;
            question_id?: number;
        } = {
            id: id,
            after: after,
        };

        if (question_id) {
            params.question_id = question_id;
        }

        this.client.$queryRaw`
            ${this.getScoresQuery(Boolean(question_id), params)}
        `
            .then((rows) => {
                this.getCompetitionScoresCount(
                    (total_counts, err) => {
                        if (err) {
                            callback(null, err);
                            return;
                        }

                        var meta: any = {
                            total: parseInt(total_counts.total_count),
                            questions_attempted: parseInt(
                                total_counts.questions_attempted
                            ),
                            user_details: null,
                        };

                        if (!user?.id) {
                            callback({ meta, rows }, null);
                            return;
                        }

                        this.client.$queryRaw`
                            SELECT
                                ranked_users.*
                            FROM (
                                ${this.getScoresQuery(Boolean(question_id), {
                                    id: id,
                                    after: 0,
                                    question_id: question_id,
                                })}
                            ) ranked_users
                            WHERE
                                user_id = ${user.id};
                        `
                            .then((rank_rows) => {
                                meta.user_details = (
                                    rank_rows as Array<Result>
                                )[0];

                                callback(
                                    {
                                        meta,
                                        rows,
                                    },
                                    err
                                );
                            })
                            .catch((err) => {
                                if (err) {
                                    callback(null, err);
                                    return;
                                }
                            });
                    },
                    id,
                    question_id
                );
            })
            .catch((err) => {
                if (err) {
                    callback(null, err);
                    return;
                }
            });
    }

    findAll(
        params: any,
        callback: (rows: any, err: QueryError | null) => void
    ) {
        let query =
            'select results.*, users.id, users.name from results inner join users on results.user_id = users.id where true ';
        let args = [];

        if (params.user_id) {
            query += ` and user_id = ?`;
            args.push(params.user_id);
        }
        if (params.competition_id) {
            query += ` and competition_id = ?`;
            args.push(params.competition_id);
        }
        if (params.question_id) {
            query += ` and question_id = ?`;
            args.push(params.question_id);
        }
        if (params.id) {
            query += ` and id = ?`;
            args.push(params.id);
        }

        query += ';';

        this.dbConnection.query(query, args, (err, rows) => {
            callback(rows, err);
        });
    }
}
