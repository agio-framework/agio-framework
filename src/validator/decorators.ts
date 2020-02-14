import { Singleton } from '@agio/framework/common';
import { ValidatorOptions } from '@agio/framework/validator';
import { Request, Response, NextFunction } from '@agio/framework/http';

import { schema } from './schema-mapper';

/**
 * Validator Decorator: Turn the class a Joi validator middleware
 */
export const Validator = (options: ValidatorOptions) => function(target: VoidFunction) {

    // Register always as singleton
    Singleton()(target);

    const validations = options.validate
        .map(field => ({ field, schema: schema((new target)[field]) }))
        .filter(validation => !!validation.schema);


    target.prototype.use = (req: Request, res: Response, next: NextFunction) => {

        if (!options.provideTo) return next();

        Promise
            .all(validations.map(validation => {

                if (options.provideTo === 'request') return validation.schema.validateAsync(req[validation.field])
                else if (options.provideTo === 'response') return validation.schema.validateAsync(res[validation.field])
                else return true;

            }))
            .then(() => next())
            .catch((err: Error) => res.sendResponse(HTTP_STATUS.UNPROCESSABLE_ENTITY, err))

    }

}