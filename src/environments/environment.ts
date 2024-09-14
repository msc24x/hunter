// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const protocol = 'http';
export const domainName = '127.0.0.1:4200';

export const environment = {
    production: false,
    apiUrl: `${protocol}://${domainName}/api`,
    version: 'v2.0-beta',
};

export interface UserInfo {
    id: number;
    email: string;
    name: string;
}

export type HunterLanguage = 'cpp' | 'py' | 'c' | 'js' | 'ts' | 'go';

export type QuestionVerification = {
    id: number;
    created_at: Date;
    submission: string;
    language: string;
    reason: string;
    success: boolean;
    question_id: number;
};

export interface CompetitionInfo {
    id: number;
    host_user_id: number;
    host_user?: UserInfo;
    title: string;
    description: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    scheduled_at: Date | null;
    scheduled_end_at: Date | null;
    rating: number;
    public: boolean;
    questions?: QuestionInfo[];
}

export type HunterExecutable = {
    for: {
        competition_id: number;
        question_id: number;
    };

    solution: {
        lang: 'py' | 'c' | 'cpp' | 'js' | string;
        code: string;
    };
};

export type ExecutionInfo = {
    success: boolean;
    output: string;
    expected: string;
    meta: string;
};

export type result = {
    name: string;
    user_id: number;
    result: number;
    submission?: string;
    meta?: string;
};

export type resultFull = {
    id: number;
    user: UserInfo;
    question_id: number;
    result: number;
    submission?: string;
    meta?: string;
};

export const apiEndpoints = {
    register: environment.apiUrl + '/register',
    login: environment.apiUrl + '/login',
    authenticate: environment.apiUrl + '/authenticate',
    logout: environment.apiUrl + '/logout',
    competition: environment.apiUrl + '/competition',
    getCompetitions: environment.apiUrl + '/competitions',
    question: environment.apiUrl + '/competitions/{0}/questions/{1}',
    deleteQuestion: environment.apiUrl + '/question/delete',
    postFile: environment.apiUrl + '/question/upload',
    execute: environment.apiUrl + '/execute',
    user: environment.apiUrl + '/user',
    results: environment.apiUrl + '/result/c/',
    resultsAll: environment.apiUrl + '/result',
    submission: environment.apiUrl + '/submission/',
};

export const templates = {
    cpp: '#include <iostream>\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n\t//write code\n\treturn 0;\n}',
    c: '#include"stdio.h"\n#include"string.h"\n#include"math.h"\n#include"stdlib.h"\n#include"ctype.h"\n#include"limits.h"\n#include"time.h"\n#include"stdbool.h"\n\nint main(){\n\t//write code\n\treturn 0;\n}',
    py: '# write code',
    js: '/*write code*/',
    ts: '/*write code*/',
    go: 'package main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, World!")\n}',
};

export const resCode = {
    serverError: 503,
    success: 200,
    accepted: 202,
    created: 201,
    badRequest: 400,
    forbidden: 403,
    notFound: 404,
    found: 302,
};
export interface QuestionInfo {
    id: number;
    competition_id: number;
    title: string;
    statement: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    sample_cases: string;
    sample_sols: string;
    points: number;
    neg_points: number;
    test_cases_file?: boolean;
    sol_cases_file?: boolean;
    sol_code_file?: boolean;
}
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
