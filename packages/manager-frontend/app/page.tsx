"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { DeviceCard } from "@/components/device-card";
import {config} from "config";


// import { AddDeviceForm } from '@/components/add-device-form'

const PORT = config.MANAGER_BACKEND_PORT;
// Update this with your actual backend URL
const BACKEND_URL = `http://localhost:${PORT}`;
// Local app url
// const ADM_BASE = 'http://localhost:5050'
const ADM_BASE_GITHUB = "https://dev-rvk.github.io/adm-emulator";

interface Device {
    id: string;
    model: string;
    manufacturer: string;
    version: string;
    codename: string;
    specs: string;
    serial: string;
    ip: string;
    port: number | null;
    wsUrl: string | null;
    connectionType: "USB" | "WIFI";
}

export default function DeviceManagement() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/devices`);
            const data = await response.json();
            setDevices(data);
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setLoading(false);
        }
    };

    const startServer = async (deviceSerial: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/start-ws-wifi`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ deviceSerial }),
            });
            if (response.ok) {
                // Refetch devices to get updated information
                await fetchDevices();
            } else {
                console.error("Failed to start server");
            }
        } catch (error) {
            console.error("Error starting server:", error);
        }
    };

    // const addDevice = async (name: string, ip: string) => {
    //   // This function is left as is for now
    //   console.log('Adding device:', name, ip)
    // }

    return (
        <div className="container mx-auto p-4">
            <div className="text-center mb-10 relative">
                <h1 className="text-2xl font-bold mb-4">Device Management</h1>
                <button
                    onClick={fetchDevices}
                    className="absolute right-0 top-0 p-2 hover:bg-gray-100 rounded-full"
                    disabled={loading}
                >
                    <RefreshCw
                        className={`h-6 w-6 ${loading ? "animate-spin" : ""}`}
                    />
                </button>
                <hr></hr>
            </div>
            {/* <AddDeviceForm onAddDevice={addDevice} /> */}

            {loading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => (
                    <DeviceCard
                        key={device.id}
                        {...device}
                        onStartServer={() => startServer(device.serial)}
                        onClickConnect={() => {
                            if (device.wsUrl) {
                                window.open(
                                    `${ADM_BASE_GITHUB}/?wsUrl=${device.wsUrl}`,
                                    "_blank",
                                );
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
