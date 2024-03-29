import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isLive, showPopup } from 'src/app/utils/utils';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { UserDataService } from 'src/app/services/user-data/user-data.service';

@Component({
	selector: 'editor-menu',
	templateUrl: './editor-menu.component.html',
	styleUrls: ['./editor-menu.component.scss'],
})
export class EditorMenuComponent implements OnInit {
	loading = 0;

	isAuthenticated: boolean = false;
	user = {
		id: '',
		email: '',
		name: '',
	};

	userCompetitions: Array<CompetitionInfo> | null = null;
	competitionsMetaData  = {
		total: 0,
		live: 0,
		public : 0,
	}

	constructor(
		private authService: AuthService,
		private competitionsDataService: CompetitionsDataService,
		private userDataService: UserDataService,
		private router: Router
	) {
		this.authService.isAuthenticated.subscribe((isAuth) => {
			this.user = this.authService.user;
			this.isAuthenticated = isAuth;
		});
	}
	showEditProfileForm(f: boolean) {
		showPopup(f, "edit_profile_popup")
	}

	calculateCompetitionsMetaData() {

		let data = {
			total: 0,
			live: 0,
			public : 0,
		}

		if (this.userCompetitions == null) {
			this.competitionsMetaData = data
			return
		}

		data.total = this.userCompetitions?.length || 0
		
		for (let competition of this.userCompetitions) {
			if (isLive(competition.start_schedule, competition.duration)) {
				data.live += 1;
			}
			if (competition.public) {
				data.public += 1;
			}
		}

		this.competitionsMetaData = data
		return

	}

	updateUserInfo() {
		let userInput = document.getElementById(
			'user_name_input'
		) as HTMLInputElement;
		this.user.name = userInput.value;

		this.loading += 1;

		this.userDataService
			.updateUserInfo({
				id: this.user.id,
				name: userInput.value,
				email: this.user.email,
			})
			.subscribe((res) => {
				this.loading -= 1;
			});
	}

	ngOnInit(): void {
		this.authService.authenticate_credentials().subscribe({
			next: (res) => {
				if (res.status == 202) {
					// save user info
					const body = res.body as UserInfo;
					this.user = {
						id: body.id,
						email: body.email,
						name: body.name,
					};

					// save user info for all components subscribed to the service
					this.authService.user = this.user;
					this.isAuthenticated = true;
					this.authService.isAuthenticated.next(true);

					this.loading += 1;
					// fetch user's all created competitions
					this.competitionsDataService
						.getPublicCompetitions({
							host_user_id: this.user.id,
						})
						.subscribe({
							next: (res) => {
								this.userCompetitions = res.body;
								this.calculateCompetitionsMetaData()
								this.loading -= 1;
							},
							error: (err) => {
								this.userCompetitions = err.error;
								this.loading -= 1;
							},
						});
				}
			},
			error: (err) => {
				this.router.navigate(['/home']);
			},
		});
	}
}
