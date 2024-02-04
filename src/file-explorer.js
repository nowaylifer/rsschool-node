import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { asyncIterableToArray, bindMethods, mkdirForce, printEOL } from './utils.js';

export default class FileExplorer {
  #cwd;

  constructor(cwd = homedir()) {
    this.#cwd = cwd;
    bindMethods.call(this);
  }

  get cwd() {
    return this.#cwd;
  }

  printCwd() {
    console.log(`You are currently in ${this.cwd}`);
  }

  resolvePath(pathTo) {
    return path.resolve(this.cwd, pathTo);
  }

  async up() {
    const parentDir = this.resolvePath('..');
    if (parentDir === this.cwd) return;
    return await this.cd(parentDir);
  }

  async cd(pathToDir, shouldClose = true) {
    const resolvedPath = this.resolvePath(pathToDir);
    const dir = await fs.opendir(resolvedPath);
    this.#cwd = resolvedPath;
    if (shouldClose) dir.close();
    return dir;
  }

  async ls() {
    const dirents = await asyncIterableToArray(await this.cd(this.cwd, false));
    const entries = dirents
      .map((dirent) => ({
        Name: dirent.name,
        Type: dirent.isDirectory() ? 'directory' : 'file',
      }))
      .sort((a, b) => {
        if (a.Type === 'directory' && b.Type === 'file') {
          return -1;
        } else if (a.Type === 'file' && b.Type === 'directory') {
          return 1;
        }

        return a.Name.localeCompare(b.Name);
      });

    console.table(entries);
  }

  async cat(pathToFile) {
    await pipeline(createReadStream(this.resolvePath(pathToFile)), process.stdout, {
      end: false,
    });
    printEOL();
  }

  async add(pathToFile) {
    const fileHandle = await fs.open(this.resolvePath(pathToFile), 'w');
    fileHandle.close();
  }

  async rn(pathToFile, newFilename) {
    await fs.rename(this.resolvePath(pathToFile), this.resolvePath(newFilename));
  }

  async cp(srcPath, destPath) {
    const resolvedSrcPath = this.resolvePath(srcPath);
    let resolvedDestPath = this.resolvePath(destPath);
    let firstCreatedPath;

    try {
      await ensureDestDirExists();
      await copy(resolvedSrcPath, resolvedDestPath);
    } catch (error) {
      if (firstCreatedPath) {
        fs.rm(firstCreatedPath, { recursive: true, force: true });
      }
      throw error;
    }

    async function ensureDestDirExists() {
      const srcStats = await fs.stat(resolvedSrcPath);

      if (srcStats.isDirectory() && resolvedDestPath.includes(resolvedSrcPath)) {
        throw new Error(`cannot copy a directory, '${srcPath}' into itself, '${destPath}'`);
      }

      try {
        const destStats = await fs.stat(resolvedDestPath);

        if (srcStats.isDirectory() && destStats.isFile()) {
          throw new Error(
            `cannot overwrite non-directory '${destPath}' with directory '${srcPath}'`
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
    await this.cp(srcPath, destPath);
    await fs.rm(this.resolvePath(srcPath), { recursive: true, force: true });
  }

  async rm(pathTo) {
    await fs.rm(this.resolvePath(pathTo), { recursive: true });
  }
}
