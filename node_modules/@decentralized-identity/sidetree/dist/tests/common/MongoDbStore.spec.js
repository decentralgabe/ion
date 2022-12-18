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
const Logger_1 = require("../../lib/common/Logger");
const mongodb_1 = require("mongodb");
const MongoDb_1 = require("./MongoDb");
const MongoDbStore_1 = require("../../lib/common/MongoDbStore");
describe('MongoDbStore', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = require('../json/config-test.json');
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield MongoDb_1.default.createInmemoryDb(config);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    }));
    it('should invoke command monitoring logger with different log level according to command response status', () => __awaiter(void 0, void 0, void 0, function* () {
        spyOn(Logger_1.default, 'info');
        spyOn(Logger_1.default, 'warn');
        spyOn(Logger_1.default, 'error');
        const client = yield mongodb_1.MongoClient.connect(config.mongoDbConnectionString, {
            useNewUrlParser: true,
            monitorCommands: true
        });
        MongoDbStore_1.default.enableCommandResultLogging(client);
        yield expectAsync(client.db('sidetree-test').collection('service').findOne({ id: 1 })).toBeResolved();
        expect(Logger_1.default.info).toHaveBeenCalledWith(jasmine.objectContaining({ commandName: 'find' }));
        yield expectAsync(client.db('sidetree-test').collection('service').dropIndex('test')).toBeRejected();
        expect(Logger_1.default.warn).toHaveBeenCalledWith(jasmine.objectContaining({ commandName: 'dropIndexes' }));
        client.emit('commandSucceeded', { commandName: 'ping' });
        expect(Logger_1.default.info).not.toHaveBeenCalledWith(jasmine.objectContaining({ commandName: 'ping' }));
    }));
    it('should invoke logger with corresponding method according to the passed state', () => {
        spyOn(Logger_1.default, 'info');
        spyOn(Logger_1.default, 'warn');
        spyOn(Logger_1.default, 'error');
        MongoDbStore_1.default.customLogger('message', undefined);
        expect(Logger_1.default.info).not.toHaveBeenCalled();
        const state = {
            className: 'className',
            date: 0,
            message: 'message',
            pid: 0,
            type: 'debug'
        };
        state.type = 'info';
        MongoDbStore_1.default.customLogger('message', state);
        expect(Logger_1.default.info).toHaveBeenCalledWith(state);
        state.type = 'error';
        MongoDbStore_1.default.customLogger('message', state);
        expect(Logger_1.default.error).toHaveBeenCalledWith(state);
        state.type = 'whatever';
        MongoDbStore_1.default.customLogger('message', state);
        expect(Logger_1.default.info).toHaveBeenCalledWith(state);
    });
}));
//# sourceMappingURL=MongoDbStore.spec.js.map