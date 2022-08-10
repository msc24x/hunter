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

  constructor() { }

  bgClicked(event : any){
    if(event.target.id == 'bg')
      this.closeEvent.emit("cancel")
  }

  ngOnInit(): void {
  }

}
