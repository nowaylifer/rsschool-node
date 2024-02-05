import { parseArgs } from 'node:util';
import readline from 'node:readline';
import { parseStringToArgv, printEOL, printError, printExitMsg, printWelcomeMsg } from './utils.js';
import CommandConfig from './command-config.js';
import FileExplorer from './file-explorer.js';
import { InputError } from './errors.js';

export default function initCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const username = parseUsername();
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

function parseUsername() {
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
    return printError(error);
  }

  const { command, inputArgs } = parseResult;

  try {
    await command.exec(inputArgs);
  } catch (error) {
    printError(error);
  }
}

function parseCommand(input, commands) {
  const argsArray = parseStringToArgv(input);
  const cmdName = argsArray[0];
  const command = commands[cmdName];

  if (!command) {
    throw new InputError(`command not found: ${cmdName}`);
  }

  return { command, inputArgs: argsArray.slice(1) };
}
