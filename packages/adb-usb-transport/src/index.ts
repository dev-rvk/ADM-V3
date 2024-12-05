import {
    AdbBanner, AdbFeature,
    type AdbIncomingSocketHandler,
    type AdbSocket,
    type AdbTransport,
    unreachable,
} from "@yume-chan/adb";
import { Consumable, ReadableStream, WritableStream } from "@yume-chan/stream-extra";
// import { WebSocket } from "@yume-chan/undici-browser";
import { PromiseResolver } from "@yume-chan/async";
import type { ValueOrPromise } from "@yume-chan/struct";
import { DuplexStreamFactory } from "@yume-chan/stream-extra";
import { ConsumableWritableStream } from "@yume-chan/stream-extra";



export class AdbUsbSocket implements AdbSocket {
    service: string;
    readable: ReadableStream<Uint8Array>;
    // @ts-ignore
    writable: WritableStream<Consumable<Uint8Array>>;
    private ws: WebSocket;
    #closed = new PromiseResolver<void>();

    // uses ws
    constructor(service: string, wsUrl: string) {
        this.service = service;
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        console.log(`Attempting to connect to WebSocket at ${wsUrl}`);

        const duplex = new DuplexStreamFactory<Uint8Array, Consumable<Uint8Array>>({
            close: () => {
                this.ws.close();
            },
        });

        const connectionReady = new Promise<void>((resolve, reject) => {
            this.ws.onopen = () => {
                console.log("WebSocket connection opened");
                resolve();
            };
            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                reject(new Error("WebSocket connection failed"));
            };
        });

        this.ws.onclose = (event) => {
            console.log("WebSocket connection closed:", event);
            duplex.dispose().catch(unreachable);
            this.#closed.resolve();
        };

        this.readable = duplex.wrapReadable(
            new ReadableStream({
                start: (controller) => {
                    this.ws.onmessage = (event) => {
                        console.log("Received data in readable stream");
                        controller.enqueue(new Uint8Array(event.data));
                    };
                },
            }, {
                highWaterMark: 16 * 1024,
                size(chunk) {
                    return chunk.byteLength;
                },
            }),
        );

        this.writable = duplex.createWritable(
            new ConsumableWritableStream({
                write: async (chunk) => {
                    console.log("Attempting to write to WebSocket");
                    await connectionReady;
                    console.log("WebSocket connection is ready, sending chunk");
                    this.ws.send(chunk);
                    console.log("Chunk written:", chunk);
                },
            }),
        );
    }



    get closed() {
        return this.#closed.promise;
    }

    close(): ValueOrPromise<void> {
        this.#closed.resolve();
    }
}

interface AdbUsbTransportOptions {
    wsUrl: string;
}

export class AdbUsbTransport implements AdbTransport {
    readonly wsUrl: string;
    readonly _serial: string;
    readonly _maxPayloadSize: number;
    readonly _banner: AdbBanner;
    readonly _service: string;
    // @ts-ignore
    readonly clientFeatures: readonly AdbFeature[] | undefined;

    constructor(options: AdbUsbTransportOptions) {
        const url = new URL(options.wsUrl);
        const params = url.searchParams;

        this.wsUrl = `${url.protocol}//${url.host}${url.pathname}`;
        this._serial = params.get('serial') || '';
        this._maxPayloadSize = parseInt(params.get('maxPayload') || '4096');
        this._service = params.get('service') || '';



        const bannerStr = params.get('banner');
        if (bannerStr) {
            const bannerString = decodeURIComponent(bannerStr);
            console.log(bannerString)
            this._banner = AdbBanner.parse(bannerString);
            console.log(this._banner)
        } else {
            this._banner = new AdbBanner("device", "host", "tls", []);
        }
    }

    connect(service?: string): Promise<AdbSocket> {
        console.log('inside transport connect')
        const wsUrlWithService = `${this.wsUrl}${this.wsUrl.includes('?') ? '&' : '?'}service=${encodeURIComponent(service ?? this._service)}`;
        // @ts-ignore
        return Promise.resolve(new AdbUsbSocket(service ?? this._service, wsUrlWithService));
    }

    get serial(): string {
        return this._serial;
    }

    get maxPayloadSize(): number {
        return this._maxPayloadSize;
    }

    get banner(): AdbBanner {
        return this._banner;
    }

    #disconnected = new PromiseResolver<void>();
    get disconnected(): Promise<void> {
        return this.#disconnected.promise;
    }

    addReverseTunnel(
        handler: AdbIncomingSocketHandler,
        address?: string
    ): ValueOrPromise<string> {
        if (!address) {
            const id = Math.random().toString().substring(2);
            address = `localabstract:reverse_${id}`;
        }

        // Here we can add WebSocket-specific handling for reverse tunnels
        // Could involve setting up a new WebSocket connection for the tunnel

        return address;
    }

    removeReverseTunnel(address: string): ValueOrPromise<void> {

    }

    clearReverseTunnels(): ValueOrPromise<void> {

    }

    close(): ValueOrPromise<void> {
        this.#disconnected.resolve();
    }


}
