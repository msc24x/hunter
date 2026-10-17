import {
    CodeSolution,
    CompetitionInfo,
    HunterExecutable,
    UserInfo,
} from '../config/types';
import config from '../config/config';
import { fromBuffer } from 'file-type';
import { fileExistsSync } from './serverStorage';

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
        return ['c', 'cpp', 'py', 'js', 'ts', 'go', 'java'];
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

    static getQuestionFileName(
        comp_id: number,
        ques_id: number,
        file_type: string
    ) {
        return `${comp_id}_${ques_id}_${file_type}`;
    }

    static doesTestFilesExist(hunterExecutable: HunterExecutable) {
        return fileExistsSync(
            Util.getQuestionFileName(
                hunterExecutable.for.competition_id,
                hunterExecutable.for.question_id,
                'solutions'
            )
        );
    }

    static getFirstName(name: string) {
        const names = name.trim().split(' ');

        for (let fName of names) {
            if (fName.length > 2) {
                return fName;
            }
        }

        return name;
    }

    static getCommunityURL(id: number | string) {
        return `${config.protocol}://${config.frontend}/communities/browse/${id}`;
    }

    static getContestURL(id: number | string) {
        return `${config.protocol}://${config.frontend}/compete/p/${id}`;
    }

    static getUserURL(id: number | string) {
        return `${config.protocol}://${config.frontend}/u/${id}`;
    }

    static rowsToCsv(
        rows: any[],
        headers?: { key: string; label: string; proc?: (v: any) => any }[]
    ): string {
        if (!rows || rows.length === 0) return '';
        if (headers) {
            var keys = headers.map((v) => v.key);
        } else {
            const first = rows[0];
            var keys = Object.keys(first);
        }
        let getProc = (key: string) => {
            if (!headers) {
                return null;
            }

            for (let h of headers) {
                if (h.key === key) {
                    return h.proc;
                }
            }
        };
        const escape = (v: any) => {
            if (v === null || v === undefined) return '';
            if (typeof v === 'object')
                return '"' + JSON.stringify(v).replace(/"/g, '""') + '"';
            const s = String(v);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return '"' + s.replace(/"/g, '""') + '"';
            }

            return s;
        };

        const header = keys.join(',');
        const lines = rows.map((r) =>
            keys
                .map((k) =>
                    getProc(k) ? escape(getProc(k)!(r[k])) : escape(r[k])
                )
                .join(',')
        );

        var labelledHeader = headers?.map((v) => v.label) || header;

        return [labelledHeader].concat(lines).join('\n');
    }
}

// File type detection using the `file-type` library (comprehensive magic-byte
// database). Falls back to the original filename extension when the library
// cannot determine the type (some PDFs from Java-based systems have unusual
// headers that file-type doesn't recognize but are still valid PDFs).
export async function detectFileFormat(
    buf: Buffer,
    filename?: string,
): Promise<string | null> {
    if (!buf || buf.length < 4) return null;

    // 1. Try the file-type library first (most reliable).
    try {
        const result = await fromBuffer(buf);
        if (result) {
            // file-type may return 'jpeg' — normalize to 'jpg' for our allowed exts.
            const ext: string = result.ext;
            return ext === 'jpeg' ? 'jpg' : ext;
        }
    } catch {}

    // 2. Fallback: check the original filename extension.
    if (filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext) return ext;
    }

    return null;
}
