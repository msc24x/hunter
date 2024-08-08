import { Component, OnDestroy, OnInit } from '@angular/core';
import {
	ActivatedRoute,
	NavigationStart,
	Router,
} from '@angular/router';
import * as ace from 'ace-builds';
import { Subscription } from 'rxjs';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import {
	CompetitionInfo,
	ExecutionInfo,
	HunterLanguage,
	QuestionInfo,
	resCode,
	resultFull,
	templates,
	UserInfo,
} from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { faArrowRightArrowLeft, faTableColumns } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'competition',
	templateUrl: './competition.component.html',
	styleUrls: ['./competition.component.scss'],
})
export class CompetitionComponent implements OnInit, OnDestroy {
	layoutIcon = faTableColumns

	loading = false;
	fetchSubmissionMsg = '';

	c_id: string = '';
	editor!: ace.Ace.Editor;
	hrlayout: boolean = true;

	isAuthenticated: boolean = false;
	user = {} as UserInfo;
	competition = {} as CompetitionInfo;
	evaluation: Array<resultFull> = [];
	competitionQuestions = [] as Array<QuestionInfo>;
	questionSelected = -1;
	questionSelectedInfo = {} as QuestionInfo;
	solutionOutput: ExecutionInfo = {
		expected: "",
		output: "",
		success: false,
		meta: ""
	};
	languageSelected : HunterLanguage = 'cpp';

	timeRemaining = {
		min: '∞',
		sec: '∞',
	};
	hasEnded = false;

	routerSubsc: Subscription | null = null;
	subscriptions: Subscription[] = [];
	timeInterval;

	constructor(
		private route: ActivatedRoute,
		private authService: AuthService,
		private router: Router,
		private competitionsService: CompetitionsDataService,
		private scoresDataService: ScoresDataService
	) {
		const idParam = this.route.snapshot.paramMap.get('competition_id');
		if (idParam) {
			this.c_id = idParam;
		}

		this.subscriptions.push(
			this.authService.isAuthenticated.subscribe((isAuth:boolean) => {
				this.user = this.authService.user;
				this.isAuthenticated = isAuth;
				this.fetchData();
			})
		);

		this.timeInterval = setInterval(() => {
			let seconds =
				(Date.parse(this.competition.start_schedule) +
					this.competition.duration * 60 * 1000 -
					Date.now()) /
				1000;
			seconds = Math.floor(seconds);
			if (seconds < 0) {
				this.timeRemaining = { min: '0', sec: '0' };
				clearInterval(this.timeInterval);
				return;
			}
			this.timeRemaining.min = Math.floor(seconds / 60) + '';
			this.timeRemaining.sec = (seconds % 60) + '';
		}, 1000);
	}

	ngOnInit(): void {
		if (this.isAuthenticated) {
			return
		}
		this.subscriptions.push(
			this.authService.authenticate_credentials().subscribe({
				next: (res) => {
					if (res.status == 202) {
						const body = res.body as UserInfo;
						this.user = body;
						this.authService.user = this.user;
						this.authService.isAuthenticated.next(true);
						this.fetchData();
						if (
							/iPhone|iPad|iPod|Android|Opera Mini|IEMobile|BlackBerry|WPDesktop/i.test(
								navigator.userAgent
							)
						) {
							alert(
								'Participating in competitions is not recommended on your device. Hunter is designed to be best viewed on desktops'
							);
						}
					}
				}
			})
		);

		this.unsubscribeAll();
	}

	ngOnDestroy() {
		this.unsubscribeAll();
		this.routerSubsc?.unsubscribe();
	}

	unsubscribeAll() {
		this.routerSubsc?.unsubscribe();
		this.routerSubsc = this.router.events.subscribe((event) => {
			if (event instanceof NavigationStart) {
				let sub = this.subscriptions.pop();
				while (sub) {
					sub.unsubscribe();
					sub = this.subscriptions.pop();
				}
			}
		});
	}

	clearOutput() {
		this.solutionOutput = {
			expected: "", meta: "", output : "", success: false
		}
	}

	postSolution(samples = false) {
		this.clearOutput()

		if (this.questionSelected == -1) {
			this.solutionOutput.output = 'No question selected';
			return;
		}
		if (!this.editor.getValue()) {
			this.solutionOutput.output = 'Empty solution';
			return;
		}

		this.solutionOutput.output = 'Judging.... (This might take few seconds)';

		this.loading = true;
		this.enableSubmitControls(false);
		this.subscriptions.push(
			this.competitionsService
				.judgeSolution(
					{
						for: {
							competition_id: this.c_id,
							question_id:
								this.competitionQuestions[this.questionSelected]
									.id,
						},
						solution: {
							lang: this.languageSelected,
							code: this.editor.getValue(),
						},
					},
					samples
				)
				.subscribe({
					next: (res) => {
						this.loading = false;
						this.enableSubmitControls(true);
						if (res.status == resCode.success) {
							this.solutionOutput = (
								res.body as ExecutionInfo
							);
							let outputBox =
								document.getElementById('solution_output');
							if (outputBox) {
								if (this.solutionOutput.success) {
									outputBox.style.backgroundColor =
										'#A3EBB133';
									outputBox.style.borderColor = 'darkgreen';
								} else {
									outputBox.style.backgroundColor = '#fff0f0';
									outputBox.style.borderColor = 'darkred';
								}
							}

							this.fetchEvaluation();
						} else {
							this.solutionOutput.output = res.statusText;
						}
					},

					error: (err) => {
						this.loading = false;
						this.enableSubmitControls(true);
						this.solutionOutput = err.statusText;
					},
				})
		);
	}

	fetchLastSubmission() {
		this.fetchSubmissionMsg = '';
		this.loading = true;
		this.subscriptions.push(
			this.competitionsService
				.getLastSubmission({
					competition_id: this.competition.id,
					question_id: this.questionSelectedInfo.id,
					lang: this.languageSelected,
				})
				.subscribe({
					next: (res) => {
						this.editor.setValue(res.body?.data ?? '');
						this.loading = false;
					},
					error: (err) => {
						console.log(err);
						this.loading = false;
						this.fetchSubmissionMsg =
							'* Not found any .' +
							this.languageSelected +
							' submission';
					},
				})
		);
	}

	fetchEvaluation() {
		this.subscriptions.push(
			this.scoresDataService
				.getScoresAll({
					user_id: this.user.id,
					competition_id: this.c_id,
				})
				.subscribe((res) => {
					if (res.status == resCode.success) {
						this.evaluation = res.body
							? (res.body as Array<resultFull>)
							: [];
					}
				})
		);
	}

	fetchData() {
		this.fetchEvaluation();

		this.subscriptions.push(
			this.competitionsService.getCompetitionInfo(this.c_id).subscribe({
				next: (res) => {
					this.competition = res.body as CompetitionInfo;

					if (this.competition.duration == 0) {
						clearInterval(this.timeInterval);
					}

					if (
						Date.parse(this.competition.start_schedule) > Date.now()
					) {
						alert('Competition has not started yet');
						this.router.navigate(['/compete']);
					} else this.initEditor();

					if (
						this.competition.duration != 0 &&
						Date.now() >
							Date.parse(this.competition.start_schedule) +
								this.competition.duration * 60 * 1000
					) {
						this.hasEnded = true;
					}

					this.competitionsService
						.getQuestions({ competition_id: this.c_id })
						.subscribe((res) => {
							this.competitionQuestions =
								res.body as QuestionInfo[];
							if (this.competitionQuestions) {
								this.selectQuestion(0);
							}
						});
				},
				error: (err) => {
					if (err.status == resCode.notFound) {
						this.router.navigate(['/404']);
					}
				},
			})
		);
	}

	selectQuestion(index: number) {
		this.questionSelected = index;
		this.questionSelectedInfo = this.competitionQuestions[index];
	}

	loadTemplate() {
		this.editor.setValue(
			templates[this.languageSelected as HunterLanguage]
		);
	}

	updateEditorMode(lang: string) {
		this.languageSelected = lang as HunterLanguage;

		switch (this.languageSelected) {
			case 'c':
			case 'cpp':
				this.editor.session.setMode('ace/mode/c_cpp');
				break;
			case 'py':
				this.editor.session.setMode('ace/mode/python');
				break;
			case 'js':
				this.editor.session.setMode('ace/mode/javascript');
				break;
			case 'ts':
				this.editor.session.setMode('ace/mode/typescript');
				break;
			case 'go':
				this.editor.session.setMode('ace/mode/golang');
				break;
		}
	}

	toggleLayout() {
		console.log("dfkj")
		this.hrlayout = !this.hrlayout
	}

	enableSubmitControls(enable: boolean) {
		let elem = document.getElementById('submit_controls') as HTMLDivElement;

		if (enable) {
			elem.style.pointerEvents = 'initial';
			elem.style.opacity = '1';
		} else {
			elem.style.pointerEvents = 'none';
			elem.style.opacity = '0.5';
		}
	}

	getPrettyRuntimeInfo(info: string) : any[] {
		var prettyArr: any[] = [];
		info.split('\n').forEach(infoKey => {
			const [itemName, itemVal] = infoKey.split(':');
			
			switch (itemName) {
				case "cg-mem":
					prettyArr.push([
						"Memory", itemVal + " kb"
					])
					break;
				case "status":
					const msgMap: any = {
						"RE": "Runtime error",
						"SG": "Died on signal",
						"TO": "Timed out",
						"XX": "Internal error"
					}
					prettyArr.push(["Message", itemVal + ": " + (msgMap[itemVal] || '')])
					break;
				case "time":
					prettyArr.push([
						"CPU time", itemVal + " sec"
					])
					break;
				case "time-wall":
					prettyArr.push(["Total time", itemVal+" sec"])
			}
		})

		return prettyArr;
	}

	initEditor() {
		this.editor = ace.edit('editor');
		ace.config.set('basePath', 'assets/');
		/**
		 * twilight
		 * monokai
		 * terminal
		 */
		this.editor.setTheme('ace/theme/twilight');
		this.editor.session.setMode('ace/mode/c_cpp');
		this.editor.setAutoScrollEditorIntoView(true)
	}
}
