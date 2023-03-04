import Container, { Service } from 'typedi';
import mysql, { Connection } from 'mysql';
import { Questions } from '../database/models/Questions';
import config from '../config/config';
import { Competitions } from '../database/models/Competitions';
import { Results } from '../database/models/Results';
import { User } from '../database/models/User';

@Service({ global: true })
export class DatabaseProvider {
	private _dbConnection: Connection;
	private _connectionConfig = config.dbConnectionConfig;

	public models = [Questions, Competitions, Results, User];
	public loaded = false;

	constructor() {
		this._dbConnection = mysql.createConnection(this._connectionConfig);
		this._dbConnection.connect((err) => {
			if (err) {
				console.log(err);
				return;
			}
			console.log(
				`Connection to database '${this._connectionConfig.database}' : Initialized`
			);
		});
	}

	loadModels() {
		console.log('Loading registered models...');
		for (let model of this.models) {
			Container.set(model, new model());
			console.log(`  > ${model['name']} : Initialized`);
		}
		this.loaded = true;
	}

	getInstance() {
		return this._dbConnection;
	}
}