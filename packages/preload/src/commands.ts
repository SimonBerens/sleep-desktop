import {exec} from 'child_process';
import {exposeInMainWorld} from './exposeInMainWorld';

function run(command: string) : void {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

export const commands = {run} as const;

exposeInMainWorld('commands', commands);
