import 'reflect-metadata'

import { Application, Router as ExpressRouter } from 'express';
import { join } from 'path';
import { singleton, autoInjectable, injectable } from 'tsyringe';
import { ControllerClass } from '@agio/framework/common';
import { RouterMethods, Request, Response, NextFunction } from '@agio/framework/http';

// Handle middleware in promise, capture exceptions in async methods
const handleMiddlewares = use => (req, res, next) => Promise.resolve(use(req, res, next)).catch(next);

/**
 * Controller Decorator: Turn the class into a Agio Controller
 *
 * @param prefix Router prefix path
 */
export const Controller = (prefix: string = '/') => function(target: ControllerClass) {

    target.prefix = prefix;

    // Router generator function, sync routes to express app
    target.router = (app: Application) => {

        const expressRouter = ExpressRouter({});
        const controller = new target();

        target.prototype.routes.forEach(route => {

            const handler = handleMiddlewares((req, res, next) => controller[route.controllerMethod].apply(controller, [req, res, next]));
            expressRouter[route.method](route.path, route.middlewares, handler);

        });

        app.use(join('/', prefix), expressRouter);

    }

}


/**
 * Validator Decorator: Turn the class a Joi validator middleware
 */
export const Validator = () => function(target: VoidFunction) {

    const validations = Object
        .getOwnPropertyNames(target.prototype)
        .map(key => ({key, schema: target.prototype[key]}))
        .filter(validation => validation.schema.isJoi)
    

    target.prototype.use = (req: Request, res: Response, next: NextFunction) => {

        Promise
            .all(validations.map(validation => validation.schema.validate(req[validation.key])))
            .then(() => next())
            .catch((err: Error) => res.sendResponse(HTTP_STATUS.UNPROCESSABLE_ENTITY, err))

    }

}

/**
 * Router Decorator: Turn class method in middleware by method
 *
 * @param method - HTTP method, get, post, put etc...
 * @param path - the route path
 * @param middlewares - list of route middlewares
 */
export const Router = (method: RouterMethods, path: string |  string[], middlewares: any[] = []) => function(target: ControllerClass, propertyKey?: string) {

    if (!target.routes) Object.setPrototypeOf(target, {routes: []})

    target.routes.push({
        path,
        method,
        controllerMethod: propertyKey,
        middlewares: middlewares
            .map(middleware => new middleware())
            .filter(middleware => middleware.use)
            .map(middleware => handleMiddlewares((req, res, next) => middleware.use.apply(middleware, [req, res, next])))
    });

}

// Injectable Decorator: Add support for dependencie injector
export const Injectable = (options: {auto: boolean} = {auto: true}) => options.auto ? autoInjectable() : injectable();

// Singleton Decorator: Turns the class singleton
export const Singleton = singleton;