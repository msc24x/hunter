import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  competition_id : string
  competitionInfo : CompetitionInfo | null = null

  isAuthenticated : boolean = false
  user = {
    id : "",
    email : "",
    name : ""
  }

  constructor(private activatedRoute : ActivatedRoute, private authService : AuthService) {

    this.competition_id =  activatedRoute.snapshot.paramMap.get("competition_id") as string

    this.fetchCompetitionInfo(this.competition_id)

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
      }
    })


  }


  fetchCompetitionInfo(id :  string){
    this.authService.getCompetitionInfo(id as string).subscribe(res=>{
      if(res.status == this.authService.resCode.found){
        this.competitionInfo = res.body as CompetitionInfo
        //console.log(this.competitionInfo)
      }
    },
    err =>{
      if(err.status == this.authService.resCode.found){
        this.competitionInfo = err.error as CompetitionInfo
        // this.competitionInfo = {
        //   id : body.id,
        //   host_user_id : body.host_user_id,
        //   title : body.title,
        //   description : body.description,
        //   created_on : body.created_on,
        //   rating : body.rating,
        //   public : body.public
        // }
        console.log(this.competitionInfo)
        this.toggleVisibility()
        this.toggleVisibility()
      }
    })
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




}
