import { parseArgs } from 'node:util';
import { EOL } from 'node:os';
import { CommandError, InputError } from './errors.js';

export default class Command {
  #handler;

  constructor({ name, handler, args, options, minOptionCount }) {
    this.#handler = handler;
    this.name = name;
    this.args = args;
    this.options = options;
    this.minOptionCount = minOptionCount;
    this.argCount = this.args?.length ?? 0;
  }

  async exec(input) {
    const { args, options } = this.#parseInput(input);

    try {
      return await this.#handler(...args, options);
    } catch (error) {
      throw new CommandError(error.message, this, error.code);
    }
  }

  usage() {
    return `${this.name} ${this.argCount ? this.args.join(' ') : ''}`;
  }

  #parseInput(input) {
    let parseResult;

    try {
      parseResult = parseArgs({
        args: input,
        options: this.options,
        allowPositionals: true,
      });
    } catch (error) {
      throw new InputError(error.message, this, error.code);
    }

    const { positionals: args, values: options } = parseResult;

    this.#validateArgs(args);
    this.#validateOptions(options);

    return { args, options };
  }

  #validateArgs(args) {
    if (args.length > this.argCount) {
      throw new InputError(`too many arguments${EOL}Use ${this.usage()}`, this);
    }

    if (args.length < this.argCount) {
      throw new InputError(`missing arguments${EOL}Use ${this.usage()}`, this);
    }
  }

  #validateOptions(options) {
    if (this.minOptionCount && Object.keys(options).length < this.minOptionCount) {
      throw new InputError(
        `you must provide at least ${this.minOptionCount} option${
          this.minOptionCount > 1 ? 's' : ''
        }`,
        this
      );
    }
  }
}
