import { Component, Input, OnInit } from '@angular/core';
import {
    faCheckDouble,
    faCircleCheck,
    faLock,
} from '@fortawesome/free-solid-svg-icons';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { isLive, prettyDuration } from 'src/app/utils/utils';
import { CompetitionInfo } from 'src/environments/environment';

@Component({
    selector: 'competitions-list',
    templateUrl: './competitions-list.component.html',
    styleUrls: ['./competitions-list.component.scss'],
})
export class CompetitionsListComponent implements OnInit {
    loading = false;
    officialIcon = faCircleCheck;
    privateIcon = faLock;

    @Input()
    competitionsList: Array<CompetitionInfo> | null = null;

    @Input()
    host_user_id = '';

    @Input()
    heading: string = 'Competitions';

    @Input()
    includeSelf: boolean = false;

    @Input()
    route: string = 'editor';

    query = '';
    liveStatus = 'all';
    orderBy: '' | 'asc' | 'desc' = 'desc';
    debounceTimeout?: NodeJS.Timeout;
    timeLeftFlag = false;

    constructor(private competitionsDataService: CompetitionsDataService) {
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
        console.log(com.scheduled_end_at);
        if (com.scheduled_end_at === null) {
            return false;
        }
        return this.isAfterNow(com.scheduled_end_at);
    }

    timeLeft(com: CompetitionInfo, f: boolean) {
        const endTime = com.scheduled_end_at;

        if (endTime === null) {
            return 'unlimited';
        }

        const minutes = Math.ceil((endTime.getTime() - Date.now()) / 1000 / 60);

        return prettyDuration(minutes * 60, false);
    }

    ngOnInit(): void {}

    updateLiveStatus(event: Event) {
        let select = event.target as HTMLSelectElement;
        this.liveStatus = select.value;
        this.updateList();
    }

    updateOrderBy(event: Event) {
        let select = event.target as HTMLSelectElement;
        this.orderBy = select.value as '' | 'asc' | 'desc';
        this.updateList();
    }

    _updateList() {
        this.competitionsDataService
            .getCompetitions({
                query: this.query,
                includeSelf: this.includeSelf,
                orderBy: this.orderBy,
                liveStatus: this.liveStatus,
            })
            .then((res) => {
                this.competitionsList = res;
                this.loading = false;
            });
    }

    updateList() {
        this.loading = true;

        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this._updateList();
        }, 300);
    }
}
