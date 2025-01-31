import { Component, Input } from '@angular/core';
import { QuestionInfo } from 'src/environments/environment';

@Component({
    selector: 'question-display',
    templateUrl: './question-display.component.html',
    styleUrls: ['./question-display.component.scss'],
})
export class QuestionDisplayComponent {
    @Input()
    titleOnly = false;

    @Input({ required: true })
    questionInfo!: QuestionInfo;

    getQuestionStatement(questionInfo: QuestionInfo) {
        if (!questionInfo.statement) {
            return 'No description provided by host.';
        }

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
}
