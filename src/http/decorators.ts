import { Router } from '@agio/framework/common';

export const All = (path: string | string[], middlewares: any[] = []) => Router('all', path, middlewares);
export const Get = (path: string | string[], middlewares: any[] = []) => Router('get', path, middlewares);
export const Put = (path: string | string[], middlewares: any[] = []) => Router('put', path, middlewares);
export const Post = (path: string | string[], middlewares: any[] = []) => Router('post', path, middlewares);
export const Head = (path: string | string[], middlewares: any[] = []) => Router('head', path, middlewares);
export const Trace = (path: string | string[], middlewares: any[] = []) => Router('trace', path, middlewares);
export const Patch = (path: string | string[], middlewares: any[] = []) => Router('patch', path, middlewares);
export const Delete = (path: string | string[], middlewares: any[] = []) => Router('delete', path, middlewares);
export const Connect = (path: string | string[], middlewares: any[] = []) => Router('connect', path, middlewares);
export const Options = (path: string | string[], middlewares: any[] = []) => Router('options', path, middlewares);
