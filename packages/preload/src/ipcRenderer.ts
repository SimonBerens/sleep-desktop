import {ipcRenderer as ipc} from 'electron';
import {exposeInMainWorld} from './exposeInMainWorld';

export const ipcRenderer = {send: ipc.send} as const;
exposeInMainWorld('ipcRenderer', ipcRenderer);
