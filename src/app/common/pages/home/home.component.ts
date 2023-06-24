import { Component, OnInit } from '@angular/core';
import { UserInfo, environment } from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isAuthenticated : boolean = false
  prod : boolean = environment.production
  user = {
    id : "",
    email : "",
    name : ""
  }

  constructor(private authService : AuthService) {
    this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;
    })
  }

  getStarted() {
    if (this.prod) {
      this.redirectToGitHubOAuth()
    }
    else {
      this.scrollToBottom()
    }
  }

  scrollToBottom(){
    let elem = document.getElementById("login_tag");
    elem?.scrollIntoView();
  }

  redirectToGitHubOAuth(){
    window.open("https://hunter.cambo.in/api/oauth/github")
  }

  animateInView() {
    let targets = document.getElementsByClassName("inview_slide")

    for (let target of targets) {
      const observer = new IntersectionObserver(entries => {
        target.classList.toggle( 'inview_slide__active', entries[0].isIntersecting );
      });
      observer.observe(target)
    }

  }

  ngOnInit(): void {
    this.animateInView()

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


}
