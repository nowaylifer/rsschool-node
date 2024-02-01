import { homedir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { asyncIterableToArray, printError } from './utils.js';

export default class FileExplorer {
  #cwd;
  #cwdHandle;

  constructor(cwd = homedir()) {
    this.#cwd = cwd;
  }

  get cwd() {
    return this.#cwd;
  }

  async up() {
    const parentDir = path.resolve(this.cwd, '..');

    if (parentDir === this.cwd) {
      return this;
    }

    await this.cd(parentDir);
  }

  async cd(pathToDir) {
    const resolvedPath = path.resolve(this.cwd, pathToDir);

    try {
      const dir = await fs.opendir(resolvedPath);

      if (this.#cwdHandle) {
        await this.#cwdHandle.close();
      }

      this.#cwd = resolvedPath;
      this.#cwdHandle = dir;
    } catch (error) {
      printError(error);
    }
  }

  async ls() {
    try {
      if (!this.#cwdHandle) {
        await this.cd(this.cwd);
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
}
