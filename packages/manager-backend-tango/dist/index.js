import express from 'express';
import { WebSocketServer } from "ws";
import { AdbBanner, AdbBannerKey, AdbServerClient } from '@yume-chan/adb';
import { AdbServerNodeTcpConnector } from "@yume-chan/adb-server-node-tcp";
import { Server as HttpServer } from 'http';
import { WritableStream } from '@yume-chan/stream-extra';
import cors from 'cors';
import { config } from 'config';
const app = express();
app.use(cors({
    origin: 'http://localhost:5050',
    credentials: true
}));
const port = config.TANGO_BACKEND_MANAGER_PORT;
const server = new HttpServer(app);
// WebSocket server for device communication
const wss = new WebSocketServer({ noServer: true });
// Setup AdbServerClient with a TCP connector for Node.js
const connector = new AdbServerNodeTcpConnector({ port: 5037 });
const client = new AdbServerClient(connector);
async function listDevices() {
    const devices = await client.getDevices();
    return devices.map(device => ({
        serial: device.serial,
        product: device.product,
        model: device.model,
        transportId: device.transportId.toString(),
    }));
}
// Get connected devices
app.get('/devices', async (req, res) => {
    try {
        const devices = await listDevices();
        const deviceInfo = await Promise.all(devices.map(async (device) => {
            const transport = await client.createTransport(device);
            const banner = new AdbBanner(device.product, device.model, device.serial, ['cmd', 'stat_v2', 'shell_v2']);
            // Convert banner to string format
            const bannerString = `::${[
                `${AdbBannerKey.Product}=${banner.product}`,
                `${AdbBannerKey.Model}=${banner.model}`,
                `${AdbBannerKey.Device}=${banner.device}`,
                `${AdbBannerKey.Features}=${banner.features.join(',')}`
            ].join(';')}`;
            return {
                ...device,
                maxPayloadSize: transport.maxPayloadSize,
                banner: bannerString,
                wsUrl: `ws://localhost:${port}/device/${device.transportId}?serial=${device.serial}&maxPayload=${transport.maxPayloadSize}&banner=${encodeURIComponent(bannerString)}&service=${encodeURIComponent('')}`
            };
        }));
        res.json(deviceInfo);
    }
    catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Failed to retrieve devices' });
    }
});
// WebSocket connection handler for each device
async function handleDeviceWebSocket(ws, transportId, req) {
    console.log('handling connection....');
    try {
        const device = (await client.getDevices()).find(d => d.transportId === transportId);
        if (!device)
            throw new Error("Device not found");
        const transport = await client.createTransport(device);
        // Get service from URL parameters
        const url = new URL(req.url, `http://${req.headers.host}`);
        const service = decodeURIComponent(url.searchParams.get('service') || '');
        console.log('Connecting to service:', service);
        const adbSocket = await transport.connect(service);
        const writer = adbSocket.writable.getWriter();
        // Send binary data to match client's arraybuffer expectation
        ws.binaryType = 'arraybuffer';
        // Set up WebSocket event handlers first
        ws.on('message', async (data) => {
            try {
                const uint8Data = new Uint8Array(data instanceof Buffer ? data : data);
                await writer.write(uint8Data);
            }
            catch (error) {
                console.error('Error writing to socket:', error);
                ws.close();
            }
        });
        ws.on('error', () => {
            writer.releaseLock();
            adbSocket.close();
            transport.close();
        });
        ws.on('close', async () => {
            try {
                writer.releaseLock();
                await adbSocket.close();
                await transport.close();
            }
            catch (error) {
                console.error('Error during cleanup:', error);
            }
        });
        adbSocket.readable
            .pipeTo(new WritableStream({
            write(chunk) {
                if (ws.readyState === ws.OPEN) {
                    ws.send(chunk.buffer, { binary: true });
                }
            },
            close() {
                ws.close();
            },
            abort(reason) {
                console.error('Stream aborted:', reason);
                ws.close();
            }
        }))
            .catch(error => {
            console.error('Stream pipeline error:', error);
            ws.close();
        });
    }
    catch (error) {
        console.error(`Failed to handle WebSocket connection: ${error?.message ?? 'Unknown error'}`);
        ws.close();
    }
}
server.on('upgrade', async (req, socket, head) => {
    console.log('Upgrade request received for URL:', req.url);
    const match = req.url?.match(/\/device\/(\d+)/);
    if (match) {
        const transportId = BigInt(match[1]);
        console.log(`Parsed transport ID: ${transportId}`);
        wss.handleUpgrade(req, socket, head, async (ws) => {
            wss.emit('connection', ws, req);
            console.log('Upgrade successful, establishing WebSocket connection');
            await handleDeviceWebSocket(ws, transportId, req);
        });
    }
    else {
        console.log('No matching route for URL:', req.url);
        socket.destroy();
    }
});
app.get('/test', (req, res) => {
    res.send('Server is running on port 3000');
});
server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
