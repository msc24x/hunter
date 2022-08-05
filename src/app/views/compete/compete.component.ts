import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../../services/auth/auth.service';
import { CompetitionsDataService } from '../../services/data/competitions-data.service';

export class Question{
  constructor(
    public title : string,
    public description : string,
    public value : number
  ){}

}

export class Competition{
  constructor(
    public id : number,
    public title : string,
    public about : string,
    public dateCreated : number,
    public duration : number,
    public questions : Array<Question>,
    public isPublic : Boolean
  ){}

}

@Component({
  selector: 'compete',
  templateUrl: './compete.component.html',
  styleUrls: ['./compete.component.scss']
})
export class CompeteComponent implements OnInit {

  isAuthenticated : boolean = false
  user = {
    id : "",
    email : "",
    name : ""
  }

  publicCompetitions : Array<CompetitionInfo> | null = null


  constructor(
    private authService : AuthService,
    private competitionsDataService : CompetitionsDataService,
    private router : Router
  ) {

    this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;
    })

    competitionsDataService.getPublicCompetitions({public : true}).subscribe(res=>{
      this.publicCompetitions = res.body
    },
    err=>{
      this.publicCompetitions = err.error
    })

  }



  ngOnInit(): void {

    this.authService.authenticate_credentials().subscribe(res=>{
      if(res.status == 202){
        const body = res.body as UserInfo
        this.user = {
          id :  body.id,
          email : body.email,
          name : body.name
        }
        this.authService.user = this.user
        this.isAuthenticated = true
        this.authService.isAuthenticated.next(true)

      }
    })

  }

  routeToCompetition(){
    const id = document.getElementById("competition_id_text") as HTMLInputElement
    this.router.navigate(["/hunt/"+id.valueAsNumber])
  }

  showCreateDialog(show : boolean){
    let createDialog = document.getElementsByTagName("create-dialog")[0] as HTMLDivElement
    if(show){
      createDialog.style.display = "block"
    }else{
      createDialog.style.display = "none"
    }
  }


}
