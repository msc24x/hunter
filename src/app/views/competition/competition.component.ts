import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ActivationEnd, NavigationStart, Router } from '@angular/router';
import * as ace from 'ace-builds';
import { Subscription } from 'rxjs';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import { CompetitionInfo, HunterExecutable, QuestionInfo, resCode, resultFull, UserInfo } from 'src/environments/environment';
import { AuthService } from '../../services/auth/auth.service';
import { CompetitionsDataService } from '../../services/data/competitions-data.service';
import katex from 'katex';


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
  evaluation : Array<resultFull> = []

  competitionQuestions : Array<QuestionInfo> = []
  questionSelected = -1
  questionSelectedInfo = {} as QuestionInfo
  solutionOutput = ""
  languageSelected = "cpp"

  timeRemaining = {
    min : "∞",
    sec : "∞"
  }

  routerSubsc : Subscription | null = null
  subscriptions : Subscription[] = []
  timeInterval


  constructor(
    private route : ActivatedRoute,
    private authService : AuthService,
    private router : Router,
    private competitionsService : CompetitionsDataService,
    private scoresDataService : ScoresDataService
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

    this.timeInterval = setInterval(
      ()=>{
        
        let seconds = (Date.parse(this.competition.start_schedule) + this.competition.duration * 60 * 1000 - Date.now())/1000
        seconds = Math.floor(seconds)
        if(seconds < 0){
          this.timeRemaining = {min : '0', sec : '0'}
          clearInterval(this.timeInterval)
          return
        }
        this.timeRemaining.min = Math.floor(seconds/60)+""
        this.timeRemaining.sec = seconds % 60+""
      },
      1000
    )


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
      if(res.status == resCode.success){
        this.solutionOutput = ( res.body as {output : string}).output
        let outputBox = document.getElementById('solution_output');
        if(outputBox){
          if(this.solutionOutput[0] == '1'){
            outputBox.style.backgroundColor = "#A3EBB133";
            outputBox.style.borderColor = 'darkgreen'
          }
          else{
            outputBox.style.backgroundColor = "#fff0f0";
            outputBox.style.borderColor = 'darkred'
          }
        }
        
        this.fetchEvaluation()
      }
      else
        this.solutionOutput == res.statusText
    })
  }


  fetchEvaluation(){
    this.subscriptions.push(
      this.scoresDataService.getScoresAll(
        {
          user_id : this.user.id,
          competition_id : this.c_id
        }
      ).subscribe(res=>{
        if(res.status == resCode.success){
          this.evaluation = res.body? res.body as Array<resultFull> : []
        }
      })
    ) 
  }

  fetchData(){

    this.fetchEvaluation()

    this.subscriptions.push( this.competitionsService.getCompetitionInfo(this.c_id).subscribe({
      next : res=>{
        this.competition = res.body as CompetitionInfo
        if(this.competition.duration == 0){
          clearInterval(this.timeInterval)
        }
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
