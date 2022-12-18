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
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
/**
 * MongoDB related operations.
 */
class MongoDb {
    /**
     * Setup inmemory mongodb to test with
     */
    static createInmemoryDb(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!MongoDb.initialized) {
                // If the test config says localhost, then launch in-memory mongodb.
                // Otherwise, assume the database is already running
                const prefix = 'mongodb://localhost:';
                if (config.mongoDbConnectionString.startsWith(prefix)) {
                    const port = parseInt(config.mongoDbConnectionString.substr(prefix.length));
                    yield MongoMemoryServer.create({
                        instance: {
                            port
                        }
                    });
                }
                MongoDb.initialized = true;
            }
        });
    }
}
exports.default = MongoDb;
//# sourceMappingURL=MongoDb.js.map