import { Component, Input } from '@angular/core';
import {
    faCode,
    faCheckDouble,
    faCircleHalfStroke,
    faParagraph,
    faAlignLeft,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ques-type-label',
    templateUrl: './ques-type-label.component.html',
    styleUrls: ['./ques-type-label.component.scss'],
})
export class QuesTypeLabelComponent {
    @Input({ required: true })
    ques_type!: number;

    questionTypes = [
        'Coding Test',
        'Multiple Choice',
        'Fill In Blanks',
        'Long Answer',
        'Short Answer',
    ];
    getQuesIcon(type: any) {
        switch (type) {
            case 0:
                return faCode;
            case 1:
                return faCheckDouble;
            case 2:
                return faCircleHalfStroke;
            case 3:
                return faParagraph;
            case 4:
                return faAlignLeft;
            default:
                return faCode;
        }
    }
}
