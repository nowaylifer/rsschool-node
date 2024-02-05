const RED = '\x1b[31m%s';
const RESET = '\x1b[0m';

export class InputError extends Error {
  constructor(message, command, code) {
    super();

    this.command = command;
    this.message =
      code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION'
        ? message[0].toLowerCase() + message.slice(1, message.indexOf('.'))
        : message;
  }

  print() {
    console.error(
      RED,
      'Invalid input: ' +
        RESET +
        (this.command ? `${this.command.name}: ${this.message}` : this.message)
    );
  }
}

export class CommandError extends Error {
  constructor(message, command, code) {
    super();
    this.message = code ? message.replace(`${code}: `, '') : message;
    this.command = command;
  }

  print() {
    console.error(
      RED,
      'Operation failed: ' +
        RESET +
        (this.command ? `${this.command.name}: ${this.message}` : this.message)
    );
  }
}
