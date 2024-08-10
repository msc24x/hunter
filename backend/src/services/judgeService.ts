import { exec } from 'child_process';
import { readFile, readFileSync, writeFile } from 'fs';
import { Service } from 'typedi';
import { HunterExecutable, QuestionInfo, UserInfo } from '../config/types';
import { Util } from '../util/util';
import config from '../config/config';

type ExeInfo = {
    success: boolean;
    meta: string;
    output: string;
    expected: string;
};

@Service({ global: true })
export class JudgeService {
    private isProcessingUserMap = new Map<string, boolean>();
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

    private _cmd(
        hunterExecutable: HunterExecutable,
        samples: Boolean,
        question: QuestionInfo,
        user: UserInfo
    ) {
        return `${this.gatewayPath} ${Util.getFileName(hunterExecutable)} ${
            hunterExecutable.solution.lang
        } ${samples} ${user.id} "${question.sample_cases.replace(
            '\n',
            '\\n'
        )}" "${question.sample_sols.replace('\n', '\\n')}"`;
    }

    private buildFilePath(hunterExecutable: HunterExecutable, user: UserInfo) {
        return `${this.filesPath}${Util.getFileName(hunterExecutable)}_${
            user.id
        }.${hunterExecutable.solution.lang}`;
    }

    getNumberOfEntries = () => {
        return this.entries;
    };

    async execute(
        hunterExecutable: HunterExecutable,
        samples: boolean,
        question: QuestionInfo,
        user: UserInfo
    ): Promise<ExeInfo> {
        return new Promise((resolve, reject) => {
            if (this.isProcessingUserMap.get(user.id))
                resolve({
                    'output': 'Already processing for this user',
                } as ExeInfo);
            else this.saveEntry(user);

            let programInput = '';
            let programOutput = '';

            if (samples) {
                programInput = question.sample_cases;
                programOutput = question.sample_sols;
            } else {
                const internalFileName = Util.getFileName(hunterExecutable);
                programInput = readFileSync(
                    internalFileName + '_s.txt',
                    'utf-8'
                );
                programOutput = readFileSync(
                    internalFileName + '_t.txt',
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
                this.remEntry(user);
                resolve(res);
            };

            fetch(this.showdownJudgeUrl, {
                headers: headers,
                body: JSON.stringify(payload),
                method: 'POST',
            })
                .then(
                    (res) => res.json(),
                    (err) => fulfillSolution({ output: err } as ExeInfo)
                )
                .then(
                    (res) => {
                        fulfillSolution({
                            expected: res.expected,
                            meta: res.meta,
                            output: res.output,
                            success: res.success,
                        });
                    },
                    (err) => fulfillSolution({ output: err } as ExeInfo)
                );
        });
    }
}
