import { Connection, QueryError } from 'mysql2';
import { QuestionInfo } from '../../config/types';
import { Competitions } from './Competitions';
import Container, { Inject, Service } from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';

export class Questions {
	dbConnection;
	dbService: DatabaseProvider = Container.get(DatabaseProvider);

	constructor() {
		this.dbConnection = this.dbService.getInstance();
	}

	delete(params: any, callback: (err: QueryError | null) => void) {
		let args = [];
		let query = 'delete from questions where ';

		if (params.id) {
			query += ' id = ?;';
			args.push(params.id);
		} else if (params.competition_id) {
			query += ' competition_id = ?;';
			args.push(params.competition_id);
		} else {
			callback(null);
			return;
		}

		this.dbConnection.query(query, args, (err) => {
			callback(err);
		});
	}

	findAll(params: any, callback: (questions: Array<QuestionInfo>) => void) {
		let query = 'select * from questions where true = true ';
		let args = [];

		if (params.competition_id != null) {
			query += `and competition_id = ? `;
			args.push(params.competition_id);
		} else if (params.id != null) {
			query += `and id = ? `;
			args.push(params.id);
		}
		query += ';';

		this.dbConnection.query(query, args, (err, rows) => {
			if (err) {
				console.log(err);
				return;
			}

			let questions = rows as Array<QuestionInfo>;

			callback(questions);
		});
	}

	add(
		competition_id: string,
		callback: (question_id: string) => void,
		errCallback: (err: QueryError | null) => void
	) {
		this.dbConnection.query(
			` insert into questions (competition_id, date_created) values(?, NOW()) ; `,
			[competition_id],
			(err) => {
				if (err) {
					errCallback(err);
					return;
				}
				this.dbConnection.query(
					` select * from questions where competition_id = ? order by date_created ;`,
					[competition_id],
					(err, rows) => {
						var questions = rows as Array<QuestionInfo>;

						if (err || questions.length == 0) {
							errCallback(err);
							return;
						}

						callback(questions[0].id);
					}
				);
			}
		);
	}

	update(newQuestion: any, callback: (err: QueryError | null) => void) {
		let args = [
			newQuestion.title,
			newQuestion.statement,
			newQuestion.sample_cases,
			newQuestion.sample_sols,
		];

		let query = `update questions set title = ?, statement = ?, sample_cases = ?, sample_sols = ?`;

		if (newQuestion.points) {
			query += `, points = ?`;
			args.push(newQuestion.points);
		}

		query += ` where id = ? ; `;
		args.push(newQuestion.id);

		this.dbConnection.query(query, args, (err) => {
			callback(err);
		});
	}
}
