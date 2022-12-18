"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("../common/Logger");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * Encapsulates functionality about parsing a sidetree transaction written on the bitcoin.
 */
class SidetreeTransactionParser {
    constructor(bitcoinClient, sidetreePrefix) {
        this.bitcoinClient = bitcoinClient;
        this.sidetreePrefix = sidetreePrefix;
    }
    /**
     * Parses the given transaction and returns the sidetree transaction object.
     *
     * @param bitcoinTransaction The transaction to parse.
     *
     * @returns The data model if the specified transaction is a valid sidetree transaction; undefined otherwise.
     */
    parse(bitcoinTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const sidetreeData = this.getValidSidetreeDataFromOutputs(bitcoinTransaction.outputs, this.sidetreePrefix);
            if (!sidetreeData) {
                return undefined;
            }
            const writer = yield this.getValidWriterFromInputs(bitcoinTransaction.id, bitcoinTransaction.inputs);
            if (!writer) {
                Logger_1.default.info(`Valid sidetree data was found but no valid writer was found for transaction id: ${bitcoinTransaction.id}`);
                return undefined;
            }
            return {
                data: sidetreeData,
                writer: writer
            };
        });
    }
    getValidSidetreeDataFromOutputs(transactionOutputs, sidetreePrefix) {
        // The sidetree transaction output has the following requirements:
        //  1. We will recognize only the first sidetree anchor string and ignore the rest.
        for (let i = 0; i < transactionOutputs.length; i++) {
            const currentOutput = transactionOutputs[i];
            const sidetreeDataForThisOutput = this.getSidetreeDataFromOutputIfExist(currentOutput, sidetreePrefix);
            if (sidetreeDataForThisOutput) {
                // Sidetree data found .. return it
                return sidetreeDataForThisOutput;
            }
        }
        // Nothing found
        return undefined;
    }
    getSidetreeDataFromOutputIfExist(transactionOutput, sidetreePrefix) {
        // check for returned data for sidetree prefix
        const hexDataMatches = transactionOutput.scriptAsmAsString.match(/\s*OP_RETURN ([0-9a-fA-F]+)$/);
        if (hexDataMatches && hexDataMatches.length !== 0) {
            const data = Buffer.from(hexDataMatches[1], 'hex').toString();
            if (data.startsWith(sidetreePrefix)) {
                return data.slice(sidetreePrefix.length);
            }
        }
        // Nothing was found
        return undefined;
    }
    getValidWriterFromInputs(transactionId, transactionInputs) {
        return __awaiter(this, void 0, void 0, function* () {
            // A valid sidetree transaction inputs have following requirements:
            //  A. There must be at least one input.
            //  B. The first input must be in format: <signature> <publickey>
            //  C. The output being spent by the first input must be in the pay-to-public-key-hash output.
            //
            // The first input checks will prove that the writer of the input/txn owns the <publickey><privatekey> pair
            // so we won't check any other inputs.
            //
            // The writer is the hash of the <publickey> which is in the output being spent (C).
            //
            // Example valid transaction: https://www.blockchain.com/btctest/tx/a98fd29d4583d1f691067b0f92ae83d3808d18cba55bd630dbf569fbaea9355c
            // A.
            if (transactionInputs.length < 1) {
                Logger_1.default.info(`There must be at least one input in the transaction id: ${transactionId}`);
                return undefined;
            }
            const inputToCheck = transactionInputs[0];
            // B.
            const inputScriptAsmParts = inputToCheck.scriptAsmAsString.split(' ');
            if (inputScriptAsmParts.length !== 2) {
                Logger_1.default.info(`The first input must have only the signature and publickey; transaction id: ${transactionId}`);
                return undefined;
            }
            // C.
            const outputBeingSpend = yield this.fetchOutput(inputToCheck.previousTransactionId, inputToCheck.outputIndexInPreviousTransaction);
            if (!outputBeingSpend) {
                return undefined;
            }
            return this.getPublicKeyHashIfValidScript(outputBeingSpend.scriptAsmAsString);
        });
    }
    fetchOutput(transactionId, outputIndexToFetch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = yield this.bitcoinClient.getRawTransaction(transactionId);
                return transaction.outputs[outputIndexToFetch];
            }
            catch (e) {
                Logger_1.default.error(`Error while trying to get outputIdx: ${outputIndexToFetch} from transaction: ${transactionId}. Error: ${SidetreeError_1.default.stringify(e)}`);
                throw e;
            }
        });
    }
    getPublicKeyHashIfValidScript(scriptAsm) {
        const scriptAsmParts = scriptAsm.split(' ');
        const isScriptValid = scriptAsmParts.length === 5 &&
            scriptAsmParts[0] === 'OP_DUP' &&
            scriptAsmParts[1] === 'OP_HASH160' &&
            scriptAsmParts[3] === 'OP_EQUALVERIFY' &&
            scriptAsmParts[4] === 'OP_CHECKSIG';
        return isScriptValid ? scriptAsmParts[2] : undefined;
    }
}
exports.default = SidetreeTransactionParser;
//# sourceMappingURL=SidetreeTransactionParser.js.map