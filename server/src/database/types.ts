
export interface RegisterRequest{
  user : string;
  password : string;
}

export interface QuestionInfo{
  id : string,
  competition_id : string,
  title : string,
  statement : string,
  created_on : string,
  tests_id : string,
  solutions_id : string,
  points : number,
}

export const execCode = {
  correct : 1,
  incorrect : 2,
  error : 3,
  timeout : 4,
  memoryExceeded : 5
}

export interface UserInfo{
  id : string, email : string, name : string
}
export interface CompetitionInfo{
  id : string,
  host_user_id : string,
  title : string,
  description : string,
  created_on : string,
  rating : number,
  public : boolean,
  duration : number,
  start_schedule : string
}

export interface HunterExecutable{
  for : {
    competition_id : string,
    question_id : string,

  }

  solution : {
    lang : "py" | "c" | "cpp" | "js",
    code : string
  }

}

export const resCode = {
  serverErrror : 503,
  success : 200,
  accepted : 202,
  created : 201,
  badRequest : 400,
  forbidden : 403,
  notFound : 404,
  found  : 302
}
