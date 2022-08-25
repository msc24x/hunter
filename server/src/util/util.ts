import { CompetitionInfo, HunterExecutable, UserInfo } from "../environments/environment";
import Mailgun from "mailgun-js";


export class Util {

    
    static sendEmail(userInfo : UserInfo){
        const DOMAIN = 'sandbox511079e5185343208301c8c7d6c486fd.mailgun.org';

        const mg = Mailgun({apiKey: "1fe01efb475905bebf66ecb790ffd085-c76388c3-624a0a92", domain: DOMAIN});
        const data = {
            from: 'Hunter <creator@hunter.tech>',
            to: userInfo.email,
            subject: 'Email verification',
            text: `Hi, ${userInfo.name}! Thank you for joining us at Hunter. \n\n Here is the verification code - <testing>.\n\nIf it was not you who requested this code, kindly ignore this email.\n Thank you!`
        };

        mg.messages().send(data, function (error, body) {
            if(error){
                console.log(error)
                return
            }
            console.log(body);
        });
    }

    static sendResponse(res : any , code : number ,msg : string = "") {

        res.status(code).send(msg);
    }
    
    static sendResponseJson(res : any , code : number , body : {
        id : string,
        email : string,
        name : string,
        msg? : string
    } |
    {
        id : string,
        title : string
    } | CompetitionInfo | Array<CompetitionInfo> | any) {
        res.status(code).send(body);
    }
  
    
    static isValidExecRequest(exec : HunterExecutable) : boolean{

        const langs = ["c", "cpp", "py", "js"]
    
        try {
        if(
            exec.for.competition_id &&
            exec.for.question_id &&
            exec.solution.code &&
            langs.includes(exec.solution.lang)
        ) return true
    
        } catch (error) {
        return false
        }
    
        return false;
    }
    
    static getFileName(hunterExecutable : HunterExecutable){
        return `${hunterExecutable.for.competition_id}_${hunterExecutable.for.question_id}`
    }
}