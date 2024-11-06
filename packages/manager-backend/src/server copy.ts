import express from 'express';
import { createProxy } from './websockify';

const app = express();
app.use(express.json());

app.post('/start-ws', (req, res) => {
    const { deviceIP, devicePort } = req.body;
    const wsPort = 10000 + devicePort;
    
    try {
        const server = createProxy({
            sourcePort: wsPort,
            targetHost: deviceIP,
            targetPort: devicePort
        });
        
        res.json({
            status: 'success',
            message: 'WebSocket proxy started',
            wsUrl: `ws://localhost:${wsPort}`
        });
    } catch (error) {
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
