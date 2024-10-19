import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import * as ace from 'ace-builds';
import { last, Subscription } from 'rxjs';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import {
    CompetitionInfo,
    QuestionProgress,
    domainName,
    ExecutionInfo,
    HunterLanguage,
    protocol,
    QuestionInfo,
    resCode,
    result,
    resultFull,
    templates,
    UserInfo,
    environment,
} from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    faAddressCard,
    faChevronUp,
    faFileCode,
    faHourglassHalf,
    faSpinner,
    faTableColumns,
} from '@fortawesome/free-solid-svg-icons';
import { prettyDuration } from 'src/app/utils/utils';
import { TimeInterval } from 'rxjs/internal/operators/timeInterval';

@Component({
    selector: 'competition',
    templateUrl: './competition.component.html',
    styleUrls: ['./competition.component.scss'],
})
export class CompetitionComponent implements OnInit, OnDestroy {
    layoutIcon = faTableColumns;
    judgeLoadingIcon = faSpinner;
    loginIcon = faAddressCard;
    timerIcon = faHourglassHalf;
    upIcon = faChevronUp;

    showInstructionP = false;

    loading = false;
    fetchSubmissionMsg = '';

    c_id: number = 0;

    hrlayout: boolean = true;
    bottomSection = false;

    viewSubmissionResult: result | undefined;
    questionsProgress: Array<QuestionProgress> = [];

    isAuthenticated: boolean = false;
    user = {} as UserInfo;
    competition = {} as CompetitionInfo;

    evaluation: Array<result> = [];

    questionSelected = -1;
    questionSelectedInfo = {} as QuestionInfo;
    judgeInProgress = false;
    solutionOutput: ExecutionInfo = {
        expected: '',
        output: '',
        success: false,
        meta: '',
    };
    languageSelected: HunterLanguage = 'cpp';
    codeWritten: string = '';

    timeRemaining = '(-_-)';
    hasEnded = false;

    routerSubsc: Subscription | null = null;
    subscriptions: Subscription[] = [];
    timeInterval: any = null;

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private router: Router,
        private competitionsService: CompetitionsDataService,
        private scoresDataService: ScoresDataService
    ) {
        const idParam = parseInt(
            this.route.snapshot.paramMap.get('competition_id') || ''
        );
        if (idParam) {
            this.c_id = idParam;
        }

        this.user = this.authService.user;
        this.isAuthenticated = this.authService.isAuthenticated.value;
    }

    ngOnInit(): void {
        document
            .getElementsByTagName('bottom-app-bar')[0]
            .classList.add('hidden');

        document.addEventListener('click', (event) => {
            const inBottomSection = (event.target as HTMLElement).closest(
                '.bottom-section'
            );
            const inSubmitControls = (event.target as HTMLElement).closest(
                '#submit_controls'
            );

            if (!inBottomSection && !inSubmitControls) {
                this.bottomSection = false;
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.shiftKey && event.altKey && event.key == 'J') {
                this.postSolution(true);
            }

            if (event.key.startsWith('Esc')) {
                this.bottomSection = false;
            }

            this.lastEditorContent(true);
        });

        if (this.isAuthenticated) {
            this.fetchData();
            return;
        }

        this.subscriptions.push(
            this.authService.authenticate_credentials().subscribe({
                next: (res) => {
                    if (res.status == 202) {
                        const body = res.body as UserInfo;
                        this.user = body;
                        this.isAuthenticated = true;
                        this.authService.user = this.user;
                        this.authService.isAuthenticated.next(true);
                        this.fetchData();
                        if (
                            /iPhone|iPad|iPod|Android|Opera Mini|IEMobile|BlackBerry|WPDesktop/i.test(
                                navigator.userAgent
                            )
                        ) {
                            alert(
                                'Participating in competitions is not recommended on your device. Hunter is designed to be best viewed on desktops'
                            );
                        }
                    }
                },
            })
        );
    }

    ngOnDestroy() {
        document
            .getElementsByTagName('bottom-app-bar')[0]
            .classList.remove('hidden');

        this.unsubscribeAll();
        this.routerSubsc?.unsubscribe();
    }

    unsubscribeAll() {
        this.routerSubsc?.unsubscribe();
        this.routerSubsc = this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                let sub = this.subscriptions.pop();
                while (sub) {
                    sub.unsubscribe();
                    sub = this.subscriptions.pop();
                }
            }
        });
    }

    clearOutput() {
        this.solutionOutput = {
            expected: '',
            meta: '',
            output: '',
            success: false,
        };
    }

    getAcceptedSubmissions() {
        return this.evaluation.filter((ev) => ev.accepted).length;
    }

    getRejectedSubmissions() {
        return this.evaluation.filter((ev) => !ev.accepted).length;
    }

    getAcceptedSolutions() {
        return this.questionsProgress.filter((qp) => qp.accepted).length;
    }

    getTotalScore(question_id?: number) {
        var total = 0;

        this.questionsProgress.forEach((qp) => {
            if (question_id && qp.question_id !== question_id) {
                return;
            }

            total += qp.total;
        });
        return total;
    }

    redirectToGitHubOAuth() {
        window.open(`${environment.apiUrl}/oauth/github`);
    }

    postSolution(samples = false) {
        this.clearOutput();
        this.bottomSection = true;

        if (this.questionSelected == -1) {
            this.solutionOutput.output = 'No question selected';
            return;
        }
        if (!this.codeWritten) {
            this.solutionOutput.output = 'Empty solution';
            return;
        }

        this.solutionOutput.output = '';
        this.judgeInProgress = true;

        this.loading = true;
        this.enableSubmitControls(false);
        this.subscriptions.push(
            this.competitionsService
                .judgeSolution(
                    {
                        for: {
                            competition_id: this.c_id,
                            question_id:
                                this.competition.questions![
                                    this.questionSelected
                                ].id,
                        },
                        solution: {
                            lang: this.languageSelected,
                            code: this.codeWritten,
                        },
                    },
                    samples
                )
                .subscribe({
                    next: (res) => {
                        this.loading = false;
                        this.judgeInProgress = false;
                        this.enableSubmitControls(true);

                        if (res.status == resCode.success) {
                            this.solutionOutput = res.body as ExecutionInfo;
                        } else {
                            this.solutionOutput.output = res.statusText;
                        }
                    },

                    error: (err) => {
                        this.loading = false;
                        this.judgeInProgress = false;

                        this.enableSubmitControls(true);
                        this.solutionOutput = err.statusText;
                    },
                })
        );
    }

    fetchLastSubmission() {
        this.fetchSubmissionMsg = '';
        this.loading = true;
        this.subscriptions.push(
            this.competitionsService
                .getLastSubmission({
                    competition_id: this.competition.id,
                    question_id: this.questionSelectedInfo.id,
                    lang: this.languageSelected,
                })
                .subscribe({
                    next: (res) => {
                        this.codeWritten = res.body?.data ?? '';
                        this.loading = false;
                    },
                    error: (err) => {
                        console.log(err);
                        this.loading = false;
                        this.fetchSubmissionMsg =
                            '* Not found any .' +
                            this.languageSelected +
                            ' submission';
                    },
                })
        );
    }

    fetchData() {
        this.subscriptions.push(
            this.competitionsService
                .getQuestions({ competition_id: this.c_id })
                .subscribe({
                    next: (res) => {
                        this.competition = res.body as CompetitionInfo;
                        this.competitionsService.parseCompetitionTypes(
                            this.competition
                        );

                        if (!this.competition.scheduled_end_at) {
                            clearInterval(this.timeInterval);
                        }

                        if (
                            this.competition.scheduled_at &&
                            this.competition.scheduled_at.getTime() > Date.now()
                        ) {
                            alert('Competition has not started yet');
                            this.router.navigate(['/compete']);
                        }

                        if (
                            this.competition.scheduled_end_at &&
                            new Date() > this.competition.scheduled_end_at
                        ) {
                            this.hasEnded = true;
                        }

                        if (this.competition.scheduled_end_at !== null) {
                            this.timeInterval = setInterval(() => {
                                let seconds =
                                    (this.competition.scheduled_end_at!.getTime() -
                                        Date.now()) /
                                    1000;
                                if (seconds < 0) {
                                    this.timeRemaining = 'Closed';
                                    clearInterval(this.timeInterval);
                                    return;
                                }
                                this.timeRemaining = prettyDuration(seconds);
                            }, 1000);
                        } else {
                            this.timeRemaining = 'Unlimited';
                        }

                        if (this.competition.questions) {
                            this.selectQuestion(0);
                        }
                    },
                    error: (err) => {
                        if (err.status == resCode.notFound) {
                            this.router.navigate(['/404']);
                        }
                    },
                }),
            this.scoresDataService
                .getProgress({ comp_id: this.c_id })
                .subscribe({
                    next: (res) => {
                        this.questionsProgress = res.body || [];
                    },
                })
        );
    }

    selectQuestion(index: number) {
        this.questionSelected = index;
        this.questionSelectedInfo = this.competition.questions![index];

        this.lastEditorContent();
    }

    lastEditorContent(save?: boolean) {
        const storageKey = `code-c${this.questionSelectedInfo.competition_id}-q${this.questionSelectedInfo.id}`;

        if (save) {
            localStorage.setItem(storageKey, this.codeWritten);
        } else {
            const lastContent = localStorage.getItem(storageKey);

            if (lastContent) {
                this.codeWritten = lastContent;
            }
        }
    }

    toggleLayout() {
        this.hrlayout = !this.hrlayout;
    }

    getQuestionStatement(questionInfo: QuestionInfo) {
        var final = `$\\textbf{Statement}$\n\n` + questionInfo.statement || '';

        if (questionInfo.sample_cases) {
            final +=
                `\n\n$\\textbf{Sample Cases}$\n\n` + questionInfo.sample_cases;
        }

        if (questionInfo.sample_sols) {
            final +=
                `\n\n$\\textbf{Sample Output}$\n\n` + questionInfo.sample_sols;
        }

        return final;
    }

    enableSubmitControls(enable: boolean) {
        let elem = document.getElementById('submit_controls') as HTMLDivElement;

        if (enable) {
            elem.style.pointerEvents = 'initial';
            elem.style.opacity = '1';
        } else {
            elem.style.pointerEvents = 'none';
            elem.style.opacity = '0.5';
        }
    }
}
