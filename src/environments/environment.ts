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
    avatar_url?: string;
    blog_url?: string;
    github_url?: string;
    linkedin_url?: string;

    email_updates_disabled_at?: Date | null;

    hunt_points?: number;
    participated?: Array<CompetitionInfo>;

    competitions?: Array<CompetitionInfo>;
}

export type HunterLanguage = 'cpp' | 'py' | 'c' | 'js' | 'ts' | 'go' | 'java';

export type QuestionVerification = {
    id: number;
    created_at: Date;
    submission: string;
    language: string;
    reason: string;
    success: boolean;
    question_id: number;
};

export interface CompetitionInfoCounts {
    questions: number;
}

export interface CompetitionInfo {
    id: number;
    host_user_id: number;
    host_user?: UserInfo;
    title: string;
    hidden_scoreboard: boolean;
    visibility: 'PRIVATE' | 'PUBLIC' | 'INVITE';
    description: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    scheduled_at: Date | null;
    scheduled_end_at: Date | null;
    time_limit: number | null;
    rating: number;
    practice: boolean;
    questions?: QuestionInfo[];
    competition_sessions?: CompetitionSession[];
    competition_invites?: CompetitionInvite[];
    community_id?: number;
    community_only?: boolean;
    community?: Community;

    _count: CompetitionInfoCounts;
}

export type CompetitionSession = {
    id: number;
    user_id: number;
    user_info?: UserInfo;
    competition_id: number;
    competitions?: CompetitionInfo;
    created_at: Date;
};

export type CompetitionInvite = {
    id: number;
    uuid: string;
    email: string;
    user_id: number;
    user?: UserInfo;
    competition_id: number;
    competition?: CompetitionInfo;
    created_at: Date;
    accepted_at: Date | null;
};

export type HunterExecutable = {
    for: {
        competition_id: number;
        question_id: number;
        type: number;
    };

    solution:
        | {
              lang: 'py' | 'c' | 'cpp' | 'js' | string;
              code: string;
          }
        | QuestionInfo;
};

export type ExecutionInfo = {
    success: boolean;
    output: string;
    expected: string;
    meta: string;
};

export type result = {
    id: number;
    user_id: number;
    evaluated_by_id?: number;
    evaluated_by?: UserInfo;
    user_name: string;
    user_avatar_url: string;
    user_rank: number;
    result: number;
    accepted: boolean;
    created_at?: string;
    created_at_diff?: number;
    evaluated_at?: string;
    language?: HunterLanguage;
    neg_result?: number;
    final_result?: number;
    questions_attempted?: number;
    submission?: string;
    meta?: string;
    question_choices?: QuestionChoice[];
    question?: QuestionInfo;
    user?: UserInfo;
};

export type ScoresMeta = {
    total: number;
    user_details: result | undefined;
} | null;

export type resultFull = {
    id: number;
    user: UserInfo;
    question_id: number;
    result: number;
    submission?: string;
    meta?: string;
};

export type QuestionProgress = {
    question_id: number;
    total: number;
    accepted: boolean;
};

export const apiEndpoints = {
    register: environment.apiUrl + '/register',
    login: environment.apiUrl + '/login',
    authenticate: environment.apiUrl + '/authenticate',
    logout: environment.apiUrl + '/logout',
    competition: environment.apiUrl + '/competition',
    competitionQuality: environment.apiUrl + '/competition/{0}/quality',
    competitionSession: environment.apiUrl + '/competition/{0}/session',
    competitionInvites: environment.apiUrl + '/competitions/{0}/invites',
    competitionInviteDelete:
        environment.apiUrl + '/competitions/{0}/invites/{1}',
    invites: environment.apiUrl + '/competitions/invites/{0}',
    getCompetitions: environment.apiUrl + '/competitions',
    question: environment.apiUrl + '/competitions/{0}/questions/{1}',
    deleteQuestion: environment.apiUrl + '/question/delete',
    postFile: environment.apiUrl + '/question/upload',
    submit: environment.apiUrl + '/submit',
    user: environment.apiUrl + '/users',
    results: environment.apiUrl + '/competitions/{0}/results/{1}',
    evaluationsAll: environment.apiUrl + '/competitions/{0}/evaluations',
    evaluations: environment.apiUrl + '/competitions/{0}/evaluations/{1}',
    resultsAll: environment.apiUrl + '/competitions/{0}/results',
    progress: environment.apiUrl + '/competitions/{0}/progress',
    submission: environment.apiUrl + '/submission/',
    communities: environment.apiUrl + '/communities/',
    communityMemberships: environment.apiUrl + '/communities/memberships',
    community: environment.apiUrl + '/communities/{0}',
    pendingCommunityMemberships:
        environment.apiUrl + '/communities/{0}/memberships/pending',
    joinCommunity: environment.apiUrl + '/communities/{0}/join',
    createCommunity: environment.apiUrl + '/communities/create',
};

export const templates = {
    cpp: '#include <iostream>\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n\t//write code\n\treturn 0;\n}',
    c: '#include"stdio.h"\n#include"string.h"\n#include"math.h"\n#include"stdlib.h"\n#include"ctype.h"\n#include"limits.h"\n#include"time.h"\n#include"stdbool.h"\n\nint main(){\n\t//write code\n\treturn 0;\n}',
    py: '# write code',
    js: "const readline = require('readline');\n\nconst stdio = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nfunction main() {\n    //write your code here\n}\nmain();",
    ts: "import * as readline from 'readline';\r\n\r\nconst stdio = readline.createInterface({\r\n    input: process.stdin,\r\n    output: process.stdout\r\n});\r\n\r\nfunction main(): void {\r\n    //write your code here\r\n}\r\n\r\nmain();\r\n",
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello, World!")\n}',
    java: 'class MainClass {\n    public static void main(String[] args) {\n        \n    }\n}',
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
    type: number;
    position: number;
    statement: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    sample_cases: string;
    sample_sols: string;
    points: number;
    neg_points: number;
    char_limit?: number | null;
    correct_count?: number;
    case_sensitive?: boolean;
    test_cases_file?: boolean;
    sol_cases_file?: boolean;
    sol_code_file?: boolean;
    user_answer?: string;

    question_choices?: QuestionChoice[];
    results?: result[];
}

export interface QuestionChoice {
    id: number;
    text: string;
    question_id: number;
    position: number;
    is_correct: boolean;
    delete?: boolean;
}

export interface Community {
    id: number;
    name?: string;
    description?: string;
    logo_file_path?: string;
    website_link?: string;
    created_at: Date;
    status: string;
    admin_user_id: number;
    admin_user?: UserInfo;
    members?: CommunityMember[];
    competitions?: CompetitionInfo[];

    _count?: any;
}

export interface CommunityMember {
    id: number;
    user_id: number;
    community_id: number;
    status: string;
    created_at: Date;
    user?: UserInfo;
    community?: Community;
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
