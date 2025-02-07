import path from 'path';
import {
    CodeSolution,
    CompetitionInfo,
    HunterExecutable,
    UserInfo,
} from '../config/types';
import { existsSync } from 'fs';
import config from '../config/config';

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
        res.status(code).send(
            JSON.stringify(body, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )
        );
    }

    static getValidLangs(): string[] {
        return ['c', 'cpp', 'py', 'js', 'ts', 'go'];
    }

    static isValidExecRequest(exec: HunterExecutable): boolean {
        const langs = this.getValidLangs();

        try {
            if (
                exec.for.competition_id &&
                exec.for.question_id &&
                (exec.solution as CodeSolution).code &&
                langs.includes((exec.solution as CodeSolution).lang)
            )
                return true;
        } catch (error) {
            return false;
        }

        return false;
    }

    static getFileName(hunterExecutable: HunterExecutable, file_type: string) {
        return this.getAbsoluteFilePath(
            hunterExecutable.for.competition_id,
            hunterExecutable.for.question_id,
            file_type
        );
    }

    static getAbsoluteFilePath(
        comp_id: number,
        ques_id: number,
        file_type: string
    ) {
        return path.join(
            __dirname,
            '../../files',
            `${comp_id}_${ques_id}_${file_type}`
        );
    }

    static doesTestFilesExist(hunterExecutable: HunterExecutable) {
        return existsSync(`${Util.getFileName(hunterExecutable, 'solutions')}`);
    }
}
