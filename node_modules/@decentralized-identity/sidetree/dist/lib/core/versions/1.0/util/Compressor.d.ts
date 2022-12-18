/// <reference types="node" />
/**
 * Encapsulates functionality to compress/decompress data.
 */
export default class Compressor {
    /** The estimated ratio/multiplier of decompressed Sidetree CAS file size compared against the compressed file size. */
    static readonly estimatedDecompressionMultiplier = 3;
    private static readonly gzipAsync;
    /**
     * Compresses teh data in gzip and return it as buffer.
     * @param inputAsBuffer The input string to be compressed.
     */
    static compress(inputAsBuffer: Buffer): Promise<Buffer>;
    /**
     * Decompresses the input and returns it as buffer.
     */
    static decompress(inputAsBuffer: Buffer, maxAllowedDecompressedSizeInBytes: number): Promise<Buffer>;
}
