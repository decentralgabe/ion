/**
 * Class for generating files used for load testing using Vegeta.
 */
export default class VegetaLoadGenerator {
    /**
     * Creates a Create request followed by an Update request for each DID.
     * Following targets files will be generated:
     *   One targets file containing all Create requests
     *   One targets file containing all Update requests
     *   One targets file containing all recovery requests
     *   One targets file containing all deactivate requests
     * @param uniqueDidCount The number of unique DID to be generated.
     * @param endpointUrl The URL that the requests will be sent to.
     * @param absoluteFolderPath The folder that all the generated files will be saved to.
     * @param hashAlgorithmInMultihashCode The hash algorithm in Multihash code in DEC (not in HEX).
     */
    static generateLoadFiles(uniqueDidCount: number, endpointUrl: string, absoluteFolderPath: string): Promise<void>;
}
