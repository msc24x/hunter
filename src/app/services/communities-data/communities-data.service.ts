import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiEndpoints, Community } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunitiesDataService {
    constructor(private http: HttpClient) {}

    fetchCommunities(params: { user_id?: number | null }) {
        const httpParams = new HttpParams();

        if (params.user_id) {
            httpParams.set('user_id', params.user_id);
        }

        return this.http.get<Array<Community>>(apiEndpoints.communities, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
            params: httpParams,
        });
    }

    sendCommunityCreateRequest(params: {
        name: string;
        description: string;
        website_link: string;
        logo_file_path: string;
    }) {
        return this.http.post<Community>(apiEndpoints.createCommunity, params, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }
}
