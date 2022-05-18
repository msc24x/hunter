import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HtmlParser } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { time } from 'console';
import { userInfo } from 'os';
import { timestamp } from 'rxjs';
import { CompetitionInfo, QuestionInfo, resCode, UserInfo } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';
import { CompetitionsDataService } from '../services/data/competitions-data.service';
import { convert } from '../utils/utils';

@Component({
  selector: 'editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  competition_id : string
  competitionInfo : CompetitionInfo  = {
    id : "",
    title : "",
    created_on : "",
    host_user_id : "",
    description : "",
    public : false,
    rating : 0,
    duration : 0,
    start_schedule : ""
  } as CompetitionInfo
  competitionQuestions : Array<QuestionInfo> = []

  isAuthenticated : boolean = false
  user = {
    id : "",
    email : "",
    name : ""
  }

  constructor(
    private router :  Router,
    private activatedRoute : ActivatedRoute,
    private authService : AuthService,
    private competitionsData : CompetitionsDataService,
    private datePipe : DatePipe
  ) {

    this.competition_id =  activatedRoute.snapshot.paramMap.get("competition_id") as string

    this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;

    })
  }

  ngOnInit(): void {

    this.authService.authenticate_credentials().subscribe(res=>{
      if(res.status == 202){
        const body = res.body as UserInfo
        this.user = body
        this.authService.user = this.user
        this.authService.isAuthenticated.next(true)
        this.fetchCompetitionInfo()

      }
    },
    err=>{
      this.router.navigate(["/home"])
    })





  }

  openFile(event : any){
    const input  = event.target as HTMLInputElement
    input.type = "file"
    input.click()
  }

  updateSolutionsFile(event: any){
    const file = (event.target as HTMLInputElement).files
    if(file && file.length > 0){
      const label = document.getElementById("solutions_file_label") as HTMLLabelElement
      label.innerText = "Test against " + file[0].name
    }
  }

  updateTestCasesFile(event: any){
    const file = (event.target as HTMLInputElement).files
    if(file && file.length > 0){
      const label = document.getElementById("testcases_file_label") as HTMLLabelElement
      label.innerText = "Test cases " + file[0].name
    }
  }

  addQuestion(){
    this.competitionsData.addQuestion(this.competitionInfo.id).subscribe(res=>{
      this.fetchQuestions()
    })
  }

  fetchQuestions(){
    this.competitionsData.getQuestions({competition_id : this.competitionInfo.id as string}).subscribe(res=>{
      if(res.status == resCode.success){
        if(res.body)
          this.competitionQuestions = res.body
      }
    })
  }

  fetchCompetitionInfo(){
    this.competitionsData.getCompetitionInfo(this.competition_id as string).subscribe(res=>{
      if(res.status == resCode.found){
        this.competitionInfo = res.body as CompetitionInfo
      }
    },
    err =>{
      if(err.status == resCode.found){
        this.competitionInfo = err.error as CompetitionInfo
        this.toggleVisibility()
        this.toggleVisibility()


        if(this.competitionInfo.host_user_id != this.user.id){
          this.router.navigate(["/home"])
        }

        this.fetchQuestions()
      }
      else{
        this.router.navigate(["/home"])
      }
    })
  }

  refreshCompetitionInfo(){
    this.fetchCompetitionInfo()
    const title = document.getElementById("text_title") as HTMLTextAreaElement
    const description = document.getElementById("text_description") as HTMLTextAreaElement
    const duration = document.getElementById("competition_duration") as HTMLInputElement
    const schedule = document.getElementById("competition_schedule") as HTMLInputElement
    duration.value = this.competitionInfo.duration as unknown as string
    schedule.value = this.datePipe.transform(this.competitionInfo.start_schedule, "yyyy-MM-ddThh:mm")!
    title.value = this.competitionInfo.title as string
    description.value = this.competitionInfo.description as string
  }

  toggleVisibility(){
    const visBtn = document.getElementById("visibility") as HTMLDivElement

    if(this.competitionInfo?.public){
      this.competitionInfo.public = false
      visBtn.innerHTML = "PRIVATE"
      visBtn.style.color = "black"
      visBtn.style.backgroundColor = "rgb(20, 220, 120)"
    }
    else if(this.competitionInfo){
      this.competitionInfo.public = true
      visBtn.innerHTML = "PUBLIC"
      visBtn.style.color = "white"
      visBtn.style.backgroundColor = "crimson"
    }
  }

  saveChanges(){
    const title = document.getElementById("text_title") as HTMLTextAreaElement
    const description = document.getElementById("text_description") as HTMLTextAreaElement
    const duration = document.getElementById("competition_duration") as HTMLInputElement
    const schedule = document.getElementById("competition_schedule") as HTMLInputElement
    this.competitionInfo.title  = title.value
    this.competitionInfo.description = description.value
    this.competitionInfo.duration = duration.value as unknown as number
    this.competitionInfo.start_schedule = schedule.value
    this.competitionsData.updateCompetitionInfo(this.competitionInfo).subscribe(res=>{
      console.log(res);
    })
  }


}
