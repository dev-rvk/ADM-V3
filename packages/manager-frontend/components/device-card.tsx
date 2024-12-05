import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import {config} from "config";

interface DeviceProps {
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
    onStartServer: () => void;
    onClickConnect: () => void;
}

const PORT = config.MANAGER_BACKEND_PORT;

export function DeviceCard({
    model,
    manufacturer,
    version,
    codename,
    specs,
    serial,
    ip: initialIp,
    port: initialPort,
    wsUrl,
    connectionType,
    onStartServer,
    onClickConnect,
}: DeviceProps) {
    const [ip, setIp] = useState("");
    const [port, setPort] = useState("5555");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        try {
            const response = await fetch(
                `http://localhost:${PORT}/connect-adb-wifi`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        deviceSerial: serial,
                        deviceIP: ip,
                        port: parseInt(port),
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            console.log("Device connected:", data);
            window.location.reload();
        } catch (err) {
            console.error("Connection error:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-center mb-4">
                    <Smartphone className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="text-center text-2xl font-bold">
                    {model}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-sm font-medium text-muted-foreground">
                        Manufacturer
                    </div>
                    <div className="text-sm text-right">{manufacturer}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Version
                    </div>
                    <div className="text-sm text-right">{version}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Codename
                    </div>
                    <div className="text-sm text-right">{codename}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Specs
                    </div>
                    <div className="text-sm text-right">{specs}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Serial
                    </div>
                    <div className="text-sm text-right">{serial}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Connection Type
                    </div>
                    <div className="text-sm text-right">{connectionType}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                        IP
                    </div>
                    <div className="text-sm text-right">
                        {initialIp || "N/A"}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Port
                    </div>
                    <div className="text-sm text-right">
                        {initialPort || "N/A"}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        WS URL
                    </div>
                    <div className="text-sm text-right">{wsUrl || "N/A"}</div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <div className="flex justify-between w-full">
                    <Button
                        onClick={onStartServer}
                        disabled={wsUrl !== null || connectionType === "USB"}
                    >
                        Start Server
                    </Button>
                    <Button disabled={wsUrl === null} onClick={onClickConnect}>
                        Connect
                    </Button>
                </div>

                {connectionType === "USB" && (
                    <form onSubmit={handleConnect} className="w-full">
                        <div className="flex flex-col gap-2">
                            <Input
                                type="text"
                                placeholder="Device IP"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                required
                            />
                            <Input
                                type="number"
                                placeholder="Port"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                required
                            />
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : error ? (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                    "Connect Over Wi-Fi"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </CardFooter>
        </Card>
    );
}
