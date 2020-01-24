import { Connection } from './connection';
import { Query, QueryConfig, QueryResult } from './query';
import { ConnectionParams, IConnectionParams } from './connection_params';

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
	public query(text: string | QueryConfig, ...args: any[]): Promise<QueryResult> {
		const query = new Query(text, ...args);
		return this._connection.query(query);
	}

	public end() {
		return this._connection.end();
	}

}

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
