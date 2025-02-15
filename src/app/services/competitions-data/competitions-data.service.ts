import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    apiEndpoints,
    CompetitionInfo,
    HunterExecutable,
    QuestionInfo,
} from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from 'src/app/common/common.module';
import { format } from 'src/app/utils/utils';

@Injectable({
    providedIn: 'root',
})
export class CompetitionsDataService {
    constructor(private authService: AuthService, private http: HttpClient) {}

    deleteCompetition(id: number) {
        return this.http.delete(apiEndpoints.competition + '/' + id, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    getLastSubmission(params: any) {
        let httpParams = new HttpParams();

        if (params.competition_id)
            httpParams = httpParams.set(
                'competition_id',
                params.competition_id
            );
        if (params.question_id)
            httpParams = httpParams.set('question_id', params.question_id);

        return this.http.get<{ data: string }>(
            apiEndpoints.submission + params.lang,
            {
                responseType: 'json',
                withCredentials: true,
                observe: 'response',
                params: httpParams,
            }
        );
    }

    getFileStatus(params: {
        competition_id: number;
        question_id: number;
        file_type: string;
    }) {
        const endpoint =
            format(
                apiEndpoints.question,
                params.competition_id.toString()!,
                params.question_id.toString() || ''
            ) +
            '/' +
            params.file_type;

        return this.http.get(endpoint, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    fetchVerification(params: { competition_id: number; question_id: number }) {
        const endpoint =
            format(
                apiEndpoints.question,
                params.competition_id.toString()!,
                params.question_id.toString()!
            ) + '/verification';

        return this.http.get(endpoint, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    fetchQuality(params: { competition_id: number }) {
        const endpoint = format(
            apiEndpoints.competitionQuality,
            params.competition_id.toString()!
        );

        return this.http.get(endpoint, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    verifySolution(exe: HunterExecutable) {
        const endpoint =
            format(
                apiEndpoints.question,
                exe.for.competition_id.toString()!,
                exe.for.question_id.toString()!
            ) + '/verification';

        return this.http.post(
            endpoint,
            { solution: exe.solution },
            {
                responseType: 'json',
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    judgeSolution(exe: HunterExecutable, samples = false) {
        return this.http.post(
            apiEndpoints.submit,
            { exec: exe, samples: samples },
            {
                responseType: 'json',
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    postQuestion(params: { competition_id: number; type: number }) {
        const endpoint = format(
            apiEndpoints.question,
            params.competition_id.toString()!,
            ''
        );
        return this.http.post<QuestionInfo>(
            endpoint,
            { competition_id: params.competition_id, type: params.type },
            {
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    postFile(params: {
        competition_id: number;
        id: number;
        fileType: string;
        file: File;
    }) {
        const endpoint = format(
            apiEndpoints.question,
            params.competition_id.toString()!,
            params.id.toString() || ''
        );

        const data = new FormData();
        data.append('file', params.file);

        return this.http.post(endpoint + '/' + params.fileType, data, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    deleteQuestion(params: { competition_id: number; id: number }) {
        const endpoint = format(
            apiEndpoints.question,
            params.competition_id.toString()!,
            params.id.toString() || ''
        );
        return this.http.delete(endpoint, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    putQuestion(params: QuestionInfo) {
        const endpoint = format(
            apiEndpoints.question,
            params.competition_id.toString()!,
            params.id.toString() || ''
        );

        return this.http.put(endpoint, params, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    getQuestions(params: { competition_id: number; id?: number }) {
        const endpoint = format(
            apiEndpoints.question,
            params.competition_id.toString()!,
            params.id?.toString() || ''
        );

        return this.http.get<CompetitionInfo>(endpoint, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    postCompetition(params: { title: string; practice: boolean }) {
        if (!this.authService.isAuthenticated) {
            return;
        }

        return this.http.post(apiEndpoints.competition, params, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    putCompetitionInfo(competition: CompetitionInfo) {
        return this.http.put(apiEndpoints.competition, competition, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }

    parseCompetitionTypes(comp: CompetitionInfo) {
        const dateOrNull = (date: any) => {
            if (date === null) {
                return null;
            }
            return new Date(date as unknown as string);
        };
        comp.created_at = dateOrNull(comp.created_at)!;
        comp.updated_at = dateOrNull(comp.updated_at)!;
        comp.deleted_at = dateOrNull(comp.deleted_at);
        comp.scheduled_at = dateOrNull(comp.scheduled_at);
        comp.scheduled_end_at = dateOrNull(comp.scheduled_end_at);

        comp.questions = comp.questions?.map((ques) => {
            ques.created_at = new Date(ques.created_at as unknown as string);
            ques.updated_at = new Date(ques.updated_at as unknown as string);
            ques.deleted_at = dateOrNull(ques.deleted_at);
            return ques;
        });
    }

    getCompetitions(params: any) {
        let httpParams = new HttpParams();
        if (params?.id) httpParams = httpParams.set('id', params.id);
        if (params?.query) httpParams = httpParams.set('query', params.query);
        if (params?.duration)
            httpParams = httpParams.set('duration', params.duration);
        if (params?.liveStatus)
            httpParams = httpParams.set('liveStatus', params.liveStatus);
        if (params?.orderBy)
            httpParams = httpParams.set('orderBy', params.orderBy);
        if (params?.includeSelf)
            httpParams = httpParams.set('includeSelf', params.includeSelf);

        const promise = new Promise<Array<CompetitionInfo>>(
            (resolve, reject) => {
                this.http
                    .get<Array<CompetitionInfo>>(apiEndpoints.getCompetitions, {
                        observe: 'response',
                        responseType: 'json',
                        withCredentials: true,
                        params: httpParams,
                    })
                    .subscribe((res) => {
                        res.body?.forEach((comp) => {
                            this.parseCompetitionTypes(comp);
                        });

                        resolve(res.body!);
                    });
            }
        );
        return promise;
    }

    getCompetitionInfo(id: string) {
        return this.http.get(apiEndpoints.competition + '/' + id, {
            responseType: 'json',
            observe: 'response',
        });
    }
}
