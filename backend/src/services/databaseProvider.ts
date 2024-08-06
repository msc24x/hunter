import Container, { Service } from 'typedi';
import mysql, { Connection } from 'mysql2';
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
		this._dbConnection = mysql.createConnection({
			host: this._connectionConfig.host,
			user: this._connectionConfig.user,
			password: this._connectionConfig.password,
			database: this._connectionConfig.database,
			ssl: {
				rejectUnauthorized : false
			}
		});
		
		this._dbConnection.connect((err) => {
			if (err) {
				throw err;
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
