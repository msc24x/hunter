
export class Sanitizer{

    static checkIf = {
        ifInteger : ()=>{

        }
    }
    
    static integer(val : string | number, negative = true) {
        let newVal : number
        
        if(typeof val == 'string')
            newVal = parseFloat(val)
        else
            newVal = val

        newVal = Math.floor(newVal)

        if(!negative && newVal < 0)
            newVal = 0

        return newVal
    }

    static isEmail(val : string){
        if(val.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)?.length != 0){
            return true
        }
        else
            return false
    }

    static rmEAlphabet(val :string){
        return val.replace(/[^a-z]/, '')
    }
    
}