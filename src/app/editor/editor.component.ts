import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { time } from 'console';
import { userInfo } from 'os';
import { timestamp } from 'rxjs';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';

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
    rating : 0
  } as CompetitionInfo

  isAuthenticated : boolean = false
  user = {
    id : "",
    email : "",
    name : ""
  }

  constructor(private router :  Router, private activatedRoute : ActivatedRoute, private authService : AuthService) {

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

        this.fetchCompetitionInfo(this.competition_id)

      }
    },
    err=>{
      this.router.navigate(["/home"])
    })


  }


  convertZtoUTC(zString : string) : string{
    let utc = new Date(zString)
    return utc.toUTCString()
  }

  fetchCompetitionInfo(id :  string){
    this.authService.getCompetitionInfo(id as string).subscribe(res=>{
      if(res.status == this.authService.resCode.found){
        this.competitionInfo = res.body as CompetitionInfo
      }
    },
    err =>{
      if(err.status == this.authService.resCode.found){
        this.competitionInfo = err.error as CompetitionInfo
        this.competitionInfo.created_on = this.convertZtoUTC(this.competitionInfo.created_on)
        this.toggleVisibility()
        this.toggleVisibility()

        if(this.competitionInfo.host_user_id != this.user.id){
          this.router.navigate(["/home"])
        }
      }
      else{
        this.router.navigate(["/home"])
      }
    })
  }

  refreshCompetitionInfo(){
    this.fetchCompetitionInfo(this.competition_id)
    const title = document.getElementById("text_title") as HTMLTextAreaElement
    const description = document.getElementById("text_description") as HTMLTextAreaElement
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
    this.competitionInfo.title  = title.value
    this.competitionInfo.description = description.value
    this.authService.updateCompetitionInfo(this.competitionInfo).subscribe(res=>{
      console.log(res);
    })
  }


}
