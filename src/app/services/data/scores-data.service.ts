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
        user_id?: number | null;
        after?: number;
    }) {
        var endpoint = format(
            apiEndpoints.results,
            params.comp_id.toString(),
            params.ques_id.toString()
        );

        var queryParams = [];

        if (params.after) {
            queryParams.push(`after=${params.after}`);
        }

        if (params.user_id) {
            queryParams.push(`user_id=${params.user_id}`);
        }

        endpoint += '?' + queryParams.join('&');

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

    getScoresAll(params: {
        comp_id: number;
        ques_id?: number;
        after?: number;
    }) {
        var endpoint = format(
            apiEndpoints.resultsAll,
            params.comp_id.toString()
        );

        var queryParams: string[] = [];

        if (params.after) {
            queryParams.push(`after=${params.after}`);
        }

        if (params.ques_id) {
            queryParams.push(`question=${params.ques_id}`);
        }

        if (queryParams) {
            endpoint += '?' + queryParams.join('&');
        }

        return this.http.get<{
            meta: { user_details: result; total: number };
            rows: result[];
        }>(endpoint, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }

    getProgress(params: { comp_id: number }) {
        var endpoint = format(apiEndpoints.progress, params.comp_id.toString());

        return this.http.get<Array<QuestionProgress>>(endpoint, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }

    getEvaluations(params: { comp_id: number; ques_id?: number | null }) {
        var endpoint;

        if (params.ques_id) {
            endpoint = format(
                apiEndpoints.evaluations,
                params.comp_id.toString(),
                params.ques_id.toString()
            );
        } else {
            endpoint = format(
                apiEndpoints.evaluationsAll,
                params.comp_id.toString()
            );
        }

        return this.http.get<Array<result>>(endpoint, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }

    updateEvaluation(params: { comp_id: number; id: number; points: number }) {
        var endpoint = format(
            apiEndpoints.evaluations,
            params.comp_id.toString(),
            params.id.toString()
        );

        return this.http.put(
            endpoint,
            { result: params.points },
            {
                observe: 'response',
                responseType: 'json',
                withCredentials: true,
            }
        );
    }
}
