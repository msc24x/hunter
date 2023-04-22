import { Component, Input, OnInit } from '@angular/core';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
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
	host_user_id = '';

	@Input()
	heading: string = 'Competitions';

	@Input()
	public: boolean = true;

	@Input()
	route: string = 'editor';

	title = '';
	liveStatus = 'all';
	orderBy: 'any' | 'latest' | 'oldest' = 'latest';

	orderByCode = { any: 0, latest: -1, oldest: 1 };

	constructor(private competitionsDataService: CompetitionsDataService) {}

	isAfterNow(date: string) {
		return Date.parse(date) < Date.now();
	}

	

	ngOnInit(): void {}

	updateLiveStatus(event: Event) {
		let select = event.target as HTMLSelectElement;
		this.liveStatus = select.value;
		this.updateList();
	}

	updateOrderBy(event: Event) {
		let select = event.target as HTMLSelectElement;
		this.orderBy = select.value as 'any' | 'latest' | 'oldest';
		this.updateList();
	}

	updateList() {
		this.loading = true;

		this.competitionsDataService
			.getPublicCompetitions({
				title: this.title,
				public: this.public,
				dateOrder: this.orderByCode[this.orderBy],
				liveStatus: this.liveStatus,
				host_user_id: this.host_user_id + '',
			})
			.subscribe((res) => {
				this.competitionsList = res.body;
				this.loading = false;
			});
	}
}
