/// <reference types="node" />
import AnchoredOperationModel from '../../lib/core/models/AnchoredOperationModel';
import CreateOperation from '../../lib/core/versions/latest/CreateOperation';
import DeactivateOperation from '../../lib/core/versions/latest/DeactivateOperation';
import DocumentModel from '../../lib/core/versions/latest/models/DocumentModel';
import JwkEs256k from '../../lib/core/models/JwkEs256k';
import OperationModel from '../../lib/core/versions/latest/models/OperationModel';
import OperationType from '../../lib/core/enums/OperationType';
import PatchAction from '../../lib/core/versions/latest/PatchAction';
import PublicKeyModel from '../../lib/core/versions/latest/models/PublicKeyModel';
import PublicKeyPurpose from '../../lib/core/versions/latest/PublicKeyPurpose';
import RecoverOperation from '../../lib/core/versions/latest/RecoverOperation';
import ServiceModel from '../../lib/core/versions/latest/models/ServiceModel';
import TransactionModel from '../../lib/common/models/TransactionModel';
import UpdateOperation from '../../lib/core/versions/latest/UpdateOperation';
interface AnchoredCreateOperationGenerationInput {
    transactionNumber: number;
    transactionTime: number;
    operationIndex: number;
}
interface RecoverOperationGenerationInput {
    didUniqueSuffix: string;
    recoveryPrivateKey: JwkEs256k;
}
interface GeneratedRecoverOperationData {
    operationBuffer: Buffer;
    recoverOperation: RecoverOperation;
    recoveryPublicKey: JwkEs256k;
    recoveryPrivateKey: JwkEs256k;
    signingPublicKey: PublicKeyModel;
    signingPrivateKey: JwkEs256k;
    updateKey: PublicKeyModel;
    updatePrivateKey: JwkEs256k;
}
/**
 * A class that can generate valid operations.
 * Mainly useful for testing purposes.
 */
export default class OperationGenerator {
    /**
     * Generates a random `TransactionModel`.
     */
    static generateTransactionModel(): TransactionModel;
    /**
     * Generates a random multihash.
     */
    static generateRandomHash(): string;
    /**
     * Generates SECP256K1 key pair to be used in an operation. If purposes not supplied, all purposes will be included
     * Mainly used for testing.
     * @returns [publicKey, privateKey]
     */
    static generateKeyPair(id: string, purposes?: PublicKeyPurpose[]): Promise<[PublicKeyModel, JwkEs256k]>;
    /**
     * Generates an anchored create operation.
     */
    static generateAnchoredCreateOperation(input: AnchoredCreateOperationGenerationInput): Promise<{
        createOperation: CreateOperation;
        operationRequest: {
            type: OperationType;
            suffixData: {
                deltaHash: string;
                recoveryCommitment: string;
            };
            delta: {
                updateCommitment: string;
                patches: {
                    action: PatchAction;
                    document: DocumentModel;
                }[];
            };
        };
        anchoredOperationModel: {
            type: OperationType;
            didUniqueSuffix: string;
            operationBuffer: Buffer;
            transactionNumber: number;
            transactionTime: number;
            operationIndex: number;
        };
        recoveryPublicKey: JwkEs256k;
        recoveryPrivateKey: JwkEs256k;
        updatePublicKey: JwkEs256k;
        updatePrivateKey: JwkEs256k;
        signingPublicKey: PublicKeyModel;
        signingPrivateKey: JwkEs256k;
    }>;
    /**
     * generate a long form did
     * @param recoveryPublicKey
     * @param updatePublicKey
     * @param otherPublicKeys
     * @param services
     */
    static generateLongFormDid(otherPublicKeys?: PublicKeyModel[], services?: ServiceModel[], network?: string): Promise<{
        longFormDid: string;
        shortFormDid: string;
        didUniqueSuffix: string;
    }>;
    /**
     * Generates a long from from create operation data.
     */
    static createDid(recoveryKey: JwkEs256k, updateKey: JwkEs256k, patches: any, network?: string): Promise<{
        longFormDid: string;
        shortFormDid: string;
        didUniqueSuffix: string;
    }>;
    /**
     * Generates a create operation.
     */
    static generateCreateOperation(): Promise<{
        createOperation: CreateOperation;
        operationRequest: {
            type: OperationType;
            suffixData: {
                deltaHash: string;
                recoveryCommitment: string;
            };
            delta: {
                updateCommitment: string;
                patches: {
                    action: PatchAction;
                    document: DocumentModel;
                }[];
            };
        };
        recoveryPublicKey: JwkEs256k;
        recoveryPrivateKey: JwkEs256k;
        updatePublicKey: JwkEs256k;
        updatePrivateKey: JwkEs256k;
        signingPublicKey: PublicKeyModel;
        signingPrivateKey: JwkEs256k;
    }>;
    /**
     * Generates a recover operation.
     */
    static generateRecoverOperation(input: RecoverOperationGenerationInput): Promise<GeneratedRecoverOperationData>;
    /**
     * Generates an update operation that adds a new key.
     */
    static generateUpdateOperation(didUniqueSuffix: string, updatePublicKey: JwkEs256k, updatePrivateKey: JwkEs256k, multihashAlgorithmCodeToUse?: number, multihashAlgorithmForRevealValue?: number): Promise<{
        updateOperation: UpdateOperation;
        operationBuffer: Buffer;
        additionalKeyId: string;
        additionalPublicKey: PublicKeyModel;
        additionalPrivateKey: JwkEs256k;
        nextUpdateKey: any;
    }>;
    /**
     * Creates an anchored operation model from `OperationModel`.
     */
    static createAnchoredOperationModelFromOperationModel(operationModel: OperationModel, transactionTime: number, transactionNumber: number, operationIndex: number): AnchoredOperationModel;
    /**
     * Creates a anchored operation model from an operation request.
     */
    static createAnchoredOperationModelFromRequest(didUniqueSuffix: string, operationRequest: {
        type: OperationType;
    }, // Need to know at least the type.
    transactionTime: number, transactionNumber: number, operationIndex: number): AnchoredOperationModel;
    /**
     * Creates a create operation request.
     */
    static createCreateOperationRequest(recoveryPublicKey: JwkEs256k, updatePublicKey: JwkEs256k, otherPublicKeys: PublicKeyModel[], services?: ServiceModel[]): Promise<{
        type: OperationType;
        suffixData: {
            deltaHash: string;
            recoveryCommitment: string;
        };
        delta: {
            updateCommitment: string;
            patches: {
                action: PatchAction;
                document: DocumentModel;
            }[];
        };
    }>;
    /**
     * Generates an update operation request.
     */
    static generateUpdateOperationRequest(didUniqueSuffix?: string): Promise<{
        request: {
            type: OperationType;
            didSuffix: string;
            revealValue: string;
            delta: {
                patches: any;
                updateCommitment: string;
            };
            signedData: string;
        };
        buffer: Buffer;
        updateOperation: UpdateOperation;
    }>;
    /**
     * Creates an update operation request.
     */
    static createUpdateOperationRequest(didSuffix: string, updatePublicKey: JwkEs256k, updatePrivateKey: JwkEs256k, nextUpdateCommitmentHash: string, patches: any, multihashAlgorithmCodeToUse?: number, multihashAlgorithmForRevealValue?: number): Promise<{
        type: OperationType;
        didSuffix: string;
        revealValue: string;
        delta: {
            patches: any;
            updateCommitment: string;
        };
        signedData: string;
    }>;
    /**
     * Generates a recover operation request.
     */
    static generateRecoverOperationRequest(didUniqueSuffix: string, recoveryPrivateKey: JwkEs256k, newRecoveryPublicKey: JwkEs256k, newSigningPublicKey: PublicKeyModel, services?: ServiceModel[], publicKeys?: PublicKeyModel[]): Promise<{
        type: OperationType;
        didSuffix: string;
        revealValue: string;
        signedData: string;
        delta: {
            patches: {
                action: PatchAction;
                document: any;
            }[];
            updateCommitment: string;
        };
    }>;
    /**
     * Creates a recover operation request.
     */
    static createRecoverOperationRequest(didSuffix: string, recoveryPrivateKey: JwkEs256k, newRecoveryPublicKey: JwkEs256k, nextUpdateCommitmentHash: string, document: any): Promise<{
        type: OperationType;
        didSuffix: string;
        revealValue: string;
        signedData: string;
        delta: {
            patches: {
                action: PatchAction;
                document: any;
            }[];
            updateCommitment: string;
        };
    }>;
    /**
     * Generates a deactivate operation request.
     */
    static createDeactivateOperationRequest(didSuffix: string, recoveryPrivateKey: JwkEs256k): Promise<{
        type: OperationType;
        didSuffix: string;
        revealValue: string;
        signedData: string;
    }>;
    /**
     * Generates a create operation request buffer.
     * @param nextRecoveryCommitmentHash The encoded commitment hash for the next recovery.
     * @param nextUpdateCommitmentHash The encoded commitment hash for the next update.
     */
    static generateCreateOperationBuffer(recoveryPublicKey: JwkEs256k, signingPublicKey: PublicKeyModel, services?: ServiceModel[]): Promise<Buffer>;
    /**
     * Creates an update operation for adding a key.
     */
    static createUpdateOperationRequestForAddingAKey(didUniqueSuffix: string, updatePublicKey: JwkEs256k, updatePrivateKey: JwkEs256k, newPublicKey: PublicKeyModel, nextUpdateCommitmentHash: string, multihashAlgorithmCodeToUse?: number, multihashAlgorithmForRevealValue?: number): Promise<{
        type: OperationType;
        didSuffix: string;
        revealValue: string;
        delta: {
            patches: any;
            updateCommitment: string;
        };
        signedData: string;
    }>;
    /**
     * Generate an update operation for adding and/or removing services.
     */
    static generateUpdateOperationRequestForServices(didUniqueSuffix: string, updatePublicKey: any, updatePrivateKey: JwkEs256k, nextUpdateCommitmentHash: string, idOfServiceEndpointToAdd: string | undefined, idsOfServiceEndpointToRemove: string[]): Promise<{
        type: OperationType;
        didSuffix: string;
        revealValue: string;
        delta: {
            patches: any;
            updateCommitment: string;
        };
        signedData: string;
    }>;
    /**
     * Signs the given payload as a ES256K compact JWS.
     */
    static signUsingEs256k(payload: any, privateKey: JwkEs256k): Promise<string>;
    /**
     * Generates a Deactivate Operation data.
     */
    static createDeactivateOperation(didUniqueSuffix: string, recoveryPrivateKey: JwkEs256k): Promise<{
        operationRequest: {
            type: OperationType;
            didSuffix: string;
            revealValue: string;
            signedData: string;
        };
        operationBuffer: Buffer;
        deactivateOperation: DeactivateOperation;
    }>;
    /**
     * Generates an array of services with specified ids
     * @param ids the id field in service.
     */
    static generateServices(ids: string[]): ServiceModel[];
    /**
     * Generates an core index file.
     */
    static generateCoreIndexFile(recoveryOperationCount: number): Promise<Buffer>;
}
export {};
