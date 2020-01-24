import { Column } from './Column';

export class RowDescription {

	public columnCount: number;
	public columns: Column[];

	public constructor(columnCount: number, columns: Column[]) {
		this.columnCount = columnCount;
		this.columns = columns;
	}

}
