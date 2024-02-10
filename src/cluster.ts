import cluster, { type Worker } from 'node:cluster';
import { availableParallelism } from 'node:os';
import http from 'node:http';
import app from './app';

export default function initCluster(port: number) {
  if (cluster.isPrimary) {
    const cpuCount = availableParallelism();
    const workers: Worker[] = [];

    for (let i = 1; i <= cpuCount; i++) {
      workers.push(cluster.fork());
    }

    const next = roundRobin(workers.length);

    http
      .createServer((clientReq, proxyResp) => {
        const worker = workers.at(next())!;

        const options: http.RequestOptions = {
          hostname: 'localhost',
          port: port + worker.id,
          path: clientReq.url,
          method: clientReq.method,
          headers: clientReq.headers,
        };

        const proxyReq = http.request(options, (res) => {
          proxyResp.writeHead(res.statusCode!, res.headers);
          res.pipe(proxyResp);
        });

        clientReq.pipe(proxyReq);
      })
      .listen(port, () => {
        console.log(`Load balancer proxy is listening on port ${port}`);
      });
  }

  if (cluster.isWorker) {
    const workerId = cluster.worker!.id;
    const workerPort = port + workerId;

    app.listen(workerPort, () => {
      console.log(`Worker ${workerId} is listening on port ${workerPort}`);
    });
  }
}

function roundRobin(length: number) {
  function* createGen() {
    let current = 0;
    while (true) {
      yield current;
      current = (current + 1) % length;
    }
  }

  const gen = createGen();
  const next = () => gen.next().value as number;
  return next;
}
