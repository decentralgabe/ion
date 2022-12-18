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
const ErrorCode_1 = require("../../lib/bitcoin/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const MockBlockMetadataStore_1 = require("../mocks/MockBlockMetadataStore");
const VersionManager_1 = require("../../lib/bitcoin/VersionManager");
describe('VersionManager', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('getFeeCalculator()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return the correct version of fee calculator.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: '1000', protocolParameters: { valueTimeLockDurationInBlocks: 5, initialNormalizedFeeInSatoshis: 1, feeLookBackWindowInBlocks: 1, feeMaxFluctuationMultiplierPerBlock: 1 } },
                { startingBlockchainTime: 2000, version: '2000', protocolParameters: { valueTimeLockDurationInBlocks: 5, initialNormalizedFeeInSatoshis: 1, feeLookBackWindowInBlocks: 1, feeMaxFluctuationMultiplierPerBlock: 1 } }
            ];
            const versionManager = new VersionManager_1.default();
            // Setting up loading of mock fee calculators.
            const mockFeeCalculator1 = class {
                getNormalizedFee() { return 1000; }
            };
            const mockFeeCalculator2 = class {
                getNormalizedFee() { return 2000; }
            };
            spyOn(versionManager, 'loadDefaultExportsForVersion').and.callFake((version, _className) => __awaiter(void 0, void 0, void 0, function* () {
                if (version === '1000') {
                    return mockFeeCalculator1;
                }
                else { // '2000'
                    return mockFeeCalculator2;
                }
            }));
            yield versionManager.initialize(versionModels, { genesisBlockNumber: 1 }, new MockBlockMetadataStore_1.default());
            const fee = yield versionManager.getFeeCalculator(2001).getNormalizedFee(2001);
            expect(fee).toEqual(2000);
        }));
    }));
    describe('getVersionString()', () => {
        it('should throw if version given is not in the supported version list.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionManager = new VersionManager_1.default();
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => versionManager.getVersionString(1), ErrorCode_1.default.VersionManagerVersionStringNotFound);
        }));
    });
    describe('getLockDurationInBlocks', () => {
        it('should get the correct lock duration', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: '1000', protocolParameters: { valueTimeLockDurationInBlocks: 123, initialNormalizedFeeInSatoshis: 1, feeLookBackWindowInBlocks: 1, feeMaxFluctuationMultiplierPerBlock: 1 } },
                { startingBlockchainTime: 2000, version: '2000', protocolParameters: { valueTimeLockDurationInBlocks: 456, initialNormalizedFeeInSatoshis: 1, feeLookBackWindowInBlocks: 1, feeMaxFluctuationMultiplierPerBlock: 1 } }
            ];
            const versionManager = new VersionManager_1.default();
            spyOn(versionManager, 'loadDefaultExportsForVersion').and.callFake((_version, _className) => __awaiter(void 0, void 0, void 0, function* () {
                return class {
                    getNormalizedFee() { return 1000; }
                };
            }));
            yield versionManager.initialize(versionModels, { genesisBlockNumber: 1 }, new MockBlockMetadataStore_1.default());
            const result = versionManager.getLockDurationInBlocks(1500);
            expect(result).toEqual(123);
            const result2 = versionManager.getLockDurationInBlocks(2500);
            expect(result2).toEqual(456);
        }));
    });
}));
//# sourceMappingURL=VersionManager.spec.js.map