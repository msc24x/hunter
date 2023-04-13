import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiEndpoints, UserInfo } from 'src/environments/environment';

@Injectable({
  providedIn: "root"
})
export class UserDataService {

  constructor(private http : HttpClient) { }

  updateUserInfo(params : UserInfo){
    return this.http.put(apiEndpoints.user, params, {
      withCredentials : true,
      responseType : "json",
      observe : 'response'
    })
  }

  getUser(id : string){
    let httpParams = new HttpParams()
    httpParams = httpParams.set("id" , id)

    return this.http.get(apiEndpoints.user, 
      {
        responseType : 'json',
        observe : "response",
        withCredentials : true,
        params : httpParams
      }
    )
  }
}
