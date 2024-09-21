import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { format } from 'src/app/utils/utils';
import { apiEndpoints } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ScoresDataService {
    constructor(private http: HttpClient) {}

    getQuestionScores(params: { comp_id: number; ques_id: number }) {
        var endpoint = format(
            apiEndpoints.results,
            params.comp_id.toString(),
            params.ques_id.toString()
        );

        return this.http.get(endpoint, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }

    getScoresAll(params: { comp_id: number }) {
        var endpoint = format(
            apiEndpoints.resultsAll,
            params.comp_id.toString()
        );

        return this.http.get(endpoint, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }
}
