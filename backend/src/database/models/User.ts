import mysql, { PoolConnection, QueryError } from 'mysql2';
import { UserInfo } from '../../config/types';
import Container, { Inject, Service } from 'typedi';
import { DatabaseProvider } from '../../services/databaseProvider';

export class User {
    dbConnection!: PoolConnection;

    dbService: DatabaseProvider = Container.get(DatabaseProvider);

    constructor() {
        this.dbService.getInstance().then((conn) => {
            this.dbConnection = conn;
        });
    }

    add(params: any, callback: (err: QueryError | null) => void) {
        let query =
            'insert into users(email, name, password_hash, salt) values (?, ?, ?, ?);';
        let args = [params.email, '', '', ''];

        if (params.name) {
            args[1] = params.name;
        }

        if (params.password_hash) {
            args[2] = params.password_hash;
        }

        if (params.salt) {
            args[3] = params.salt;
        }

        this.dbConnection.query(query, args, (err) => {
            callback(err);
        });
    }

    delete(params: any, callback: (err: QueryError | null) => void) {
        let args = [];
        let query = 'delete from users where ';

        if (params.id) {
            query += ' id = ?;';
            args.push(params.id);
        } else if (params.email) {
            query += ' email = ?;';
            args.push(params.email);
        } else {
            callback(null);
            return;
        }

        this.dbConnection.query(query, args, (err) => {
            callback(err);
        });
    }

    update(
        newUserInfo: UserInfo,
        callback: (err: mysql.QueryError | null) => void
    ) {
        this.dbConnection.query(
            ` update users set name = ? where id = ? ; `,
            [newUserInfo.name, newUserInfo.id],
            (err) => {
                callback(err);
            }
        );
    }

    findAll(
        params: any,
        callback: (err: QueryError | null, rows: any) => void
    ) {
        let query = 'select id, email, name from users where true';
        let args = [];

        if (params.id) {
            query += ` and users.id = ?`;
            args.push(params.id);
        }
        if (params.email) {
            query += ` and users.email = ?`;
            args.push(params.email);
        }
        if (params.name) {
            query += ` and user.name = ?`;
            args.push(params.name);
        }
        query += ';';

        this.dbConnection.query(query, args, (err, rows) => {
            callback(err, rows);
        });
    }

    count(callback: (err: QueryError | null, rows: any) => void) {
        this.dbConnection.query(
            ' select count(*) as count from users;',
            (err, rows) => {
                if (err) {
                    console.log(err);
                    callback(err, null);
                    return;
                }

                callback(null, rows);
            }
        );
    }
}
