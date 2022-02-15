import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiEndpoints, CompetitionInfo } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompetitionsDataService {

  constructor(private authService : AuthService, private http : HttpClient) { }

  createCompetition(title : string){
    if(!this.authService.isAuthenticated){
      return
    }

    return this.http.post(apiEndpoints.competition, {
      responseType : "json",
      withCredentials : true,
      observe : "response",
      title : title
    })
  }

  updateCompetitionInfo(competition : CompetitionInfo){
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
