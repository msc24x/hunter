import { Component, Input } from '@angular/core';
import {
    faClock,
    faFileCode,
    faStarOfLife,
} from '@fortawesome/free-solid-svg-icons';
import { QuestionInfo, result } from 'src/environments/environment';

@Component({
    selector: 'submission-view',
    templateUrl: './submission-view.component.html',
    styleUrls: ['./submission-view.component.scss'],
})
export class SubmissionViewComponent {
    loading = false;
    codeIcon = faFileCode;
    judgeIcon = faStarOfLife;
    clockIcon = faClock;

    @Input({ required: true })
    viewSubmissionResult!: result;

    @Input({ required: true })
    questionSelectedInfo!: QuestionInfo;

    getChoiceText(choice_id: number) {
        return this.questionSelectedInfo.question_choices?.find(
            (ch) => ch.id === choice_id
        )?.text;
    }
}
