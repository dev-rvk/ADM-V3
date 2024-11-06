"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxy = createProxy;
const ws_1 = require("ws");
const net = __importStar(require("net"));
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
function createProxy(options) {
    const { sourcePort, targetHost, targetPort, cert, key, web, record } = options;
    let webServer;
    const new_client = function (client) {
        const clientAddr = client._socket.remoteAddress;
        const start_time = new Date().getTime();
        const log = function (msg) {
            console.log(' ' + clientAddr + ': ' + msg);
        };
        log('WebSocket connection');
        let rs = null;
        if (record) {
            rs = fs.createWriteStream(record + '/' + new Date().toISOString().replace(/:/g, "_"));
            rs.write('var VNC_frame_data = [\n');
        }
        const target = net.createConnection(targetPort, targetHost, function () {
            log('connected to target');
        });
        target.on('data', function (data) {
            if (rs) {
                const tdelta = Math.floor(new Date().getTime()) - start_time;
                const rsdata = '\'{' + tdelta + '{' + decodeBuffer(data) + '\',\n';
                rs.write(rsdata);
            }
            try {
                client.send(data);
            }
            catch (e) {
                log("Client closed, cleaning up target");
                target.end();
            }
        });
        target.on('end', function () {
            log('target disconnected');
            client.close();
            if (rs) {
                rs.end('\'EOF\'];\n');
            }
        });
        target.on('error', function () {
            log('target connection error');
            target.end();
            client.close();
            if (rs) {
                rs.end('\'EOF\'];\n');
            }
        });
        client.on('message', function (msg) {
            if (rs) {
                const rdelta = Math.floor(new Date().getTime()) - start_time;
                const rsdata = ('\'}' + rdelta + '}' + decodeBuffer(msg) + '\',\n');
                rs.write(rsdata);
            }
            target.write(msg);
        });
        client.on('close', function (code, reason) {
            log('WebSocket client disconnected: ' + code + ' [' + reason + ']');
            target.end();
        });
        client.on('error', function (a) {
            log('WebSocket client error: ' + a);
            target.end();
        });
    };
    if (cert) {
        const certData = fs.readFileSync(cert);
        const keyData = fs.readFileSync(key || cert);
        console.log("Running in encrypted HTTPS (wss://) mode");
        webServer = https.createServer({ cert: certData, key: keyData });
    }
    else {
        console.log("Running in unencrypted HTTP (ws://) mode");
        webServer = http.createServer();
    }
    console.log(`Proxying from port ${sourcePort} to ${targetHost}:${targetPort}`);
    webServer.listen(sourcePort, () => {
        const wsServer = new ws_1.Server({ server: webServer });
        wsServer.on('connection', new_client);
    });
    return webServer;
}
function decodeBuffer(buf) {
    let returnString = '';
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] >= 48 && buf[i] <= 90) {
            returnString += String.fromCharCode(buf[i]);
        }
        else if (buf[i] === 95) {
            returnString += String.fromCharCode(buf[i]);
        }
        else if (buf[i] >= 97 && buf[i] <= 122) {
            returnString += String.fromCharCode(buf[i]);
        }
        else {
            const charToConvert = buf[i].toString(16);
            if (charToConvert.length === 0) {
                returnString += '\\x00';
            }
            else if (charToConvert.length === 1) {
                returnString += '\\x0' + charToConvert;
            }
            else {
                returnString += '\\x' + charToConvert;
            }
        }
    }
    return returnString;
}
