import EventEmitter from 'events';

class EventData {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

class EventEmitterService extends EventEmitter {
    constructor() {
        super();
        if (EventEmitterService.instance) {
            return EventEmitterService.instance;
        }
        EventEmitterService.instance = this;
    }

    emitEvent(eventData) {
        this.emit(eventData.type, eventData);
    }
    subscribe(type, listener) {
        this.on(type, listener)
    }
}

const eventEmitterService = new EventEmitterService();

export { EventData, eventEmitterService, EventEmitterService };
