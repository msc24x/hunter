import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
    faCheckCircle,
    faCircleCheck,
    faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    CompetitionInfo,
    QuestionInfo,
    QuestionProgress,
} from 'src/environments/environment';

@Component({
    selector: 'questions-list',
    templateUrl: './questions-list.component.html',
    styleUrls: ['./questions-list.component.scss'],
})
export class QuestionsListComponent implements OnInit {
    loading = false;
    checkIcon = faCircleCheck;
    crossIcon = faCircleXmark;

    showQuestionDeleteP = false;

    constructor(private competitionsData: CompetitionsDataService) {}

    @Input()
    editable = true;

    @Input()
    clearable = false;

    @Input()
    questionsProgress: Array<QuestionProgress> = [];

    @Input()
    questionsList: Array<QuestionInfo> = [];

    @Input()
    competitionInfo = {} as CompetitionInfo;

    @Output()
    messageEmitter = new EventEmitter();

    @Output()
    questionSelectEmitter = new EventEmitter();

    @Output()
    saveClicked = new EventEmitter();

    @Output()
    fetchRequired = new EventEmitter();

    @Input()
    questionSelected: number = -1;
    @Output()
    questionSelectedChange = new EventEmitter<number>();

    ngOnInit(): void {}

    getQuestionProgress(ques_id: number) {
        return this.questionsProgress.find((qp) => qp.question_id === ques_id);
    }

    selectedQuestionElement(): HTMLLIElement | null {
        if (this.questionSelected == -1) return null;
        const prevTarget = document
            .getElementById('questions_list')
            ?.getElementsByTagName('li')[this.questionSelected];
        if (prevTarget) {
            return prevTarget;
        } else return null;
    }

    selectQuestion(ev: MouseEvent | null) {
        const target = ev?.target;

        if (target == null) {
            this.questionSelected = -1;
            this.questionSelectEmitter.emit(this.questionSelected);
            return;
        }

        const index = (target as HTMLElement)
            .closest('li')
            ?.getElementsByTagName('span')[0].innerText;
        var newSelection = (index as unknown as number) - 1;

        if (this.clearable && newSelection === this.questionSelected) {
            newSelection = -1;
        }

        this.questionSelected = newSelection;

        this.displayLog('Question ' + this.questionSelected + ' selected');
        this.questionSelectEmitter.emit(this.questionSelected);
        this.questionSelectedChange.emit(this.questionSelected);
    }

    resetQuestionSelected() {
        this.selectQuestion(null);
    }

    delQuestion() {
        if (this.questionSelected != -1) {
            this.loading = true;
            this.competitionsData
                .deleteQuestion({
                    id: this.questionsList[this.questionSelected].id,
                    competition_id: this.competitionInfo.id,
                })
                .subscribe(() => {
                    this.displayLog(
                        'Question ' + this.questionSelected + ' deleted'
                    );
                    this.resetQuestionSelected();
                    this.fetchRequired.emit();
                    this.loading = false;
                });
        } else this.displayLog('No Question selected');
    }

    addQuestion() {
        this.loading = true;
        this.competitionsData
            .postQuestion({ competition_id: this.competitionInfo.id })
            .subscribe(() => {
                this.resetQuestionSelected();
                this.fetchRequired.emit();
                this.displayLog('New question inserted and saved');
                this.loading = false;
            });
    }

    handleDeleteConfirmation(event: string) {
        this.showQuestionDeleteP = false;

        if (event == 'continue') {
            this.delQuestion();
        }
    }

    displayLog(msg: string) {
        this.messageEmitter.emit(msg);
    }
}
