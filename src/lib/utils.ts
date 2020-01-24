import { TextEncoder } from 'util';
import { createHash } from 'crypto';
import { URL } from 'url';

export function readInt16BE(buffer: Uint8Array, offset: number): number {
	offset >>>= 0;
	const val = buffer[offset + 1] | (buffer[offset] << 8);
	return val & 0x8000 ? val | 0xffff0000 : val;
}

export function readUInt16BE(buffer: Uint8Array, offset: number): number {
	offset >>>= 0;
	return buffer[offset] | (buffer[offset + 1] << 8);
}

export function readInt32BE(buffer: Uint8Array, offset: number): number {
	offset >>>= 0;

	return (
		(buffer[offset] << 24)
    | (buffer[offset + 1] << 16)
    | (buffer[offset + 2] << 8)
    | buffer[offset + 3]
	);
}

export function readUInt32BE(buffer: Uint8Array, offset: number): number {
	offset >>>= 0;

	return ((buffer[offset] * 0x1000000) +
    ((buffer[offset + 1] << 16)
      | (buffer[offset + 2] << 8)
      | buffer[offset + 3])
	);
}

const encoder = new TextEncoder();

function md5(bytes: Uint8Array): string {
	return createHash('md5').update(bytes).digest('hex');
}

// https://www.postgresql.org/docs/current/protocol-flow.html
// AuthenticationMD5Password
// The actual PasswordMessage can be computed in SQL as:
//  concat('md5', md5(concat(md5(concat(password, username)), random-salt))).
// (Keep in mind the md5() function returns its result as a hex string.)
export function hashMd5Password(
	username: string,
	password: string,
	salt: Uint8Array
): string {
	const innerHash = md5(encoder.encode(password + username));
	const innerBytes = encoder.encode(innerHash);
	const outerBuffer = new Uint8Array(innerBytes.length + salt.length);
	outerBuffer.set(innerBytes);
	outerBuffer.set(salt, innerBytes.length);
	const outerHash = md5(outerBuffer);
	return `md5${outerHash}`;
}

export interface DsnResult {
	driver: string;
	user: string;
	password: string;
	host: string;
	port: string;
	database: string;
	params: {
		[key: string]: string;
	};
}

export function parseDsn(dsn: string): DsnResult {
	const url = new URL(dsn);

	return {
		// remove trailing colon
		driver: url.protocol.slice(0, url.protocol.length - 1),
		user: url.username,
		password: url.password,
		host: url.hostname,
		port: url.port,
		// remove leading slash from path
		database: url.pathname.slice(1),
		params: Object.fromEntries(url.searchParams.entries())
	};
}

export function delay<T>(ms: number, value?: T): Promise<T> {
	return new Promise<T>(resolve => setTimeout(() => resolve(value), ms));
}

export function copyBytes(dst: Uint8Array, src: Uint8Array, off = 0): number {
	off = Math.max(0, Math.min(off, dst.byteLength));
	const r = dst.byteLength - off;
	if (src.byteLength > r) {
	  src = src.subarray(0, r);
	}
	dst.set(src, off);
	return src.byteLength;
}
