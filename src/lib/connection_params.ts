import { parseDsn } from './utils';

const DEFAULT_CONNECTION_PARAMS = {
	host: '127.0.0.1',
	port: '5432',
	application_name: 'skyra_postgres'
};

function getPgEnv(): IConnectionParams {
	const { PGDATABASE, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGAPPNAME } = process.env;
	return {
		database: PGDATABASE,
		host: PGHOST,
		port: PGPORT,
		user: PGUSER,
		password: PGPASSWORD,
		application_name: PGAPPNAME
	};
}

function selectFrom(sources: Array<IConnectionParams>,
	key: keyof IConnectionParams): string | undefined {
	for (const source of sources) {
		if (source[key]) return source[key];
	}

	return undefined;
}

function selectFromWithDefault(sources: Array<IConnectionParams>, key: keyof typeof DEFAULT_CONNECTION_PARAMS): string {
	return selectFrom(sources, key) || DEFAULT_CONNECTION_PARAMS[key];
}

export interface IConnectionParams {
	database?: string;
	host?: string;
	port?: string;
	user?: string;
	password?: string;
	application_name?: string;
}

class ConnectionParamsError extends Error {

	public name = 'ConnectionParamsError';

}

export class ConnectionParams {

	public database!: string;
	public host: string;
	public port: string;
	public user!: string;
	public password?: string;
	public application_name: string;
	// TODO: support other params

	public constructor(config: string | IConnectionParams = {}) {
		const pgEnv = getPgEnv();

		if (typeof config === 'string') {
			const dsn = parseDsn(config);
			if (dsn.driver !== 'postgres') throw new Error(`Supplied DSN has invalid driver: ${dsn.driver}.`);

			config = dsn;
		}

		const potentiallyNull: { [K in keyof IConnectionParams]?: string } = {
			database: selectFrom([config, pgEnv], 'database'),
			user: selectFrom([config, pgEnv], 'user')
		};

		this.host = selectFromWithDefault([config, pgEnv], 'host');
		this.port = selectFromWithDefault([config, pgEnv], 'port');
		this.application_name = selectFromWithDefault(
			[config, pgEnv],
			'application_name'
		);
		this.password = selectFrom([config, pgEnv], 'password');

		const missingParams: string[] = [];

		(['database', 'user'] as Array<keyof IConnectionParams>).forEach(param => {
			if (potentiallyNull[param]) {
				this[param] = potentiallyNull[param]!;
			} else {
				missingParams.push(param);
			}
		});

		if (missingParams.length) {
			throw new ConnectionParamsError(
				`Missing connection parameters: ${missingParams.join(', ')}. Connection parameters can be read 
        from environment only if Deno is run with env permission (deno run --allow-env)`
			);
		}
	}

}
