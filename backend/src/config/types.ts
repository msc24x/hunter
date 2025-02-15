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
    competitions?: CompetitionInfo;
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

    github_fetched_at?: Date;
};

export type CompetitionInfo = {
    id: number;
    host_user_id: number;
    host_user_info?: UserInfo;
    title: string;
    description: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date;
    scheduled_at: Date;
    scheduled_end_at: Date;
    rating: number;
    public: boolean;
    practice: boolean;
};

export type CodeSolution = {
    lang: 'py' | 'c' | 'cpp' | 'js' | 'ts' | 'go';
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
