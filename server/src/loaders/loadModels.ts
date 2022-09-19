import Container from "typedi"
import { Competitions } from "../database/models/Competitions"
import { Questions } from "../database/models/Questions"
import { Results } from "../database/models/Results"
import { User } from "../database/models/User"

export default ()=>{
    Container.set(Questions, new Questions()),
    Container.set(Competitions, new Competitions()),
    Container.set(Results, new Results()),
    Container.set(User, new User())
}