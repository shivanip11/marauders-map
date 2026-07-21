import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { initSocket } from './sockets/index.js';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.get('/', (req, res) => res.send("Marauder's Map API is running"));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const httpServer = createServer(app);

const io = initSocket(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Server listening on ${PORT}`));