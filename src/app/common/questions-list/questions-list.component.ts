import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import {
    faCircleCheck,
    faCircleExclamation,
    faCircleXmark,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    CompetitionInfo,
    QuestionInfo,
    QuestionProgress,
} from 'src/environments/environment';

import {
    CdkDragDrop,
    CdkDropList,
    CdkDrag,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'questions-list',
    templateUrl: './questions-list.component.html',
    styleUrls: ['./questions-list.component.scss'],
})
export class QuestionsListComponent implements OnInit {
    loading = false;
    checkIcon = faCircleCheck;
    crossIcon = faCircleXmark;
    warningIcon = faCircleExclamation;

    showQuestionDeleteP = false;
    questionTypeBuffer: number = -1;

    dragMap: any = {};

    constructor(
        private competitionsData: CompetitionsDataService,
        private snackBar: MatSnackBar
    ) {}

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

    @Input()
    quality: any = {};

    @Input()
    showHeader = true;

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

    @ViewChild('add_question_select') addQuestionSelect!: MatSelect;

    questionTypes = [
        ['Coding Test', 0],
        ['Multiple Choice', 1],
        ['Fill In Blank', 2],
        ['Long Answer', 3],
    ];

    ngOnInit(): void {}

    dropQuestion(event: CdkDragDrop<string[]>) {
        moveItemInArray(
            this.questionsList,
            event.previousIndex,
            event.currentIndex
        );

        if (this.questionSelected === event.previousIndex) {
            this.questionSelected = event.currentIndex;
        } else {
            if (
                event.previousIndex < this.questionSelected &&
                this.questionSelected <= event.currentIndex
            ) {
                this.questionSelected--;
            } else if (
                event.currentIndex <= this.questionSelected &&
                this.questionSelected < event.previousIndex
            ) {
                this.questionSelected++;
            }
        }
    }

    parseInt(f: any) {
        return parseInt(f);
    }

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

    selectQuestion(index: number) {
        // const target = ev?.target;

        if (index == -1) {
            this.questionSelected = -1;
            this.questionSelectEmitter.emit(this.questionSelected);
            return;
        }

        // const index = (target as HTMLElement)
        //     .closest('li')
        //     ?.getElementsByTagName('span')[0].innerText;
        // var newSelection = (index as unknown as number) - 1;

        if (this.clearable && index === this.questionSelected) {
            index = -1;
        }

        this.questionSelected = index;

        this.displayLog('Question ' + this.questionSelected + ' selected');
        this.questionSelectEmitter.emit(this.questionSelected);
        this.questionSelectedChange.emit(this.questionSelected);
    }

    resetQuestionSelected() {
        this.selectQuestion(-1);
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
                    this.loading = false;
                    this.fetchRequired.emit();
                    this.snackBar.open('Question has been deleted permanently');
                });
        } else this.displayLog('No Question selected');
    }

    openCreateQues() {
        this.addQuestionSelect.open();
    }

    addQuestion(question_type: MatSelectChange) {
        this.loading = true;

        setTimeout(() => {
            this.questionTypeBuffer = -1;
        });

        this.competitionsData
            .postQuestion({
                competition_id: this.competitionInfo.id,
                type: question_type.value,
            })
            .subscribe((response) => {
                if (response.body) {
                    this.questionsList.push(response.body as QuestionInfo);
                    this.questionSelected = this.questionsList.length - 1;
                    this.questionSelectEmitter.emit(this.questionSelected);
                }
                this.loading = false;
                this.fetchRequired.emit();
                this.displayLog('New question inserted and saved');
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
