// includes
import * as winston from 'winston';
import { ITable, IColumn } from './schema';

declare global {
    namespace NodeJS {
        interface Global {
            APP_ID: string;
            AUTHORITY: string;
            DIRECTORY: string;
            LOG_LEVEL: string;
            PASSWORD: string;
            REDIRECT_URL: string;
            RESOURCE: string;
            USERNAME: string;
            logger: winston.Logger;
            schema: ITable;
            token?: string;
        }
    }
    interface Array<T> {
        random(): T;
    }
}
