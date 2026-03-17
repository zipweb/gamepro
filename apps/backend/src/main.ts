import dotenv from 'dotenv';
import { createServer } from './app/server.js';

dotenv.config();

const port = Number(process.env.API_PORT ?? 4000);
const app = createServer();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] API listening on :${port}`);
});
