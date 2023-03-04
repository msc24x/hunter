import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiEndpoints } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScoresDataService {

  constructor(private http : HttpClient) { }

  getScoreboard(competition_id :string){
    return this.http.get(apiEndpoints.results + competition_id,
      {
        observe : "response",
        responseType : 'json',
        withCredentials : true
      }
    )
  }


  getScoresAll(params : any){
    let httpParams = new HttpParams()
    
    if(params.user_id){
      httpParams = httpParams.set("user_id", params.user_id)
    }
    if(params.question_id){
      httpParams = httpParams.set("question_id", params.question_id)
    }
    if(params.competition_id){
      httpParams = httpParams.set("competition_id", params.competition_id)
    }

    return this.http.get(apiEndpoints.resultsAll, 
      {
        observe : "response",
        responseType : 'json',
        withCredentials : true,
        params : httpParams
      }
    )
  }

}
