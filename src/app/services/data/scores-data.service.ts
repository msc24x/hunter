import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { format } from 'src/app/utils/utils';
import {
    apiEndpoints,
    QuestionProgress,
    result,
} from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ScoresDataService {
    constructor(private http: HttpClient) {}

    getQuestionScores(params: {
        comp_id: number;
        ques_id: number;
        after?: number;
    }) {
        var endpoint = format(
            apiEndpoints.results,
            params.comp_id.toString(),
            params.ques_id.toString()
        );

        if (params.after) {
            endpoint += '?after=' + params.after;
        }

        return this.http.get<{
            results: Array<result>;
            accepted_count: number;
            rejected_count: number;
        }>(endpoint, {
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

        return this.http.get<{ user_details: result; rows: result[] }>(
            endpoint,
            {
                observe: 'response',
                responseType: 'json',
                withCredentials: true,
            }
        );
    }

    getProgress(params: { comp_id: number }) {
        var endpoint = format(apiEndpoints.progress, params.comp_id.toString());

        return this.http.get<Array<QuestionProgress>>(endpoint, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }
}
