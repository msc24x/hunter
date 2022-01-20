import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, ɵresetJitOptions } from '@angular/core';
import { environment } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl = environment.apiUrl;

  apiEndpoints = {
    register : this.apiUrl+"/register",
    login : this.apiUrl+"/login",
    authenticate : this.apiUrl+"/authenticate"
  }

  constructor(private http : HttpClient) { }

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
}
