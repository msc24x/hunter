import Container, { Service } from 'typedi';
import { Competitions } from '../database/models/Competitions';
import { Results } from '../database/models/Results';
import { PrismaClient } from '@prisma/client';

@Service({ global: true })
export class DatabaseProvider {
    public models = [Competitions, Results];
    public loaded = false;

    private prismaClient: PrismaClient;

    constructor() {
        this.prismaClient = new PrismaClient();

        this.prismaClient.$connect().then(
            () => {
                console.log(`Prisma connection to database: Initialized`);
            },
            (err) => {
                console.error(err);
            },
        );
    }

    loadModels() {
        console.log('Loading registered models...');
        for (let model of this.models) {
            Container.set(model, new model());
            console.log(`  > ${model['name']} : Initialized`);
        }
        this.loaded = true;
    }

    public client() {
        return this.prismaClient;
    }
}
