import { Component, OnInit } from '@angular/core';
import { UserInfo } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';

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

  public coms : Competition[];

  isAuthenticated : boolean = false
  user = {
    id : "",
    email : "",
    name : ""
  }


  constructor(private authService : AuthService) {

    const comp = new Competition(
      45,
      "Downtown kabbadi competition",
      "B%5*[_FUX5bd5ab}kxZ$k3+e.rSwL8Hn+z2]j}t[8VE#M2y-S)txVm*xGrG(7r3C./SVU3VVzEvHZ*#@T_tNQTGx;u.Cp,dkHN@hp(W&XHxaXDn{qvKr})yRN[vL!Upuh}A$jtA;(zVn_C#,E]+ZB.p=v5dYXZf]pSgYbVqguAX5},gh4%,KUg+Qa:H*@]bT/)rJW[ZCWFQJj9k]$N=vTbC8+HX/FX!N97atJ79K-qhzFrF5PB(ALV44[u+aX)qi!(C%X+29c4{96my2;$J+bunSHAq3Bk9-%$VQTCWfE9AD([PdY{7f-d%E7rvhBeRd92(g(mXa#F#yfmq$ihrdg=X@x&V+4]vFcR$*3(uy!U;!pwH:ijzck.kjg=Tn#cd!)id])dxKN9&7eq_GtA8/UJi_YnMF8Ju_Y;_PF{-z#qHq$?(mJLmr%J#NyqjW:}[d,_/e]UDE",
      545481,
      45454,
      [new Question("dfsf","fdsdf", 545)],
       true
    );

    this.coms = [comp, comp, comp, comp, comp, comp, comp, comp, comp];
    console.log(this.coms[0].questions);

    this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;
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

  showCreateDialog(show : boolean){
    let createDialog = document.getElementsByTagName("create-dialog")[0] as HTMLDivElement
    if(show){
      createDialog.style.display = "block"
    }else{
      createDialog.style.display = "none"
    }
  }


}
