import { Component, OnInit } from '@angular/core';
import { showPopup } from 'src/app/utils/utils';

@Component({
  selector: 'bottom-app-bar',
  templateUrl: './bottom-app-bar.component.html',
  styleUrls: ['./bottom-app-bar.component.scss']
})
export class BottomAppBarComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  showPrivacyPolicy(f : boolean){
    showPopup(f, "privacy_policy")
  }

  openGithub(){
    window.open('https://github.com/msc24x/hunter', "_blank")
  }

}
