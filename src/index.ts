import 'dotenv/config';
import express from './express';
import path from 'path';

const port = +process.env.SERVER_PORT!;

const app = express();

app.use(express.log());
app.use(express.static(path.resolve(__dirname, '../frontend')));

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
