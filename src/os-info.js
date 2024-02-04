import { EOL, cpus as _cpus, homedir as _homedir, userInfo, arch } from 'node:os';
import { round } from './utils.js';

export const osInfo = {
  eol() {
    return JSON.stringify(EOL);
  },
  cpus() {
    const cpusInfo = _cpus();
    return JSON.stringify(
      {
        total: cpusInfo.length,
        cpus: cpusInfo.map(({ model, speed }) => ({
          model,
          speed: `${round(speed / 1000, 2)}GHz`,
        })),
      },
      null,
      2
    );
  },
  homedir() {
    return _homedir();
  },
  username() {
    return userInfo().username;
  },
  architecture() {
    return arch();
  },
};

export function printOsInfo(options) {
  Object.keys(options).forEach((option) => console.log(osInfo[option]()));
}
