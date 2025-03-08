import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import katex from 'katex';
import { QuestionInfo } from 'src/environments/environment';
import suneditor from 'suneditor';
import SunEditor from 'suneditor/src/lib/core';
import plugins from 'suneditor/src/plugins';

@Component({
    selector: 'question-display',
    templateUrl: './question-display.component.html',
    styleUrls: ['./question-display.component.scss'],
})
export class QuestionDisplayComponent implements OnChanges, OnDestroy {
    @Input()
    titleOnly = false;

    @Input({ required: true })
    questionInfo!: QuestionInfo;

    suneditor: SunEditor | null = null;

    constructor(private sanitizer: DomSanitizer) {}

    ngOnDestroy(): void {
        this.suneditor?.destroy();
    }

    ngOnChanges(): void {
        setTimeout(() => {
            this.suneditor?.destroy();

            this.suneditor = suneditor.create('statement-content', {
                katex: {
                    src: katex,
                    options: {
                        output: 'mathml',
                        displayMode: false,
                    },
                },
                hideToolbar: true,
                defaultStyle: 'font-family: appFont; font-size: 1.1rem;',
            });
            this.suneditor.readOnly(true);
            this.suneditor.setContents(
                this.getQuestionStatement(this.questionInfo.statement)
            );
        });
    }

    getQuestionStatement(statement: string) {
        if (!statement) {
            return 'No description provided by host.';
        }

        return statement.trim().replaceAll('\n', '<br/>');
    }
}
