import { Component, OnInit } from '@angular/core';
import { userInfo } from 'os';
import { CompetitionInfo, UserInfo } from 'server/src/environments/environment';
import { AuthService } from '../services/auth/auth.service';
import { CompetitionsDataService } from '../services/data/competitions-data.service';

@Component({
  selector: 'editor-menu',
  templateUrl: './editor-menu.component.html',
  styleUrls: ['./editor-menu.component.scss']
})
export class EditorMenuComponent implements OnInit {

  isAuthenticated : boolean = false
  user = {
    id : "",
    email : "",
    name : ""
  }

  userCompetitions : Array<CompetitionInfo> | null = null


  constructor(
    private authService : AuthService,
    private competitionsDataService : CompetitionsDataService
  ) {

    this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;
    })

  }

  ngOnInit(): void {

    this.authService.authenticate_credentials().subscribe(res=>{
      if(res.status == 202){

        // save user info
        const body = res.body as UserInfo
        this.user = {
          id :  body.id,
          email : body.email,
          name : body.name
        }

        // save user info for all components subscribed to the service
        this.authService.user = this.user
        this.isAuthenticated = true
        this.authService.isAuthenticated.next(true)

        // fetch user's all created competitions
        this.competitionsDataService.getPublicCompetitions({
          public : false,
          host_user_id : this.user.id
        }).subscribe(res=>{
          this.userCompetitions = res.body
        },
        err=>{
          this.userCompetitions = err.error
        })

      }
    })

  }

}
