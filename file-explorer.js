import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { asyncIterableToArray, mkdirForce, printError } from './utils.js';

export default class FileExplorer {
  #cwd;
  #cwdHandle;

  constructor(cwd = homedir()) {
    this.#cwd = cwd;
  }

  get cwd() {
    return this.#cwd;
  }

  resolvePath(pathTo) {
    return path.resolve(this.cwd, pathTo);
  }

  async up() {
    const parentDir = this.resolvePath('..');

    if (parentDir === this.cwd) {
      return;
    }

    return await this.cd(parentDir);
  }

  async cd(pathToDir) {
    const resolvedPath = this.resolvePath(pathToDir);

    try {
      const dir = await fs.opendir(resolvedPath);

      if (this.#cwdHandle) {
        await this.#cwdHandle.close();
      }

      this.#cwd = resolvedPath;
      this.#cwdHandle = dir;

      return true;
    } catch (error) {
      printError(error);
      return false;
    }
  }

  async ls() {
    try {
      if (!this.#cwdHandle) {
        if (!(await this.cd(this.cwd))) {
          return;
        }
      }

      const dirents = await asyncIterableToArray(this.#cwdHandle);
      const entries = dirents.map((dirent) => ({
        Name: dirent.name,
        Type: dirent.isDirectory() ? 'directory' : 'file',
      }));

      console.table(entries);
    } catch (error) {
      printError(error);
    }
  }

  async cat(pathToFile) {
    try {
      await pipeline(createReadStream(this.resolvePath(pathToFile)), process.stdout, {
        end: false,
      });
      // process.stdout.write('\n');
    } catch (error) {
      printError(error);
    }
  }

  async add(pathToFile) {
    try {
      const fileHandle = await fs.open(this.resolvePath(pathToFile));
      await fileHandle.close();
    } catch (error) {
      printError(error);
    }
  }

  async rn(pathToFile, newFilename) {
    try {
      await fs.rename(this.resolvePath(pathToFile), newFilename);
    } catch (error) {
      printError(error);
    }
  }

  async cp(srcPath, destPath) {
    const resolvedSrcPath = this.resolvePath(srcPath);
    let resolvedDestPath = this.resolvePath(destPath);
    let firstCreatedPath;

    try {
      await ensureDestDirExists();
      await copy(resolvedSrcPath, resolvedDestPath);
      return true;
    } catch (error) {
      if (firstCreatedPath) {
        await fs.rm(firstCreatedPath, { recursive: true, force: true });
      }
      printError(error);
      return false;
    }

    async function ensureDestDirExists() {
      const srcStats = await fs.stat(resolvedSrcPath);

      try {
        const destStats = await fs.stat(resolvedDestPath);

        if (srcStats.isDirectory() && destStats.isFile()) {
          throw new Error(
            `cannot overwrite non-directory '${destPath} with directory '${srcPath}'`
          );
        }

        resolvedDestPath = path.join(resolvedDestPath, path.basename(resolvedSrcPath));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      firstCreatedPath = await mkdirForce(
        srcStats.isDirectory() ? resolvedDestPath : path.dirname(resolvedDestPath),
        { recursive: true }
      );
    }

    async function copy(copySrc, copyDest) {
      const stats = await fs.stat(copySrc);

      if (stats.isFile()) {
        return await pipeline(createReadStream(copySrc), createWriteStream(copyDest));
      }

      if (copyDest !== resolvedDestPath) {
        await fs.mkdir(copyDest);
      }

      const files = await fs.readdir(copySrc);

      const promises = files.map((file) => {
        const fileSrc = path.resolve(copySrc, file);
        const fileDest = path.resolve(copyDest, file);
        return copy(fileSrc, fileDest);
      });

      await Promise.all(promises);
    }
  }

  async mv(srcPath, destPath) {
    if (await this.cp(srcPath, destPath)) {
      await fs.rm(srcPath, { recursive: true, force: true });
    }
  }

  async rm(pathTo) {
    try {
      await fs.rm(pathTo, { recursive: true });
    } catch (error) {
      printError(error);
    }
  }
}

const fe = new FileExplorer(process.cwd());
