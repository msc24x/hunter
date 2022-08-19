import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {

  @Output()
  closeEvent = new EventEmitter<string>()

  @Input()
  title = "Message"

  @Input()
  destructive = false

  @Input()
  showControls = true

  constructor() { }

  bgClicked(event : any){
    if(event.target.id == 'bg')
      this.closeEvent.emit("cancel")
  }

  ngOnInit(): void {

    if(this.destructive){
      let dialog = document.getElementById('dialog') as HTMLElement
      
      dialog = document.getElementById('title') as HTMLElement
      dialog.style.color = "darkred"

    }
  }

}
