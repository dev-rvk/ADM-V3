import { Server as WebSocketServer } from 'ws';
import * as net from 'net';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as mime from 'mime-types';

interface ProxyOptions {
    sourcePort: number;
    targetHost: string;
    targetPort: number;
    cert?: string;
    key?: string;
    web?: string;
    record?: string;
}

export function createProxy(options: ProxyOptions) {
    const { sourcePort, targetHost, targetPort, cert, key, web, record } = options;
    let webServer;

    const new_client = function(client: any) {
        const clientAddr = client._socket.remoteAddress;
        const start_time = new Date().getTime();

        const log = function (msg: string) {
            console.log(' ' + clientAddr + ': '+ msg);
        };
        log('WebSocket connection');

        let rs = null;
        if (record) {
            rs = fs.createWriteStream(record + '/' + new Date().toISOString().replace(/:/g, "_"));
            rs.write('var VNC_frame_data = [\n');
        }

        const target = net.createConnection(targetPort, targetHost, function() {
            log('connected to target');
        });

        target.on('data', function(data: Buffer) {
            if (rs) {
                const tdelta = Math.floor(new Date().getTime()) - start_time;
                const rsdata = '\'{' + tdelta + '{' + decodeBuffer(data) + '\',\n';
                rs.write(rsdata);
            }

            try {
                client.send(data);
            } catch(e) {
                log("Client closed, cleaning up target");
                target.end();
            }
        });

        target.on('end', function() {
            log('target disconnected');
            client.close();
            if (rs) {
                rs.end('\'EOF\'];\n');
            }
        });

        target.on('error', function() {
            log('target connection error');
            target.end();
            client.close();
            if (rs) {
                rs.end('\'EOF\'];\n');
            }
        });

        client.on('message', function(msg: Buffer) {
            if (rs) {
                const rdelta = Math.floor(new Date().getTime()) - start_time;
                const rsdata = ('\'}' + rdelta + '}' + decodeBuffer(msg) + '\',\n');
                rs.write(rsdata);
            }
            target.write(msg);
        });

        client.on('close', function(code: number, reason: string) {
            log('WebSocket client disconnected: ' + code + ' [' + reason + ']');
            target.end();
        });

        client.on('error', function(a: Error) {
            log('WebSocket client error: ' + a);
            target.end();
        });
    };

    if (cert) {
        const certData = fs.readFileSync(cert);
        const keyData = fs.readFileSync(key || cert);
        console.log("Running in encrypted HTTPS (wss://) mode");
        webServer = https.createServer({cert: certData, key: keyData});
    } else {
        console.log("Running in unencrypted HTTP (ws://) mode");
        webServer = http.createServer();
    }

    console.log(`Proxying from port ${sourcePort} to ${targetHost}:${targetPort}`);
    
    webServer.listen(sourcePort, () => {
        const wsServer = new WebSocketServer({server: webServer});
        wsServer.on('connection', new_client);
    });

    return webServer;
}

function decodeBuffer(buf: Buffer): string {
    let returnString = '';
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] >= 48 && buf[i] <= 90) {
            returnString += String.fromCharCode(buf[i]);
        } else if (buf[i] === 95) {
            returnString += String.fromCharCode(buf[i]);
        } else if (buf[i] >= 97 && buf[i] <= 122) {
            returnString += String.fromCharCode(buf[i]);
        } else {
            const charToConvert = buf[i].toString(16);
            if (charToConvert.length === 0) {
                returnString += '\\x00';
            } else if (charToConvert.length === 1) {
                returnString += '\\x0' + charToConvert;
            } else {
                returnString += '\\x' + charToConvert;
            }
        }
    }
    return returnString;
}
