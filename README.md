# Simple CRUD API

## Getting started

1. Clone this repo `git clone https://github.com/nowaylifer/rsschool-node`

2. Switch to a development branch `git switch crud-api`

3. Install dependencies `npm i`

4. Run one of the following npm scripts: `start:dev`, `start:multi` or `start:prod`

5. You can now send request to http://localhost:8000. If a server runs in a cluster mode, also to the same hostname on ports 8001, 8002, ... (see description of `start:multi` script). All endpoints work as in the [task description](https://github.com/AlreadyBored/nodejs-assignments/blob/main/assignments/crud-api/assignment.md). Btw, you can check out server error 500 response on `GET api/error` endpoint.

## Scripts

`npm run start:dev` - start one server instance in a development mode

`npm run start:multi` - start multiple server instances - cluster of node.js processes equal to your PC's logical cpus cores with a load balancer. The loader balancer listens on 8000 port and forwards request to child processes that listen on 8001, 8002, ... ports.

`npm run start:prod` - bundle source code into one file and start the server in cluster mode

`npm test` - run tests
