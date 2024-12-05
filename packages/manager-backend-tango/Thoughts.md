
use `AdbServerClient` on server side and forward individual device's transport.

### Backend:
Connect Google Adb to  `AdbServerClient` through `AdbServerNodeTcpConnector`.
When requested for a particular device:

- creates an `AdbTransport` for the specified device using `AdbServerClient.createTransport`
- Use `AdbTransport.connect` to create `AdbSocket`
- Forward `AdbSocket.readable` to `AdbSocket.writable` over WebSocket like `WebSockify` does.

Also implement a route to fetch all device details with the web socket url created.

### Client (old-demo):
- Create custom transport `AdbUsbTransport` using `AdbTransport` and `AdbSocket` interfaces.
- `AdbTransport#connect` creates your `AdbSocket`, and `AdbSocket` should convert the data in WebSocket connections back to Web Streams.
- Create `new Adb(customTransport)` where `customTransport` is the `AdbUsbTransport`.
- Use `GLOBAL_STATE.setDevice(undefined, adb-instance)` to set the device.
???
- I need to create something like `AdbDaemonWebSocketDevice` to connect to the websocket url. (as in the old-demo, adb-daemon-ws)
- Assume it's `AdbServerWebSocketDevice` would it inherit the `AdbDaemonDevice` on the client? And then I would have to define a custom `connect` method taking for connecting to the web socket url?

- Edit the connect page to show all the devices connected to the server. and connect on a specific device would be used to get interface.