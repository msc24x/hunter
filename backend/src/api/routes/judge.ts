import express from 'express';
import models from '../../database/containers/models';
import { HunterExecutable, QuestionInfo, UserInfo } from '../../config/types';
import { Util } from '../../util/util';
import { existsSync, readFile, writeFile } from 'fs';
import { authenticate, loginRequired } from '../auth';
import { exec } from 'child_process';
import Container from 'typedi';
import { JudgeService } from '../../services/judgeService';
import { ScoreboardService } from '../../services/scoreboardService';
import { resCode } from '../../config/settings';
import { DatabaseProvider } from '../../services/databaseProvider';

const router = express.Router();
const judgeService = Container.get(JudgeService);
const scoreboardService = Container.get(ScoreboardService);
const client = Container.get(DatabaseProvider).client();

router.post('/execute', authenticate, loginRequired, (req, res) => {
    const hunterExecutable = req.body.exec as HunterExecutable;
    const samples = req.body.samples as boolean;
    const user: UserInfo = res.locals.user;

    if (!Util.isValidExecRequest(hunterExecutable)) {
        Util.sendResponse(res, resCode.badRequest, 'executable is not valid');
        return;
    }

    client.questions
        .findUnique({
            where: {
                id: hunterExecutable.for.question_id,
                competition_id: hunterExecutable.for.competition_id,
                competitions: {
                    public: true,
                    deleted_at: null,
                },
                deleted_at: null,
            },
            include: {
                competitions: true,
            },
        })
        .then(async (question) => {
            if (
                !question ||
                !question?.competitions ||
                question?.competitions?.deleted_at
            ) {
                Util.sendResponse(res, resCode.notFound);
                return;
            }

            if (
                !models.competitions.isLiveNow(
                    question.competitions.scheduled_at
                ) ||
                !models.competitions.hasNotEnded(
                    question.competitions.scheduled_end_at
                )
            ) {
                Util.sendResponse(
                    res,
                    resCode.forbidden,
                    'Either the competition is not live or has ended'
                );
                return;
            }

            if (!samples && !Util.doesTestFilesExist(hunterExecutable)) {
                Util.sendResponseJson(res, resCode.success, {
                    output: 'HERR:No test cases has been set for this question',
                });
                return;
            }

            if (samples && (!question.sample_cases || !question.sample_sols)) {
                Util.sendResponseJson(res, resCode.success, {
                    output: 'HERR:No sample test cases has been set for this question',
                });
                return;
            }

            try {
                const resInfo = await judgeService.execute(
                    hunterExecutable,
                    samples,
                    question as QuestionInfo,
                    user
                );

                if (!samples)
                    scoreboardService.updateResult(
                        user,
                        hunterExecutable,
                        resInfo,
                        question as QuestionInfo
                    );

                Util.sendResponseJson(res, resCode.success, resInfo);
            } catch (err) {
                console.log(err);
                Util.sendResponse(res, resCode.serverError);
            }
        })
        .catch((err) => {
            console.log(err);
            Util.sendResponse(res, resCode.serverError);
            return;
        });
});

router.get('/submission/:lang', authenticate, loginRequired, (req, res) => {
    const competition_id = parseInt(req.query.competition_id as string);
    const question_id = req.query.question_id;
    const lang = req.params.lang;
    const user: UserInfo = res.locals.user;

    if (
        !competition_id ||
        !question_id ||
        !Util.getValidLangs().includes(lang)
    ) {
        Util.sendResponse(res, resCode.badRequest);
        return;
    }

    models.questions.findAll({ id: question_id }, (questions) => {
        if (questions.length == 0) {
            Util.sendResponse(res, resCode.notFound, 'no ques');
            return;
        }

        models.competitions.findAll(
            { id: questions[0].competition_id },
            0,
            -1,
            (competitions) => {
                if (competitions.length == 0) {
                    Util.sendResponse(res, resCode.notFound, 'no comp');
                    return;
                }

                if (competitions[0].id != competition_id) {
                    Util.sendResponse(res, resCode.badRequest);
                    return;
                }

                if (
                    !competitions[0].public &&
                    competitions[0].host_user_id != user.id
                ) {
                    Util.sendResponse(res, resCode.forbidden);
                    return;
                }

                readFile(
                    `${judgeService.filesPath}${competition_id}_${question_id}_${user.id}.${lang}`,
                    { encoding: 'utf-8' },
                    (err, data) => {
                        if (err) {
                            if (err.code == 'ENOENT')
                                Util.sendResponse(res, resCode.notFound);
                            else Util.sendResponse(res, resCode.serverError);
                            return;
                        }
                        Util.sendResponseJson(res, resCode.success, {
                            data: data,
                        });
                    }
                );
            },
            (err) => {
                Util.sendResponse(res, resCode.forbidden);
            }
        );
    });
});

module.exports = router;
