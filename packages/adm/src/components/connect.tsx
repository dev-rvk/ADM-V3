import {
    DefaultButton,
    Dialog,
    Dropdown,
    IDropdownOption,
    PrimaryButton,
    ProgressIndicator,
    Stack,
    StackItem,
    TextField,

} from "@fluentui/react";
import {
    Adb,
    AdbDaemonDevice,
    AdbDaemonTransport,
    AdbPacketData,
    AdbPacketInit,
} from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import AdbDaemonDirectSocketsDevice from "@yume-chan/adb-daemon-direct-sockets";
import AdbDaemonWebSocketDevice from "@yume-chan/adb-daemon-ws";
import {
    Consumable,
    InspectStream,
    ReadableStream,
    WritableStream,
    pipeFrom,
} from "@yume-chan/stream-extra";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GLOBAL_STATE } from "../state";
import { CommonStackTokens, Icons } from "../utils";
import { useRouter } from "next/router";
// import {AdbPacketSerializeStream, AdbPacketDispatcher} from "@yume-chan/adb";
import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";

import { AdbUsbTransport } from "adb-usb-transport";
// import { AdbUsbTransport } from "../utils/AdbUsbTransport";

const DropdownStyles = { dropdown: { width: "100%" } };

const CredentialStore = new AdbWebCredentialStore();

function ConnectCore(): JSX.Element | null {
    const [selected, setSelected] = useState<AdbDaemonDevice | undefined>();
    const [connecting, setConnecting] = useState(false);
    const [usbSupported, setUsbSupported] = useState(true);
    const [usbDeviceList, setUsbDeviceList] = useState<AdbDaemonDevice[]>([]);

    const handleSelectedChange = (
        e: React.FormEvent<HTMLDivElement>,
        option?: IDropdownOption,
    ) => {
        setSelected(option?.data as AdbDaemonDevice);
    };

    const updateUsbDeviceList = useCallback(async () => {
        try{
            const devices: AdbDaemonDevice[] =
                await AdbDaemonWebUsbDeviceManager.BROWSER!.getDevices();
            setUsbDeviceList(devices);
            return devices;
        } catch (error: any) {
            setUsbSupported(false);
            GLOBAL_STATE.showErrorDialog(` Browser not Supported ${error}`);
        }

    }, []);

    const router = useRouter();
    const { wsUrl } = router.query;

    // Handle initial websocket URL setup
    useEffect(() => {
        if (wsUrl && typeof wsUrl === "string") {
            const existingDevices = webSocketDeviceList.find(
                (device) => device.serial === wsUrl,
            );
            if (!existingDevices) {
                setWebSocketDeviceList((list) => {
                    return [...list, new AdbDaemonWebSocketDevice(wsUrl)];
                });
            }
        }
    }, [wsUrl]);

    // Hide UI when auto-connecting
    let showConnectUI = !wsUrl || !!GLOBAL_STATE.adb;
    // Auto-connect when device is selected and wsUrl is present
    useEffect(() => {
        if (
            wsUrl &&
            selected?.serial === wsUrl &&
            !GLOBAL_STATE.adb &&
            !connecting
        ) {
            connect().then(r => {
                 // eslint-disable-next-line react-hooks/exhaustive-deps
                showConnectUI = false;
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, wsUrl, connecting]);

    const [webSocketDeviceList, setWebSocketDeviceList] = useState<
        AdbDaemonWebSocketDevice[]
    >([]);
    useEffect(() => {
        const savedList = localStorage.getItem("ws-backend-list");
        if (!savedList) {
            return;
        }

        const parsed = JSON.parse(savedList) as { address: string }[];
        setWebSocketDeviceList(
            parsed.map((x) => new AdbDaemonWebSocketDevice(x.address)),
        );
    }, []);

    const addWebSocketDevice = useCallback(() => {
        const address = window.prompt("Enter the address of WebSockify server");
        if (!address) {
            return;
        }
        setWebSocketDeviceList((list) => {
            const copy = list.slice();
            copy.push(new AdbDaemonWebSocketDevice(address));
            globalThis.localStorage.setItem(
                "ws-backend-list",
                JSON.stringify(copy.map((x) => ({ address: x.serial }))),
            );
            return copy;
        });
    }, []);

    const [wsUrlUSB, setWsUrlUSB] = useState<string>('');

    const connectUsbDevice = useCallback(async () => {
        console.log('connecting....')
        try{
            // @ts-ignore
            const device = new Adb(new AdbUsbTransport(
                {wsUrl: wsUrlUSB}
            ));

            console.log(device)
            GLOBAL_STATE.setDevice(undefined, device);

            device.disconnected.then(() => {
                console.log('Device disconnected');
                GLOBAL_STATE.setDevice(undefined, undefined);
            });

            console.log(GLOBAL_STATE.adb)


            const serial = GLOBAL_STATE.adb?.serial;
            console.log("Device serial:", serial);

            // await GLOBAL_STATE.adb?.power.powerOff()
            // console.log('Device powered off');

        }catch (e: any) {
            GLOBAL_STATE.showErrorDialog(e);
        }
    }, [wsUrlUSB]);


    const [tcpDeviceList, setTcpDeviceList] = useState<
        AdbDaemonDirectSocketsDevice[]
    >([]);
    useEffect(() => {
        if (!AdbDaemonDirectSocketsDevice.isSupported()) {
            return;
        }

        const savedList = localStorage.getItem("tcp-backend-list");
        if (!savedList) {
            return;
        }

        const parsed = JSON.parse(savedList) as {
            address: string;
            port: number;
        }[];
        setTcpDeviceList(
            parsed.map(
                (x) => new AdbDaemonDirectSocketsDevice(x.address, x.port),
            ),
        );
    }, []);

    const addTcpDevice = useCallback(() => {
        const host = window.prompt("Enter the address of device");
        if (!host) {
            return;
        }

        const port = window.prompt("Enter the port of device", "5555");
        if (!port) {
            return;
        }

        const portNumber = Number.parseInt(port, 10);

        setTcpDeviceList((list) => {
            const copy = list.slice();
            copy.push(new AdbDaemonDirectSocketsDevice(host, portNumber));
            globalThis.localStorage.setItem(
                "tcp-backend-list",
                JSON.stringify(
                    copy.map((x) => ({
                        address: x.host,
                        port: x.port,
                    })),
                ),
            );
            return copy;
        });
    }, []);



    const connect = useCallback(async () => {
        if (!selected) {
            return;
        }

        setConnecting(true);

        let readable: ReadableStream<AdbPacketData>;
        let writable: WritableStream<Consumable<AdbPacketInit>>;
        try {
            const streams = await selected.connect();

            // Use `InspectStream`s to intercept and log packets
            readable = streams.readable.pipeThrough(
                new InspectStream((packet) => {
                    GLOBAL_STATE.appendLog("in", packet);
                }),
            );

            writable = pipeFrom(
                streams.writable,
                new InspectStream((packet: Consumable<AdbPacketInit>) => {
                    GLOBAL_STATE.appendLog("out", packet.value);
                }),
            );
        } catch (e: any) {
            GLOBAL_STATE.showErrorDialog(e);
            setConnecting(false);
            return;
        }

        async function dispose() {
            // Adb won't close the streams,
            // so manually close them.
            try {
                await readable.cancel();
            } catch {}
            try {
                await writable.close();
            } catch {}
            GLOBAL_STATE.setDevice(undefined, undefined);
        }

        try {
            const device = new Adb(
                await AdbDaemonTransport.authenticate({
                    serial: selected.serial,
                    connection: { readable, writable },
                    credentialStore: CredentialStore,
                }),
            );

            device.disconnected.then(
                async () => {
                    await dispose();
                },
                async (e) => {
                    GLOBAL_STATE.showErrorDialog(e);
                    await dispose();
                },
            );

            GLOBAL_STATE.setDevice(selected, device);
        } catch (e: any) {
            GLOBAL_STATE.showErrorDialog(e);
            await dispose();
        } finally {
            setConnecting(false);
        }
    }, [selected]);

    const disconnect = useCallback(async () => {
        try {
            await GLOBAL_STATE.adb!.close();
        } catch (e: any) {
            GLOBAL_STATE.showErrorDialog(e);
        }
    }, []);

    const deviceList = useMemo(
        () => ([] as AdbDaemonDevice[]).concat(
            webSocketDeviceList,
            usbDeviceList,
            tcpDeviceList
        ),
        [webSocketDeviceList, usbDeviceList, tcpDeviceList]
    );

    const deviceOptions = useMemo(() => {
        return deviceList.map((device) => ({
            key: device.serial,
            text: `${device.serial} ${device.name ? `(${device.name})` : ""}`,
            data: device,
        }));
    }, [deviceList]);

    useEffect(() => {
        setSelected((old) => {
            if (old) {
                const current = deviceList.find(
                    (device) => device.serial === old.serial,
                );
                if (current) {
                    return current;
                }
            }

            return deviceList.length ? deviceList[0] : undefined;
        });
    }, [deviceList]);

    const addUsbDevice = useCallback(async () => {
        try{
            const [device] = await Promise.all([AdbDaemonWebUsbDeviceManager.BROWSER!.requestDevice()]);
            setSelected(device);
            await updateUsbDeviceList();

        } catch (e: any) {
            setUsbSupported(false);
            GLOBAL_STATE.showErrorDialog('Browser does not support WebADB');
        }

    }, [updateUsbDeviceList]);

    const addMenuProps = useMemo(() => {
        const items = [];

        if (usbSupported) {
            items.push({
                key: "usb",
                text: "USB",
                onClick: addUsbDevice,
            });
        }

        items.push({
            key: "websocket",
            text: "WebSocket",
            onClick: addWebSocketDevice,
        });

        if (AdbDaemonDirectSocketsDevice.isSupported()) {
            items.push({
                key: "direct-sockets",
                text: "Direct Sockets TCP",
                onClick: addTcpDevice,
            });
        }

        return {
            items,
        };
    }, [usbSupported, addUsbDevice, addWebSocketDevice, addTcpDevice]);


    return (
        <>
            {showConnectUI && (
                <Stack tokens={{ childrenGap: 8, padding: "0 0 8px 8px" }}>

                    <Dropdown
                        disabled={!!GLOBAL_STATE.adb}
                        label="Available devices"
                        placeholder="No available devices"
                        options={deviceOptions}
                        styles={DropdownStyles}
                        dropdownWidth={300}
                        selectedKey={selected?.serial}
                        onChange={handleSelectedChange}
                    />

                    {!GLOBAL_STATE.adb ? (
                        <>
                            <Stack horizontal tokens={CommonStackTokens}>
                                <StackItem grow shrink>
                                    <PrimaryButton
                                        iconProps={{ iconName: Icons.PlugConnected }}
                                        text="Connect"
                                        disabled={!selected}
                                        primary={!!selected}
                                        styles={{ root: { width: "100%" } }}
                                        onClick={connect}
                                    />
                                </StackItem>
                                <StackItem grow shrink>
                                    <DefaultButton
                                        iconProps={{ iconName: Icons.AddCircle }}
                                        text="Add"
                                        split
                                        splitButtonAriaLabel="Add other connection type"
                                        menuProps={addMenuProps}
                                        disabled={!usbSupported}
                                        primary={!selected}
                                        styles={{ root: { width: "100%" } }}
                                        onClick={addUsbDevice}
                                    />
                                </StackItem>
                            </Stack>

                            <Stack horizontal tokens={CommonStackTokens}>
                                <StackItem grow shrink>
                                    <TextField
                                        placeholder="WebSocket URL"
                                        value={wsUrlUSB}
                                        onChange={(e, newValue) => setWsUrlUSB(newValue || '')}
                                    />
                                </StackItem>
                                <StackItem align="end">
                                    <PrimaryButton
                                        iconProps={{ iconName: Icons.PlugConnected }}
                                        text="Connect"
                                        disabled={!wsUrlUSB}
                                        onClick={connectUsbDevice}
                                    />
                                </StackItem>
                            </Stack>
                        </>
                    ) : (
                        <DefaultButton
                            iconProps={{ iconName: Icons.PlugDisconnected }}
                            text="Disconnect"
                            onClick={disconnect}
                        />
                    )}
                </Stack>
            )}

            <Dialog
                hidden={!connecting}
                dialogContentProps={{
                    title: "Connecting...",
                    subText: "Please authorize the connection on your device",
                }}
            >
                <ProgressIndicator />
            </Dialog>
        </>
    );

}
export const Connect = observer(ConnectCore);

