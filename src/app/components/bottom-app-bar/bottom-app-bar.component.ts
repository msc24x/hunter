import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'bottom-app-bar',
  templateUrl: './bottom-app-bar.component.html',
  styleUrls: ['./bottom-app-bar.component.scss']
})
export class BottomAppBarComponent implements OnInit {

  version = environment.version

  constructor() { }

  ngOnInit(): void {
  }

  showPopup(f : boolean, id : string){
    let guide = document.getElementById(id) as HTMLElement
    if(f){
      guide.style.display = 'block'
      window.scrollTo(0,0)
    }
    else
      guide.style.display = 'none'
  }

  openGithub(){
    window.open('https://github.com/msc24x/hunter', "_blank")
  }

}
