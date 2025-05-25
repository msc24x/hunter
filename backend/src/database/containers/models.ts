import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Competitions } from '../models/Competitions';
import { Results } from '../models/Results';
import { User } from '../models/User';
import { Questions } from '../models/Questions';

Container.get(DatabaseProvider).loadModels();

export default {
    questions: Container.get(Questions),
    competitions: Container.get(Competitions),
    results: Container.get(Results),
    users: Container.get(User),
};
