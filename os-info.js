import { EOL, cpus, homedir, userInfo, arch } from 'node:os';

export default class OsInfo {
  eol() {
    return EOL;
  }

  cpus() {
    const cpusInfo = cpus();
    return { total: cpusInfo.length, cpus: cpusInfo };
  }

  homedir() {
    return homedir();
  }

  username() {
    return userInfo().username;
  }

  architecture() {
    return arch();
  }
}
