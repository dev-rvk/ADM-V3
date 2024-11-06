import express from "express";
import Adb from "@devicefarmer/adbkit";
import { createProxy } from "./websockify";
import cors from "cors";

const { MANAGER_BACKEND_PORT, MANAGER_FRONTEND_URL } = require("config");

const corsOptions = {
    origin: MANAGER_FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
};

const app = express();
const client = Adb.createClient();
app.use(express.json());
app.use(cors(corsOptions));

interface DeviceInfo {
    id: string;
    model: string | "";
    manufacturer: string | "";
    version: string | "";
    codename: string | "";
    specs: string | "";
    serial: string;
    ip: string | "";
    port: number | null;
    wsUrl: string | null;
    connectionType: "USB" | "WIFI";
}
const devices: Record<string, DeviceInfo> = {};

// Track devices as they connect and disconnect
client
    .trackDevices()
    .then(
        (tracker: {
            on: (
                event: string,
                callback: (device: { id: string }) => void,
            ) => void;
        }) => {
            tracker.on("add", async (device: { id: string }) => {
                console.log(`Device ${device.id} connected`);
                await updateDeviceInfo(device.id);
            });

            tracker.on("remove", (device: { id: string }) => {
                console.log(`Device ${device.id} disconnected`);
                delete devices[device.id];
            });
        },
    )
    .catch((err: { stack: any }) => {
        console.error("Error tracking devices:", err.stack);
    });

// Function to update device information
async function updateDeviceInfo(deviceId: string) {
    try {
        const device = client.getDevice(deviceId);

        // First check if device is available
        let retryCount = 0;
        while (retryCount < 3) {
            try {
                await device.shell('echo "Device is online"');
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === 1) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                } else if (retryCount === 2) {
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                } else {
                    console.log(
                        `Device ${deviceId} is offline after retries, skipping info update`,
                    );
                    devices[deviceId] = {
                        id: deviceId,
                        model: "",
                        manufacturer: "",
                        version: "",
                        codename: "",
                        specs: "",
                        serial: deviceId,
                        ip: "",
                        port: null,
                        wsUrl: null,
                        connectionType: deviceId.includes(":") ? "WIFI" : "USB",
                    };
                    return;
                }
            }
        }
        const properties = await device.getProperties();
        const ip = await device.getDHCPIpAddress().catch(() => "");

        devices[deviceId] = {
            id: deviceId,
            model: properties["ro.product.vendor.brand"] || "",
            manufacturer: properties["ro.product.vendor.manufacturer"] || "",
            version:
                properties["ro.vendor.build.version.release_or_codename"] || "",
            codename: properties["ro.product.vendor.device"] || "",
            specs: properties["ro.product.vendor.manufacturer"] || "",
            serial: deviceId,
            ip: ip,
            port: null,
            wsUrl: null,
            connectionType: deviceId.includes(":") ? "WIFI" : "USB",
        };
    } catch (err) {
        console.error(`Error updating info for device ${deviceId}:`, err);
    }
}

// Endpoint to list all connected devices
app.get("/devices", (req, res) => {
    res.json(Object.values(devices));
});

// Endpoint to start WebSocket server for a specified device
app.post("/start-ws-wifi", async (req, res): Promise<any> => {
    const { deviceSerial } = req.body;

    // Find the device by serial
    const device = Object.values(devices).find(
        (d) => d.serial === deviceSerial,
    );

    if (!device) {
        return res
            .status(404)
            .json({ status: "error", message: "Device not found" });
    }

    if (device.connectionType === "USB") {
        return res.status(400).json({
            status: "error",
            message:
                "Device is connected via USB. Only WIFI connections are supported.",
        });
    }

    // Extract IP and port from device ID for WIFI devices
    const [deviceIP, devicePort] = device.id.split(":");

    // If the WebSocket server is already running, return the existing WebSocket URL
    if (device.wsUrl) {
        return res.json({
            status: "success",
            message: "WebSocket proxy already started",
            wsUrl: device.wsUrl,
        });
    }

    // Start a new WebSocket server
    const wsPort = 10000 + parseInt(devicePort);
    try {
        createProxy({
            sourcePort: wsPort,
            targetHost: deviceIP,
            targetPort: parseInt(devicePort),
        });

        const wsUrl = `ws://localhost:${wsPort}`;
        device.wsUrl = wsUrl;
        device.port = parseInt(devicePort);

        res.json({
            status: "success",
            message: "WebSocket proxy started",
            wsUrl: wsUrl,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.post("/connect-adb-wifi", async (req, res): Promise<any> => {
    try {
        const { deviceSerial, port, deviceIP } = req.body;
        if (!deviceSerial || !port || !deviceIP) {
            return res.status(400).json({
                message: "Device serial, port and IP address are required",
            });
        }
        // Find the specific device by serial
        const targetDevice = Object.values(devices).find(
            (d) => d.serial === deviceSerial,
        );
        if (!targetDevice) {
            return res
                .status(404)
                .json({ message: "Specified device not found" });
        }

        // Connect the specific device
        const device = client.getDevice(targetDevice.id);

        // Try to connect with retry mechanism for authorization and longer delays
        let connectedDevice;
        let retries = 0;
        const maxRetries = 15;

        while (retries < maxRetries) {
            try {
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Longer initial delay
                await device.tcpip(port); // Switching to TCP/IP mode
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait after TCP/IP mode switch

                // Verify device is still available
                await device.waitForDevice();
                await new Promise((resolve) => setTimeout(resolve, 3000));

                // Attempt connection
                connectedDevice = await client.connect(deviceIP, port);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                break;
            } catch (e) {
                retries++;
                console.log(`Retry attempt ${retries} of ${maxRetries}`);
                if (retries === maxRetries) {
                    throw new Error(
                        "Failed to connect after multiple attempts. Please check device authorization and ensure device is still connected.",
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 4000));
            }
        }
        // disconnect the device usb connection
        await device.detach();

        res.json({
            message: "Device connected over Wi-Fi",
            deviceId: connectedDevice,
            ip: deviceIP,
            port,
        });
    } catch (error) {
        console.error("Error connecting device over Wi-Fi:", error);
        res.status(500).json({
            message: "Failed to connect device over Wi-Fi",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// Start the server
const PORT = MANAGER_BACKEND_PORT;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
