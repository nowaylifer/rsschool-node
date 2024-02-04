import readline from 'node:readline';
import { parseArgs } from 'node:util';
import { EOL } from 'node:os';
import { printEOL, printExitMsg, printWelcomeMsg } from './utils.js';
import { InputError, CommandError } from './errors.js';
import CommandConfig from './command-config.js';
import FileExplorer from './file-explorer.js';

export default function initCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const username = parseArgv();

  const explorer = new FileExplorer();
  const commandConfig = new CommandConfig(explorer, username);

  printWelcomeMsg(username);
  explorer.printCwd();
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      return rl.prompt();
    }

    await handleCommandInput(input, commandConfig.commands);
    explorer.printCwd();
    rl.prompt();
  });

  rl.on('SIGINT', () => {
    printEOL();
    printExitMsg(username);
    process.exit();
  });
}

function parseArgv() {
  const {
    values: { username },
  } = parseArgs({ options: { username: { type: 'string' } } });

  if (!username) {
    throw new Error('You must provide username: --username=<username>');
  }

  return username;
}

async function handleCommandInput(input, commands) {
  let parseResult;

  try {
    parseResult = parseCommand(input, commands);
  } catch (error) {
    return error instanceof InputError ? error.print() : console.error(error);
  }

  const { command, args, options } = parseResult;

  try {
    await command.handler(...args, options);
  } catch (error) {
    return new CommandError(error.message, command, error.code).print();
  }
}

function parseCommand(input, commands) {
  const argsArray = input.split(' ');
  const cmdName = argsArray[0];
  const command = commands[cmdName];

  if (!command) {
    throw new InputError(`command not found: ${cmdName}`);
  }

  let parseResult;

  try {
    parseResult = parseArgs({
      args: argsArray.slice(1),
      allowPositionals: true,
      options: command.options,
    });
  } catch (error) {
    throw new InputError(error.message, command, error.code);
  }

  checkArgErrors(command, parseResult);

  return { command, args: parseResult.positionals, options: parseResult.values };
}

function checkArgErrors(command, { values, positionals }) {
  if (positionals.length > (command.args?.length ?? 0)) {
    throw new InputError(`too many arguments${EOL}Use ${getCommandUsageExample(command)}`, command);
  }

  if (positionals.length < (command.args?.length ?? 0)) {
    throw new InputError(`missing arguments${EOL}Use ${getCommandUsageExample(command)}`, command);
  }

  if (command.minOptionCount && Object.keys(values).length < command.minOptionCount) {
    throw new InputError(
      `you must provide at least ${command.minOptionCount} option${
        command.minOptionCount > 1 ? 's' : ''
      }`,
      command
    );
  }
}

function getCommandUsageExample(command) {
  return `${command.name} ${command.args?.length ? command.args.join(' ') : ''}`;
}
