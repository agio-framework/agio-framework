import morgan from 'morgan';
import bodyParser from 'body-parser';
import httpStatus from 'http-status-codes';
import { NextFunction, Request, Response } from '@agio/framework/http';
import { environment } from '@agio/framework/environment';

export const HEADERS_HANDLER = (req: Request, res: Response, next: NextFunction) => {

    res.removeHeader('X-Powered-By');

    const customHeaders = environment.server['custom-headers'] || {};
    const corsHeaders = environment.server.cors || {};

    [
        ...Object.keys(customHeaders).map(key => [key, customHeaders[key]]),
        ...Object.keys(corsHeaders).map(key => [`access-Control-allow-${key}`, corsHeaders[key]]),
    ]
    .forEach(header => res.setHeader(header[0], header[1]))
    
    next();
}


export const RESPONSE_HANDLER = (req: Request, res: Response, next: NextFunction) => {
    
    global.HTTP_STATUS = httpStatus;

    req.sendResponse = res.sendResponse = (...args) => {

        let data = undefined;
        let error = args[args.length-1] instanceof Error ? args[args.length-1] : undefined;
        let metadata = undefined;
        let statusCode = HTTP_STATUS.OK;


        if (typeof args[0] === 'object') data = args[0];
        if (typeof args[0] === 'number') statusCode = args[0];
        if (typeof args[1] === 'number') statusCode = args[1];
        if (typeof args[1] === 'object' && !error) metadata = args[1];
        if (typeof args[2] === 'object') metadata = args[2];

        
        if (error) {

            error.stack = error.stack
                // .split('(<anonymous>)')[1]
                .split('\n')[1]
                .trim()
                .match(/\(([^)]+)\)/)[1]
                .split(/src|node_modules/)
                .pop()
    
            error = {
                name: error.name,
                message: error.message,
                [error.details ? 'details' : 'at']: error.details || error.stack
            }
        }

        res.status(statusCode).json({
            data,
            code: statusCode,
            error,
            metadata: {
                ...metadata,
                responsedAt: new Date().toISOString()
                // route: req.path,
                // method: req.method,
                // remoteAddress: [...req.ips, req.connection.remoteAddress]
            },
        })
        .end();

        res.destroy();
    };

    next();

}


/**
 * TODO: comment
 *
 * @param  {Error} err
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
export const ERROR_HANDLER = (err: Error, req: Request, res: Response, next: NextFunction) => {

    if (!err) return next();
    res.sendResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, err);

}


/**
 * TODO: comment
 *
 * @param  {Request} req
 * @param  {Response} res
 */
export const NOT_IMPLEMENTED_HANDLER = (req: Request) => req.sendResponse(HTTP_STATUS.NOT_IMPLEMENTED, { message: 'Resource Not Implemented' });

const BODY_PARSER_HANDLER = bodyParser.json();
export const LOGGER_HANDLER = morgan('[:date[iso]] :status - :method :url - :response-time ms');

export const HANDLERS = {
    before: {
        RESPONSE_HANDLER,
        HEADERS_HANDLER,
        LOGGER_HANDLER,
        BODY_PARSER_HANDLER,
    },
    after: {
        ERROR_HANDLER,
        NOT_IMPLEMENTED_HANDLER
    }
}
