import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import katex from 'katex';
import suneditor from 'suneditor';
import SunEditor from 'suneditor/src/lib/core';
import plugins from 'suneditor/src/plugins';
import {
    materialFileLimits,
    materialTypeLabels,
    materialTypes,
    MaterialInfo,
    QuestionMaterial,
} from 'src/environments/environment';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    faClose,
    faPlus,
    faUpload,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'materials-browser',
    templateUrl: './materials-browser.component.html',
    styleUrls: ['./materials-browser.component.scss'],
})
export class MaterialsBrowserComponent implements OnChanges, OnDestroy {
    @Input() competition_id: number | null = null;
    @Input() visible = false;

    @Output() closeEvent = new EventEmitter<void>();
    @Output() unlinkEvent = new EventEmitter<{
        material_id: number;
        question_id: number;
    }>();
    @Output() materialsChanged = new EventEmitter<void>();

    materialTypes = materialTypes;
    materialTypeLabels = materialTypeLabels;

    materials: MaterialInfo[] = [];
    selectedMaterial: MaterialInfo | null = null;
    loading = false;
    saving = false;

    // Detail panel mode: 'view' shows selected material, 'add' shows create form.
    detailMode: 'view' | 'add' = 'view';

    // Add-material form state.
    addForm = {
        title: '',
        type: materialTypes.rich_text,
        content: '',
        file: null as File | null,
    };
    addErrors: Record<string, string> = {};
    addEditor: SunEditor | null = null;

    // Rich text editing state (for the selected rich_text material).
    editingRichText = false;
    richEditor: SunEditor | null = null;
    draftTitle = '';
    draftContent = '';

    // File replacement state (for the selected file material).
    replaceFile: File | null = null;

    // Delete confirmation popup.
    deletePopupVisible = false;

    // Fullscreen preview state.
    fullscreenMaterial: MaterialInfo | null = null;

    closeIcon = faClose;
    plusIcon = faPlus;
    uploadIcon = faUpload;
    trashIcon = faTrashCan;

    constructor(
        private competitionsData: CompetitionsDataService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible && this.competition_id) {
            this.refresh();
        }
        if (!this.visible) {
            this.teardownAllEditors();
        }
    }

    ngOnDestroy(): void {
        this.teardownAllEditors();
    }

    private teardownAllEditors(): void {
        this.teardownEditor(this.richEditor);
        this.richEditor = null;
        this.editingRichText = false;
        this.teardownEditor(this.addEditor);
        this.addEditor = null;
    }

    private teardownEditor(editor: SunEditor | null): void {
        if (editor?.destroy) {
            try {
                editor.destroy();
            } catch {}
        }
    }

    private createEditor(elementId: string, initialContent: string): SunEditor {
        return suneditor.create(elementId, {
            plugins: plugins,
            charCounter: true,
            display: 'block',
            katex: {
                src: katex,
                options: { output: 'mathml', displayMode: false },
            },
            buttonList: [
                ['blockquote', 'formatBlock'],
                ['bold', 'underline', 'italic', 'strike'],
                ['removeFormat'],
                ['align', 'horizontalRule', 'list'],
                ['table', 'link', 'math'],
                ['fullScreen'],
                ['preview'],
                ['undo', 'redo'],
            ],
            defaultStyle: 'font-family: appFont; font-size: 1.1rem;',
        });
    }

    refresh(): void {
        if (!this.competition_id) return;
        this.loading = true;
        this.competitionsData.getMaterials(this.competition_id).subscribe({
            next: (res) => {
                this.loading = false;
                this.materials = (res.body as any) || [];
                if (this.selectedMaterial) {
                    const fresh = this.materials.find(
                        (m) => m.id === this.selectedMaterial!.id,
                    );
                    if (fresh) {
                        this.selectMaterial(fresh.id);
                    } else {
                        this.selectedMaterial = null;
                        this.detailMode = 'view';
                    }
                }
            },
            error: () => {
                this.loading = false;
                this.snackBar.open('Failed to load materials');
            },
        });
    }

    selectMaterial(id: number): void {
        if (!this.competition_id) return;
        this.teardownAllEditors();
        this.detailMode = 'view';
        this.loading = true;
        this.competitionsData
            .getMaterialDetail(this.competition_id, id)
            .subscribe({
                next: (res) => {
                    this.loading = false;
                    this.selectedMaterial = res.body as any;
                    if (this.selectedMaterial) {
                        this.draftTitle = this.selectedMaterial.title || '';
                        this.draftContent = this.selectedMaterial.content || '';
                    }
                },
                error: () => {
                    this.loading = false;
                    this.snackBar.open('Failed to load material');
                },
            });
    }

    showAddForm(): void {
        this.teardownAllEditors();
        this.detailMode = 'add';
        this.selectedMaterial = null;
        this.addForm = {
            title: '',
            type: materialTypes.rich_text,
            content: '',
            file: null,
        };
        this.addErrors = {};
        setTimeout(() => {
            if (this.addForm.type === materialTypes.rich_text) {
                this.initAddEditor();
            }
        });
    }

    onAddTypeChange(): void {
        this.teardownEditor(this.addEditor);
        this.addEditor = null;
        if (this.addForm.type === materialTypes.rich_text) {
            setTimeout(() => this.initAddEditor());
        }
    }

    private initAddEditor(): void {
        this.teardownEditor(this.addEditor);
        this.addEditor = this.createEditor(
            'material_add_editor',
            this.addForm.content || '',
        );
        this.addEditor.onChange = (contents: string) => {
            this.addForm.content = contents;
        };
    }

    cancelAddForm(): void {
        this.teardownEditor(this.addEditor);
        this.addEditor = null;
        this.detailMode = 'view';
        this.addErrors = {};
    }

    onAddFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.addForm.file = input.files[0];
        }
    }

    onReplaceFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.replaceFile = input.files[0];
            this.submitReplaceFile();
        }
    }

    onDropFile(event: DragEvent, isAdd: boolean): void {
        event.preventDefault();
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            if (isAdd) {
                this.addForm.file = event.dataTransfer.files[0];
            } else {
                this.replaceFile = event.dataTransfer.files[0];
                this.submitReplaceFile();
            }
        }
    }

    allowDrop(event: DragEvent): void {
        event.preventDefault();
    }

    submitAddForm(): void {
        if (!this.competition_id) return;
        this.addErrors = {};

        const type = this.addForm.type;
        const limit = (materialFileLimits as any)[type];
        if (type !== materialTypes.rich_text) {
            if (!this.addForm.file) {
                this.addErrors['file'] = 'A file is required for this type';
            } else if (limit && this.addForm.file.size > limit.max) {
                this.addErrors['file'] = `File size exceeds the ${Math.floor(
                    limit.max / (1024 * 1024),
                )}MB limit`;
            }
        }

        if (Object.keys(this.addErrors).length) return;

        this.saving = true;
        this.competitionsData
            .createMaterial(
                this.competition_id,
                {
                    title: this.addForm.title,
                    type,
                    content: this.addForm.content,
                },
                this.addForm.file || undefined,
            )
            .subscribe({
                next: () => {
                    this.saving = false;
                    this.snackBar.open('Material added');
                    this.teardownEditor(this.addEditor);
                    this.addEditor = null;
                    this.detailMode = 'view';
                    this.materialsChanged.emit();
                    this.refresh();
                },
                error: (err) => {
                    this.saving = false;
                    this.addErrors = err?.error || {};
                    if (!Object.keys(this.addErrors).length) {
                        this.snackBar.open('Failed to add material');
                    }
                },
            });
    }

    startEditRichText(): void {
        this.editingRichText = true;
        setTimeout(() => {
            this.teardownEditor(this.richEditor);
            this.richEditor = this.createEditor(
                'material_rich_editor',
                this.draftContent || '',
            );
            this.richEditor.onChange = (contents: string) => {
                this.draftContent = contents;
            };
        });
    }

    cancelEditRichText(): void {
        this.teardownEditor(this.richEditor);
        this.richEditor = null;
        this.editingRichText = false;
        this.draftContent = this.selectedMaterial?.content || '';
    }

    saveRichText(): void {
        if (!this.competition_id || !this.selectedMaterial) return;
        this.saving = true;
        this.competitionsData
            .updateMaterial(this.competition_id, this.selectedMaterial.id, {
                title: this.draftTitle,
                content: this.draftContent,
            })
            .subscribe({
                next: () => {
                    this.saving = false;
                    this.snackBar.open('Material saved');
                    this.teardownEditor(this.richEditor);
                    this.richEditor = null;
                    this.editingRichText = false;
                    this.materialsChanged.emit();
                    this.refresh();
                },
                error: () => {
                    this.saving = false;
                    this.snackBar.open('Failed to save material');
                },
            });
    }

    saveTitle(): void {
        if (!this.competition_id || !this.selectedMaterial) return;
        this.saving = true;
        this.competitionsData
            .updateMaterial(this.competition_id, this.selectedMaterial.id, {
                title: this.draftTitle,
            })
            .subscribe({
                next: () => {
                    this.saving = false;
                    this.snackBar.open('Title saved');
                    this.materialsChanged.emit();
                    this.refresh();
                },
                error: () => {
                    this.saving = false;
                    this.snackBar.open('Failed to save title');
                },
            });
    }

    submitReplaceFile(): void {
        if (!this.competition_id || !this.selectedMaterial || !this.replaceFile)
            return;
        const limit = (materialFileLimits as any)[this.selectedMaterial.type];
        if (limit && this.replaceFile.size > limit.max) {
            this.snackBar.open(
                `File size exceeds the ${Math.floor(
                    limit.max / (1024 * 1024),
                )}MB limit`,
            );
            this.replaceFile = null;
            return;
        }
        this.saving = true;
        this.competitionsData
            .updateMaterial(
                this.competition_id,
                this.selectedMaterial.id,
                {},
                this.replaceFile,
            )
            .subscribe({
                next: () => {
                    this.saving = false;
                    this.replaceFile = null;
                    this.snackBar.open('File updated');
                    this.materialsChanged.emit();
                    this.refresh();
                },
                error: (err) => {
                    this.saving = false;
                    this.replaceFile = null;
                    const msg = err?.error?.file || 'Failed to update file';
                    this.snackBar.open(msg);
                },
            });
    }

    // Delete confirmation via popup component.
    requestDelete(): void {
        this.deletePopupVisible = true;
    }

    handleDeletePopupEvent(event: 'cancel' | 'continue'): void {
        if (event === 'continue') {
            this.confirmDeleteMaterial();
        } else {
            this.deletePopupVisible = false;
        }
    }

    confirmDeleteMaterial(): void {
        if (!this.competition_id || !this.selectedMaterial) return;
        this.saving = true;
        this.competitionsData
            .deleteMaterial(this.competition_id, this.selectedMaterial.id)
            .subscribe({
                next: () => {
                    this.saving = false;
                    this.snackBar.open('Material deleted');
                    this.selectedMaterial = null;
                    this.deletePopupVisible = false;
                    this.materialsChanged.emit();
                    this.refresh();
                },
                error: () => {
                    this.saving = false;
                    this.snackBar.open('Failed to delete material');
                },
            });
    }

    unlinkQuestion(qm: QuestionMaterial): void {
        if (!this.selectedMaterial) return;
        this.unlinkEvent.emit({
            material_id: this.selectedMaterial.id,
            question_id: qm.question_id,
        });
        if (this.selectedMaterial.question_materials) {
            this.selectedMaterial.question_materials =
                this.selectedMaterial.question_materials.filter(
                    (q) => q.question_id !== qm.question_id,
                );
        }
        const m = this.materials.find(
            (x) => x.id === this.selectedMaterial!.id,
        );
        if (m && m.linked_count) m.linked_count--;
    }

    openFullscreen(m: MaterialInfo): void {
        this.fullscreenMaterial = m;
    }

    closeFullscreen(): void {
        this.fullscreenMaterial = null;
    }

    mediaUrl(m: MaterialInfo): string {
        return `/api/media/${m.file_path}`;
    }

    fileSizeLabel(bytes: number | null | undefined): string {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    fileLimitExts(type: number): string {
        const limit = (materialFileLimits as any)[type];
        return limit ? limit.exts.join(', ') : '';
    }

    fileLimitMb(type: number): number {
        const limit = (materialFileLimits as any)[type];
        return limit ? Math.floor(limit.max / (1024 * 1024)) : 0;
    }

    addError(field: string): string {
        return this.addErrors[field] || '';
    }

    close(): void {
        this.teardownAllEditors();
        this.deletePopupVisible = false;
        this.detailMode = 'view';
        this.closeEvent.emit();
    }
}
