import { Query } from './Query';
import { decode } from '../utils/Decoder';
import { RowDescription } from '../connection/RowDescription';

export class QueryResult {

	public query: Query;
	public rows: unknown[] = []; // actual results
	public rowDescription!: RowDescription;
	private _done = false;

	public constructor(query: Query) {
		this.query = query;
	}

	public handleRowDescription(description: RowDescription) {
		this.rowDescription = description;
	}

	public handleDataRow(dataRow: readonly Uint8Array[]): void {
		if (this._done) {
			throw new Error('New data row, after result if done.');
		}

		const parsedRow = this._parseDataRow(dataRow);
		this.rows.push(parsedRow);
	}

	public rowsOfObjects() {
		return this.rows.map((row, index) => {
			const rv: Record<string, unknown> = {};
			for (const column of this.rowDescription.columns) {
				rv[column.name] = (row as Record<number, unknown>)[index];
			}

			return rv;
		});
	}

	public done() {
		this._done = true;
	}

	private _parseDataRow(dataRow: readonly Uint8Array[]): unknown[] {
		const parsedRow = [];

		const { length } = dataRow;
		for (let i = 0; i < length; ++i) {
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
