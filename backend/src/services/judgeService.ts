import { exec } from 'child_process';
import { writeFile } from 'fs';
import { Service } from 'typedi';
import { HunterExecutable, QuestionInfo, UserInfo } from '../config/types';
import { Util } from '../util/util';
import  config  from '../config/config';

@Service({ global: true })
export class JudgeService {
	private isProcessingUserMap = new Map<string, boolean>();
	private entries = 0;
	private gatewayPath: string;
	private filesPath: string = "src/database/files/";

	constructor() {
		if (config.env == "prod") {
			this.gatewayPath = "src/scripts/linux/init_judge.sh"
		}
		else {
			this.gatewayPath = "src/scripts/win/init_judge.bat"
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
		return `${this.gatewayPath} ${Util.getFileName(
				hunterExecutable
			)} ${hunterExecutable.solution.lang} ${samples} ${
				user.id
			} "${question.sample_cases.replace(
				'\n',
				'\\n'
			)}" "${question.sample_sols.replace('\n', '\\n')}"`
			
	}

	private buildFilePath(
		hunterExecutable: HunterExecutable,
		user : UserInfo
	) {
		return `${this.filesPath}${Util.getFileName(hunterExecutable)}_${
			user.id
		}.${hunterExecutable.solution.lang}`
	}

	getNumberOfEntries = () => {
		return this.entries;
	};

	async execute(
		hunterExecutable: HunterExecutable,
		samples: Boolean,
		question: QuestionInfo,
		user: UserInfo
	): Promise<String> {
		return new Promise((resolve, reject) => {
			if (this.isProcessingUserMap.get(user.id))
				reject('Already processing for this user');
			else this.saveEntry(user);

			writeFile(
				this.buildFilePath(hunterExecutable, user),
				hunterExecutable.solution.code,
				{ flag: 'w' },
				(err) => {
					if (err) {
						this.remEntry(user);
						reject(err);
					}

					const cmd = this._cmd(
						hunterExecutable,
						samples,
						question,
						user
					);

					exec(cmd,
						(error, stdout, stderr) => {
							if (error) {
								this.remEntry(user);
								reject(err);
							}
							this.remEntry(user);
							resolve(stdout);
						}
					);
				}
			);
		});
	}
}
