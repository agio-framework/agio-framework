import { Environment } from '@agio/framework/environment';
import { join } from 'path';

// Define environment filename
const ENV_FILENAME = `${process.env.AGIO_ENV ? `${process.env.AGIO_ENV}.` : ''}environment.json`;

// Define environment full path
const ENV_PATH = join(`${APP_PATH}/environments/`, ENV_FILENAME);

// Require environment JSON file
global.__agio__.environment = global.__agio__.environment || require(ENV_PATH);

export const { environment } = global.__agio__;