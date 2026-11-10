import Container from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';
import { Competitions } from '../models/Competitions';
import { Results } from '../models/Results';

Container.get(DatabaseProvider).loadModels();

export default {
    competitions: Container.get(Competitions),
    results: Container.get(Results),
};
