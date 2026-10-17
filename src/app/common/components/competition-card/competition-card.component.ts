import { Component, Input } from '@angular/core';
import {
    faAlignLeft,
    faCheckDouble,
    faCircleCheck,
    faCircleHalfStroke,
    faCode,
    faLock,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { prettyDuration } from 'src/app/utils/utils';
import { CompetitionInfo } from 'src/environments/environment';

@Component({
    selector: 'competition-card',
    templateUrl: './competition-card.component.html',
    styleUrls: ['./competition-card.component.scss'],
})
export class CompetitionCardComponent {
    loading = false;
    officialIcon = faCircleCheck;
    privateIcon = faLock;

    questionTypeOrder = [0, 1, 2, 3];

    @Input({ required: true })
    com!: CompetitionInfo;

    @Input()
    showAuthor: boolean = true;

    @Input()
    showDesc: boolean = true;

    @Input()
    shortTitle: boolean = false;

    @Input()
    route: string = 'editor';

    timeLeftFlag = false;

    constructor() {
        setInterval(() => {
            this.timeLeftFlag = !this.timeLeftFlag;
        }, 30 * 1000);
    }

    get questionTypeEntries(): { type: number; count: number }[] {
        if (!this.com?.question_type_counts) {
            return [];
        }
        return this.questionTypeOrder
            .filter((t) => this.com.question_type_counts![t] > 0)
            .map((t) => ({
                type: t,
                count: this.com.question_type_counts![t],
            }));
    }

    quesTypeIcon(type: number): IconDefinition {
        switch (type) {
            case 0:
                return faCode;
            case 1:
                return faCheckDouble;
            case 2:
                return faCircleHalfStroke;
            case 3:
                return faAlignLeft;
            default:
                return faCode;
        }
    }

    isAfterNow(date: Date | null) {
        if (date === null) {
            return true;
        }
        return date.getTime() < Date.now();
    }

    isClosedNow(com: CompetitionInfo) {
        if (com.scheduled_end_at === null) {
            return false;
        }
        return this.isAfterNow(com.scheduled_end_at);
    }

    timeLeft(targetTime: Date, f: boolean) {
        if (targetTime === null) {
            return 'unlimited';
        }

        const seconds = Math.ceil((targetTime.getTime() - Date.now()) / 1000);

        return prettyDuration(seconds, false);
    }
}
