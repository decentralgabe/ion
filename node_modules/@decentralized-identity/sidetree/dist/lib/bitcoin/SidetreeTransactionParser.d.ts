import BitcoinClient from './BitcoinClient';
import BitcoinTransactionModel from './models/BitcoinTransactionModel';
import SidetreeTransactionModel from './models/SidetreeTransactionModel';
/**
 * Encapsulates functionality about parsing a sidetree transaction written on the bitcoin.
 */
export default class SidetreeTransactionParser {
    private bitcoinClient;
    private sidetreePrefix;
    constructor(bitcoinClient: BitcoinClient, sidetreePrefix: string);
    /**
     * Parses the given transaction and returns the sidetree transaction object.
     *
     * @param bitcoinTransaction The transaction to parse.
     *
     * @returns The data model if the specified transaction is a valid sidetree transaction; undefined otherwise.
     */
    parse(bitcoinTransaction: BitcoinTransactionModel): Promise<SidetreeTransactionModel | undefined>;
    private getValidSidetreeDataFromOutputs;
    private getSidetreeDataFromOutputIfExist;
    private getValidWriterFromInputs;
    private fetchOutput;
    private getPublicKeyHashIfValidScript;
}
