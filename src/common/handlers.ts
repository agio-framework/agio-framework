import morgan from 'morgan';
import bodyParser from 'body-parser';
import httpStatus from 'http-status-codes';
import { NextFunction, Request, Response } from '@agio/framework/http';
import { environment } from '@agio/framework/environment';

/**
 * Handler to manipule haders
 *
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
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


/**
 * Handler to manipule common response
 *
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
export const RESPONSE_HANDLER = (req: Request, res: Response, next: NextFunction) => {
    
    // Define global HTTP Status list
    global.HTTP_STATUS = httpStatus;

    // Define request/response send method
    req.sendResponse = res.sendResponse = (...args) => {

        // Parse paramters
        let data = undefined;
        let error = args[args.length-1] instanceof Error ? args[args.length-1] : undefined;
        let metadata = undefined;
        let statusCode = HTTP_STATUS.OK;

        if (typeof args[0] === 'object') data = args[0];
        if (typeof args[0] === 'number') statusCode = args[0];
        if (typeof args[1] === 'number') statusCode = args[1];
        if (typeof args[1] === 'object' && !error) metadata = args[1];
        if (typeof args[2] === 'object') metadata = args[2];

        // Parse error to send
        if (error) {

            const stackLine = error.stack.split('\n')[1];

            error.stack = !stackLine ? undefined : stackLine
                .trim()
                .match(/(([^)]+))/)[1]
                .split(/src|node_modules/)
                .pop();

            error = {
                name: error.name,
                message: error.message,
                [error.details ? 'details' : 'at']: error.details || error.stack
            }
        }

        // Send response
        res.status(statusCode).json({
            data,
            code: statusCode,
            error,
            metadata: {
                ...metadata,
                responsedAt: new Date().toISOString(),
            },
        })
        .end();

        res.destroy();
    };

    next();
}


/**
 * Hndler to catch all errors
 *
 * @param  {Error} err
 * @param  {Request} req
 * @param  {Response} res
 * @param  {NextFunction} next
 */
export const ERROR_HANDLER = (err: Error, req: Request, res: Response, next: NextFunction) => {

    // No errors, continue
    if (!err) return next();

    // Error, send 500 status
    res.sendResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, err);

}


/**
 * Handler to intercept all  
 *
 * @param  {Request} req
 * @param  {Response} res
 */
export const NOT_IMPLEMENTED_HANDLER = (req: Request) => req.sendResponse(HTTP_STATUS.NOT_IMPLEMENTED, { message: 'Resource Not Implemented' });

// Handler for body parser
const BODY_PARSER_HANDLER = bodyParser.json();

// Handler for logs
export const LOGGER_HANDLER = morgan('[:date[iso]] :status - :method :url - :response-time ms');

// Handlers
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
