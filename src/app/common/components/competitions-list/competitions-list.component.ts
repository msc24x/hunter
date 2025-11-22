import { Component, Input, OnInit } from '@angular/core';
import {
    faCheckDouble,
    faCircleCheck,
    faEnvelope,
    faEnvelopeOpen,
    faEnvelopeSquare,
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

    @Input()
    competitionsList: Array<CompetitionInfo> | null = null;

    @Input()
    invitedList: Array<CompetitionInfo> | null = null;

    @Input()
    host_user_id = '';

    @Input()
    community_id: number | null = null;

    @Input()
    heading: string = 'Competitions';

    @Input()
    selfOnly: boolean = false;

    @Input()
    showBuildButton: boolean = false;

    @Input()
    showAuthor: boolean = true;

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

    ngOnInit(): void {
        this.updateList();
    }

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
                selfOnly: this.selfOnly,
                orderBy: this.orderBy,
                liveStatus: this.liveStatus,
                community_id: this.community_id,
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
