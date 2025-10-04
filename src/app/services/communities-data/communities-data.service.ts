import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiEndpoints, Community } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunitiesDataService {
    constructor(private http: HttpClient) {}

    fetchCommunities(params: { user_id: number | null }) {
        return this.http.get<Array<Community>>(apiEndpoints.communities, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
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
