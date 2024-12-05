import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { AdbServerNodeTcpConnector } from "@yume-chan/adb-server-node-tcp";
import { AdbServerClient } from "@yume-chan/adb";
const app = express();
const port = 3000;
const server = http.createServer(app);
let adbClient;
const deviceSocketMap = new Map();
const deviceWebSocketServers = new Map();
// Initialize the ADB client with Node.js TCP connector
async function initializeAdbClient() {
    const connector = new AdbServerNodeTcpConnector({
        host: "localhost",
        port: 5037,
    });
    adbClient = new AdbServerClient(connector);
    console.log("ADB Client initialized");
}
// Create a WebSocket server for each device
async function createWebSocketServerForDevice(serial) {
    const deviceWebSocketServer = new WebSocketServer({ noServer: true });
    deviceWebSocketServers.set(serial, deviceWebSocketServer);
    // Handle WebSocket connections for this specific device
    deviceWebSocketServer.on("connection", async (ws) => {
        let deviceSocket = null;
        try {
            const device = (await adbClient.getDevices()).find((d) => d.serial === serial);
            if (!device) {
                ws.send(JSON.stringify({ error: "Device not found" }));
                return;
            }
            const transport = await adbClient.createTransport(device);
            deviceSocket = await transport.connect(""); // Connecting to "shell" as an example
            // Store the socket
            deviceSocketMap.set(serial, deviceSocket);
            // Read data from device socket and send it to WebSocket client
            const reader = deviceSocket.readable.getReader();
            const readLoop = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        ws.send(value);
                    }
                }
                catch (error) {
                    console.error("Error reading from device:", error);
                }
                finally {
                    reader.releaseLock();
                }
            };
            await readLoop();
            // Handle messages from WebSocket client to device
            ws.on("message", async (message) => {
                const data = JSON.parse(message.toString());
                if (data.type === "write" && deviceSocket && data.payload) {
                    const writer = deviceSocket.writable.getWriter();
                    await writer.write(Uint8Array.from(data.payload));
                    writer.releaseLock();
                }
            });
            // Cleanup on WebSocket close
            ws.on("close", () => {
                if (deviceSocket) {
                    deviceSocket.close();
                    deviceSocketMap.delete(serial);
                }
            });
        }
        catch (error) {
            console.error("Error handling WebSocket connection for device:", error);
            ws.send(JSON.stringify({ error: "Failed to connect to device" }));
        }
    });
    return deviceWebSocketServer;
}
// Fetch device list and return it with WebSocket URLs
app.get("/api/devices", async (req, res) => {
    try {
        const devices = await adbClient.getDevices();
        const deviceInfoList = await Promise.all(devices.map(async (device) => {
            // If the WebSocket server for this device doesn't exist, create it
            if (!deviceWebSocketServers.has(device.serial)) {
                await createWebSocketServerForDevice(device.serial);
            }
            const wsUrl = `ws://localhost:${port}/ws/${device.serial}`;
            return { serial: device.serial, model: device.model, wsUrl };
        }));
        res.json(deviceInfoList);
    }
    catch (error) {
        console.error("Error fetching devices:", error);
        res.status(500).send("Failed to fetch devices");
    }
});
// Upgrade HTTP requests to WebSocket requests for specific device paths
server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const serial = url.pathname.split("/").pop();
    if (serial && deviceWebSocketServers.has(serial)) {
        const deviceWSS = deviceWebSocketServers.get(serial);
        deviceWSS.handleUpgrade(request, socket, head, (ws) => {
            deviceWSS.emit("connection", ws, request);
        });
    }
    else {
        socket.destroy();
    }
});
// Start the server and initialize ADB client
server.listen(port, async () => {
    await initializeAdbClient();
    console.log(`Server running at http://localhost:${port}`);
});
