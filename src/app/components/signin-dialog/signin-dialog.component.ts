import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { resCode, UserInfo } from 'src/environments/environment';

@Component({
  selector: 'signin-dialog',
  templateUrl: './signin-dialog.component.html',
  styleUrls: ['./signin-dialog.component.scss']
})
export class SigninDialogComponent implements OnInit {

  registerResponseMessage : string = "";

  constructor(private authService : AuthService, private router : Router) { }

  ngOnInit(): void {
  }

  redirectToGitHubOAuth(){
    window.open("https://thehunter.tech/api/oauth/github")
  }

  sendRegisterReq(){

    this.registerResponseMessage = ""

    const name = (document.getElementsByClassName("textbox")[0] as HTMLInputElement).value ?? "";
    const email = (document.getElementsByClassName("textbox")[1] as HTMLInputElement).value;
    const password = (document.getElementsByClassName("textbox")[2] as HTMLInputElement).value;

    if(!this.isEmail(email)){
      this.registerResponseMessage = "*Email not valid"
      return
    }

    if(name.length > 50){
      this.registerResponseMessage = "*Name should be less than 50 Chars"
      return
    }

    if(password.length < 6 || password.length > 26){
      this.registerResponseMessage = "*Password should be of length 6-26 chars"
      return
    }


    this.toggleSubmitButton(false);

    this.authService.register({name : name, email : email, password : password}).subscribe({
      next : (res)=>{
              this.toggleSubmitButton(true)
              this.registerResponseMessage = res.statusText
              this.router.navigate(['/home'])
            },
      error : err=>{
              this.toggleSubmitButton(true)
              this.registerResponseMessage = err.error
            }
    })
  }


  private isEmail(email:string){
    if(email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
      return true;
    }
    else{
      return false;
    }
  }


  private handleResponse(res : HttpResponse<Object>){
    this.toggleSubmitButton(true);

    switch (res.status) {
      case resCode.serverErrror:
        this.registerResponseMessage = "*Server side exception, please try again later";
        break;
      case resCode.forbidden:
        this.registerResponseMessage = "*Invlid credentials";
        break;
      case 404:
        this.registerResponseMessage = "*Account does not exists";
        break;
      case 201:
        this.registerResponseMessage = "*Registered successfully"
        break;
      case 202:
        const body = res.body as UserInfo
        this.authService.user = {id : body.id, email : body.email, name : body.name}
        this.authService.isAuthenticated.next(true)
        this.router.navigate(["/home"])
        break;
      default:
        this.registerResponseMessage = "*Unknown error occurred"
        break;
    }
  }

  private toggleSubmitButton(enable : boolean){
    (document.getElementById("register_btn") as HTMLButtonElement).disabled = !enable;
  }



}
