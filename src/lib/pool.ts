import { PoolClient } from './client';
import { Connection } from './connection';
import { ConnectionParams, IConnectionParams } from './connection_params';
import { Query, QueryConfig, QueryResult } from './query';
import { DeferredStack } from './deferred';

export class Pool {

	private _connectionParams: ConnectionParams;
	private _connections!: Array<Connection>;
	private _availableConnections!: DeferredStack<Connection>;
	private _maxSize: number;
	private _ready: Promise<void>;
	private _lazy: boolean;

	public constructor(connectionParams: IConnectionParams, maxSize: number, lazy?: boolean) {
		this._connectionParams = new ConnectionParams(connectionParams);
		this._maxSize = maxSize;
		this._lazy = Boolean(lazy);
		this._ready = this._startup();
	}

	public async connect(): Promise<PoolClient> {
		await this._ready;
		const connection = await this._availableConnections.pop();
		const release = () => this._availableConnections.push(connection);
		return new PoolClient(connection, release);
	}

	// TODO: can we use more specific type for args?
	public async query(text: string | QueryConfig, ...args: any[]): Promise<QueryResult> {
		const query = new Query(text, ...args);
		return this._execute(query);
	}

	public async end(): Promise<void> {
		await this._ready;
		const ending = this._connections.map(c => c.end());
		await Promise.all(ending);
	}

	/** pool max size */
	public get maxSize(): number {
		return this._maxSize;
	}

	/** number of connections created */
	public get size(): number {
		return this._availableConnections.size;
	}

	/** number of available connections */
	public get available(): number {
		return this._availableConnections.available;
	}

	private async _startup(): Promise<void> {
		const initSize = this._lazy ? 1 : this._maxSize;
		const connecting = [...Array(initSize)].map(this._createConnection.bind(this));
		this._connections = await Promise.all(connecting);
		this._availableConnections = new DeferredStack(this._maxSize, this._connections, this._createConnection.bind(this));
	}

	private async _execute(query: Query): Promise<QueryResult> {
		await this._ready;
		const connection = await this._availableConnections.pop();
		try {
			const result = await connection.query(query);
			return result;
		} catch (error) {
			throw error;
		} finally {
			this._availableConnections.push(connection);
		}
	}

	private async _createConnection(): Promise<Connection> {
		const connection = new Connection(this._connectionParams);
		await connection.startup();
		await connection.initSQL();
		return connection;
	}

}
