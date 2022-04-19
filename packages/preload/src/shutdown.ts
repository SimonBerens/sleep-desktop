import {shutdown as electronShutdown} from 'electron-shutdown-command';
import {exposeInMainWorld} from './exposeInMainWorld';

export const shutdown = {electronShutdown} as const;

exposeInMainWorld('shutdown', shutdown);
