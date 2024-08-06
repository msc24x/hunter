export type RegisterRequest = {
	user: string;
	password: string;
};

export type QuestionInfo = {
	id: string;
	competition_id: string;
	title: string;
	statement: string;
	date_created: string;
	sample_cases: string;
	sample_sols: string;
	points: number;
};

export type Result = {
	id: string;
	user_id: string;
	question_id: string;
	competition_id: string;
	result: string;
};

export type UserInfo = {
	id: string;
	email: string;
	name: string;
};

export type CompetitionInfo = {
	id: string;
	host_user_id: string;
	host_user_info?: UserInfo;
	title: string;
	description: string;
	created_on: string;
	rating: number;
	public: boolean;
	duration: number;
	start_schedule: string;
};

export type HunterExecutable = {
	for: {
		competition_id: string;
		question_id: string;
	};

	solution: {
		lang: 'py' | 'c' | 'cpp' | 'js';
		code: string;
	};
};
