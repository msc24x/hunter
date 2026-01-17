import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import * as ace from 'ace-builds';
import { BehaviorSubject, timeout } from 'rxjs';
import { HunterLanguage, templates } from 'src/environments/environment';

@Component({
    selector: 'code-editor',
    templateUrl: './code-editor.component.html',
    styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent implements OnInit, OnChanges {
    editor!: ace.Ace.Editor;
    emittedChanges = false;

    created_at = new Date().getTime();

    editorInitialized = new BehaviorSubject<boolean>(false);

    @Output() fetchLastSubmission = new EventEmitter<void>();

    @Input() editorClass: string = '';
    @Input() editable: boolean = true;
    @Input() languageSelected: HunterLanguage = 'cpp';
    @Output() languageSelectedChange = new EventEmitter<HunterLanguage>();

    @Output() codeChange = new EventEmitter<string>();
    @Input() code: string = '';

    ngOnInit(): void {
        this.initEditor();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.editor?.getValue() === this.code) {
            this.emittedChanges = false;
            return;
        }

        if (!this.editor) {
            this.editorInitialized.subscribe((val) => {
                if (val) {
                    this.editor.setValue(this.code, 1);
                    this._updateEditorMode();
                    this.editorInitialized.unsubscribe();
                }
            });

            return;
        }

        this.editor.setValue(this.code, 1);
        this._updateEditorMode();
    }

    initEditor() {
        setTimeout(() => {
            this.editor = ace.edit(`editor-${this.created_at}`);
            this.editor.setReadOnly(!this.editable);
            ace.config.set('basePath', 'assets/');
            /**
             * twilight
             * monokai
             * terminal
             */
            this.editor.setTheme('ace/theme/twilight');
            this.editor.session.setMode('ace/mode/c_cpp');
            this.editor.setStyle(this.editorClass);

            this.editor.on('change', (delta) => {
                this.emittedChanges = true;
                this.codeChange.emit(this.editor.getValue());
            });

            this.editorInitialized.next(true);
        });
    }

    loadTemplate() {
        this.editor.setValue(
            templates[this.languageSelected as HunterLanguage],
        );
    }

    _updateEditorMode() {
        const modeMap: { [key in HunterLanguage]: string } = {
            c: 'ace/mode/c_cpp',
            cpp: 'ace/mode/c_cpp',
            py: 'ace/mode/python',
            js: 'ace/mode/javascript',
            ts: 'ace/mode/typescript',
            go: 'ace/mode/golang',
            java: 'ace/mode/java',
        };

        const mode = modeMap[this.languageSelected];
        if (mode) {
            this.editor.session.setMode(mode);
        }
    }

    updateEditorMode(lang: string) {
        this.languageSelected = lang as HunterLanguage;
        this.languageSelectedChange.emit(this.languageSelected);

        this._updateEditorMode();
    }
}
