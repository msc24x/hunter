import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
    faBook,
    faCheckDouble,
    faCircleCheck,
    faCircleXmark,
    faDownload,
    faEye,
    faEyeSlash,
    faMinusCircle,
    faPenToSquare,
    faShare,
    faShareNodes,
    faSquareShareNodes,
    faTrashArrowUp,
    faTrashCan,
    faUpload,
    faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { error } from 'console';
import katex from 'katex';
import { BehaviorSubject, timeout } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    CompetitionInfo,
    domainName,
    environment,
    protocol,
    QuestionChoice,
    QuestionInfo,
    QuestionVerification,
    resCode,
    ScoresMeta,
    UserInfo,
} from 'src/environments/environment';

import suneditor from 'suneditor';
import SunEditor, { Core } from 'suneditor/src/lib/core';
import plugins from 'suneditor/src/plugins';

@Component({
    selector: 'editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit, OnDestroy {
    shareIcon = faShareNodes;
    viewIcon = faEye;
    writeIcon = faEyeSlash;
    checkIcon = faCircleCheck;
    crossIcon = faCircleXmark;
    trashIcon = faTrashCan;
    trashUpIcon = faTrashArrowUp;
    magicIcon = faWandMagicSparkles;
    guideIcon = faBook;

    correctIcon = faCheckDouble;
    minusIcon = faMinusCircle;

    uploadIcon = faUpload;
    downloadIcon = faDownload;

    loading = false;
    preview_mode = false;
    log = new Array<string>();
    deleteCompMessage = '';

    competition_id: number;
    competitionInfo: CompetitionInfo = {} as CompetitionInfo;
    questionSelected = -1;
    questionSelectedInfo = {} as QuestionInfo;
    questionSelectedBackup = {} as QuestionInfo;
    testExists = false;
    solsExists = false;
    verificationResult: QuestionVerification | null = null;
    quality: any = {};
    elem: HTMLElement | null = null;
    suneditor: SunEditor | null = null;

    scoreMeta: ScoresMeta = null;

    isAuthenticated: boolean = false;
    user = {} as UserInfo;
    eventPopup = new BehaviorSubject<string>('');

    errors: any = {};

    choiceTypes = {
        selectable: 0,
        hidden: 1,
    };

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private competitionsData: CompetitionsDataService,
        private datePipe: DatePipe,
        private titleService: Title,
        private snackBar: MatSnackBar
    ) {
        titleService.setTitle('Build • Hunter');

        this.competition_id = parseInt(
            this.activatedRoute.snapshot.paramMap.get('competition_id') || ''
        );

        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;
        });
    }

    ngOnDestroy(): void {
        this.suneditor?.destroy();

        document
            .getElementsByTagName('bottom-app-bar')[0]
            .classList.remove('hidden');

        window.onbeforeunload = null;
    }

    ngOnInit(): void {
        document
            .getElementsByTagName('bottom-app-bar')[0]
            .classList.add('hidden');
        window.scroll(0, 0);

        window.onbeforeunload = (event) => {
            event.preventDefault();
            return;
        };

        this.elem = document.getElementById('log');

        if (!this.isAuthenticated) {
            this.loading = true;
            this.authService.authenticate_credentials().subscribe(
                (res) => {
                    if (res.status == 202) {
                        const body = res.body as UserInfo;
                        this.user = body;
                        this.authService.user = this.user;
                        this.authService.isAuthenticated.next(true);
                        this.loading = false;
                        this.fetchQuestions();
                    }
                },
                (err) => {
                    this.loading = false;
                    this.router.navigate(['/home']);
                }
            );
        } else {
            this.fetchQuestions();
        }

        document.onkeydown = (event) => {
            if (
                event.shiftKey &&
                event.key == 'S' &&
                !['INPUT', 'TEXTAREA'].includes(
                    (event.target as HTMLElement).tagName
                )
            ) {
                this.saveChanges();
            }
        };
    }

    addObserver() {
        const iObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.intersectionRatio === 1) {
                        entry.target.classList.remove('sticky');
                    } else {
                        if (
                            entry.intersectionRect.top > 100 ||
                            !entry.intersectionRect.width
                        ) {
                            return;
                        }
                        entry.target.classList.add('sticky');
                    }
                });
            },
            { rootMargin: '-1px 0px 0px 0px', threshold: [1] }
        );

        iObserver.observe(document.querySelector('.questions-list')!);
    }

    shareAction() {
        navigator.share({
            title: `Invitation link to "${this.competitionInfo.title}"`,
            url: this.getParticipationLink(),
            text: `\nYou are invited to participate in the above competition created by ${
                this.user.name || 'a user'
            }.\n(Hosted on Hunter, an open source contest hosting platform, with easy participation and automatic evaluation of participants.)`,
        });
    }

    getParticipationLink() {
        return `${protocol}://${domainName}/compete/p/${this.competition_id}`;
    }

    getFileStatus(fileType: string) {
        let exists = new BehaviorSubject(false);
        this.competitionsData
            .getFileStatus({
                competition_id: this.questionSelectedInfo.competition_id,
                question_id: this.questionSelectedInfo.id,
                file_type: fileType,
            })
            .subscribe((res) => {
                if (res.status == resCode.success) {
                    exists.next((res.body as any).exists);
                }
            });

        return exists.asObservable();
    }

    downloadFileUrl(fileType: string) {
        return `${environment.apiUrl}/competitions/${this.questionSelectedInfo.competition_id}/questions/${this.questionSelectedInfo.id}/${fileType}/download`;
    }

    downloadFile(fileType: string) {
        window.open(this.downloadFileUrl(fileType));
    }

    addNewChoiceInQuestion() {
        const chId = -1 * Date.now();
        this.questionSelectedInfo.question_choices?.push({
            id: chId,
            is_correct: false,
            position: this.questionSelectedInfo.question_choices.length,
            question_id: this.questionSelectedInfo.id,
            text: '',
        });

        setTimeout(() => {
            const choiceElem = document.querySelector(`#choice-text-${chId}`);

            if (choiceElem) {
                (choiceElem as HTMLTextAreaElement).select();
            }
        });
    }

    markChoiceAsDeletedToggle(choice: QuestionChoice) {
        choice.delete = !choice.delete;
    }

    saveQuestion() {
        if (this.questionSelected == -1) {
            return;
        }
        this.loading = true;
        var promise = new Promise<void>((resolve, reject) => {
            this.competitionsData
                .putQuestion({
                    ...this.questionSelectedInfo,
                    created_at: this.competitionInfo.created_at,
                    updated_at: new Date(),
                } as QuestionInfo)
                .subscribe(
                    (res) => {
                        this.loading = false;
                        this.errors = {};
                        this.snackBar.open('Question saved successfully');

                        this.fetchQuestions();

                        resolve();
                    },
                    (error) => {
                        this.loading = false;
                        this.snackBar.open(
                            'Some error occurred while saving question'
                        );
                        this.errors = error.error;
                        reject();
                    }
                );
        });

        return promise;
    }

    selectedQuestionElement(): HTMLLIElement | null {
        let prevTarget = document
            .getElementById('questions_list')
            ?.getElementsByTagName('li')[this.questionSelected];
        if (prevTarget) {
            return prevTarget;
        } else return null;
    }

    _selectQuestion(index: number, backup = true) {
        this.questionSelected = index;
        this.questionSelectedInfo =
            index == -1
                ? ({} as QuestionInfo)
                : this.competitionInfo.questions![index];

        if (backup) {
            this.questionSelectedBackup = structuredClone(
                this.questionSelectedInfo
            );
        }

        if (this.questionSelectedInfo?.type === 0) {
            this.getFileStatus('solutions').subscribe((res) => {
                this.solsExists = res;
            });
            this.getFileStatus('testcases').subscribe((res) => {
                this.testExists = res;
            });
        }

        this.titleService.setTitle(
            `Q${index + 1} • ${this.competitionInfo.title || 'Competition'}`
        );

        setTimeout(() => {
            this.suneditor?.destroy();
            this.suneditor = suneditor.create('text_statement', {
                plugins: plugins,
                charCounter: true,
                display: 'block',
                katex: {
                    src: katex,
                    options: {
                        output: 'mathml',
                        displayMode: false,
                    },
                },
                // Plugins can be used directly in the button list
                buttonList: [
                    ['blockquote'],
                    [
                        'bold',
                        'underline',
                        'italic',
                        'strike',
                        'subscript',
                        'superscript',
                    ],
                    ['removeFormat'],
                    ['outdent', 'indent'],
                    ['align', 'horizontalRule', 'list'],
                    ['table', 'link', 'math'],
                    ['fullScreen'],
                    ['preview', 'print'],
                    ['undo', 'redo'],
                ],
                defaultStyle: 'font-family: appFont; font-size: 1.1rem;',
            });

            this.suneditor.onChange = (contents: string, core: Core) => {
                this.questionSelectedInfo.statement = contents;
            };
        });
    }

    selectQuestion(index: number, checkUnsaved: boolean = false) {
        var currentQuestionIndex = this.questionSelected;

        if (
            checkUnsaved &&
            JSON.stringify(this.questionSelectedInfo) !==
                JSON.stringify(this.questionSelectedBackup)
        ) {
            const saveRequired = confirm(
                'Save unsaved changes for the selected question?\nPress "OK" to save, or "CANCEL" to discard unsaved changed.'
            );

            if (saveRequired) {
                this.saveQuestion()?.then(
                    () => {
                        this._selectQuestion(index);
                    },
                    () => {
                        this._selectQuestion(currentQuestionIndex, false);
                    }
                );
                return;
            } else {
                Object.assign(
                    this.questionSelectedInfo,
                    this.questionSelectedBackup
                );
            }
            this._selectQuestion(index);

            return;
        }

        this._selectQuestion(index);
    }

    updateFile(event: any, filen: string) {
        const file = (event.target as HTMLInputElement).files;

        if (!file || file.length == 0) {
            this.displayLog('Error while uploading');
            return;
        }

        if (this.questionSelected == -1) {
            this.displayLog('Error : No question selected');
            return;
        }

        if (file[0].size > 1572864 || file[0].type != 'text/plain') {
            this.displayLog('File should be .txt < 1.5 Mb');
            return;
        }

        this.loading = true;
        this.displayLog('Uploading.. ' + filen + ' ' + file[0].name);

        this.competitionsData
            .postFile({
                id: this.questionSelectedInfo.id,
                fileType: filen.toLowerCase(),
                file: file[0],
                competition_id: this.competitionInfo.id,
            })
            .subscribe((res) => {
                if (res.status !== 200) {
                    this.displayLog('Upload failed');
                    this.snackBar.open(
                        `File upload failed due to some reason, please refresh and try again later.`
                    );
                    return;
                }

                this.snackBar.open(
                    `File for ${filen} uploaded successfully, now please verify the question by using 'Test your own solution'`
                );

                if (this.verificationResult) {
                    this.verificationResult.success = false;
                }

                if (filen === 'testcases') {
                    this.testExists = true;
                } else if (filen === 'solutions') {
                    this.solsExists = true;
                }

                this.loading = false;
            });
    }

    fetchQuestions(update_competition = true) {
        this.loading = true;
        this.competitionsData
            .getQuestions({ competition_id: this.competition_id })
            .subscribe((res) => {
                if (res.body) {
                    if (update_competition) {
                        this.competitionInfo = res.body as CompetitionInfo;
                        this.toggleVisibility();
                        this.toggleVisibility();
                    }

                    this.competitionInfo.questions = res.body.questions;
                    this.loading = false;

                    this.titleService.setTitle(
                        `Build • ${this.competitionInfo.title || 'Competition'}`
                    );

                    if (this.questionSelected !== -1) {
                        this.selectQuestion(this.questionSelected);
                    }

                    this.competitionsData
                        .fetchQuality({ competition_id: this.competition_id })
                        .subscribe({
                            next: (qualityRes) => {
                                this.quality = qualityRes.body;
                            },
                        });

                    setTimeout(() => this.addObserver());
                }
            });
    }

    toggleCharLimit(enabled: boolean) {
        if (enabled) {
            this.questionSelectedInfo.char_limit = 24;
        } else {
            this.questionSelectedInfo.char_limit = null;
        }
    }

    refreshCompetitionInfo() {
        this.fetchQuestions();
    }

    toggleVisibility() {
        this.competitionInfo.public = !this.competitionInfo.public;
    }

    saveChanges() {
        this.loading = true;
        this.errors = {};

        const schedule = document.getElementById(
            'competition_schedule'
        ) as HTMLInputElement;
        const schedule_end = document.getElementById(
            'competition_schedule_end'
        ) as HTMLInputElement;

        this.competitionInfo.scheduled_end_at = new Date(schedule_end.value);
        this.competitionInfo.scheduled_at = new Date(schedule.value);
        this.competitionsData
            .putCompetitionInfo(this.competitionInfo)
            .subscribe(
                (res) => {
                    this.snackBar.open('Competition info saved successfully');
                    this.loading = false;

                    this.saveQuestion();
                },
                (error) => {
                    this.snackBar.open(
                        'Some error occurred while saving competition info'
                    );

                    this.loading = false;
                    this.errors = error.error;
                }
            );
    }

    displayLog(msg: string) {
        console.info(msg);
        this.log.push(msg);
        if (this.elem) this.elem.innerHTML = '&#x1F6C8; ' + msg;
    }

    handleDeleteCompPopupEvent(event: string) {
        this.showPopup(false, 'delete_comp_popup');
    }

    handleGuidePopupEvent(event: string) {
        this.eventPopup.next(event);
        this.showPopup(false, 'guide');
    }

    handlePrivacyConfirmPopupEvent(event: string) {
        if (event == 'continue') {
            this.toggleVisibility();
        }

        this.showPopup(false, 'public_status_confirm');
    }

    showLog() {
        console.log(this.log);
    }

    showPopup(f: boolean, id: string) {
        let guide = document.getElementById(id) as HTMLElement;
        if (f) {
            guide.style.display = 'block';
            window.scroll(0, 0);
        } else guide.style.display = 'none';
    }

    onClickVisibility(isPublic = true) {
        if (isPublic) {
            this.showPopup(true, 'public_status_confirm');
        } else {
            this.toggleVisibility();
        }
    }

    togglePreview() {
        // Saving the text area content into questions statement
        // so that the user do not loose the written content
        let text_statement = document.getElementById(
            'text_statement'
        ) as HTMLTextAreaElement;

        if (text_statement)
            this.questionSelectedInfo.statement = text_statement.value;

        this.preview_mode = !this.preview_mode;
    }

    deleteCompetition() {
        this.errors.delete_code = '';

        let input = document.getElementById(
            'input_competition_code'
        ) as HTMLInputElement;
        if (parseInt(input.value) != this.competitionInfo.id) {
            this.errors.delete_code = 'Code does not match';
        } else {
            this.deleteCompMessage = '';
            this.loading = true;
            this.competitionsData
                .deleteCompetition(this.competitionInfo.id)
                .subscribe({
                    next: (res) => {
                        this.deleteCompMessage = 'Deleted';
                        this.showPopup(false, 'delete_comp_popup');
                        this.router.navigate(['/editor/workbench']);
                        this.snackBar.open('Competition deleted');
                    },
                    error: (err) => {
                        this.deleteCompMessage = err.status;
                    },
                    complete: () => {
                        this.loading = false;
                    },
                });
        }
    }
}
