/// <reference types="node" />
import { EventEmitter } from 'events';
import { Client, Message, Subscription } from 'faye';
export declare interface SignalClient {
    on(event: 'ready', listener: () => void): this;
    on(event: 'data', listener: (channel: string, message: Message) => void): this;
}
export declare class SignalClient extends EventEmitter {
    app: string;
    faye: Client;
    subscriptions: Subscription[];
    constructor(url: string, app: string);
    subscribe(channel: string): void;
    publish(channel: string, message: Message): Promise<void>;
    close(): void;
}
