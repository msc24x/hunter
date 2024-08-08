import { CompetitionInfo, HunterExecutable, UserInfo } from '../config/types';

export class Util {
	static sendResponse(res: any, code: number, msg: string = '') {
		res.status(code).send(msg);
	}

	static sendResponseJson(
		res: any,
		code: number,
		body:
			| {
					id: string;
					email: string;
					name: string;
					msg?: string;
			  }
			| {
					id: string;
					title: string;
			  }
			| CompetitionInfo
			| Array<CompetitionInfo>
			| any
	) {
		res.status(code).send(body);
	}

	static isValidExecRequest(exec: HunterExecutable): boolean {
		const langs = ['c', 'cpp', 'py', 'js', 'ts', 'go'];

		try {
			if (
				exec.for.competition_id &&
				exec.for.question_id &&
				exec.solution.code &&
				langs.includes(exec.solution.lang)
			)
				return true;
		} catch (error) {
			return false;
		}

		return false;
	}

	static getFileName(hunterExecutable: HunterExecutable) {
		return `${hunterExecutable.for.competition_id}_${hunterExecutable.for.question_id}`;
	}
}
