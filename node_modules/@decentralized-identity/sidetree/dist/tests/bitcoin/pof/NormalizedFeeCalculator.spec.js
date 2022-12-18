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
const ErrorCode_1 = require("../../../lib/bitcoin/ErrorCode");
const MockBlockMetadataStore_1 = require("../../mocks/MockBlockMetadataStore");
const NormalizedFeeCalculator_1 = require("../../../lib/bitcoin/versions/latest/NormalizedFeeCalculator");
describe('NormalizedFeeCalculator', () => {
    let normalizedFeeCalculator;
    let mockMetadataStore;
    beforeEach(() => {
        mockMetadataStore = new MockBlockMetadataStore_1.default();
        normalizedFeeCalculator = new NormalizedFeeCalculator_1.default(mockMetadataStore, 1, 1, 100, 0.000002);
    });
    describe('initialize', () => {
        it('should initialize members correctly', (done) => __awaiter(void 0, void 0, void 0, function* () {
            yield normalizedFeeCalculator.initialize();
            done();
        }));
    });
    describe('addNormalizedFeeToBlock', () => {
        let blockMetadataWithoutFee;
        beforeEach(() => {
            normalizedFeeCalculator['feeLookBackWindowInBlocks'] = 3;
            blockMetadataWithoutFee = {
                height: 0,
                hash: 'hash',
                previousHash: 'prevHash',
                transactionCount: 100,
                totalFee: 100
            };
        });
        it('should return initial fee for blocks within genesis + lookBackDuration', () => __awaiter(void 0, void 0, void 0, function* () {
            blockMetadataWithoutFee.height = 3;
            const actual = yield normalizedFeeCalculator.addNormalizedFeeToBlockMetadata(blockMetadataWithoutFee);
            expect(actual.normalizedFee).toEqual(1);
        }));
        it('should calculate normalized fee and fetch for blocks when starting fresh', () => __awaiter(void 0, void 0, void 0, function* () {
            blockMetadataWithoutFee.height = 101;
            const getMetadataSpy = spyOn(mockMetadataStore, 'get').and.returnValue(Promise.resolve([
                {
                    height: 98,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 2,
                    totalFee: 1999994
                },
                {
                    height: 99,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 1,
                    totalFee: 999997
                },
                {
                    height: 100,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 10,
                    totalFee: 9999970
                }
            ]));
            const actual = yield normalizedFeeCalculator.addNormalizedFeeToBlockMetadata(blockMetadataWithoutFee);
            expect(actual.normalizedFee).toBeDefined();
            expect(getMetadataSpy).toHaveBeenCalled();
            expect(normalizedFeeCalculator['cachedLookBackWindow'][0].height).toEqual(99);
            expect(normalizedFeeCalculator['cachedLookBackWindow'][2].height).toEqual(101);
            expect(normalizedFeeCalculator['blockHeightOfCachedLookBackWindow']).toEqual(102);
        }));
        it('should calculate normalized fee and use cache', () => __awaiter(void 0, void 0, void 0, function* () {
            blockMetadataWithoutFee.height = 101;
            normalizedFeeCalculator['blockHeightOfCachedLookBackWindow'] = 101;
            normalizedFeeCalculator['cachedLookBackWindow'] = [
                {
                    height: 98,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 2,
                    totalFee: 1999994
                },
                {
                    height: 99,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 1,
                    totalFee: 999997
                },
                {
                    height: 100,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 10,
                    totalFee: 9999970
                }
            ];
            const getMetadataSpy = spyOn(mockMetadataStore, 'get').and.returnValue(Promise.resolve([]));
            const actual = yield normalizedFeeCalculator.addNormalizedFeeToBlockMetadata(blockMetadataWithoutFee);
            expect(actual.normalizedFee).toBeDefined();
            expect(normalizedFeeCalculator['cachedLookBackWindow'][0].height).toEqual(99);
            expect(normalizedFeeCalculator['cachedLookBackWindow'][2].height).toEqual(101);
            expect(getMetadataSpy).not.toHaveBeenCalled(); // not called because there's cached data
            expect(normalizedFeeCalculator['blockHeightOfCachedLookBackWindow']).toEqual(102);
        }));
        it('should calculate normalized fee using db if cache does not have the correct number of blocks', () => __awaiter(void 0, void 0, void 0, function* () {
            blockMetadataWithoutFee.height = 101;
            normalizedFeeCalculator['blockHeightOfCachedLookBackWindow'] = 101;
            const getMetadataSpy = spyOn(mockMetadataStore, 'get').and.returnValue(Promise.resolve([
                {
                    height: 98,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 2,
                    totalFee: 1999994
                },
                {
                    height: 99,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 1,
                    totalFee: 999997
                },
                {
                    height: 100,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 10,
                    totalFee: 9999970
                }
            ]));
            normalizedFeeCalculator['cachedLookBackWindow'] = [
                {
                    height: 99,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 1,
                    totalFee: 999997
                },
                {
                    height: 100,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 10,
                    totalFee: 9999970
                }
            ];
            const actual = yield normalizedFeeCalculator.addNormalizedFeeToBlockMetadata(blockMetadataWithoutFee);
            expect(actual.normalizedFee).toBeDefined();
            expect(normalizedFeeCalculator['cachedLookBackWindow'][0].height).toEqual(99);
            expect(normalizedFeeCalculator['cachedLookBackWindow'][2].height).toEqual(101);
            expect(getMetadataSpy).toHaveBeenCalled(); // not called because there's cached data
            expect(normalizedFeeCalculator['blockHeightOfCachedLookBackWindow']).toEqual(102);
        }));
        it('should return the correct fee above fluctuation for blocks after genesis + 100 blocks.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            blockMetadataWithoutFee.height = 101;
            normalizedFeeCalculator['blockHeightOfCachedLookBackWindow'] = 101;
            spyOn(mockMetadataStore, 'get').and.returnValue(Promise.resolve([
                {
                    height: 98,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 2,
                    totalFee: 2000006
                },
                {
                    height: 99,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 1,
                    totalFee: 1000003
                },
                {
                    height: 100,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 10,
                    totalFee: 10000030
                }
            ]));
            const actual = yield normalizedFeeCalculator.addNormalizedFeeToBlockMetadata(blockMetadataWithoutFee);
            const expectedFee = 1000002;
            expect(actual.normalizedFee).toEqual(expectedFee);
            done();
        }));
        it('should return the correct fee below fluctuation for blocks after genesis + 100 blocks.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            blockMetadataWithoutFee.height = 101;
            normalizedFeeCalculator['blockHeightOfCachedLookBackWindow'] = 101;
            spyOn(mockMetadataStore, 'get').and.returnValue(Promise.resolve([
                {
                    height: 98,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 2,
                    totalFee: 1999994
                },
                {
                    height: 99,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 1,
                    totalFee: 999997
                },
                {
                    height: 100,
                    hash: 'string',
                    normalizedFee: 1000000,
                    previousHash: 'string',
                    transactionCount: 10,
                    totalFee: 9999970
                }
            ]));
            const actual = yield normalizedFeeCalculator.addNormalizedFeeToBlockMetadata(blockMetadataWithoutFee);
            const expectedFee = 999998;
            expect(actual.normalizedFee).toEqual(expectedFee);
            done();
        }));
        it('should return the correct fee within fluctuation for blocks after genesis + 100 blocks.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            blockMetadataWithoutFee.height = 101;
            normalizedFeeCalculator['blockHeightOfCachedLookBackWindow'] = 101;
            spyOn(mockMetadataStore, 'get').and.returnValue(Promise.resolve([
                {
                    height: 98,
                    hash: 'string',
                    normalizedFee: 1000001,
                    previousHash: 'string',
                    transactionCount: 2,
                    totalFee: 2000000
                },
                {
                    height: 99,
                    hash: 'string',
                    normalizedFee: 1000001,
                    previousHash: 'string',
                    transactionCount: 1,
                    totalFee: 1000000
                },
                {
                    height: 100,
                    hash: 'string',
                    normalizedFee: 1000001,
                    previousHash: 'string',
                    transactionCount: 10,
                    totalFee: 10000000
                }
            ]));
            const actual = yield normalizedFeeCalculator.addNormalizedFeeToBlockMetadata(blockMetadataWithoutFee);
            const expectedFee = 1000000;
            expect(actual.normalizedFee).toEqual(expectedFee);
            done();
        }));
    });
    describe('getNormalizedFee', () => {
        it('should return recalculated normalized fee from db', () => __awaiter(void 0, void 0, void 0, function* () {
            const blocks = [{
                    height: 0,
                    hash: 'hash',
                    previousHash: 'prevHash',
                    transactionCount: 100,
                    totalFee: 100,
                    normalizedFee: 1.1111111
                }];
            const blockMetadataGetSpy = spyOn(normalizedFeeCalculator['blockMetadataStore'], 'get').and.returnValue(Promise.resolve(blocks));
            const result = yield normalizedFeeCalculator.getNormalizedFee(0);
            expect(result).toEqual(1);
            expect(blockMetadataGetSpy).toHaveBeenCalled();
        }));
        it('should throw when block not yet recognized', () => __awaiter(void 0, void 0, void 0, function* () {
            const blocks = [];
            spyOn(normalizedFeeCalculator['blockMetadataStore'], 'get').and.returnValue(Promise.resolve(blocks));
            yield expectAsync(normalizedFeeCalculator.getNormalizedFee(0)).toBeRejectedWith(jasmine.objectContaining({
                code: ErrorCode_1.default.NormalizedFeeCalculatorBlockNotFound
            }));
        }));
    });
    describe('calculateNormalizedTransactionFeeFromBlock', () => {
        it('should return the correct value', () => {
            const block = {
                height: 0,
                hash: 'hash',
                previousHash: 'prevHash',
                transactionCount: 100,
                totalFee: 100,
                normalizedFee: 1.1111111
            };
            const result = normalizedFeeCalculator.calculateNormalizedTransactionFeeFromBlock(block);
            expect(result).toEqual(1);
        });
    });
});
//# sourceMappingURL=NormalizedFeeCalculator.spec.js.map