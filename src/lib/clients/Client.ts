import { Connection } from '../connection/Connection';
import { IConnectionParams, ConnectionParams } from '../connection/ConnectionParameters';
import { QueryConfig, Query } from '../queries/Query';
import { QueryResult } from '../queries/QueryResult';

export class Client {

	protected _connection: Connection;

	public constructor(config?: IConnectionParams | string) {
		const connectionParams = new ConnectionParams(config);
		this._connection = new Connection(connectionParams);
	}

	public async connect(): Promise<void> {
		await this._connection.startup();
		await this._connection.initSQL();
	}

	// TODO: can we use more specific type for args?
	public query(text: string | QueryConfig, ...args: readonly unknown[]): Promise<QueryResult> {
		const query = new Query(text, ...args);
		return this._connection.query(query);
	}

	public end() {
		return this._connection.end();
	}

}
