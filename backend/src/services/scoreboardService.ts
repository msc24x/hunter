import { Service } from 'typedi';
import models from '../database/containers/models';
import { User } from '../database/models/User';
import { HunterExecutable, UserInfo } from '../config/types';

@Service()
export class ScoreboardService {
	async updateResult(
		user: UserInfo,
		hunterExecutable: HunterExecutable,
		accepted: boolean,
		points: number
	) {
		models.results.findAll(
			{
				user_id: user.id,
				question_id: hunterExecutable.for.question_id,
				competition_id: hunterExecutable.for.competition_id,
			},

			(rows, err) => {
				if (err) {
					console.log(err);
					return;
				}

				let pts = accepted ? points : 0;

				if (rows.length == 0) {
					models.results.post(
						{
							user_id: user.id,
							question_id: hunterExecutable.for.question_id,
							competition_id: hunterExecutable.for.competition_id,
							result: pts,
						},
						(err) => {
							if (err) {
								console.log(err);
								return;
							}
						}
					);
				} else {
					if (rows[0].result == '0') {
						models.results.update(rows[0].id, pts + '', (err) => {
							if (err) {
								console.log(err);
								return;
							}
						});
					}
				}
			}
		);
	}
}
