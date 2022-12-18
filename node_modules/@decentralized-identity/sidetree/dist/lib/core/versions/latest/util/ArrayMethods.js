"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class containing methods that operates against an array.
 */
class ArrayMethods {
    /**
     * Checks to see if there are duplicates in the given array.
     */
    static hasDuplicates(array) {
        const uniqueValues = new Set();
        for (let i = 0; i < array.length; i++) {
            const value = array[i];
            if (uniqueValues.has(value)) {
                return true;
            }
            uniqueValues.add(value);
        }
        return false;
    }
    /**
     * Checks that entries in array 2 is not in array 1.
     */
    static areMutuallyExclusive(array1, array2) {
        const valuesInArray1 = new Set(array1);
        for (const value of array2) {
            if (valuesInArray1.has(value)) {
                return false;
            }
        }
        return true;
    }
}
exports.default = ArrayMethods;
//# sourceMappingURL=ArrayMethods.js.map