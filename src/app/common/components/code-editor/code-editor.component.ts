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
import { HunterLanguage, templates } from 'src/environments/environment';

@Component({
    selector: 'code-editor',
    templateUrl: './code-editor.component.html',
    styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent implements OnInit, OnChanges {
    editor!: ace.Ace.Editor;
    emittedChanges = false;

    @Input() languageSelected: HunterLanguage = 'cpp';
    @Output() languageSelectedChange = new EventEmitter<HunterLanguage>();

    @Output() codeChange = new EventEmitter<string>();
    @Input() code: string = '';

    ngOnInit(): void {
        this.initEditor();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.emittedChanges || !this.editor) {
            this.emittedChanges = false;
            return;
        }

        this.editor.setValue(this.code, 1);
        this._updateEditorMode();
    }

    initEditor() {
        this.editor = ace.edit('editor');
        ace.config.set('basePath', 'assets/');
        /**
         * twilight
         * monokai
         * terminal
         */
        this.editor.setTheme('ace/theme/twilight');
        this.editor.session.setMode('ace/mode/c_cpp');

        this.editor.on('change', (delta) => {
            this.emittedChanges = true;
            this.codeChange.emit(this.editor.getValue());
        });
    }

    loadTemplate() {
        this.editor.setValue(
            templates[this.languageSelected as HunterLanguage]
        );
    }

    _updateEditorMode() {
        switch (this.languageSelected) {
            case 'c':
            case 'cpp':
                this.editor.session.setMode('ace/mode/c_cpp');
                break;
            case 'py':
                this.editor.session.setMode('ace/mode/python');
                break;
            case 'js':
                this.editor.session.setMode('ace/mode/javascript');
                break;
            case 'ts':
                this.editor.session.setMode('ace/mode/typescript');
                break;
            case 'go':
                this.editor.session.setMode('ace/mode/golang');
                break;
        }
    }

    updateEditorMode(lang: string) {
        this.languageSelected = lang as HunterLanguage;
        this.languageSelectedChange.emit(this.languageSelected);

        this._updateEditorMode();
    }
}
