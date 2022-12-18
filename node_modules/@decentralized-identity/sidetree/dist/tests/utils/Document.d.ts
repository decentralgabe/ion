import DocumentModel from '../../lib/core/versions/latest/models/DocumentModel';
import PublicKeyModel from '../../lib/core/versions/latest/models/PublicKeyModel';
export default class Document {
    static getPublicKey(document: DocumentModel, keyId: string): PublicKeyModel | undefined;
}
