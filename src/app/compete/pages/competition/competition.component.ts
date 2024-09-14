import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import * as ace from 'ace-builds';
import { Subscription } from 'rxjs';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import {
    CompetitionInfo,
    domainName,
    ExecutionInfo,
    HunterLanguage,
    protocol,
    QuestionInfo,
    resCode,
    resultFull,
    templates,
    UserInfo,
} from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    faAddressCard,
    faChevronUp,
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

    isAuthenticated: boolean = false;
    user = {} as UserInfo;
    competition = {} as CompetitionInfo;
    evaluation: Array<resultFull> = [];
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

        document.onkeydown = (event) => {
            if (event.shiftKey && event.altKey && event.key == 'J') {
                this.postSolution(true);
            }

            if (event.key.startsWith('Esc')) {
                this.bottomSection = false;
            }
        };

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

    redirectToGitHubOAuth() {
        window.open(`${protocol}://${domainName}/api/oauth/github`);
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

        // setTimeout(() => {
        //     document.getElementById('solution_output')?.scrollIntoView({
        //         behavior: 'smooth',
        //         block: 'nearest',
        //     });
        // });

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
                            this.fetchEvaluation();
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

    fetchEvaluation() {
        this.subscriptions.push(
            this.scoresDataService
                .getScoresAll({
                    user_id: this.user.id,
                    competition_id: this.c_id,
                })
                .subscribe((res) => {
                    if (res.status == resCode.success) {
                        this.evaluation = res.body
                            ? (res.body as Array<resultFull>)
                            : [];
                    }
                })
        );
    }

    fetchData() {
        this.fetchEvaluation();

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
                            // setTimeout(() => {
                            //     this.initEditor();
                            // });
                        }
                    },
                    error: (err) => {
                        if (err.status == resCode.notFound) {
                            this.router.navigate(['/404']);
                        }
                    },
                })
        );
    }

    selectQuestion(index: number) {
        this.questionSelected = index;
        this.questionSelectedInfo = this.competition.questions![index];
    }

    // loadTemplate() {
    //     this.editor.setValue(
    //         templates[this.languageSelected as HunterLanguage]
    //     );
    // }

    // updateEditorMode(lang: string) {
    //     this.languageSelected = lang as HunterLanguage;

    //     switch (this.languageSelected) {
    //         case 'c':
    //         case 'cpp':
    //             this.editor.session.setMode('ace/mode/c_cpp');
    //             break;
    //         case 'py':
    //             this.editor.session.setMode('ace/mode/python');
    //             break;
    //         case 'js':
    //             this.editor.session.setMode('ace/mode/javascript');
    //             break;
    //         case 'ts':
    //             this.editor.session.setMode('ace/mode/typescript');
    //             break;
    //         case 'go':
    //             this.editor.session.setMode('ace/mode/golang');
    //             break;
    //     }
    // }

    toggleLayout() {
        this.hrlayout = !this.hrlayout;
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
