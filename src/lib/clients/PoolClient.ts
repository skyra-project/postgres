import { Connection } from '../connection/Connection';
import { QueryConfig, Query } from '../queries/Query';
import { QueryResult } from '../queries/QueryResult';

export class PoolClient {

	protected _connection: Connection;
	private _releaseCallback: () => void;

	public constructor(connection: Connection, releaseCallback: () => void) {
		this._connection = connection;
		this._releaseCallback = releaseCallback;
	}

	public query(text: string | QueryConfig, ...args: any[]): Promise<QueryResult> {
		const query = new Query(text, ...args);
		return this._connection.query(query);
	}

	public release(): void {
		return this._releaseCallback();
	}

}
