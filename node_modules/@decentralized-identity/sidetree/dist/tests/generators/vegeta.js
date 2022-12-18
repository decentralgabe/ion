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
/**
 * Example code on how to generate load files for Vegeta load testing tool.
 */
const VegetaLoadGenerator_1 = require("./VegetaLoadGenerator");
const uniqueDidCount = 20000;
const endpointUrl = 'http://localhost:3000/';
const outputFolder = `d:/vegeta-localhost-jws`;
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.info(`Generating load requests...`);
    const startTime = process.hrtime(); // For calculating time taken to process operations.
    yield VegetaLoadGenerator_1.default.generateLoadFiles(uniqueDidCount, endpointUrl, outputFolder);
    const duration = process.hrtime(startTime);
    console.info(`Generated requests. Time taken: ${duration[0]} s ${duration[1] / 1000000} ms.`);
}))();
//# sourceMappingURL=vegeta.js.map