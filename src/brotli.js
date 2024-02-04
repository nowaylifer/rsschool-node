import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import { createBrotliCompress, createBrotliDecompress } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { mkdirForce } from './utils.js';

const BROTLI_EXT = '.br';

export async function compress(srcPath, destPath) {
  await fs.access(srcPath);

  let firstCreatedPath;

  try {
    const destStats = await fs.stat(destPath);

    if (destStats.isFile()) {
      throw new Error(`file ${destPath} already exists`);
    }

    destPath = path.resolve(destPath, path.basename(srcPath) + BROTLI_EXT);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const destExt = path.extname(destPath);

    if (destExt !== BROTLI_EXT) {
      destPath += BROTLI_EXT;
    }

    firstCreatedPath = await mkdirForce(path.dirname(destPath));
  }

  try {
    await pipeline(createReadStream(srcPath), createBrotliCompress(), createWriteStream(destPath));
  } catch (error) {
    if (firstCreatedPath) {
      fs.rm(firstCreatedPath, { recursive: true, force: true });
    }
    throw error;
  }
}

export async function decompress(srcPath, destPath) {
  await fs.access(srcPath);

  let firstCreatedPath;

  try {
    const destStats = await fs.stat(destPath);

    if (destStats.isFile()) {
      throw new Error(`file ${destPath} already exists`);
    }

    destPath = path.resolve(destPath, path.basename(srcPath).replace(BROTLI_EXT, ''));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    firstCreatedPath = await mkdirForce(path.dirname(destPath));
  }

  try {
    await pipeline(
      createReadStream(srcPath),
      createBrotliDecompress(),
      createWriteStream(destPath)
    );
  } catch (error) {
    if (firstCreatedPath) {
      fs.rm(firstCreatedPath, { recursive: true, force: true });
    }
    throw error;
  }
}
