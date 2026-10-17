import { exec } from 'child_process';
import { readFile } from '../util/serverStorage';
import { Service } from 'typedi';
import {
    CodeSolution,
    ExeInfo,
    HunterExecutable,
    QuestionInfo,
    UserInfo,
} from '../config/types';
import { Util } from '../util/util';
import config from '../config/config';

@Service({ global: true })
export class JudgeService {
    private isProcessingUserMap = new Map<number, boolean>();
    private entries = 0;
    private showdownJudgeUrl = process.env.SHOWDOWN_URL!;
    public filesPath: string = 'files/';

    constructor() {}

    private saveEntry({ id }: UserInfo) {
        this.isProcessingUserMap.set(id, true);
        this.entries++;
    }

    private remEntry({ id }: UserInfo) {
        this.isProcessingUserMap.set(id, false);
        this.entries--;
    }

    getNumberOfEntries = () => {
        return this.entries;
    };

    async execute(
        hunterExecutable: HunterExecutable,
        samples: boolean,
        question: QuestionInfo | null,
        user: UserInfo | null,
        revealOutput: boolean = false
    ): Promise<ExeInfo> {
        return new Promise(async (resolve, reject) => {
            if (user) {
                if (this.isProcessingUserMap.get(user.id)) {
                    resolve({
                        'output': 'Already processing for this user',
                    } as ExeInfo);
                    return;
                }
                this.saveEntry(user);
            }

            let programInput = '';
            let programOutput = '';

            if (samples) {
                programInput = question?.sample_cases || '';
                programOutput = question?.sample_sols || '';
            } else {
                try {
                    programInput = (
                        await readFile(
                            Util.getQuestionFileName(
                                hunterExecutable.for.competition_id,
                                hunterExecutable.for.question_id,
                                'testcases'
                            )
                        )
                    ).toString('utf-8');
                    programOutput = (
                        await readFile(
                            Util.getQuestionFileName(
                                hunterExecutable.for.competition_id,
                                hunterExecutable.for.question_id,
                                'solutions'
                            )
                        )
                    ).toString('utf-8');
                } catch (err) {
                    if (user) {
                        this.remEntry(user);
                    }
                    reject(err);
                    return;
                }
            }

            const headers = new Headers({
                'Access-Token': process.env.SHOWDOWN_ACCESS_TOKEN!,
                'Content-Type': 'application/json',
            });

            const payload = {
                judge_params: {
                    collectmeta: true,
                    donotjudge: false,
                    limits: [
                        {
                            'time': 18,
                            'wall_time': 18,
                            'memory': 512 * 1024,
                            'stack': 512 * 1024,
                        },
                        {
                            'time': 4,
                            'wall_time': 6,
                            'memory': 512 * 1024,
                            'stack': 512 * 1024,
                        },
                    ],
                },
                exe: {
                    language: (hunterExecutable.solution as CodeSolution).lang,
                    code: (hunterExecutable.solution as CodeSolution).code,
                    input: programInput,
                    output: programOutput,
                },
            };

            const fulfillSolution = (res: ExeInfo) => {
                if (user) {
                    this.remEntry(user);
                }
                resolve(res);
            };

            fetch(this.showdownJudgeUrl, {
                headers: headers,
                body: JSON.stringify(payload),
                method: 'POST',
            }).then(
                (res) => {
                    return res
                        .json()
                        .then((res_json) => {
                            const reveal = samples || revealOutput;
                            fulfillSolution({
                                expected: reveal ? res_json.expected : '',
                                output: reveal ? res_json.output : '',
                                meta: res_json.meta,
                                success: res_json.success,
                            });
                        })
                        .catch(() =>
                            fulfillSolution({
                                output: 'Invalid response from judge',
                                success: false,
                            } as ExeInfo)
                        );
                },
                (err) =>
                    fulfillSolution({
                        output: err instanceof Error ? err.message : String(err),
                        success: false,
                    } as ExeInfo)
            );
        });
    }
}
