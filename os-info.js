import { EOL, cpus, homedir, userInfo, arch } from 'node:os';

export function eol() {
  return EOL;
}

export function cpus() {
  const cpusInfo = cpus();
  return { total: cpusInfo.length, cpus: cpusInfo };
}

export function homedir() {
  return homedir();
}

export function username() {
  return userInfo().username;
}

export function architecture() {
  return arch();
}
