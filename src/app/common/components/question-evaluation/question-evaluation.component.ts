import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import { faFileCode } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs/internal/Subscription';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import { QuestionInfo, resCode, result } from 'src/environments/environment';

@Component({
    selector: 'question-evaluation',
    templateUrl: './question-evaluation.component.html',
    styleUrls: ['./question-evaluation.component.scss'],
})
export class QuestionEvaluationComponent implements OnInit, OnChanges {
    loading = false;
    codeIcon = faFileCode;

    showSubmissionP = false;

    @Input()
    questionSelectedInfo = {} as QuestionInfo;

    viewSubmissionResult: result | undefined;

    evaluationAfterPages: number[] = [];
    acceptedEvaluation: number = 0;
    rejectedEvaluation: number = 0;

    subscriptions: Subscription[] = [];

    constructor(private scoresDataService: ScoresDataService) {}

    ngOnInit(): void {
        this.fetchEvaluation();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.viewSubmissionResult = undefined;
        this.evaluationAfterPages = [];
        this.questionSelectedInfo.results = [];

        this.fetchEvaluation();
    }

    prevEvaluations() {
        this.evaluationAfterPages.pop();
        this.fetchEvaluation();
    }

    nextEvaluations() {
        this.evaluationAfterPages.push(
            this.questionSelectedInfo.results?.[
                this.questionSelectedInfo.results?.length - 1
            ]?.id!
        );
        this.fetchEvaluation();
    }

    fetchEvaluation() {
        if (!Object.keys(this.questionSelectedInfo).length) {
            return;
        }

        const qId = this.questionSelectedInfo.id;

        this.loading = true;
        this.subscriptions.push(
            this.scoresDataService
                .getQuestionScores({
                    comp_id: this.questionSelectedInfo.competition_id,
                    ques_id: this.questionSelectedInfo.id,
                    after: this.evaluationAfterPages[
                        this.evaluationAfterPages.length - 1
                    ],
                })
                .subscribe((res) => {
                    this.loading = false;

                    if (res.status == resCode.success) {
                        this.questionSelectedInfo.results = res.body?.results
                            ? (res.body.results as Array<result>)
                            : [];
                        this.acceptedEvaluation = res.body!.accepted_count;
                        this.rejectedEvaluation = res.body!.rejected_count;
                    }
                })
        );
    }

    viewSubmission(result: result) {
        this.showSubmissionP = true;
        this.viewSubmissionResult = result;
    }
}
