import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, ɵresetJitOptions } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment, UserInfo } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isAuthenticated = new BehaviorSubject<boolean>(false)
  user : UserInfo = {
    id : "",
    email : "",
    name : ""
  }
  resCode = {
    serverErrror : 503,
    success : 200,
    accepted : 202,
    created : 201,
    badRequest : 400,
    forbidden : 403,
    notFound : 404,
    found  : 302
  }

  apiUrl = environment.apiUrl;

  apiEndpoints = {
    register : this.apiUrl+"/register",
    login : this.apiUrl+"/login",
    authenticate : this.apiUrl+"/authenticate",
    logout : this.apiUrl+"/logout",
    createCompetition : this.apiUrl+"/create/competition"
  }

  constructor(private http : HttpClient) {
   }

  register(email : string, password : string) {

    var params  = new HttpParams();
    params = params.set("email", email);
    params = params.set("password", password);

    return this.http.get(this.apiEndpoints.register, {
      responseType : "json",
      withCredentials : true,
      observe : "response",
      params : params
    });

  }

  authenticate(email : string, password : string, remember : boolean = false){
    var params  = new HttpParams();
    params = params.set("email", email);
    params = params.set("password", password);
    params = params.set("remember", remember);

    return this.http.get(this.apiEndpoints.authenticate, {
      responseType : "json",
      withCredentials : true,
      observe : "response",
      params : params
    });
  }

  authenticate_credentials(){
    return this.http.get(this.apiEndpoints.authenticate, {
      responseType : "json",
      withCredentials : true,
      observe : "response",
    });
  }

  logout(){
    return this.http.get(this.apiEndpoints.logout,{
      responseType : "json",
      withCredentials : true,
      observe : "response",
    })
  }

  createCompetition(title : string){
    if(!this.isAuthenticated){
      return
    }

    return this.http.post(this.apiEndpoints.createCompetition, {
      responseType : "json",
      withCredentials : true,
      observe : "response",
      title : title
    })

  }

}
