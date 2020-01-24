import { PacketReader } from '../packets/PacketReader';

export class Message {

	public type: string;
	public byteCount: number;
	public body: Uint8Array;
	public reader: PacketReader;

	public constructor(type: string, byteCount: number, body: Uint8Array) {
		this.type = type;
		this.byteCount = byteCount;
		this.body = body;
		this.reader = new PacketReader(body);
	}

}
