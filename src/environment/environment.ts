import { Environment } from '@agio/framework/environment';
import { join } from 'path';

declare const global: NodeJS.Global & { environment: Environment }

const ENV_NAME = `${process.env.AGIO_ENV ? `${process.env.AGIO_ENV}.` : ''}environment.json`;
const ENV_DIRECTORY = `${APP_PATH}/environments/`;

global.environment = global.environment || require(join(ENV_DIRECTORY, ENV_NAME));

export const { environment } = global;