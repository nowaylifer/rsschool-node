import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { printEOL } from './utils.js';

export default async function calcHash(pathToFile) {
  const hash = createHash('sha256').setEncoding('hex');
  await pipeline(createReadStream(pathToFile), hash, process.stdout, { end: false });
  printEOL();
}
