import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiEndpoints, UserInfo } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class UserDataService {
    constructor(private http: HttpClient) {}

    updateUserInfo(params: UserInfo) {
        return this.http.put(apiEndpoints.user, params, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    getUser(id: number) {
        return this.http.get<UserInfo>(apiEndpoints.user + '/' + id, {
            responseType: 'json',
            observe: 'response',
            withCredentials: true,
        });
    }
}
