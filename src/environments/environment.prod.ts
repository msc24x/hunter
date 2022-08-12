export const environment = {
  production: true,
  apiUrl : "http://localhost:4200/api"
};

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

export type HunterExecutable = {
  for : {
    competition_id : string,
    question_id : string,

  }

  solution : {
    lang : "py" | "c" | "cpp" | "js" | string,
    code : string
  }

}

export type result = {
  user_id : string,
  score : string,
  penalities : string
}

export type resultFull = {
  id : string,
  user_id : string,
  question_id : string,
  competition_id : string,
  result : string,
  penalities : string
}

export const apiEndpoints = {
  register : environment.apiUrl+"/register",
  login : environment.apiUrl+"/login",
  authenticate : environment.apiUrl+"/authenticate",
  logout : environment.apiUrl+"/logout",
  competition : environment.apiUrl+"/competition",
  getCompetitions : environment.apiUrl+"/competitions",
  question : environment.apiUrl+"/question",
  deleteQuestion :  environment.apiUrl+"/question/delete",
  postFile : environment.apiUrl+"/question/upload",
  execute : environment.apiUrl+"/execute",
  user : environment.apiUrl+"/user",
  results : environment.apiUrl+"/result/c/",
  resultsAll : environment.apiUrl+"/result"
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
