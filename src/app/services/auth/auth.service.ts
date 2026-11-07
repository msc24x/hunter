import { HttpClient } from '@angular/common/http';
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
