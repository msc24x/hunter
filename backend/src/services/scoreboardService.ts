import Container, { Service } from 'typedi';
import {
    ExeInfo,
    HunterExecutable,
    QuestionInfo,
    UserInfo,
} from '../config/types';
import { DatabaseProvider } from './databaseProvider';

const client = Container.get(DatabaseProvider).client();

@Service()
export class ScoreboardService {
    async updateResult(
        user: UserInfo,
        hunterExecutable: HunterExecutable,
        exeInfo: ExeInfo,
        question: QuestionInfo
    ) {
        var points = -1 * question.neg_points;

        if (exeInfo.success) {
            points = question.points;
        }

        const results = await client.results.findFirst({
            where: {
                user_id: user.id,
                result: {
                    gt: 0,
                },
                question: {
                    id: hunterExecutable.for.question_id,
                    competition_id: hunterExecutable.for.competition_id,
                },
            },
        });

        // If user has already solved this competition, then set the points to
        // zero regardless of the solution's acceptance, as any submission prior
        // to the user's success should not affect the user's final score.
        if (results) {
            points = 0;
        }

        client.results
            .create({
                data: {
                    result: points,
                    created_at: new Date(),
                    language: hunterExecutable.solution.lang,
                    meta: exeInfo.meta,
                    question_id: hunterExecutable.for.question_id,
                    user_id: user.id,
                    submission: hunterExecutable.solution.code,
                },
            })
            .catch((err) => {
                console.error(err);
            });
    }
}
