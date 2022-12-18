/// <reference types="node" />
/**
 * ReadableStream utilities
 */
export default class ReadableStream {
    /**
     * Given a readable stream, reads all data only if the content does not exceed given max size.
     * Throws error if content exceeds give max size.
     * @param stream Readable stream to read.
     * @param maxAllowedSizeInBytes The maximum allowed size limit of the content.
     * @returns a Buffer of the readable stream data
     */
    static readAll(stream: NodeJS.ReadableStream, maxAllowedSizeInBytes?: number): Promise<Buffer>;
}
