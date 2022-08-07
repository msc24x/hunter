import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CompetitionsDataService } from 'src/app/services/data/competitions-data.service';
import { CompetitionInfo, QuestionInfo, resCode } from 'src/environments/environment';

@Component({
  selector: 'questions-list',
  templateUrl: './questions-list.component.html',
  styleUrls: ['./questions-list.component.scss']
})
export class QuestionsListComponent implements OnInit {

  constructor(
    private competitionsData : CompetitionsDataService
  ) { }

  @Input()
  editable = true

  @Input()
  questionsList : Array<QuestionInfo> = []

  @Input()
  competitionInfo = {}  as CompetitionInfo

  @Output()
  messageEmitter = new EventEmitter()

  @Output()
  questionSelectEmitter = new EventEmitter()

  @Output()
  saveClicked = new EventEmitter()

  @Output()
  fetchRequired = new EventEmitter()

  questionSelected = -1

  ngOnInit(): void {
  }


  selectedQuestionElement() : HTMLLIElement | null {
    if(this.questionSelected == -1)
      return null
    let prevTarget = document.getElementById("questions_list")?.getElementsByTagName("li")[this.questionSelected]
    if(prevTarget){
      return prevTarget
    }
    else
      return null
  }


  selectQuestion({target} : any){

    if(this.questionSelected != -1){
      let prevTarget = this.selectedQuestionElement()
      if(prevTarget){

        prevTarget.style.background = "#d3d3d3"
        prevTarget.style.color = "black"

      }
    }

    if(target == null){
      this.questionSelected = -1
      this.questionSelectEmitter.emit(this.questionSelected)
      return
    }

    let index = (target.innerHTML as string).substring(1);

    this.questionSelected = index as unknown as number

    target.style.background = "black"
    target.style.color = "whitesmoke"

    this.displayLog("Question "+this.questionSelected+ " selected")
    this.questionSelectEmitter.emit(this.questionSelected)
  }

  resetQuestionSelected(){
    this.selectQuestion({target : null})
  }

  delQuestion(){
    if(this.questionSelected != -1)
      this.competitionsData.deleteQuestion(this.questionsList[this.questionSelected].id).subscribe(res =>{
        this.displayLog("Question "+ this.questionSelected+ " deleted")
        this.resetQuestionSelected()
        this.fetchRequired.emit()

      })
  }

  addQuestion(){
    this.competitionsData.postQuestion(this.competitionInfo.id).subscribe(res=>{
      this.resetQuestionSelected()
      this.fetchRequired.emit()
      this.displayLog("New question inserted and saved")
    })
  }

  // fetchQuestions(){
  //   this.competitionsData.getQuestions({competition_id : this.competitionInfo.id as string}).subscribe(res=>{
  //     if(res.status == resCode.success){
  //       if(res.body)
  //         this.questionsList = res.body
  //         this.questionSelected = -1
  //         this.questionSelectEmitter.emit(-1)
  //     }
  //   })
  // }

  displayLog(msg : string){
    this.messageEmitter.emit(msg)
  }

}
