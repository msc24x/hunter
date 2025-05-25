import { Component, Input } from '@angular/core';
import { faCircleCheck, faLock } from '@fortawesome/free-solid-svg-icons';
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
