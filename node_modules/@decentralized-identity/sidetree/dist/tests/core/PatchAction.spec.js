"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PatchAction_1 = require("../../lib/core/versions/latest/PatchAction");
describe('PatchAction', () => {
    it('should have expected string as enum value', () => {
        expect(PatchAction_1.default.Replace).toEqual('replace');
        expect(PatchAction_1.default.AddPublicKeys).toEqual('add-public-keys');
        expect(PatchAction_1.default.RemovePublicKeys).toEqual('remove-public-keys');
        expect(PatchAction_1.default.AddServices).toEqual('add-services');
        expect(PatchAction_1.default.RemoveServices).toEqual('remove-services');
    });
});
//# sourceMappingURL=PatchAction.spec.js.map