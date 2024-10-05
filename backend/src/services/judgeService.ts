import { exec } from 'child_process';
import { readFile, readFileSync, writeFile } from 'fs';
import { Service } from 'typedi';
import {
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
    private gatewayPath: string;
    private showdownJudgeUrl = process.env.SHOWDOWN_URL!;

    public filesPath: string = 'files/';

    constructor() {
        if (config.env == 'prod') {
            this.gatewayPath = 'src/scripts/linux/init_judge.sh';
        } else {
            this.gatewayPath = 'src/scripts/win/init_judge.bat';
        }
    }

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
        user: UserInfo | null
    ): Promise<ExeInfo> {
        return new Promise((resolve, reject) => {
            if (user) {
                if (this.isProcessingUserMap.get(user.id))
                    resolve({
                        'output': 'Already processing for this user',
                    } as ExeInfo);
                else this.saveEntry(user);
            }

            let programInput = '';
            let programOutput = '';

            if (samples) {
                programInput = question?.sample_cases || '';
                programOutput = question?.sample_sols || '';
            } else {
                programInput = readFileSync(
                    Util.getFileName(hunterExecutable, 'testcases'),
                    'utf-8'
                );
                programOutput = readFileSync(
                    Util.getFileName(hunterExecutable, 'solutions'),
                    'utf-8'
                );
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
                    language: hunterExecutable.solution.lang,
                    code: hunterExecutable.solution.code,
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
                    return res.json().then((res_json) => {
                        fulfillSolution({
                            expected: samples ? res_json.expected : '',
                            output: samples ? res_json.output : '',
                            meta: res_json.meta,
                            success: res_json.success,
                        });
                    });
                },
                (err) => fulfillSolution({ output: err } as ExeInfo)
            );
        });
    }
}
