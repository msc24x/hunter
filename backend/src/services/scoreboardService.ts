import Container, { Service } from 'typedi';
import {
    CodeSolution,
    ExeInfo,
    HunterExecutable,
    QuestionInfo,
    UserInfo,
} from '../config/types';
import { DatabaseProvider } from './databaseProvider';
import config from '../config/config';

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

        var result_data: any = {
            result: points,
            created_at: new Date(),
            user_id: user.id,
            meta: exeInfo.meta,
            question_id: hunterExecutable.for.question_id,
            accepted: exeInfo.success,
        };

        switch (hunterExecutable.for.type) {
            case config.questionTypes.code:
                result_data = {
                    ...result_data,
                    language: (hunterExecutable.solution as CodeSolution).lang,
                    submission: (hunterExecutable.solution as CodeSolution)
                        .code,
                };
                break;

            case config.questionTypes.mcq:
                result_data = {
                    ...result_data,
                    question_choices: {
                        connect: (
                            hunterExecutable.solution as QuestionInfo
                        ).question_choices
                            ?.filter((qChoice) => qChoice.is_correct)
                            .map((qChoice) => {
                                const newChoice = {
                                    id: qChoice.id,
                                };
                                return newChoice;
                            }),
                    },
                };
                break;
            case config.questionTypes.fill:
            case config.questionTypes.long:
                result_data = {
                    ...result_data,
                    submission: (hunterExecutable.solution as QuestionInfo)
                        .user_answer,
                };
                break;
            default:
                throw 'Question type not supported';
                break;
        }

        client.results
            .create({
                data: {
                    ...result_data,
                },
            })
            .catch((err) => {
                console.error(err);
            });
    }
}
