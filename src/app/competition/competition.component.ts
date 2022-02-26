import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivationEnd } from '@angular/router';
import * as ace from 'ace-builds';
@Component({
  selector: 'competition',
  templateUrl: './competition.component.html',
  styleUrls: ['./competition.component.scss']
})
export class CompetitionComponent implements OnInit {

  c_id : string = "";
  editor!: ace.Ace.Editor;

  constructor(private route : ActivatedRoute) {
    const idParam = route.snapshot.paramMap.get("competition_id");
    if(idParam){
      this.c_id = idParam;
    }

  }


  ngOnInit(): void {
    this.initEditor()
  }


  initEditor(){
    this.editor = ace.edit("editor")
    ace.config.set("basePath", "https://unpkg.com/ace-builds@1.4.12/src-noconflict")
    /**
     * twilight
     * monokai
     * terminal
     */
    this.editor.setTheme("ace/theme/twilight")
    this.editor.session.setMode("ace/mode/python")
  }

}
