import { Format } from './Connection';

export class Column {

	public name: string;
	public tableOid: number;
	public index: number;
	public typeOid: number;
	public columnLength: number;
	public typeModifier: number;
	public format: Format;

	public constructor(name: string, tableOid: number, index: number, typeOid: number, columnLength: number, typeModifier: number, format: Format) {
		this.name = name;
		this.tableOid = tableOid;
		this.index = index;
		this.typeOid = typeOid;
		this.columnLength = columnLength;
		this.typeModifier = typeModifier;
		this.format = format;
	}

}
