import { AdbBanner, AdbFeature, type AdbIncomingSocketHandler, type AdbSocket, type AdbTransport } from "@yume-chan/adb";
import { Consumable, ReadableStream, WritableStream } from "@yume-chan/stream-extra";
import type { ValueOrPromise } from "@yume-chan/struct";
export declare class AdbUsbSocket implements AdbSocket {
    #private;
    service: string;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Consumable<Uint8Array>>;
    private ws;
    constructor(service: string, wsUrl: string);
    get closed(): Promise<void>;
    close(): ValueOrPromise<void>;
}
interface AdbUsbTransportOptions {
    wsUrl: string;
}
export declare class AdbUsbTransport implements AdbTransport {
    #private;
    readonly wsUrl: string;
    readonly _serial: string;
    readonly _maxPayloadSize: number;
    readonly _banner: AdbBanner;
    readonly _service: string;
    readonly clientFeatures: readonly AdbFeature[] | undefined;
    constructor(options: AdbUsbTransportOptions);
    connect(service?: string): Promise<AdbSocket>;
    get serial(): string;
    get maxPayloadSize(): number;
    get banner(): AdbBanner;
    get disconnected(): Promise<void>;
    addReverseTunnel(handler: AdbIncomingSocketHandler, address?: string): ValueOrPromise<string>;
    removeReverseTunnel(address: string): ValueOrPromise<void>;
    clearReverseTunnels(): ValueOrPromise<void>;
    close(): ValueOrPromise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map