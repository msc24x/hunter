import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserDataService } from 'src/app/services/data/user-data.service';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../../services/auth/auth.service';
import { CompetitionsDataService } from '../../services/data/competitions-data.service';

@Component({
	selector: 'editor-menu',
	templateUrl: './editor-menu.component.html',
	styleUrls: ['./editor-menu.component.scss'],
})
export class EditorMenuComponent implements OnInit {
	loading = false;

	isAuthenticated: boolean = false;
	user = {
		id: '',
		email: '',
		name: '',
	};

	userCompetitions: Array<CompetitionInfo> | null = null;

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

	updateUserInfo() {
		let userInput = document.getElementById(
			'user_name_input'
		) as HTMLInputElement;
		this.user.name = userInput.value;

		this.loading = true;

		this.userDataService
			.updateUserInfo({
				id: this.user.id,
				name: userInput.value,
				email: this.user.email,
			})
			.subscribe((res) => {
				this.loading = false;
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

					this.loading = true;
					// fetch user's all created competitions
					this.competitionsDataService
						.getPublicCompetitions({
							host_user_id: this.user.id,
						})
						.subscribe({
							next: (res) => {
								this.userCompetitions = res.body;
								this.loading = false;
							},
							error: (err) => {
								this.userCompetitions = err.error;
								this.loading = false;
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
