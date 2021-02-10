/// <reference types="node" />
import EventEmitter from 'events';
import { SignalClient } from './SignalClient';
import SimplePeer from 'simple-peer';
declare type MeshOptions = {
    signalsUrl: string;
    appName: string;
    simplePeer?: SimplePeer.Options;
};
export declare interface Mesh {
    on(event: 'close', listener: () => void): this;
    on(event: 'peer', listener: (peer: SimplePeer.Instance, id: string) => void): this;
    on(event: 'connect', listener: (peer: SimplePeer.Instance, id: string) => void): this;
}
export declare class Mesh extends EventEmitter {
    signals: SignalClient;
    me: string;
    channels: {
        all: string;
        me: string;
    };
    closed: boolean;
    maxPeers: number;
    simplePeerOptions?: SimplePeer.Options;
    peers: SimplePeer.Instance[];
    remotes: Record<string, SimplePeer.Instance>;
    constructor({ signalsUrl, appName, simplePeer }: MeshOptions);
    toChannel(id: string): string;
    join(): void;
    listen(): void;
    setup(peer: SimplePeer.Instance, id: string): void;
    close(): Promise<void>;
}
export {};
