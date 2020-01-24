import { RowDescription } from './connection';
import { encode, EncodedArg } from './encode';
import { decode } from './decode';

export interface QueryConfig {
	text: string;
	args?: Array<unknown>;
	name?: string;
	encoder?: (arg: unknown) => EncodedArg;
}

export class QueryResult {

	public rows: any[] = []; // actual results
	public rowDescription!: RowDescription;
	private _done = false;

	public constructor(public query: Query) {}

	public handleRowDescription(description: RowDescription) {
		this.rowDescription = description;
	}

	public handleDataRow(dataRow: any[]): void {
		if (this._done) {
			throw new Error('New data row, after result if done.');
		}

		const parsedRow = this._parseDataRow(dataRow);
		this.rows.push(parsedRow);
	}

	public rowsOfObjects() {
		return this.rows.map((row, index) => {
			const rv: { [key: string]: any } = {};
			this.rowDescription.columns.forEach(column => {
				rv[column.name] = row[index];
			});

			return rv;
		});
	}

	public done() {
		this._done = true;
	}

	private _parseDataRow(dataRow: any[]): any[] {
		const parsedRow = [];

		for (let i = 0, len = dataRow.length; i < len; i++) {
			const column = this.rowDescription.columns[i];
			const rawValue = dataRow[i];

			if (rawValue === null) {
				parsedRow.push(null);
			} else {
				parsedRow.push(decode(rawValue, column));
			}
		}

		return parsedRow;
	}

}

export class Query {

	public text: string;
	public args: EncodedArg[];
	public result: QueryResult;

	// TODO: can we use more specific type for args?
	public constructor(text: string | QueryConfig, ...args: unknown[]) {
		const config: QueryConfig = typeof text === 'string' ? { text, args } : text;

		this.text = config.text;
		this.args = this._prepareArgs(config);
		this.result = new QueryResult(this);
	}

	private _prepareArgs(config: QueryConfig): EncodedArg[] {
		const encodingFn = config.encoder ? config.encoder : encode;
		return config.args!.map(encodingFn);
	}

}
