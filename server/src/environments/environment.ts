

export const execCode =  {
  correct : 1,
  incorrect : 2,
  error : 3,
  timeout : 4,
  memoryExceeded : 5
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




export type RegisterRequest = {
  user : string;
  password : string;
}

export type QuestionInfo = {
  id : string,
  competition_id : string,
  title : string,
  statement : string,
  created_on : string,
  tests_id : string,
  solutions_id : string,
  points : number,
}

export type UserInfo = {
  id : string, email : string, name : string
}

export type CompetitionInfo = {
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

export type HunterExecutable = {
  for : {
    competition_id : string,
    question_id : string,

  }

  solution : {
    lang : "py" | "c" | "cpp" | "js",
    code : string
  }

}


