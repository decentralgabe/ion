"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A class that can generate data for basic types.
 */
class DataGenerator {
    /**
     * Generates a random integer between 0 and the specified max number.
     * @param max Maximum allowe integer value. Defaults to 100;
     */
    static generateInteger(max = 100) {
        return Math.round(Math.random() * max);
    }
}
exports.default = DataGenerator;
//# sourceMappingURL=DataGenerator.js.map