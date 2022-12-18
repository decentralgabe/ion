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
const LogColor_1 = require("./LogColor");
const Logger_1 = require("./Logger");
/**
 * Event emitter used in Sidetree.
 * Intended to be machine readable for triggering custom handlers.
 */
class EventEmitter {
    /**
     * Initializes with custom event emitter if given.
     */
    static initialize(customEventEmitter) {
        if (customEventEmitter !== undefined) {
            EventEmitter.customEvenEmitter = customEventEmitter;
            Logger_1.default.info('Custom event emitter given.');
        }
    }
    /**
     * Emits an event.
     */
    static emit(eventCode, eventData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (EventEmitter.customEvenEmitter !== undefined) {
                yield EventEmitter.customEvenEmitter.emit(eventCode, eventData);
            }
            // Always log the event using the logger.
            if (eventData === undefined) {
                Logger_1.default.info(LogColor_1.default.lightBlue(`Event emitted: ${LogColor_1.default.green(eventCode)}`));
            }
            else {
                Logger_1.default.info(LogColor_1.default.lightBlue(`Event emitted: ${LogColor_1.default.green(eventCode)}: ${JSON.stringify(eventData)}`));
            }
        });
    }
}
exports.default = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map