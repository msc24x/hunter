import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { UserInfo } from 'src/environments/environment';

interface DesignSection {
    id: string;
    label: string;
    items: { id: string; label: string }[];
}

@Component({
    selector: 'design-system',
    templateUrl: './design-system.component.html',
    styleUrls: ['./design-system.component.scss'],
})
export class DesignSystemComponent {
    starIcon = faStar;
    trashIcon = faTrashCan;
    demoUser = { id: 1, name: 'Demo User' } as UserInfo;
    demoCode = `// lang: cpp
#include <iostream>
int main() {
    std::cout << "Hello Hunter";
    return 0;
}`;

    sections: DesignSection[] = [
        {
            id: 'buttons',
            label: 'Buttons',
            items: [
                { id: 'btn-main', label: 'Main' },
                { id: 'btn-variants', label: 'Variants' },
                { id: 'btn-states', label: 'States' },
                { id: 'btn-large', label: 'Large' },
                { id: 'btn-icons', label: 'With icons' },
            ],
        },
        {
            id: 'forms',
            label: 'Forms',
            items: [
                { id: 'form-inputs', label: 'Text inputs' },
                { id: 'form-textarea', label: 'Textarea' },
                { id: 'form-select', label: 'Select' },
                { id: 'form-toggle', label: 'Slide toggle' },
            ],
        },
        {
            id: 'typography',
            label: 'Typography',
            items: [
                { id: 'type-headings', label: 'Headings' },
                { id: 'type-notes', label: 'Info & errors' },
                { id: 'type-code', label: 'Code' },
                { id: 'type-links', label: 'Links' },
            ],
        },
        {
            id: 'surfaces',
            label: 'Surfaces',
            items: [
                { id: 'surf-section', label: 'Section box' },
                { id: 'surf-cute', label: 'Cute panel' },
                { id: 'surf-glow', label: 'Glow' },
                { id: 'surf-divider', label: 'Divider' },
            ],
        },
        {
            id: 'material',
            label: 'Material',
            items: [
                { id: 'mat-tabs', label: 'Tabs' },
                { id: 'mat-tooltip', label: 'Tooltip' },
                { id: 'mat-snackbar', label: 'Snackbar' },
            ],
        },
        {
            id: 'components',
            label: 'Components',
            items: [
                { id: 'comp-greenred', label: 'Green/Red bar' },
                { id: 'comp-code', label: 'Code editor' },
                { id: 'comp-spinner', label: 'Spinner' },
                { id: 'comp-infotip', label: 'Infotip' },
                { id: 'comp-textinput', label: 'Text input' },
                { id: 'comp-questype', label: 'Question types' },
                { id: 'comp-dropdown', label: 'Dropdown' },
                { id: 'comp-manualerror', label: 'Manual error' },
                { id: 'comp-katex', label: 'KaTeX' },
                { id: 'comp-userdisplay', label: 'User display' },
                { id: 'comp-signin', label: 'Sign-in prompt' },
            ],
        },
        {
            id: 'utilities',
            label: 'Utilities',
            items: [
                { id: 'util-flex', label: 'Flex & layout' },
                { id: 'util-states', label: 'State classes' },
            ],
        },
    ];

    constructor(private snackBar: MatSnackBar) {}

    scrollTo(id: string) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }

    showSnackBar() {
        this.snackBar.open('This is a snackbar', 'Dismiss', {
            duration: 3000,
        });
    }
}
