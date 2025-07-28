import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SSE_PATH = process.env.SSE_PATH || '/malga.io/process_payment_out/listener';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

const clients = [];

app.get(SSE_PATH, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  console.log('Client SSE connected');

  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
    console.log('Client SSE disconnected');
  });
});

app.post('/malga.io/process_payment_out/listener', (req, res) => {
  const payload = req.body;

  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  console.log('Emitter event:', payload);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running in http://localhost:${PORT}`);
  console.log(`Listening SSE em ${SSE_PATH}`);
});
