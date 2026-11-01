import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { format } from 'src/app/utils/utils';
import { apiEndpoints } from 'src/environments/environment';

export interface ApiToken {
    id: number;
    name: string;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
    revoked_at: string | null;
}

export interface ApiTokenCreated extends ApiToken {
    token: string;
}

@Injectable({
    providedIn: 'root',
})
export class ApiTokensService {
    constructor(private http: HttpClient) {}

    fetchTokens() {
        return this.http.get<Array<ApiToken>>(apiEndpoints.tokens, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    createToken(params: { name: string; expires_in_days?: number }) {
        return this.http.post<ApiTokenCreated>(apiEndpoints.tokens, params, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    revokeToken(id: number) {
        return this.http.delete(format(apiEndpoints.token, id), {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }
}
