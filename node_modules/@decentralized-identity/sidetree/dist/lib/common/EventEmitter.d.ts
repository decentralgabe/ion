import IEventEmitter from './interfaces/IEventEmitter';
/**
 * Event emitter used in Sidetree.
 * Intended to be machine readable for triggering custom handlers.
 */
export default class EventEmitter {
    private static customEvenEmitter;
    /**
     * Initializes with custom event emitter if given.
     */
    static initialize(customEventEmitter?: IEventEmitter): void;
    /**
     * Emits an event.
     */
    static emit(eventCode: string, eventData?: {
        [property: string]: any;
    }): Promise<void>;
}
