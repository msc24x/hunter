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
    QuestionChoice,
} from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    faAddressCard,
    faBug,
    faCheckCircle,
    faChevronUp,
    faEnvelopeOpenText,
    faFileCode,
    faFlag,
    faHourglassHalf,
    faMeteor,
    faPlay,
    faPuzzlePiece,
    faSpinner,
    faTableColumns,
    faVolleyball,
} from '@fortawesome/free-solid-svg-icons';
import { prettyDuration } from 'src/app/utils/utils';
import { TimeInterval } from 'rxjs/internal/operators/timeInterval';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { faCircle, faClock } from '@fortawesome/free-regular-svg-icons';
import { LocationStrategy } from '@angular/common';

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
    submitIcon = faEnvelopeOpenText;
    playIcon = faPlay;
    reportIcon = faBug;
    tickIcon = faCheckCircle;
    circleIcon = faCircle;
    clockIcon = faClock;
    practiceIcon = faVolleyball;

    showInstructionP = false;
    showSignInP = false;

    evaluationChangeOccurred = false;

    loading = 0;
    fetchSubmissionMsg = '';

    c_id: number = 0;
    q_idx: number = 0;

    hrlayout: boolean = true;
    bottomSection = false;

    viewSubmissionResult: result | undefined;
    questionsProgress: Array<QuestionProgress> = [];

    isAuthenticated: boolean = false;
    user = {} as UserInfo;
    competition = {} as CompetitionInfo;

    evaluation: Array<result> = [];

    questionSelected = -1;
    questionSelectedInfo: QuestionInfo | null = null;
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
        private scoresDataService: ScoresDataService,
        private titleService: Title,
        private snackBar: MatSnackBar,
        private location: LocationStrategy
    ) {
        const idParam = parseInt(
            this.route.snapshot.paramMap.get('competition_id') || ''
        );

        const idQues = parseInt(
            this.route.snapshot.paramMap.get('ques_id') || ''
        );

        if (idParam) {
            this.c_id = idParam;
        }

        if (idQues) {
            this.q_idx = idQues;
        }

        titleService.setTitle('Participate • Hunter');

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

            if (event.ctrlKey && event.key == '`') {
                this.bottomSection = !this.bottomSection;
            } else if (event.key.startsWith('Esc')) {
                this.bottomSection = false;
            }

            this.lastEditorContent(true);
        });

        if (
            /iPhone|iPad|iPod|Android|Opera Mini|IEMobile|BlackBerry|WPDesktop/i.test(
                navigator.userAgent
            )
        ) {
            // alert(
            //     'Participating in competitions is not recommended on your device. Hunter is designed to be best viewed on desktops.'
            // );
            this.hrlayout = false;
        }

        this.fetchData();

        if (this.isAuthenticated) {
            return;
        }

        this.loading++;
        this.subscriptions.push(
            this.authService.authenticate_credentials().subscribe({
                next: (res) => {
                    this.loading--;

                    if (res.status == 202) {
                        const body = res.body as UserInfo;
                        this.user = body;
                        this.isAuthenticated = true;
                        this.authService.user = this.user;
                        this.authService.isAuthenticated.next(true);
                    }
                },
                error: (err) => {
                    this.loading--;
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

    scrollToTop() {
        setTimeout(() => {
            document.querySelector('.bottom-section')?.scrollTo({
                behavior: 'smooth',
                top: 0,
            });
        });
    }

    submitAnswerBasedQues() {
        if (!this.questionSelectedInfo) {
            return;
        }

        this.judgeInProgress = true;

        this.loading++;
        this.enableSubmitControls(false);

        this.subscriptions.push(
            this.competitionsService
                .judgeSolution({
                    for: {
                        competition_id: this.c_id,
                        question_id: this.questionSelectedInfo.id,
                        type: this.questionSelectedInfo.type,
                    },
                    solution: this.questionSelectedInfo,
                })
                .subscribe({
                    next: (res) => {
                        this.loading--;
                        this.judgeInProgress = false;
                        this.enableSubmitControls(true);
                        this.scrollToTop();

                        this.evaluationChangeOccurred =
                            !this.evaluationChangeOccurred;

                        this.subscriptions.push(this.fetchProgress());
                    },

                    error: (err) => {
                        this.loading--;
                        this.judgeInProgress = false;
                        this.snackBar.open(err.error);

                        this.enableSubmitControls(true);
                        this.scrollToTop();
                        this.solutionOutput = err.statusText;
                    },
                })
        );
    }

    executeCode(samples = false) {
        if (!this.codeWritten) {
            this.solutionOutput.output = 'Empty solution';
            return;
        }

        this.solutionOutput.output = '';
        this.judgeInProgress = true;

        this.loading++;
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
                            type: 0,
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
                        this.loading--;
                        this.judgeInProgress = false;
                        this.enableSubmitControls(true);
                        this.scrollToTop();

                        if (res.status == resCode.success) {
                            this.solutionOutput = res.body as ExecutionInfo;
                        } else {
                            this.solutionOutput.output = res.statusText;
                        }
                    },

                    error: (err) => {
                        this.loading--;
                        this.judgeInProgress = false;

                        this.enableSubmitControls(true);
                        this.scrollToTop();
                        this.solutionOutput = err.statusText;
                    },
                })
        );
    }

    postSolution(samples = false) {
        if (!this.isAuthenticated) {
            this.showSignInP = true;
            return;
        }

        if (!this.questionSelectedInfo) {
            return;
        }

        this.clearOutput();

        if (this.questionSelected == -1) {
            this.solutionOutput.output = 'No question selected';
            return;
        }

        if (this.questionSelectedInfo.type === 0) {
            this.bottomSection = true;
            this.scrollToTop();
            this.executeCode(samples);
        } else {
            this.submitAnswerBasedQues();
        }
    }

    fetchLastSubmission() {
        if (!this.questionSelectedInfo) {
            return;
        }

        this.fetchSubmissionMsg = '';
        this.loading++;
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
                        this.loading--;
                    },
                    error: (err) => {
                        console.log(err);
                        this.loading--;
                        this.fetchSubmissionMsg =
                            '* Not found any .' +
                            this.languageSelected +
                            ' submission';
                    },
                })
        );
    }

    fetchData() {
        this.loading++;

        const dataSubscriptions = [
            this.competitionsService
                .getQuestions({ competition_id: this.c_id })
                .subscribe({
                    next: (res) => {
                        this.loading--;

                        this.competition = res.body as CompetitionInfo;
                        this.competitionsService.parseCompetitionTypes(
                            this.competition
                        );

                        this.titleService.setTitle(
                            `${this.competition.title || 'Competition'}`
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
                            this.selectQuestion(this.q_idx);
                        }
                    },
                    error: (err) => {
                        this.loading--;

                        if (err.status == resCode.notFound) {
                            this.router.navigate(['/404']);
                        }
                    },
                }),
            this.fetchProgress(),
        ];

        this.subscriptions.push(...dataSubscriptions);
    }

    fetchProgress() {
        this.loading++;

        return this.scoresDataService
            .getProgress({ comp_id: this.c_id })
            .subscribe({
                next: (res) => {
                    this.loading--;

                    this.questionsProgress = res.body || [];
                },
                error: () => {
                    this.loading--;
                },
            });
    }

    selectQuestion(index: number) {
        if (!this.competition.questions?.length) {
            return;
        }

        this.questionSelected = index;
        this.questionSelectedInfo = this.competition.questions![index];

        if (!this.questionSelectedInfo) {
            this.selectQuestion(0);
            return;
        }

        this.lastEditorContent();

        this.titleService.setTitle(
            `Q${this.questionSelected + 1} • ${
                this.competition.title || 'Competition'
            }`
        );
    }

    getLastSubmission() {
        if (
            this.competition.practice &&
            this.questionSelectedInfo?.type !== 0
        ) {
            return null;
        }

        return this.questionSelectedInfo?.results?.[0];
    }

    showChoiceAsSelected(choice: QuestionChoice) {
        if (choice.is_correct) {
            return true;
        }

        if (this.competition.practice) {
            return false;
        }

        const lastSub = this.getLastSubmission();

        if (!lastSub) {
            return false;
        }

        let wasIt = false;

        lastSub.question_choices?.forEach((qChoice) => {
            if (qChoice?.id === choice.id) {
                wasIt = true;
            }
        });

        return wasIt;
    }

    lastEditorContent(save?: boolean) {
        const storageKey = `code-c${this.questionSelectedInfo?.competition_id}-q${this.questionSelectedInfo?.id}`;

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

    getParticipationLink() {
        return `${protocol}://${domainName}/compete/p/${this.competition.id}`;
    }

    reportCompetitionLink() {
        var mailtoString = `mailto:msc24x+hunter_reports@gmail.com?subject=%5BReport%5D%20${
            this.competition.title || '<Untitled competition>'
        }&body=I%20would%20like%20to%20report%20the%20following%20competition.%0A%0ALink%3A%20${this.getParticipationLink()}%0A%0AREASON%3A%0A%3CPlease%20specify%20your%20reason%20here%3E%0A%0AACTION%20REQUEST%3A%0A%3CPlease%20specify%20what%20action%20do%20you%20wish%20the%20Hunter%20to%20take%3E`;

        return mailtoString;
    }

    alreadySelectedOptions() {
        let alreadySelected = 0;

        this.questionSelectedInfo?.question_choices?.forEach((ch) => {
            if (this.showChoiceAsSelected(ch)) {
                alreadySelected++;
            }
        });

        return alreadySelected;
    }

    handleChoiceSelection(choice: QuestionChoice) {
        let alreadySelected = this.alreadySelectedOptions();

        if (!choice.is_correct) {
            alreadySelected++;
        }

        if (alreadySelected > (this.questionSelectedInfo?.correct_count || 0)) {
            this.snackBar.open(
                `Cannot select more than ${
                    alreadySelected - 1
                } choice(s), please un-select some option to choose a new one.`
            );
            return;
        }

        choice.is_correct = !choice.is_correct;
    }

    numOfWordsWritten(content: string) {
        if (!content?.trim()) {
            return 0;
        }
        return content?.trim().split(' ').length;
    }

    isLongAnswerAcceptable(content: string) {
        return (
            this.numOfWordsWritten(content) >=
            (this.questionSelectedInfo?.char_limit || 0)
        );
    }
}
