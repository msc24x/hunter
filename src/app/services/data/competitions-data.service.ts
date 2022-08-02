import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiEndpoints, CompetitionInfo, HunterExecutable, QuestionInfo } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompetitionsDataService {

  constructor(private authService : AuthService, private http : HttpClient) { }

  judgeSolution(exe : HunterExecutable){
    return this.http.post(apiEndpoints.execute, exe, {
      responseType : 'json',
      withCredentials : true,
      observe : "response"
    })
  }

  postQuestion(competition_id : string){

    return this.http.post(apiEndpoints.question,{competition_id : competition_id},{
      withCredentials : true,
      observe : "response",
    })
  }

  postFile(params : any){
    return this.http.post(apiEndpoints.postFile, params, {
      responseType : 'json',
      withCredentials : true,
      observe : "response"
    })
  }

  deleteQuestion(id : string){
    return this.http.post(apiEndpoints.deleteQuestion, {id : id}, {
      responseType : 'json',
      withCredentials : true,
      observe : "response"
    })
  }

  putQuestion(params : any){

    return this.http.put(apiEndpoints.question, params, {
      responseType : 'json',
      withCredentials : true,
      observe : "response"
    })
  }

  getQuestions(
    params : {competition_id? : string, id? : string }
  ){
    let httpParams = new HttpParams()
    if(params.competition_id != null)
      httpParams = httpParams.set("competition_id", params.competition_id)
    if(params.id != null)
      httpParams = httpParams.set("id", params.id)

    return this.http.get<Array<QuestionInfo>>(apiEndpoints.question, {
      responseType : 'json',
      withCredentials : true,
      observe : "response",
      params : httpParams
    })
  }

  postCompetition(title : string){
    if(!this.authService.isAuthenticated){
      return
    }

    return this.http.post(apiEndpoints.competition, {title : title}, {
      responseType : "json",
      withCredentials : true,
      observe : "response",
    })
  }

  putCompetitionInfo(competition : CompetitionInfo){
    return this.http.put(apiEndpoints.competition, competition, {
      observe : "response",
      responseType : "json",
      withCredentials : true
    })

  }

  getPublicCompetitions(params? : {
    id? : string,
    host_user_id? : string,
    public? : boolean,
    dateOrder? : 1 | 0 | -1
  }){
    let httpParams = new HttpParams()
    if(params?.id)  httpParams = httpParams.set("id", params.id)
    if(params?.dateOrder)  httpParams = httpParams.set("dateOrder", params.dateOrder)
    if(params?.public)  httpParams = httpParams.set("public", params.public)
    if(params?.host_user_id)  httpParams = httpParams.set("host_user_id", params.host_user_id)
    return this.http.get<Array<CompetitionInfo>>(apiEndpoints.getCompetitions,{
      observe : "response",
      responseType : "json",
      withCredentials : true,
      params : httpParams
    })
  }

  getCompetitionInfo(id :  string){
    let params = new HttpParams()
    params = params.set("competition_id", id)

    return this.http.get(apiEndpoints.competition,{
      responseType : "json",
      observe : "response",
      params : params
    })
  }


}
