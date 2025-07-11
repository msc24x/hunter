export type RegisterRequest = {
    user: string;
    password: string;
};

export type SessionInfo = {
    id: string;
    user_id: number;
};

export type QuestionInfo = {
    id: number;
    competition_id: number;
    competitions?: CompetitionInfo;
    title: string | null;
    type: number;
    statement: string | null;
    created_at: Date;
    deleted_at: Date | null;
    sample_cases: string | null;
    sample_sols: string | null;
    points: number;
    neg_points: number;
    case_sensitive?: boolean;
    char_limit?: number | null;
    correct_count?: number;
    test_cases_file?: boolean;
    sol_cases_file?: boolean;
    sol_code_file?: boolean;
    user_answer?: string;
    question_choices?: QuestionChoice[];
};

export type QuestionChoice = {
    id?: number;
    text: string | null;
    question_id: number;
    position: number;
    is_correct: boolean;
    delete?: boolean;
};

export type Result = {
    id: number;
    user_id: number;
    user_name: string;
    question_id: string;
    competition_id: string;
    result: number;
    final_result: number;
    user_rank: number;
    questions_attempted?: number;
};

export type UserSocials = {
    avatar_url?: string;
    blog_url?: string;
    github_url?: string;
    linkedin_url?: string;
};

export type UserInfo = {
    id: number;
    email: string;
    name: string;

    avatar_url?: string;
    blog_url?: string;
    github_url?: string;
    linkedin_url?: string;

    email_updates_disabled_at?: Date;
    github_fetched_at?: Date;
};

export type CompetitionInfo = {
    id: number;
    host_user_id: number;
    host_user_info?: UserInfo;
    host_user?: UserInfo;
    title: string;
    visibility: string;
    description: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date;
    scheduled_at: Date;
    scheduled_end_at: Date;
    time_limit: number | null;
    rating: number;
    hidden_scoreboard: boolean;
    practice: boolean;
};

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
    user_id?: number;
    user_info?: UserInfo;
    competition_id: number;
    competition?: CompetitionInfo;
    created_at: Date;
    accepted_at: Date | null;
    sent_at: Date | null;
};

export type CodeSolution = {
    lang: 'py' | 'c' | 'cpp' | 'js' | 'ts' | 'go' | 'java';
    code: string;
};

export type HunterExecutable = {
    for: {
        competition_id: number;
        question_id: number;
        type: number;
    };

    solution: CodeSolution | QuestionInfo;
};

export type ExeInfo = {
    success: boolean;
    meta: string;
    output: string;
    expected: string;
};
