// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// TODO(ry) It'd be better to make Deferred a class that inherits from
// Promise, rather than an interface. This is possible in ES2016, however
// typescript produces broken code when targeting ES5 code.
// See https://github.com/Microsoft/TypeScript/issues/15202
// At the time of writing, the github issue is closed but the problem remains.
export interface Deferred<T> extends Promise<T> {
	resolve: (value?: T | PromiseLike<T>) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reject: (reason?: any) => void;
}

export class DeferredStack<T> {

	private _array: Array<T>;
	private _queue: Array<Deferred<T>>;
	private _maxSize: number;
	private _size: number;

	public constructor(max?: number, ls?: Iterable<T>, private _creator?: () => Promise<T>) {
		this._maxSize = max || 10;
		this._array = ls ? [...ls] : [];
		this._size = this._array.length;
		this._queue = [];
	}

	public async pop(): Promise<T> {
		if (this._array.length > 0) {
			return this._array.pop()!;
		} else if (this._size < this._maxSize && this._creator) {
			this._size++;
			return this._creator();
		}
		const d = deferred<T>();
		this._queue.push(d);
		await d;
		return this._array.pop()!;
	}

	public push(value: T): void {
		this._array.push(value);
		if (this._queue.length > 0) {
			const d = this._queue.shift()!;
			d.resolve();
		}
	}

	public get size(): number {
		return this._size;
	}

	public get available(): number {
		return this._array.length;
	}

}

/** Creates a Promise with the `reject` and `resolve` functions
   * placed as methods on the promise object itself. It allows you to do:
   *
   *     const p = deferred<number>();
   *     // ...
   *     p.resolve(42);
   */
export function deferred<T>(): Deferred<T> {
	let methods;
	const promise = new Promise<T>((resolve, reject): void => {
	  methods = { resolve, reject };
	});
	return Object.assign(promise, methods)! as Deferred<T>;
}

interface TaggedYieldedValue<T> {
	iterator: AsyncIterableIterator<T>;
	value: T;
}

/** The MuxAsyncIterator class multiplexes multiple async iterators into a
   * single stream. It currently makes a few assumptions:
   * - The iterators do not throw.
   * - The final result (the value returned and not yielded from the iterator)
   *   does not matter; if there is any, it is discarded.
   */
export class MuxAsyncIterator<T> implements AsyncIterable<T> {

	private iteratorCount = 0;
	private yields: Array<TaggedYieldedValue<T>> = [];
	private signal: Deferred<void> = deferred();

	public async add(iterator: AsyncIterableIterator<T>) {
	  ++this.iteratorCount;
	  await this.callIteratorNext(iterator);
	}

	public [Symbol.asyncIterator](): AsyncIterableIterator<T> {
	  return this.iterate();
	}

	private async callIteratorNext(
		iterator: AsyncIterableIterator<T>
	  ): Promise<void> {
		const { value, done } = await iterator.next();
		if (done) {
			  --this.iteratorCount;
		} else {
			  this.yields.push({ iterator, value });
		}
		this.signal.resolve();
	  }

	private async *iterate(): AsyncIterableIterator<T> {
	  while (this.iteratorCount > 0) {
		// Sleep until any of the wrapped iterators yields.
			await this.signal;

			// Note that while we're looping over `yields`, new items may be added.
			for (const { iterator, value } of this.yields) {
				yield value;
				await this.callIteratorNext(iterator);
			}

			// Clear the `yields` list and reset the `signal` promise.
			this.yields.length = 0;
			this.signal = deferred();
	  }
	}

}
