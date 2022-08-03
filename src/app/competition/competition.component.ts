import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ActivationEnd, NavigationStart, Router } from '@angular/router';
import * as ace from 'ace-builds';
import { Subscription } from 'rxjs';
import { CompetitionInfo, HunterExecutable, QuestionInfo, resCode, UserInfo } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';
import { CompetitionsDataService } from '../services/data/competitions-data.service';
@Component({
  selector: 'competition',
  templateUrl: './competition.component.html',
  styleUrls: ['./competition.component.scss']
})
export class CompetitionComponent implements OnInit, OnDestroy {

  c_id : string = "";
  editor!: ace.Ace.Editor;

  isAuthenticated : boolean = false
  user = {} as UserInfo
  competition = {} as CompetitionInfo

  competitionQuestions : Array<QuestionInfo> = []
  questionSelected = -1
  questionSelectedInfo = {} as QuestionInfo
  solutionOutput = ""
  languageSelected = "cpp"

  routerSubsc : Subscription | null = null
  subscriptions : Subscription[] = []


  constructor(
    private route : ActivatedRoute,
    private authService : AuthService,
    private router : Router,
    private competitionsService : CompetitionsDataService
  ) {
    const idParam = route.snapshot.paramMap.get("competition_id");
    if(idParam){
      this.c_id = idParam;
    }

    this.subscriptions.push(this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;
      this.fetchData()
    }))


  }


  ngOnInit(): void {
    this.initEditor()

    this.subscriptions.push(
      this.authService.authenticate_credentials().subscribe(res=>{
        if(res.status == 202){
          const body = res.body as UserInfo
          this.user = body
          this.authService.user = this.user
          this.authService.isAuthenticated.next(true)
          this.fetchData()
        }
      },
      err=>{
        this.router.navigate(["/home"])
      })
    )

    this.unsubscribeAll()

  }

  ngOnDestroy(){
    this.unsubscribeAll()
    this.routerSubsc?.unsubscribe()
  }

  unsubscribeAll(){
    this.routerSubsc?.unsubscribe()
    this.routerSubsc = this.router.events.subscribe(event=>{
      if(event instanceof NavigationStart){
        console.log("event")

        let sub = this.subscriptions.pop()
        while(sub){
          console.log("unsub")
          sub.unsubscribe()
          sub = this.subscriptions.pop()
        }
      }
    })
  }

  postSolution(){

    if(this.questionSelected == -1){
      this.solutionOutput = "No question selected"
      return
    }
    if(!this.editor.getValue()){
      this.solutionOutput = "Empty solution"
      return
    }

    this.solutionOutput = "Judging.... (This might take few seconds)"
    this.competitionsService.judgeSolution({
      for : {
        competition_id : this.c_id,
        question_id : this.competitionQuestions[this.questionSelected].id
      },
      solution : {
        lang : this.languageSelected ,
        code : this.editor.getValue()
      }
    }).subscribe(res=>{

      this.solutionOutput = ( res.body as {output : string}).output

    })
  }

  fetchData(){

    this.subscriptions.push( this.competitionsService.getCompetitionInfo(this.c_id).subscribe({
      next : res=>{
        this.competition = res.body as CompetitionInfo
        this.competitionsService.getQuestions({competition_id : this.c_id}).subscribe(res=>{
          this.competitionQuestions = res.body as QuestionInfo[]
        })
      },
      error : err=>{
        if(err.status == resCode.notFound){
          this.router.navigate(["/404"])
        }
      }
    }))
  }

  selectQuestion(index : number){
    this.questionSelected = index
    this.questionSelectedInfo = this.competitionQuestions[index]

  }


  initEditor(){
    this.editor = ace.edit("editor")
    ace.config.set("basePath", "https://unpkg.com/ace-builds@1.4.12/src-noconflict")
    /**
     * twilight
     * monokai
     * terminal
     */
    this.editor.setTheme("ace/theme/twilight")
    this.editor.session.setMode("ace/mode/python")
  }

}
