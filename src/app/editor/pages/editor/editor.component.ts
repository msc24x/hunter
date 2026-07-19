import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
    faBook,
    faCheckDouble,
    faCircle,
    faCircleCheck,
    faCircleXmark,
    faCopy,
    faDownload,
    faEnvelope,
    faEye,
    faEyeSlash,
    faFileImport,
    faMinusCircle,
    faPaperPlane,
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
import { BehaviorSubject, min, timeout } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CommunitiesDataService } from 'src/app/services/communities-data/communities-data.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    Community,
    CommunityPermission,
    CompetitionInfo,
    CompetitionInvite,
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
    inviteIcon = faPaperPlane;
    circleIcon = faCircle;

    correctIcon = faCheckDouble;
    minusIcon = faMinusCircle;

    uploadIcon = faUpload;
    downloadIcon = faDownload;

    copyIcon = faCopy;
    importIcon = faFileImport;

    loading = false;
    preview_mode = false;
    log = new Array<string>();
    deleteCompMessage = '';

    competition_id: number;
    competitionInfo: CompetitionInfo = {} as CompetitionInfo;
    questionSelected = -1;
    questionSelectedInfo = {} as QuestionInfo;
    questionSelectedBackup = {} as QuestionInfo;
    timeLimitEnabled = false;
    timeLimit: { hours: number; mins: number } = {
        hours: 0,
        mins: 15,
    };
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

    inviteP = {
        input: '',
        invites: [] as string[],
    };
    showInviteP = false;
    inviteToRemove: null | CompetitionInvite = null;

    importState = {
        prompt: '',
        count: 5,
        default_points: 1,
        default_neg_points: 0,
        delete_existing: false,
        json: '',
    };
    importErrors: { json: string } = { json: '' };
    importSchema: any = null;
    userCommunities: Array<Community> = [];
    ownedCommunities: Array<Community> = [];

    errors: any = {};
    contest_errors: any = {};
    changesInterval = {
        interval: 0,
        unsavedChanges: false,
    };

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
        private snackBar: MatSnackBar,
        private communityService: CommunitiesDataService,
    ) {
        titleService.setTitle('Build - Hunter');

        this.competition_id = parseInt(
            this.activatedRoute.snapshot.paramMap.get('competition_id') || '',
        );

        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;
        });

        this.startChangesInterval();
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

        this.competitionsData.getImportSchema().then((schema) => {
            if (schema) this.importSchema = schema;
        });

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
                        this.fetchUserCommunities();
                    }
                },
                (err) => {
                    this.loading = false;
                    this.router.navigate(['/home']);
                },
            );
        } else {
            this.fetchQuestions();
            this.fetchUserCommunities();
        }

        document.onkeydown = (event) => {
            if (
                event.shiftKey &&
                event.key == 'S' &&
                !['INPUT', 'TEXTAREA'].includes(
                    (event.target as HTMLElement).tagName,
                )
            ) {
                this.saveChanges();
            }
        };
    }

    startChangesInterval() {
        if (this.changesInterval.interval) {
            clearInterval(this.changesInterval.interval);
        }

        // Check changes every second
        setInterval(() => {
            if (
                JSON.stringify(this.questionSelectedInfo) ===
                    JSON.stringify(this.questionSelectedBackup) ||
                !this.questionSelected
            ) {
                // console.log('hi');
                this.changesInterval.unsavedChanges = false;
                return;
            }

            this.changesInterval.unsavedChanges = true;
        }, 1000);
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
            { rootMargin: '-1px 0px 0px 0px', threshold: [1] },
        );

        iObserver.observe(document.querySelector('.questions-list')!);
    }

    shareAction() {
        const linkText = `\nYou are invited to participate in the above competition created by ${
            this.user.name || 'a user'
        }.\n(Hosted on Hunter, an open source contest hosting platform, with easy participation and automatic evaluation of participants.)`;

        if (navigator.share) {
            navigator.share({
                title: `Invitation link to "${this.competitionInfo.title}"`,
                url: this.getParticipationLink(),
                text: linkText,
            });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            // Use the modern API.  This is the preferred method as it's more secure
            // and doesn't require adding elements to the DOM.
            navigator.clipboard
                .writeText(
                    `Invitation link to "${
                        this.competitionInfo.title
                    }": ${this.getParticipationLink()}\n\n ${linkText}`,
                )
                .then(
                    () => {
                        this.snackBar.open(
                            'Link copied to clipboard',
                            'Dismiss',
                        );
                    },
                    () => {
                        this.snackBar.open(
                            `${this.getParticipationLink()} (Unable to auto share, please copy the link)`,
                            'Dismiss',
                            { duration: 0 },
                        );
                    },
                );
        }
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
            this.fetchQuestions();

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
                            'Some error occurred while saving question',
                        );
                        this.errors = error.error;
                        reject();
                    },
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
                this.questionSelectedInfo,
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
            `Q${index + 1} - ${this.competitionInfo.title || 'Competition'}`,
        );

        setTimeout(() => {
            if (this.suneditor?.destroy) {
                this.suneditor?.destroy();
            }

            if (this.questionSelected === -1) {
                return;
            }

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
                    ['blockquote', 'formatBlock'],
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
                'Save unsaved changes for the selected question?\nPress "OK" to save, or "CANCEL" to discard unsaved changed.',
            );

            if (saveRequired) {
                this.saveQuestion()?.then(
                    () => {
                        this._selectQuestion(index);
                    },
                    () => {
                        this._selectQuestion(currentQuestionIndex, false);
                    },
                );
                return;
            } else {
                Object.assign(
                    this.questionSelectedInfo,
                    this.questionSelectedBackup,
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
                        `File upload failed due to some reason, please refresh and try again later.`,
                    );
                    return;
                }

                this.snackBar.open(
                    `File for ${filen} uploaded successfully, now please verify the question by using 'Test your own solution'`,
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

    fetchUserCommunities() {
        var canLinkCompetitions = (perms: CommunityPermission[]) => {
            return perms.find((p) => p.code === 'MANAGE_COMPETITIONS');
        };

        this.communityService
            .fetchCommunities({ user_id: this.user.id })
            .subscribe((res) => {
                this.userCommunities = res.body as Array<Community>;
                this.ownedCommunities = this.userCommunities.filter(
                    (c) =>
                        c.admin_user_id === this.user.id ||
                        canLinkCompetitions(c.members?.[0]?.permissions || []),
                );
            });
    }

    fetchQuestions(update_competition = true) {
        this.loading = true;
        this.questionSelected = -1;

        this.competitionsData
            .getQuestions({ competition_id: this.competition_id })
            .subscribe((res) => {
                if (res.body) {
                    if (update_competition) {
                        this.competitionInfo = res.body as CompetitionInfo;
                        this.toggleVisibility(this.competitionInfo.visibility);

                        if (!this.competitionInfo.time_limit) {
                            this.timeLimitEnabled = false;
                        } else {
                            this.timeLimitEnabled = true;
                            this.timeLimit = {
                                hours: Math.floor(
                                    this.competitionInfo.time_limit / 60,
                                ),
                                mins: this.competitionInfo.time_limit % 60,
                            };
                        }
                    }

                    this.competitionInfo.questions = res.body.questions;
                    this.loading = false;

                    if (this.competitionInfo.host_user_id !== this.user.id) {
                        this.router.navigate(['/editor/workbench']);
                        return;
                    }

                    this.titleService.setTitle(
                        `Build - ${this.competitionInfo.title || 'Competition'}`,
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

    toggleVisibility(status: 'PUBLIC' | 'PRIVATE' | 'INVITE') {
        this.competitionInfo.visibility = status;
    }

    cleanTimeLimits() {
        setTimeout(() => {
            this.timeLimit.hours = Number(this.timeLimit.hours);
            this.timeLimit.mins = Number(this.timeLimit.mins);
            this.timeLimit.hours =
                this.timeLimit.hours < 0 ? 0 : this.timeLimit.hours;
            this.timeLimit.mins =
                this.timeLimit.mins < 0 ? 0 : this.timeLimit.mins;

            if (this.timeLimit.mins >= 60) {
                this.timeLimit.hours += 1;
                this.timeLimit.mins = 0;
            }
        });
    }

    /**
     * Converts a UTC ISO string to a value usable by <input type="datetime-local">
     * @param {string} utcString - Example: "2026-01-03T15:30:00Z"
     * @returns {string} Example: "2026-01-03T10:30"
     */
    utcToDatetimeLocal(utcString: Date | string | null) {
        if (!utcString) {
            return;
        }
        const date = new Date(utcString);
        const offset = date.getTimezoneOffset() * 60000;

        if (!offset) {
            return;
        }

        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }

    saveChanges() {
        this.loading = true;
        this.errors = {};
        this.contest_errors = {};

        const schedule = document.getElementById(
            'competition_schedule',
        ) as HTMLInputElement;
        const schedule_end = document.getElementById(
            'competition_schedule_end',
        ) as HTMLInputElement;

        this.competitionInfo.scheduled_end_at = new Date(schedule_end.value);
        this.competitionInfo.scheduled_at = new Date(schedule.value);

        if (this.timeLimitEnabled) {
            this.competitionInfo.time_limit =
                this.timeLimit.mins + this.timeLimit.hours * 60;
        } else {
            this.competitionInfo.time_limit = null;
        }

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
                        'Some error occurred while saving competition info',
                    );

                    this.loading = false;
                    this.contest_errors = error.error;
                },
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
            this.toggleVisibility('PUBLIC');
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

    openImportPopup() {
        if (!this.importState.json) {
            this.regenerateImportJson();
        }
        this.showPopup(true, 'import_questions');
    }

    closeImportPopup() {
        this.showPopup(false, 'import_questions');
    }

    handleImportPopupEvent(event: string) {
        if (event === 'cancel') {
            this.closeImportPopup();
        }
    }

    onImportFieldChange() {
        if (!this.importState.prompt) {
            this.regenerateImportJson();
        }
    }

    regenerateImportJson() {
        const count = Math.max(1, Number(this.importState.count) || 1);
        const points = Number(this.importState.default_points) || 0;
        const negPoints = Number(this.importState.default_neg_points) || 0;

        const questions = Array.from({ length: count }, (_, i) => ({
            type: 1,
            title: `Question ${i + 1}`,
            statement: '',
            points,
            neg_points: negPoints,
            position: null,
            case_sensitive: false,
            char_limit: null,
            question_choices: [
                { text: 'Option A', is_correct: true, position: 0 },
                { text: 'Option B', is_correct: false, position: 1 },
                { text: 'Option C', is_correct: false, position: 2 },
                { text: 'Option D', is_correct: false, position: 3 },
            ],
            sample_cases: null,
            sample_sols: null,
            test_cases: null,
            solutions: null,
            solution_code: null,
            solution_lang: null,
        }));

        this.importState.json = JSON.stringify({ questions }, null, 4);
    }

    buildImportPrompt(): string {
        const count = Number(this.importState.count) || 1;
        const points = Number(this.importState.default_points) || 0;
        const negPoints = Number(this.importState.default_neg_points) || 0;
        const description = this.importState.prompt?.trim();
        const schemaBlock = this.schemaToPromptBlock(this.importSchema);

        return [
            `Generate exactly ${count} contest questions.`,
            description ? `\n${description}\n` : '',
            `Vary the question types naturally between code (0), mcq (1), fill (2), and long (3). Do NOT default to a single type.`,
            ``,
            `Positive marking defaults to ${points}, negative marking defaults to ${negPoints}. You may override per question (min 0, max 40).`,
            ``,
            `Return ONLY a raw JSON object. Do NOT wrap the output in triple backticks, markdown fences, or any other formatting. The entire response must start with { and end with }.`,
            ``,
            `The JSON object must have exactly one key: "questions", whose value is an array of question objects. Each question object must follow this structure:`,
            ``,
            schemaBlock,
            ``,
            `IMPORTANT RULES FOR VALID JSON:`,
            `- Escape ALL double quotes and backslashes inside string values. Double quotes inside a string must be written as \\", backslashes as \\\\. Newlines must be \\n, tabs \\t.`,
            `- Do NOT use trailing commas.`,
            `- Use "true", "false", and integer/float numbers without quotes for booleans and numbers.`,
            `- "type" must be an integer (0, 1, 2, or 3) – not a string.`,
            `- Include only fields that are relevant to the question type. For example, do not include "question_choices" for a code question.`,
            `- Ensure the final JSON is syntactically valid – no missing brackets or extra characters.`,
            `- Before outputting, verify that every string value has its double quotes and backslashes properly escaped and that the entire JSON parses without errors.`,
            ``,
            `Now generate the ${count}-question JSON. Output ONLY the JSON object, nothing else.`,
        ]
            .filter((line) => line !== '')
            .join('\n');
    }

    private schemaToPromptBlock(schema: any): string {
        if (!schema?.question) {
            return this.schemaFallbackBlock();
        }
        const q = schema.question;
        const fields = Object.keys(q);
        const lines: string[] = ['{'];
        fields.forEach((field, i) => {
            const f = q[field];
            if (!f || typeof f !== 'object') return;
            lines.push(this.schemaFieldLine(field, f, i === fields.length - 1));
        });
        lines.push('}');
        return lines.join('\n');
    }

    private schemaFieldLine(field: string, f: any, isLast: boolean): string {
        const comma = isLast ? '' : ',';
        const req = f.required ? 'required' : 'optional';
        const parts: string[] = [];

        if (f.enum) {
            parts.push(
                `one of ${f.enum.map((v: any) => (typeof v === 'string' ? `"${v}"` : String(v))).join(', ')}`,
            );
        } else {
            parts.push(f.type);
        }
        if (f.maxLength != null) parts.push(`max ${f.maxLength} characters`);
        if (f.maxItems != null) parts.push(`max ${f.maxItems} items`);
        if (f.min != null && f.max != null)
            parts.push(`min ${f.min}, max ${f.max}`);
        parts.push(req);
        if (f.description) parts.push(f.description);

        if (f.type === 'array' && f.item) {
            const itemFields = Object.keys(f.item);
            const itemLines = itemFields.map((ik, j) => {
                const it = f.item[ik];
                const iComma = j === itemFields.length - 1 ? '' : ',';
                const iReq = it.required ? 'required' : 'optional';
                const iParts: string[] = [];
                if (it.enum) {
                    iParts.push(
                        `one of ${it.enum.map((v: any) => (typeof v === 'string' ? `"${v}"` : String(v))).join(', ')}`,
                    );
                } else {
                    iParts.push(it.type);
                }
                if (it.maxLength != null)
                    iParts.push(`max ${it.maxLength} characters`);
                iParts.push(iReq);
                if (it.description) iParts.push(it.description);
                const sample = it.enum
                    ? it.enum[0]
                    : it.type === 'string'
                      ? '"..."'
                      : it.type === 'number'
                        ? (it.default ?? 0)
                        : it.type === 'boolean'
                          ? (it.default ?? false)
                          : 'null';
                return `      "${ik}": ${sample}${iComma}  // ${iParts.join(', ')}`;
            });
            return (
                `  "${field}": [  // ${parts.join(', ')}\n` +
                itemLines.join('\n') +
                `\n    ]${comma}`
            );
        }

        const sample = f.enum
            ? f.enum[0]
            : f.type === 'string'
              ? '"..."'
              : f.type === 'number'
                ? (f.default ?? 0)
                : f.type === 'boolean'
                  ? (f.default ?? false)
                  : f.type === 'array'
                    ? '[]'
                    : 'null';
        return `  "${field}": ${sample}${comma}  // ${parts.join(', ')}`;
    }

    private schemaFallbackBlock(): string {
        return [
            '{',
            '  "type": 0,          // integer 0, 1, 2, or 3',
            '  "title": "...",     // string, max 400 characters (optional)',
            '  "statement": "...", // string, max 4000 characters, HTML sanitized, LaTeX allowed (optional)',
            `  "points": ${this.importState.default_points || 0},        // number, min 0, max 40 (optional, falls back to ${this.importState.default_points || 0})`,
            `  "neg_points": ${this.importState.default_neg_points || 0},    // number, min 0, max 40 (optional, falls back to ${this.importState.default_neg_points || 0})`,
            '  "position": 1,      // number, display order (optional, auto-assigned if omitted)',
            '  "case_sensitive": false, // boolean, only for type 2 (fill). Omit for other types.',
            '  "char_limit": 100,  // integer >= 0, only for type 3 (long). Minimum words acceptable.',
            '  "question_choices": [  // array of choice objects, only for types 1 (mcq) and 2 (fill). Omit for others.',
            '    {',
            '      "text": "choice text",',
            '      "is_correct": true,',
            '      "position": 1    // optional number, display order',
            '    }',
            '  ],',
            '  "sample_cases": "...",  // string, max 1000 chars, only for type 0 (code). Sample input shown to participants.',
            '  "sample_sols": "...",   // string, max 1000 chars, only for type 0 (code). Sample output shown to participants.',
            '  "test_cases": "...",    // string, only for type 0 (code). Full test cases file content.',
            '  "solutions": "...",     // string, only for type 0 (code). Expected output file content.',
            '  "solution_code": "...", // string, only for type 0 (code). Correct solution code.',
            '  "solution_lang": "py"   // string, one of "c", "cpp", "py", "js", "ts", "go", "java". Required if solution_code is present, only for type 0.',
            '}',
        ].join('\n');
    }

    copyImportPrompt() {
        const prompt = this.buildImportPrompt();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(prompt).then(
                () =>
                    this.snackBar.open('Prompt copied to clipboard', 'Dismiss'),
                () =>
                    this.snackBar.open(
                        'Unable to copy prompt, please copy it manually',
                        'Dismiss',
                    ),
            );
        } else {
            this.snackBar.open(prompt, 'Dismiss', { duration: 0 });
        }
    }

    submitImport() {
        this.importErrors.json = '';

        let parsed: any;
        try {
            parsed = JSON.parse(this.importState.json);
        } catch (e) {
            this.importErrors.json = 'Invalid JSON: ' + (e as Error).message;
            return;
        }

        if (!parsed || !Array.isArray(parsed.questions)) {
            this.importErrors.json =
                'JSON must be an object with a "questions" array.';
            return;
        }

        if (!this.competitionInfo.id) {
            this.importErrors.json = 'No competition loaded.';
            return;
        }

        const delete_existing = this.importState.delete_existing;
        const default_points = Number(this.importState.default_points) || 0;
        const default_neg_points =
            Number(this.importState.default_neg_points) || 0;

        this.loading = true;
        this.competitionsData
            .importQuestions(this.competitionInfo.id, {
                delete_existing,
                default_points,
                default_neg_points,
                questions: parsed.questions,
            })
            .subscribe({
                next: () => {
                    this.loading = false;
                    this.displayLog(
                        `Imported ${parsed.questions.length} questions` +
                            (delete_existing
                                ? ' (existing questions deleted)'
                                : ''),
                    );
                    this.snackBar.open(
                        `Imported ${parsed.questions.length} questions`,
                        'Dismiss',
                    );
                    this.closeImportPopup();
                    this.fetchQuestions();
                },
                error: (err) => {
                    this.loading = false;
                    const body = err?.error;
                    if (body && typeof body === 'object') {
                        this.importErrors.json = Object.entries(body)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join('\n');
                    } else {
                        this.importErrors.json =
                            'Import failed: ' +
                            (err?.statusText || 'unknown error');
                    }
                },
            });
    }

    onClickVisibility(status: 'PUBLIC' | 'PRIVATE' | 'INVITE') {
        if (status == this.competitionInfo.visibility) return;

        if (status == 'PUBLIC') {
            this.showPopup(true, 'public_status_confirm');
        } else {
            this.toggleVisibility(status);
        }
    }

    togglePreview() {
        // Saving the text area content into questions statement
        // so that the user do not loose the written content
        let text_statement = document.getElementById(
            'text_statement',
        ) as HTMLTextAreaElement;

        if (text_statement)
            this.questionSelectedInfo.statement = text_statement.value;

        this.preview_mode = !this.preview_mode;
    }

    deleteCompetition() {
        this.errors.delete_code = '';

        let input = document.getElementById(
            'input_competition_code',
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

    handleInvitesEvent(event: string) {
        if (event == 'cancel') {
            this.showInviteP = false;
            return;
        }

        if (event == 'continue' && this.inviteP.invites.length) {
            this.submitInvites();
        } else {
            this.snackBar.open('Please provide the emails first to continue');
        }
    }

    isValidEmailRobust(emailString: string) {
        if (typeof emailString !== 'string') {
            return false;
        }
        // More robust regex (still not 100% RFC 5322 compliant but covers more cases)
        const emailRegex =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegex.test(emailString);
    }

    handleTempEmail(blur = false) {
        const safePushEmail = (email: string) => {
            email = email.trim();

            if (
                email &&
                !this.inviteP.invites.includes(email) &&
                this.isValidEmailRobust(email)
            ) {
                this.inviteP.invites.push(email);
            }
        };

        if (
            this.inviteP.input &&
            this.isValidEmailRobust(this.inviteP.input) &&
            blur
        ) {
            safePushEmail(this.inviteP.input);
            this.inviteP.input = '';

            return;
        }

        if (this.inviteP.input.includes(',')) {
            this.inviteP.input.split(',').forEach((i) => safePushEmail(i));

            setTimeout(() => {
                this.inviteP.input = '';
            });
        }

        return true;
    }

    removeTempEmail(email: string) {
        this.inviteP.invites = this.inviteP.invites.filter((i) => i !== email);
    }

    removeInvite(event: string) {
        if (event == 'cancel') {
            this.inviteToRemove = null;
            return;
        }

        this.loading = true;

        var invite = this.inviteToRemove!;

        this.competitionsData
            .removeInvite({
                comp_id: invite.competition_id,
                invite_id: invite.id,
            })
            .subscribe({
                next: (res) => {
                    this.competitionInfo.competition_invites =
                        this.competitionInfo.competition_invites?.filter(
                            (i) => i.id !== invite.id,
                        );
                    this.snackBar.open(
                        `Invitee ${invite.email} has been removed from the contest`,
                    );
                    this.loading = false;
                    this.inviteToRemove = null;
                },
                error: (err) => {
                    this.loading = false;
                    this.snackBar.open('Something went wrong, try again later');
                },
            });
    }

    submitInvites() {
        var payload = this.inviteP.invites.map((email) => {
            return {
                email: email,
            } as CompetitionInvite;
        });

        this.loading = true;
        this.errors.invites = null;

        this.competitionsData
            .createInvites({
                id: this.competitionInfo.id,
                invites: payload,
            })
            .subscribe({
                next: (res) => {
                    this.competitionInfo.competition_invites = res.body!;
                    this.loading = false;
                    this.showInviteP = false;
                    this.inviteP.invites = [];
                    this.inviteP.input = '';
                    this.snackBar.open('Invite has been sent');
                },
                error: (error) => {
                    if (error.error?.errors?.invites) {
                        this.errors.invites = error.error?.errors?.invites;
                    }
                    this.loading = false;
                },
            });
    }
}
