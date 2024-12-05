var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AdbUsbSocket_closed, _AdbUsbTransport_disconnected;
import { AdbBanner, unreachable, } from "@yume-chan/adb";
import { ReadableStream } from "@yume-chan/stream-extra";
// import { WebSocket } from "@yume-chan/undici-browser";
import { PromiseResolver } from "@yume-chan/async";
import { DuplexStreamFactory } from "@yume-chan/stream-extra";
import { ConsumableWritableStream } from "@yume-chan/stream-extra";
export class AdbUsbSocket {
    // uses ws
    constructor(service, wsUrl) {
        _AdbUsbSocket_closed.set(this, new PromiseResolver());
        this.service = service;
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';
        console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
        const duplex = new DuplexStreamFactory({
            close: () => {
                this.ws.close();
            },
        });
        const connectionReady = new Promise((resolve, reject) => {
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
            __classPrivateFieldGet(this, _AdbUsbSocket_closed, "f").resolve();
        };
        this.readable = duplex.wrapReadable(new ReadableStream({
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
        }));
        this.writable = duplex.createWritable(new ConsumableWritableStream({
            write: (chunk) => __awaiter(this, void 0, void 0, function* () {
                console.log("Attempting to write to WebSocket");
                yield connectionReady;
                console.log("WebSocket connection is ready, sending chunk");
                this.ws.send(chunk);
                console.log("Chunk written:", chunk);
            }),
        }));
    }
    get closed() {
        return __classPrivateFieldGet(this, _AdbUsbSocket_closed, "f").promise;
    }
    close() {
        __classPrivateFieldGet(this, _AdbUsbSocket_closed, "f").resolve();
    }
}
_AdbUsbSocket_closed = new WeakMap();
export class AdbUsbTransport {
    constructor(options) {
        _AdbUsbTransport_disconnected.set(this, new PromiseResolver());
        const url = new URL(options.wsUrl);
        const params = url.searchParams;
        this.wsUrl = `${url.protocol}//${url.host}${url.pathname}`;
        this._serial = params.get('serial') || '';
        this._maxPayloadSize = parseInt(params.get('maxPayload') || '4096');
        this._service = params.get('service') || '';
        const bannerStr = params.get('banner');
        if (bannerStr) {
            const bannerString = decodeURIComponent(bannerStr);
            console.log(bannerString);
            this._banner = AdbBanner.parse(bannerString);
            console.log(this._banner);
        }
        else {
            this._banner = new AdbBanner("device", "host", "tls", []);
        }
    }
    connect(service) {
        console.log('inside transport connect');
        const wsUrlWithService = `${this.wsUrl}${this.wsUrl.includes('?') ? '&' : '?'}service=${encodeURIComponent(service !== null && service !== void 0 ? service : this._service)}`;
        // @ts-ignore
        return Promise.resolve(new AdbUsbSocket(service !== null && service !== void 0 ? service : this._service, wsUrlWithService));
    }
    get serial() {
        return this._serial;
    }
    get maxPayloadSize() {
        return this._maxPayloadSize;
    }
    get banner() {
        return this._banner;
    }
    get disconnected() {
        return __classPrivateFieldGet(this, _AdbUsbTransport_disconnected, "f").promise;
    }
    addReverseTunnel(handler, address) {
        if (!address) {
            const id = Math.random().toString().substring(2);
            address = `localabstract:reverse_${id}`;
        }
        // Here we can add WebSocket-specific handling for reverse tunnels
        // Could involve setting up a new WebSocket connection for the tunnel
        return address;
    }
    removeReverseTunnel(address) {
    }
    clearReverseTunnels() {
    }
    close() {
        __classPrivateFieldGet(this, _AdbUsbTransport_disconnected, "f").resolve();
    }
}
_AdbUsbTransport_disconnected = new WeakMap();
