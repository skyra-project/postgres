import { encode, EncodedArg } from '../utils/Encoder';
import { QueryResult } from './QueryResult';

export interface QueryConfig {
	text: string;
	args?: readonly unknown[];
	name?: string;
	encoder?: (arg: unknown) => EncodedArg;
}

export class Query {

	/**
	 * The raw SQL query to execute.
	 */
	public text: string;

	/**
	 * The encoded sanitized arguments to be injected into the SQL query.
	 */
	public args: EncodedArg[];

	/**
	 * The query's result.
	 */
	public result: QueryResult;

	// TODO: can we use more specific type for args?
	public constructor(text: string | QueryConfig, ...args: readonly unknown[]) {
		const config: QueryConfig = typeof text === 'string' ? { text, args } : text;

		this.text = config.text;
		this.args = config.args!.map(config.encoder || encode);
		this.result = new QueryResult(this);
	}

}
