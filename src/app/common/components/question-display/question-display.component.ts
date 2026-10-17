import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import {
    materialTypes,
    materialTypeLabels,
    MaterialInfo,
    QuestionInfo,
} from 'src/environments/environment';
import type SunEditor from 'suneditor/src/lib/core';
import { faExpand } from '@fortawesome/free-solid-svg-icons';

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
    materialTypes = materialTypes;
    fullscreenMaterial: MaterialInfo | null = null;
    expandIcon = faExpand;
    private mediaUrlCache = new Map<number, SafeResourceUrl>();
    private destroyed = false;

    constructor(private sanitizer: DomSanitizer) {}

    ngOnDestroy(): void {
        this.destroyed = true;
        this.suneditor?.destroy();
        this.suneditor = null;
        this.mediaUrlCache.clear();
    }

    ngOnChanges(): void {
        this.mediaUrlCache.clear();
        void this.createStatementEditor();
    }

    private async createStatementEditor() {
        const [suneditorModule, katexModule] = await Promise.all([
            import('suneditor'),
            import('katex'),
        ]);
        const suneditor = suneditorModule.default;
        const katex = katexModule.default;

        setTimeout(() => {
            if (this.destroyed) return;

            this.suneditor?.destroy();
            this.suneditor = null;

            this.suneditor = suneditor.create(
                `statement-content-${this.questionInfo.id}`,
                {
                    katex: {
                        src: katex,
                        options: {
                            output: 'mathml',
                            displayMode: false,
                        },
                    },
                    hideToolbar: true,
                    defaultStyle:
                        'font-family: appFont; font-size: 1.1rem; background: var(--white); color: var(--text-black);',
                },
            );
            this.suneditor.readOnly(true);
            this.suneditor.setContents(
                this.getQuestionStatement(this.questionInfo.statement),
            );
        });
    }

    getQuestionStatement(statement: string) {
        if (!statement) {
            return 'No description provided by host.';
        }

        return statement.trim().replaceAll('\n', '<br/>');
    }

    get linkedMaterials(): MaterialInfo[] {
        return (this.questionInfo.question_materials || [])
            .map((qm) => qm.material)
            .filter((m): m is MaterialInfo => !!m && !!m.id);
    }

    materialTypeLabel(type: number): string {
        return materialTypeLabels[type] || 'Material';
    }

    sanitizedContent(content: string | null): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(content || '');
    }

    mediaUrl(m: MaterialInfo): SafeResourceUrl {
        if (!this.mediaUrlCache.has(m.id)) {
            this.mediaUrlCache.set(
                m.id,
                this.sanitizer.bypassSecurityTrustResourceUrl(
                    `/api/media/${m.file_path}`,
                ),
            );
        }
        return this.mediaUrlCache.get(m.id)!;
    }

    openFullscreen(m: MaterialInfo): void {
        this.fullscreenMaterial = m;
    }

    closeFullscreen(): void {
        this.fullscreenMaterial = null;
    }
}
