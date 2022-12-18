/// <reference types="node" />
/**
 * A JSON library that performs operations asynchronously.
 */
export default class JsonAsync {
    /**
     * Parses the given operation into a JavaScript object asynchronously,
     * to allow the event loop a chance to handle requests.
     * NOTE: Use only when the JSON data buffer is expected to exceed 200 KB as shown in statistics in https://github.com/ibmruntimes/yieldable-json
     */
    static parse(jsonData: Buffer | string): Promise<any>;
}
