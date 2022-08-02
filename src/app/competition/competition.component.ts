import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router } from '@angular/router';
import * as ace from 'ace-builds';
import { CompetitionInfo, QuestionInfo, resCode, UserInfo } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';
import { CompetitionsDataService } from '../services/data/competitions-data.service';
@Component({
  selector: 'competition',
  templateUrl: './competition.component.html',
  styleUrls: ['./competition.component.scss']
})
export class CompetitionComponent implements OnInit {

  c_id : string = "";
  editor!: ace.Ace.Editor;

  isAuthenticated : boolean = false
  user = {} as UserInfo
  competition = {} as CompetitionInfo

  competitionQuestions : Array<QuestionInfo> = []
  questionSelected = -1
  questionSelectedInfo = {} as QuestionInfo
  solutionOutput = ""



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

    this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;
      this.fetchData()
    })

  }


  ngOnInit(): void {
    this.initEditor()

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
  }

  postSolution(){

    if(this.questionSelected == -1){
      this.solutionOutput = "No question selected"
      return
    }

    this.solutionOutput = "Judging.... (This might take few seconds)"
    this.competitionsService.judgeSolution({
      for : {
        competition_id : this.c_id,
        question_id : this.competitionQuestions[this.questionSelected].id
      },
      solution : {
        lang : "cpp",
        code : this.editor.getValue()
      }
    }).subscribe(res=>{
      console.log(res)
      this.solutionOutput = ( res.body as {output : string}).output

    })
  }

  fetchData(){
    this.competitionsService.getCompetitionInfo(this.c_id).subscribe(res=>{
      this.competition = res.body as CompetitionInfo
      this.competitionsService.getQuestions({competition_id : this.c_id}).subscribe(res=>{
        this.competitionQuestions = res.body as QuestionInfo[]
      })
    })
  }

  selectQuestion(index : number){
    this.questionSelected = index
    this.questionSelectedInfo = this.competitionQuestions[index]
    console.log(this.questionSelectedInfo)
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
