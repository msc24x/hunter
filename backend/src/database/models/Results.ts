import { QueryError } from 'mysql2';
import Container, { Inject, Service } from 'typedi';
import { Result, UserInfo } from '../../config/types';
import { DatabaseProvider } from '../../services/databaseProvider';

export class Results {
    dbConnection;

    dbService: DatabaseProvider = Container.get(DatabaseProvider);

    getScoresQuery(filterQuestion = false) {
        const scoresQuery = `
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
                        SUM(r.result) AS final_result
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
                        AND q.competition_id = ?
                        ${filterQuestion ? 'AND q.id = ?' : ''}
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
                ?, 10
        `;

        return scoresQuery;
    }

    constructor() {
        this.dbConnection = () => this.dbService.getInstance();
    }

    post(params: any, callback: (err: QueryError | null) => void) {
        let p = 0;

        if (params.result == 0) p = 1;

        this.dbConnection().query(
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

        this.dbConnection().query(
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

        if (question_id) {
            params.push(question_id.toString());
        }

        this.dbConnection().query(
            `
            SELECT
                COUNT(DISTINCT r.user_id) as total_count
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
                AND q.competition_id = ?
                ${question_id ? 'AND q.id = ?' : ''}
                ;
            `,
            params,
            (err, rows) => {
                if (err) {
                    callback(null, err);
                    return;
                }

                callback((rows as Array<any>)[0].total_count, null);
            }
        );
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

        var queryParams = [id, after];

        if (question_id) {
            queryParams = [id, question_id, after];
        }

        this.dbConnection().query(
            `${this.getScoresQuery(Boolean(question_id))};`,
            queryParams,
            (err, rows) => {
                if (err) {
                    callback(null, err);
                    return;
                }

                this.getCompetitionScoresCount(
                    (total_count, err) => {
                        if (err) {
                            callback(null, err);
                            return;
                        }

                        var meta: any = {
                            total: total_count,
                            user_details: null,
                        };

                        if (!user?.id) {
                            callback({ meta, rows }, null);
                            return;
                        }

                        this.dbConnection().query(
                            `
                        SELECT
                            ranked_users.*
                        FROM (
                            ${this.getScoresQuery(Boolean(question_id))}
                        ) ranked_users
                        WHERE
                            user_id = ?;`,
                            [
                                ...queryParams.slice(0, queryParams.length - 1),
                                0,
                                user?.id,
                            ],
                            (err, rank_rows) => {
                                if (err) {
                                    callback(null, err);
                                    return;
                                }

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
                            }
                        );
                    },
                    id,
                    question_id
                );
            }
        );
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

        this.dbConnection().query(query, args, (err, rows) => {
            callback(rows, err);
        });
    }
}
