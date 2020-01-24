import { deferred, Deferred } from './Deferred';

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

	private async callIteratorNext(iterator: AsyncIterableIterator<T>): Promise<void> {
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
