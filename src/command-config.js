import { osInfo, printOsInfo } from './os-info.js';
import { compress, decompress } from './brotli.js';
import { printExitMsg } from './utils.js';
import calcHash from './calc-hash.js';
import Command from './command.js';

export default class CommandConfig {
  constructor(fileExplorer, username) {
    this.fileExplorer = fileExplorer;
    this.username = username;
    this.commands = {};
    this.#addDefaultCommands();
  }

  add(callbackFn) {
    const config = callbackFn(this.fileExplorer, this.username);

    if (Array.isArray(config)) {
      this.commands = config.reduce(
        (acc, draft) => ({ ...acc, [draft.name]: new Command(draft) }),
        this.commands
      );
    } else {
      this.commands[config.name] = new Command(config);
    }

    return this;
  }

  #addDefaultCommands() {
    this.add((explorer, username) => [
      {
        name: '.exit',
        handler: () => {
          printExitMsg(username);
          process.exit();
        },
      },
      {
        name: 'up',
        handler: explorer.up,
      },
      {
        name: 'cd',
        args: ['<directory>'],
        handler: explorer.cd,
      },
      {
        name: 'ls',
        handler: explorer.ls,
      },
      {
        name: 'cat',
        args: ['<file>'],
        handler: explorer.cat,
      },
      {
        name: 'add',
        args: ['<file>'],
        handler: explorer.add,
      },
      {
        name: 'rn',
        args: ['<src>', '<dest>'],
        handler: explorer.rn,
      },
      {
        name: 'cp',
        args: ['<src>', '<dest>'],
        handler: explorer.cp,
      },
      {
        name: 'mv',
        args: ['<src>', '<dest>'],
        handler: explorer.mv,
      },
      {
        name: 'rm',
        args: ['<src>'],
        handler: explorer.rm,
      },
      {
        name: 'hash',
        args: ['<file>'],
        handler: (file) => calcHash(explorer.resolvePath(file)),
      },
      {
        name: 'compress',
        args: ['<file>', '<dest>'],
        handler: (file, dest) => compress(explorer.resolvePath(file), explorer.resolvePath(dest)),
      },
      {
        name: 'decompress',
        args: ['<file>', '<dest>'],
        handler: (file, dest) => decompress(explorer.resolvePath(file), explorer.resolvePath(dest)),
      },
      {
        name: 'os',
        handler: printOsInfo,
        minOptionCount: 1,
        options: Object.keys(osInfo).reduce(
          (acc, key) => ({ ...acc, [key]: { type: 'boolean' } }),
          {}
        ),
      },
    ]);
  }
}
