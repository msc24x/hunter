import { QueryError } from 'mysql2';
import Container, { Inject, Service } from 'typedi';
import { Result, UserInfo } from '../../config/types';
import { DatabaseProvider } from '../../services/databaseProvider';

export class Results {
    dbConnection;

    dbService: DatabaseProvider = Container.get(DatabaseProvider);

    scoresQuery = `
        SELECT
            r.user_id, 
            u.name AS user_name,
            MAX(r.created_at) AS created_at,
            SUM(case when r.result > 0 then r.result else 0 end) AS result,
            SUM(r.result) AS final_result,
            @curRank := @curRank + 1 AS user_rank
        FROM
            (SELECT @curRank := 0) currRankTable,
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
        GROUP BY 
            r.user_id, u.name
        ORDER BY
            user_rank ASC
    `;

    constructor() {
        this.dbConnection = this.dbService.getInstance();
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

    getCompetitionScores(
        callback: (
            res: { user_details: any; rows: any } | null,
            err: QueryError | null
        ) => void,
        id: string,
        user?: UserInfo
    ) {
        this.dbConnection.query(`${this.scoresQuery};`, [id], (err, rows) => {
            if (err) {
                callback(null, err);
                return;
            }

            if (!user?.id) {
                callback({ user_details: null, rows }, null);
                return;
            }

            this.dbConnection.query(
                `
                    SELECT
                        user_id,
                        user_name,
                        user_rank,
                        created_at,
                        result,
                        final_result
                    FROM (
                        ${this.scoresQuery}
                    ) ranked_users
                    WHERE
                        user_id = ?
                    ORDER BY
                        user_rank ASC;`,
                [id, user?.id],
                (err, rank_rows) => {
                    if (err) {
                        callback(null, err);
                        return;
                    }

                    callback(
                        { user_details: (rank_rows as Array<Result>)[0], rows },
                        err
                    );
                }
            );
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
