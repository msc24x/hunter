import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
	CompetitionInfo,
	QuestionInfo,
	resCode,
	UserInfo,
} from 'src/environments/environment';

@Component({
	selector: 'editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
	loading = false;

	log = new Array<string>();
	deleteCompMessage = '';

	competition_id: string;
	competitionInfo: CompetitionInfo = {} as CompetitionInfo;
	competitionQuestions: Array<QuestionInfo> = [];
	questionSelected = -1;
	questionSelectedInfo = {} as QuestionInfo;
	testExists = false;
	solsExists = false;
	elem: HTMLElement | null = null;

	isAuthenticated: boolean = false;
	user = {} as UserInfo;
	eventPopup = new BehaviorSubject<string>('');

	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private authService: AuthService,
		private competitionsData: CompetitionsDataService,
		private datePipe: DatePipe
	) {
		this.competition_id = this.activatedRoute.snapshot.paramMap.get(
			'competition_id'
		) as string;

		this.authService.isAuthenticated.subscribe((isAuth) => {
			this.user = this.authService.user;
			this.isAuthenticated = isAuth;
		});
	}

	ngOnInit(): void {
		window.scroll(0, 0);

		this.elem = document.getElementById('log');

		this.loading = true;
		this.authService.authenticate_credentials().subscribe(
			(res) => {
				if (res.status == 202) {
					const body = res.body as UserInfo;
					this.user = body;
					this.authService.user = this.user;
					this.authService.isAuthenticated.next(true);
					this.loading = false;
					this.fetchCompetitionInfo();
				}
			},
			(err) => {
				this.loading = false;
				this.router.navigate(['/home']);
			}
		);

		document.onkeydown = (event) => {
			if (
				event.shiftKey &&
				event.key == 'S' &&
				!['INPUT', 'TEXTAREA'].includes(
					(event.target as HTMLElement).tagName
				)
			) {
				this.saveQuestion();
				this.saveChanges();
			}
		};
	}

	getFileStatus(fileType: string) {
		let exists = new BehaviorSubject(false);
		this.competitionsData
			.getFileStatus(this.questionSelectedInfo.id, fileType)
			.subscribe((res) => {
				if (res.status == resCode.success) {
					exists.next((res.body as any).exists);
				}
			});

		return exists.asObservable();
	}

	downloadFile(fileType: string) {
		window.open(
			`/api/question/${this.questionSelectedInfo.id}/${fileType}/download`
		);
	}

	saveQuestion() {
		if (this.questionSelected == -1) {
			this.displayLog('No question selected');
			return;
		}

		this.loading = true;
		this.competitionsData
			.putQuestion({
				id: this.competitionQuestions[this.questionSelected].id,
				title: (
					document.getElementById(
						'text_qtitle'
					) as HTMLTextAreaElement
				).value,
				statement: (
					document.getElementById(
						'text_statement'
					) as HTMLTextAreaElement
				).value,
				points: (
					document.getElementById(
						'question_points'
					) as HTMLInputElement
				).valueAsNumber,
				sample_cases: (
					document.getElementById(
						'question_sample_cases'
					) as HTMLInputElement
				).value,
				sample_sols: (
					document.getElementById(
						'question_sample_sols'
					) as HTMLInputElement
				).value,
			})
			.subscribe((res) => {
				this.displayLog('Question Updated');
				this.loading = false;
				this.fetchQuestions();
			});
	}

	selectedQuestionElement(): HTMLLIElement | null {
		let prevTarget = document
			.getElementById('questions_list')
			?.getElementsByTagName('li')[this.questionSelected];
		if (prevTarget) {
			return prevTarget;
		} else return null;
	}

	selectQuestion(index: number) {
		this.loading = true;

		this.questionSelected = index;
		this.questionSelectedInfo =
			index == -1
				? ({} as QuestionInfo)
				: this.competitionQuestions[index];

		this.competitionsData
			.getFileStatus(this.questionSelectedInfo.id, 'solutions')
			.subscribe((res) => {
				if (res.status == resCode.success) {
					this.solsExists = (res.body as any).exists;
				}
			});
		this.competitionsData
			.getFileStatus(this.questionSelectedInfo.id, 'testcases')
			.subscribe((res) => {
				if (res.status == resCode.success) {
					this.testExists = (res.body as any).exists;
				}
			});
		this.loading = false;
	}

	updateFile(event: any, filen: string) {
		const file = (event.target as HTMLInputElement).files;

		if (!file || file.length == 0) {
			this.displayLog('Error while uploading');
			return;
		}

		if (this.questionSelected == -1) {
			this.displayLog('Error : No question selected');
			return;
		}

		if (file[0].size > 1572864 || file[0].type != 'text/plain') {
			this.displayLog('File should be .txt < 1.5 Mb');
			return;
		}

		this.loading = true;

		const label = document.getElementById(
			filen.toLowerCase() + '_file_label'
		) as HTMLLabelElement;
		label.innerText = 'Uploading.. ' + filen + ' ' + file[0].name;

		const contents = file[0].text();

		contents.then((result) => {
			this.competitionsData
				.postFile({
					id: this.questionSelectedInfo.id,
					fileType: filen.toLowerCase(),
					file: result,
				})
				.subscribe((res) => {
					this.displayLog('File for ' + filen + ' Uploaded');
					label.innerText = filen + ' Uploaded';

					this.competitionsData
						.getFileStatus(
							this.questionSelectedInfo.id,
							'solutions'
						)
						.subscribe((res) => {
							if (res.status == resCode.success) {
								this.solsExists = (res.body as any).exists;
							}
						});
					this.competitionsData
						.getFileStatus(
							this.questionSelectedInfo.id,
							'testcases'
						)
						.subscribe((res) => {
							if (res.status == resCode.success) {
								this.testExists = (res.body as any).exists;
							}
						});
					this.loading = false;
				});
		});
	}

	fetchQuestions() {
		this.loading = true;
		this.competitionsData
			.getQuestions({ competition_id: this.competitionInfo.id as string })
			.subscribe((res) => {
				if (res.status == resCode.success) {
					if (res.body) {
						this.competitionQuestions = res.body;
						this.questionSelected = -1;
						this.questionSelectedInfo = {} as QuestionInfo;
						this.loading = false;
					}
				}
			});
	}

	fetchCompetitionInfo() {
		this.loading = true;
		this.competitionsData
			.getCompetitionInfo(this.competition_id as string)
			.subscribe(
				(res) => {
					if (res.status == resCode.success) {
						this.competitionInfo = res.body as CompetitionInfo;
						this.toggleVisibility();
						this.toggleVisibility();

						if (this.competitionInfo.host_user_id != this.user.id) {
							this.router.navigate(['/home']);
						}

						this.fetchQuestions();
						this.loading = false;
					}
				},
				(err) => {
					if (err.status == resCode.success) {
						this.competitionInfo = err.error as CompetitionInfo;
						this.toggleVisibility();
						this.toggleVisibility();

						if (this.competitionInfo.host_user_id != this.user.id) {
							this.router.navigate(['/home']);
						}

						this.fetchQuestions();
					} else {
						this.router.navigate(['/home']);
					}
					this.loading = false;
				}
			);
	}

	refreshCompetitionInfo() {
		this.fetchCompetitionInfo();
		this.loading = true;
		const title = document.getElementById(
			'text_title'
		) as HTMLTextAreaElement;
		const description = document.getElementById(
			'text_description'
		) as HTMLTextAreaElement;
		const duration = document.getElementById(
			'competition_duration'
		) as HTMLInputElement;
		const schedule = document.getElementById(
			'competition_schedule'
		) as HTMLInputElement;
		duration.value = this.competitionInfo.duration as unknown as string;
		schedule.value = this.datePipe.transform(
			this.competitionInfo.start_schedule,
			'yyyy-MM-ddThh:mm'
		)!;
		title.value = this.competitionInfo.title as string;
		description.value = this.competitionInfo.description as string;

		this.displayLog('Data refreshed');
		this.loading = false;
	}

	toggleVisibility() {
		this.loading = true;
		const visBtn = document.getElementById('visibility') as HTMLDivElement;

		if (this.competitionInfo?.public) {
			this.competitionInfo.public = false;
			visBtn.innerHTML = 'PRIVATE';
			visBtn.style.color = 'black';
			visBtn.style.backgroundColor = 'rgb(20, 220, 120)';
		} else if (this.competitionInfo) {
			this.competitionInfo.public = true;
			visBtn.innerHTML = 'PUBLIC';
			visBtn.style.color = 'white';
			visBtn.style.backgroundColor = 'crimson';
		}
		this.loading = false;
	}

	saveChanges() {
		this.saveQuestion();
		this.loading = true;
		const title = document.getElementById(
			'text_title'
		) as HTMLTextAreaElement;
		const description = document.getElementById(
			'text_description'
		) as HTMLTextAreaElement;
		const duration = document.getElementById(
			'competition_duration'
		) as HTMLInputElement;
		const schedule = document.getElementById(
			'competition_schedule'
		) as HTMLInputElement;
		this.competitionInfo.title = title.value;
		this.competitionInfo.description = description.value;
		this.competitionInfo.duration = duration.value as unknown as number;
		this.competitionInfo.start_schedule = new Date(
			schedule.value
		).toISOString();
		this.competitionsData
			.putCompetitionInfo(this.competitionInfo)
			.subscribe((res) => {
				this.displayLog('Competition changes saved');
				this.loading = false;
			});
	}

	displayLog(msg: string) {
		this.log.push(msg);
		if (this.elem) this.elem.innerHTML = '&#x1F6C8; ' + msg;
	}

	handleDeleteCompPopupEvent(event: string) {
		this.showPopup(false, 'delete_comp_popup');
	}

	handleGuidePopupEvent(event: string) {
		this.eventPopup.next(event);
		this.showPopup(false, 'guide');
	}

	handlePrivacyConfirmPopupEvent(event: string) {
		if (event == 'continue') {
			this.toggleVisibility();
		}
		this.showPopup(false, 'public_status_confirm');
	}

	showLog() {
		console.log(this.log);
	}

	showPopup(f: boolean, id: string) {
		let guide = document.getElementById(id) as HTMLElement;
		if (f) {
			guide.style.display = 'block';
			window.scroll(0, 0);
		} else guide.style.display = 'none';
	}

	onClickVisibility() {
		if (this.competitionInfo.public == false) {
			this.showPopup(true, 'public_status_confirm');
		} else {
			this.toggleVisibility();
		}
	}

	togglePreview() {
		let raw = document.getElementById(
			'text_statement'
		) as HTMLTextAreaElement;
		let prev = document.getElementById('text_statement_preview') as any;
		if (prev.style.display == 'none') {
			prev.style.display = 'block';
			raw.style.display = 'none';
		} else {
			prev.style.display = 'none';
			raw.style.display = 'block';
		}
		this.questionSelectedInfo.statement = raw.value;
	}

	deleteCompetition() {
		let input = document.getElementById(
			'input_competition_code'
		) as HTMLInputElement;
		if (input.value != this.competitionInfo.id) {
			this.deleteCompMessage = '*Code does not match';
		} else {
			this.deleteCompMessage = '';
			this.loading = true;
			this.competitionsData
				.deleteCompetition(this.competitionInfo.id)
				.subscribe({
					next: (res) => {
						this.deleteCompMessage = 'Deleted';
						this.showPopup(false, 'delete_comp_popup');
						this.router.navigate(['/editor']);
					},
					error: (err) => {
						this.deleteCompMessage = err.status;
					},
					complete: () => {
						this.loading = false;
					},
				});
		}
	}
}
