export type RegisterRequest = {
    user: string;
    password: string;
};

export type SessionInfo = {
    id: number;
    user_id: number;
};

export type QuestionInfo = {
    id: number;
    competition_id: number;
    title: string;
    statement: string;
    date_created: string;
    sample_cases: string;
    sample_sols: string;
    points: number;
};

export type Result = {
    id: number;
    user_id: string;
    question_id: string;
    competition_id: string;
    result: string;
};

export type UserInfo = {
    id: number;
    email: string;
    name: string;
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
};

export type HunterExecutable = {
    for: {
        competition_id: string;
        question_id: string;
    };

    solution: {
        lang: 'py' | 'c' | 'cpp' | 'js' | 'ts' | 'go';
        code: string;
    };
};
