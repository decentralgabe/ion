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
const AnchoredDataSerializer_1 = require("../../../lib/core/versions/latest/AnchoredDataSerializer");
const ErrorCode_1 = require("../../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../../JasmineSidetreeErrorValidator");
describe('AnchoredDataSerializer', () => __awaiter(void 0, void 0, void 0, function* () {
    let testDataToWrite;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        testDataToWrite = {
            coreIndexFileUri: 'random data to write',
            numberOfOperations: 10000
        };
    }));
    it('should serialize & deserialize correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
        const serialized = AnchoredDataSerializer_1.default.serialize(testDataToWrite);
        const deserialized = AnchoredDataSerializer_1.default.deserialize(serialized);
        expect(deserialized.coreIndexFileUri).toEqual(testDataToWrite.coreIndexFileUri);
        expect(deserialized.numberOfOperations).toEqual(testDataToWrite.numberOfOperations);
    }));
    describe(`deserialize()`, () => {
        it('deserialize should throw if the input is not in the correct format.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Input doesn't have any delimeter
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => AnchoredDataSerializer_1.default.deserialize('SOMEINVALIDDATA'), ErrorCode_1.default.AnchoredDataIncorrectFormat);
        }));
        it('should throw if the number of operations is not a number.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Set operation number portion to `abc`.
            const anchorString = `abc${AnchoredDataSerializer_1.default.delimiter}unusedCoreIndexFileUri`;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => AnchoredDataSerializer_1.default.deserialize(anchorString), ErrorCode_1.default.AnchoredDataNumberOfOperationsNotPositiveInteger);
        }));
        it('should throw if the number of operations is not a positive integer.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Set operation number portion to 0;
            const anchorString = `0${AnchoredDataSerializer_1.default.delimiter}unusedCoreIndexFileUri`;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => AnchoredDataSerializer_1.default.deserialize(anchorString), ErrorCode_1.default.AnchoredDataNumberOfOperationsNotPositiveInteger);
        }));
        it('should throw if the number of operations exceeds max allowed.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Go over max allowed batch size by one.
            const anchorString = `10001${AnchoredDataSerializer_1.default.delimiter}unusedCoreIndexFileUri`;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => AnchoredDataSerializer_1.default.deserialize(anchorString), ErrorCode_1.default.AnchoredDataNumberOfOperationsGreaterThanMax);
        }));
    });
}));
//# sourceMappingURL=AnchoredDataSerializer.spec.js.map