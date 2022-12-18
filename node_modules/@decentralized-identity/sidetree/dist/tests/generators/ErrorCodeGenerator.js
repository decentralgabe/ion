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
const fs = require("fs");
const path = require("path");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
// Auto-generates error code messages based on the enum value and overwrites the original error code file.
const errorCodeFileName = 'ErrorCode.ts';
const latestVersionPath = '../../../lib/core/versions/latest';
const latestVersionDirectory = path.resolve(__dirname, latestVersionPath);
const saveLocation = path.resolve(__dirname, `${latestVersionPath}/${errorCodeFileName}`);
/**
 * Returns true if ErrorCode is used in ts files
 */
function isErrorCodeReferencedInDicrectory(errorCode, path) {
    const directory = fs.readdirSync(path);
    for (const fileOrSubDirectory of directory) {
        if (isErrorCodeFile(fileOrSubDirectory)) {
            continue;
        }
        else if (isTsFile(fileOrSubDirectory)) {
            const file = fs.readFileSync(`${path}/${fileOrSubDirectory}`, 'utf-8');
            if (file.includes(errorCode)) {
                return true;
            }
        }
        else if (!fileOrSubDirectory.includes('.')) {
            try {
                if (isErrorCodeReferencedInDicrectory(errorCode, `${path}/${fileOrSubDirectory}`)) {
                    return true;
                }
            }
            catch (e) {
                // this means it is not a directory
            }
        }
    }
    return false;
}
function isTsFile(fileName) {
    return fileName.includes('.ts');
}
function isErrorCodeFile(fileName) {
    return fileName === 'ErrorCode.ts';
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    let errorCodeFileContent = `/**
 * Error codes used ONLY by this version of the protocol.
 */
export default {
`;
    const errorCodeNames = [];
    for (var code in ErrorCode_1.default) {
        if (isNaN(Number(code))) {
            errorCodeNames.push(code);
        }
    }
    errorCodeNames.sort();
    for (let i = 0; i < errorCodeNames.length; i++) {
        // only add to the error code file if usage is found in code
        if (isErrorCodeReferencedInDicrectory(errorCodeNames[i], latestVersionDirectory)) {
            const camelCaseErrorMessage = errorCodeNames[i].replace(/\.?([A-Z])/g, function (_x, y) { return '_' + y.toLowerCase(); }).replace(/^_/, '');
            if (i === errorCodeNames.length - 1) {
                errorCodeFileContent += `  ${errorCodeNames[i]}: '${camelCaseErrorMessage}'\n`;
            }
            else {
                errorCodeFileContent += `  ${errorCodeNames[i]}: '${camelCaseErrorMessage}',\n`;
            }
        }
        else {
            console.info(`${errorCodeNames[i]} is removed from ErrorCode because it is not used.`);
        }
        ;
    }
    errorCodeFileContent +=
        `};
`;
    fs.writeFileSync(`${saveLocation}`, errorCodeFileContent);
}))();
//# sourceMappingURL=ErrorCodeGenerator.js.map