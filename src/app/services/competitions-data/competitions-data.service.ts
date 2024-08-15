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

@Injectable({
    providedIn: 'root',
})
export class CompetitionsDataService {
    constructor(private authService: AuthService, private http: HttpClient) {}

    deleteCompetition(id: string) {
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

    getFileStatus(id: string, fileType: string) {
        return this.http.get(
            apiEndpoints.question + '/' + id + '/' + fileType,
            {
                responseType: 'json',
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    judgeSolution(exe: HunterExecutable, samples = false) {
        return this.http.post(
            apiEndpoints.execute,
            { exec: exe, samples: samples },
            {
                responseType: 'json',
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    postQuestion(competition_id: string) {
        return this.http.post(
            apiEndpoints.question,
            { competition_id: competition_id },
            {
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    postFile(params: any) {
        return this.http.post(
            apiEndpoints.question + '/' + params.id + '/' + params.fileType,
            { file: params.file },
            {
                responseType: 'json',
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    deleteQuestion(id: string) {
        return this.http.delete(apiEndpoints.question + '/' + id, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    putQuestion(params: any) {
        return this.http.put(apiEndpoints.question, params, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
        });
    }

    getQuestions(params: { competition_id?: string; id?: string }) {
        let httpParams = new HttpParams();
        if (params.competition_id != null)
            httpParams = httpParams.set(
                'competition_id',
                params.competition_id
            );
        if (params.id != null) httpParams = httpParams.set('id', params.id);

        return this.http.get<Array<QuestionInfo>>(apiEndpoints.question, {
            responseType: 'json',
            withCredentials: true,
            observe: 'response',
            params: httpParams,
        });
    }

    postCompetition(title: string) {
        if (!this.authService.isAuthenticated) {
            return;
        }

        return this.http.post(
            apiEndpoints.competition,
            { title: title },
            {
                responseType: 'json',
                withCredentials: true,
                observe: 'response',
            }
        );
    }

    putCompetitionInfo(competition: CompetitionInfo) {
        return this.http.put(apiEndpoints.competition, competition, {
            observe: 'response',
            responseType: 'json',
            withCredentials: true,
        });
    }

    parseCompetitionTypes(comp: CompetitionInfo) {
        comp.created_at = new Date(comp.created_at as unknown as string);
        comp.updated_at = new Date(comp.updated_at as unknown as string);
        comp.deleted_at = new Date(comp.deleted_at as unknown as string);
        comp.scheduled_at = new Date(comp.scheduled_at as unknown as string);
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
