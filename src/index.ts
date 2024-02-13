import 'dotenv/config';
import initCluster from './cluster';
import app from './app';

const port = +process.env.SERVER_PORT!;
const isClusterMode = process.env.CLUSTER;

if (isClusterMode) {
  initCluster(port);
} else {
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}
