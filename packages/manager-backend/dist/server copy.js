"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const websockify_1 = require("./websockify");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post('/start-ws', (req, res) => {
    const { deviceIP, devicePort } = req.body;
    const wsPort = 10000 + devicePort;
    try {
        const server = (0, websockify_1.createProxy)({
            sourcePort: wsPort,
            targetHost: deviceIP,
            targetPort: devicePort
        });
        res.json({
            status: 'success',
            message: 'WebSocket proxy started',
            wsUrl: `ws://localhost:${wsPort}`
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
