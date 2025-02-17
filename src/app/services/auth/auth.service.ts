import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
    apiEndpoints,
    environment,
    UserInfo,
} from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    isAuthenticated = new BehaviorSubject<boolean>(false);

    user: UserInfo = {
        id: 0,
        email: '',
        name: '',
        avatar_url: '',
        blog_url: '',
        github_url: '',
        linkedin_url: '',
    };

    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    register(params: any) {
        return this.http.post(apiEndpoints.register, params, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    authenticate(email: string, password: string, remember: boolean = true) {
        var params = new HttpParams();
        params = params.set('email', email);
        params = params.set('password', password);
        params = params.set('remember', remember);

        return this.http.get(apiEndpoints.authenticate, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
            params: params,
        });
    }

    authenticate_credentials() {
        return this.http.get(apiEndpoints.authenticate, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    logout() {
        return this.http.post(apiEndpoints.logout, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }
}
