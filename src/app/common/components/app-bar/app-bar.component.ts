import { Component, Input, OnInit } from '@angular/core';
import { UserInfo } from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-bar',
  templateUrl: './app-bar.component.html',
  styleUrls: ['./app-bar.component.scss']
})
export class AppBarComponent implements OnInit {

  loading = false

  @Input()
  app_title = "Hunter"
  @Input()
  app_title_s = "H_"

  isAuthenticated : boolean = false
  user : UserInfo = {
    id : "",
    email : "",
    name : ""
  }

  @Input()
  showRegisterBtn : boolean = true

  constructor(private authService : AuthService) {
    authService.isAuthenticated.subscribe(val=>{
      this.user = this.authService.user
      this.isAuthenticated = val
    })
  }

  ngOnInit(): void {
    const navBar = document.getElementById("navBarCompact") as HTMLElement;
    navBar.style.display = "none"
  }

  toggleNavBar(){
    const navBar = document.getElementById("navBarCompact") as HTMLElement;
    if(navBar.style.display == "none"){
      navBar.style.display = "initial"
    }else{
      navBar.style.display = "none"
    }
  }

  redirectToGitHubOAuth(){
    window.open("https://hunter.cambo.in/api/oauth/github")
  }

  sendLogoutRequest(){
    this.loading = true
    this.authService.logout().subscribe(res=>{

      this.authService.user = {
        id : "",
        email : "",
        name : ""
      }
      this.authService.isAuthenticated.next(false)
      this.loading = false
    })
  }

}
