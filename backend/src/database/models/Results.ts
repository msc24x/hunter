import { QueryError } from 'mysql2';
import Container from 'typedi';
import { Result, UserInfo } from '../../config/types';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Prisma } from '@prisma/client';

export class Results {
    client = Container.get(DatabaseProvider).client();

    getScoresQuery(
        filterQuestion: boolean,
        queryParams: {
            id: string;
            after: number;
            question_id?: number;
            batch_size?: number;
        },
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
                        u.avatar_url AS user_avatar_url,
                        CONVERT_TZ(MAX(case when r.result >= 0 then r.created_at else 0 end), @@session.time_zone, '+00:00') AS created_at,
                        TIMESTAMPDIFF(
                            SECOND,
                            (
                                SELECT competition_session.created_at
                                FROM competition_session
                                WHERE 
                                    competition_session.user_id = r.user_id
                                    AND competition_session.competition_id = c.id
                                LIMIT 1
                            ),
                            MAX(case when r.result >= 0 then r.created_at else 0 end)
                        ) AS created_at_diff,
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
                        r.user_id,
                        c.id
                    ORDER BY
                        final_result DESC,
                        result DESC,
                        created_at_diff ASC,
                        created_at ASC
                ) s
            ORDER BY
                user_rank ASC
            LIMIT
                ${queryParams.after}, ${queryParams.batch_size}
        `;

        return scoresQuery;
    }

    getCompetitionScoresCount(
        callback: (res: any | null, err: QueryError | null) => void,
        id: string,
        question_id?: number,
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
            err: QueryError | null,
        ) => void,
        id: string,
        user?: UserInfo,
        after?: number,
        question_id?: number,
        batch_size?: number,
    ) {
        after = after || 0;
        batch_size = batch_size || 10;

        var params: {
            id: string;
            after: number;
            question_id?: number;
            batch_size?: number;
        } = {
            id: id,
            after: after,
            batch_size: batch_size,
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
                                total_counts.questions_attempted,
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
                                    batch_size: batch_size,
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
                                    err,
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
                    question_id,
                );
            })
            .catch((err) => {
                if (err) {
                    callback(null, err);
                    return;
                }
            });
    }
}
