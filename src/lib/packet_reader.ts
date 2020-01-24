import { readInt16BE, readInt32BE } from './utils';
import { TextDecoder } from 'util';

export class PacketReader {

	private offset = 0;
	private decoder: TextDecoder = new TextDecoder();

	public constructor(private buffer: Uint8Array) {}

	public readInt16(): number {
		const value = readInt16BE(this.buffer, this.offset);
		this.offset += 2;
		return value;
	}

	public readInt32(): number {
		const value = readInt32BE(this.buffer, this.offset);
		this.offset += 4;
		return value;
	}

	public readByte(): number {
		return this.readBytes(1)[0];
	}

	public readBytes(length: number): Uint8Array {
		const start = this.offset;
		const end = start + length;
		const slice = this.buffer.slice(start, end);
		this.offset = end;
		return slice;
	}

	public readString(length: number): string {
		const bytes = this.readBytes(length);
		return this.decoder.decode(bytes);
	}

	public readCString(): string {
		const start = this.offset;
		// find next null byte
		const end = this.buffer.indexOf(0, start);
		const slice = this.buffer.slice(start, end);
		// add +1 for null byte
		this.offset = end + 1;
		return this.decoder.decode(slice);
	}

}
