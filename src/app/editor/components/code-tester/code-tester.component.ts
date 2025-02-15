import { HttpResponse } from '@angular/common/http';
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    HunterLanguage,
    QuestionVerification,
} from 'src/environments/environment';

@Component({
    selector: 'code-tester',
    templateUrl: './code-tester.component.html',
    styleUrls: ['./code-tester.component.scss'],
})
export class CodeTesterComponent implements OnInit, OnChanges {
    @Input() question_id!: number;
    @Input() competition_id!: number;

    @Output() lastVerificationChange =
        new EventEmitter<QuestionVerification | null>();

    code: string = '';
    language!: HunterLanguage;
    lastVerification: QuestionVerification | null = null;
    verificationInProgress = false;

    constructor(
        private competitionsService: CompetitionsDataService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.fetchLastVerification();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.fetchLastVerification();
    }

    parseVerificationBody(res: HttpResponse<Object>) {
        this.lastVerification = res.body as QuestionVerification;
        this.lastVerification.created_at = new Date(
            this.lastVerification.created_at
        );
        this.code = this.lastVerification.submission;
        this.language = this.lastVerification.language as HunterLanguage;

        this.lastVerificationChange.emit(this.lastVerification);
    }

    verifySolution() {
        this.verificationInProgress = true;

        this.competitionsService
            .verifySolution({
                for: {
                    competition_id: this.competition_id,
                    question_id: this.question_id,
                    type: 0,
                },
                solution: {
                    code: this.code,
                    lang: this.language || 'cpp',
                },
            })
            .subscribe(
                (res) => {
                    this.parseVerificationBody(res);
                    this.verificationInProgress = false;
                    this.snackBar.open('Verification result received');
                },
                (err) => {
                    this.lastVerificationChange.emit(null);
                    this.verificationInProgress = false;
                }
            );
    }

    fetchLastVerification() {
        this.lastVerification = null;
        this.competitionsService
            .fetchVerification({
                competition_id: this.competition_id,
                question_id: this.question_id,
            })
            .subscribe(
                (res) => {
                    this.parseVerificationBody(res);
                    this.verificationInProgress = false;
                },
                (err) => {
                    this.lastVerificationChange.emit(null);
                    this.verificationInProgress = false;
                }
            );
    }
}
