import Container, { Service } from 'typedi';
import models from '../database/containers/models';
import { User } from '../database/models/User';
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
        var points = question.neg_points;

        if (exeInfo.success) {
            points = question.points;
        }

        client.results.create({
            data: {
                result: points,
                created_at: new Date(),
                language: hunterExecutable.solution.lang,
                meta: exeInfo.meta,
                question_id: hunterExecutable.for.question_id,
                user_id: user.id,
                submission: hunterExecutable.solution.code,
            },
        });
    }
}
