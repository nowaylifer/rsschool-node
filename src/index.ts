import 'dotenv/config';
import app from './app';

const PORT = +process.env.SERVER_PORT!;

app.listen(PORT, () => console.log(`Server is listening on ${PORT}`));
