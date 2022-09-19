import Container from "typedi";
import { Competitions } from "../database/models/Competitions";
import { Questions } from "../database/models/Questions";
import { Results } from "../database/models/Results";
import { User } from "../database/models/User";
import loadModels from "../loaders/loadModels";

loadModels()

export default {
    questions : Container.get(Questions),
    competitions : Container.get(Competitions),
    results : Container.get(Results),
    users : Container.get(User)
}