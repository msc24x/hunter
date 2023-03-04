
// dotenv.config({
// 	path: `.env/.env.${process.env.ENV}`,
// });

export default {
	env: process.env.ENV,
	port: process.env.DB_PORT,
	dbConnectionConfig: {
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	},
};
