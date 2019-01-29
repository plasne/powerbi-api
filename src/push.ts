// includes
import * as adal from 'adal-node';
import cmd = require('commander');
import dotenv = require('dotenv');
import * as fs from 'fs';
import * as qs from 'querystring';
import * as request from 'request';
import * as util from 'util';
import * as winston from 'winston';

// promisify
const readFileAsync = util.promisify(fs.readFile);

// function to get a random number
function randomInt(min: number, max: number) {
    const fmin = Math.ceil(min);
    const fmax = Math.floor(max);
    const num = Math.floor(Math.random() * (fmax - fmin + 1)) + fmin;
    return num;
}
function randomDbl(min: number, max: number) {
    const num = Math.random() * (max - min + 1) + min;
    return num;
}

// method to choose a random element from an array
Array.prototype.random = function() {
    const index = randomInt(0, this.length - 1);
    return this[index];
};

// set env
dotenv.config();

// define options
cmd.option(
    '-l, --log-level <s>',
    'LOG_LEVEL. The minimum level to log (error, warn, info, verbose, debug, silly). Defaults to "info".',
    /^(error|warn|info|verbose|debug|silly)$/i
)
    .option(
        '-d, --directory <s>',
        '[REQUIRED] DIRECTORY. The Azure Active Directory name that holds the user account (ex. mydir.onmicrosoft.com).'
    )
    .option(
        '-r, --redirect-url <s>',
        '[REQUIRED] REDIRECT_URL. The redirection URL for the Power BI Application.'
    )
    .option(
        '-a, --appId <s>',
        '[REQUIRED] APP_ID. The ID (GUID) of the Power BI Application.'
    )
    .option(
        '-u, --username <s>',
        '[REQUIRED] USERNAME. The username of the service account for Power BI.'
    )
    .option(
        '-p, --password <s>',
        '[REQUIRED] PASSWORD. The password of the service account for Power BI.'
    )
    .option(
        '-s, --schema <s>',
        'SCHEMA. The name of the schema to apply. Defaults to "contacts".'
    );

interface IStartupOptions {
    loadSchema?: boolean;
    getToken?: boolean;
}

function startup(options?: IStartupOptions) {
    return new Promise(async (resolve, reject) => {
        // assign globals
        global.AUTHORITY = 'https://login.microsoftonline.com/';
        global.RESOURCE = 'https://analysis.windows.net/powerbi/api';
        global.APP_ID = cmd.appId || process.env.APP_ID;
        global.DIRECTORY = cmd.directory || process.env.DIRECTORY;
        global.LOG_LEVEL = cmd.logLevel || process.env.LOG_LEVEL || 'info';
        global.REDIRECT_URL = cmd.redirectUrl || process.env.REDIRECT_URL;
        global.USERNAME = cmd.username || process.env.USERNAME;
        global.PASSWORD = cmd.password || process.env.PASSWORD;
        const schema = cmd.schema || process.env.SCHEMA || 'contacts';

        // start logging
        const logColors: {
            [index: string]: string;
        } = {
            debug: '\x1b[32m', // green
            error: '\x1b[31m', // red
            info: '', // white
            silly: '\x1b[32m', // green
            verbose: '\x1b[32m', // green
            warn: '\x1b[33m' // yellow
        };
        const transport = new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(event => {
                    const color = logColors[event.level] || '';
                    const level = event.level.padStart(7);
                    return `${event.timestamp} ${color}${level}\x1b[0m: ${
                        event.message
                    }`;
                })
            )
        });
        global.logger = winston.createLogger({
            level: global.LOG_LEVEL,
            transports: [transport]
        });

        // log startup options
        console.log(`LOG_LEVEL is "${global.LOG_LEVEL}".`);
        global.logger.info(`APP_ID is "${global.APP_ID}".`);
        global.logger.info(`DIRECTORY is "${global.DIRECTORY}".`);
        global.logger.info(`REDIRECT_URL is "${global.REDIRECT_URL}".`);
        global.logger.info(`USERNAME is "${global.USERNAME}".`);
        global.logger.info(
            `PASSWORD is "${global.PASSWORD ? 'assigned' : 'unassigned'}".`
        );
        global.logger.info(`SCHEMA is "${schema}".`);

        // load the schema
        if (options && options.loadSchema) {
            try {
                const raw = await readFileAsync(
                    `./schemas/${schema}.json`,
                    'utf8'
                );
                global.schema = JSON.parse(raw);
                global.logger.verbose(
                    `schema "${schema}" was successfully loaded.`
                );
            } catch (error) {
                global.logger.error(
                    `schema "${schema}" could not be loaded...`
                );
                reject(error);
                return;
            }
        }

        // get an access token
        if (options && options.getToken) {
            global.logger.verbose('fetching token...');
            const context = new adal.AuthenticationContext(
                global.AUTHORITY + global.DIRECTORY + '/oauth2/authorize'
            );
            context.acquireTokenWithUsernamePassword(
                global.RESOURCE,
                global.USERNAME,
                global.PASSWORD,
                global.APP_ID,
                (error, tokenResponse) => {
                    if (!error) {
                        const response = tokenResponse as adal.TokenResponse;
                        global.token = response.accessToken;
                        global.logger.verbose('access token obtained.');
                        resolve();
                    } else if (global.logger) {
                        global.logger.error('Error when acquiring a token...');
                        reject(error);
                    }
                }
            );
        } else {
            resolve();
        }
    });
}

// generate a consent link
cmd.command('consent')
    .description('Get the consent URL.')
    .action(_ => {
        startup();
        const stateToken = 'not_needed';
        const consent =
            global.AUTHORITY +
            global.DIRECTORY +
            '/oauth2/authorize?response_type=code&client_id=' +
            qs.escape(global.APP_ID) +
            '&redirect_uri=' +
            qs.escape(global.REDIRECT_URL) +
            '&state=' +
            qs.escape(stateToken) +
            '&resource=' +
            qs.escape(global.RESOURCE) +
            '&prompt=consent';
        global.logger.info('The consent URL is:\n' + consent);
    });

// create a new dataset
cmd.command('create <dataset_name>')
    .description('Creates a new dataset.')
    .action(async (name: string) => {
        try {
            // startup
            await startup({
                getToken: true,
                loadSchema: true
            });

            // trim the schema
            const schema = Object.assign({}, global.schema);
            for (const column of schema.columns) {
                delete column.options;
                delete column.min;
                delete column.max;
            }

            // post
            request.post(
                {
                    body: {
                        defaultMode: 'Push',
                        name,
                        tables: [schema]
                    },
                    headers: {
                        Authorization: `Bearer ${global.token}`
                    },
                    json: true,
                    uri: 'https://api.powerbi.com/v1.0/myorg/datasets'
                },
                (error, response, body) => {
                    if (!error && response.statusCode === 201) {
                        global.logger.info(`created "${body.id}".`);
                    } else {
                        if (error) {
                            global.logger.error(error.stack);
                        } else {
                            global.logger.error(
                                `${response.statusCode}: ${
                                    response.statusMessage
                                }`
                            );
                        }
                        global.logger.error(JSON.stringify(response));
                    }
                }
            );
        } catch (error) {
            global.logger.error(error.stack);
        }
    });

interface IDataset {
    id: string;
    name: string;
    addRowsAPIEnabled: boolean;
    configuredBy: string;
    isRefreshable: boolean;
    isEffectiveIdentityRequired: boolean;
    isEffectiveIdentityRolesRequired: boolean;
    isOnPremGatewayRequired: boolean;
}

function list() {
    return new Promise<IDataset[]>((resolve, reject) => {
        request.get(
            {
                headers: {
                    Authorization: `Bearer ${global.token}`
                },
                json: true,
                uri: 'https://api.powerbi.com/v1.0/myorg/datasets'
            },
            (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve(body.value);
                } else {
                    if (error) {
                        global.logger.error(error.stack);
                    } else {
                        global.logger.error(
                            `${response.statusCode}: ${response.statusMessage}`
                        );
                    }
                    global.logger.error(JSON.stringify(response));
                    reject();
                }
            }
        );
    });
}

// list all existing datasets in the workspace
cmd.command('list')
    .description('Lists all datasets in "MyWorkspace".')
    .action(async () => {
        try {
            await startup({
                getToken: true
            });
            const datasets = await list();
            for (const dataset of datasets) {
                global.logger.info('--------------------------');
                global.logger.info(`id: ${dataset.id}`);
                global.logger.info(`name: ${dataset.name}`);
                global.logger.info(
                    `addRowsAPIEnabled: ${dataset.addRowsAPIEnabled}`
                );
                global.logger.info(`isRefreshable: ${dataset.isRefreshable}`);
                global.logger.info(
                    `isEffectiveIdentityRequired: ${
                        dataset.isEffectiveIdentityRequired
                    }`
                );
                global.logger.info(
                    `isEffectiveIdentityRolesRequired: ${
                        dataset.isEffectiveIdentityRolesRequired
                    }`
                );
                global.logger.info(
                    `isOnPremGatewayRequired: ${
                        dataset.isOnPremGatewayRequired
                    }`
                );
                global.logger.info('--------------------------');
            }
        } catch (error) {
            global.logger.error(error.stack);
        }
    });

async function resolveId(id: string) {
    if (
        /^([0-9A-Fa-f]{8}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12})$/.test(
            id
        )
    ) {
        // already a valid id
        return id;
    } else {
        // use list() to get the id from the name
        const datasets = await list();
        const dataset = datasets.find(d => d.name === id);
        if (!dataset) throw new Error(`the specified dataset cannot be found.`);
        global.logger.verbose(`resolved dataset "${id}" as "${dataset.id}".`);
        return dataset.id;
    }
}

function addPost(id: string, rows: any[]) {
    return new Promise((resolve, reject) => {
        request.post(
            {
                body: {
                    rows
                },
                headers: {
                    Authorization: `Bearer ${global.token}`
                },
                json: true,
                uri: `https://api.powerbi.com/v1.0/myorg/datasets/${id}/tables/${
                    global.schema.name
                }/rows`
            },
            (error, response) => {
                if (!error && response.statusCode === 200) {
                    global.logger.info(`added "${rows.length}" rows.`);
                    resolve();
                } else {
                    if (error) {
                        global.logger.error(error.stack);
                    } else {
                        global.logger.error(
                            `${response.statusCode}: ${response.statusMessage}`
                        );
                    }
                    global.logger.error(JSON.stringify(response));
                    reject();
                    return;
                }
            }
        );
    });
}

function add(id: string, count: number) {
    return new Promise(async (resolve, reject) => {
        let total = 0;
        while (total < count) {
            try {
                // process a batch
                const batch = Math.min(count - total, 10000); // max size allowed
                total += batch;

                // generate the rows
                const rows: any[] = [];
                for (let i = 0; i < batch; i++) {
                    const row = {};
                    for (const column of global.schema.columns) {
                        switch (column.dataType.toLowerCase()) {
                            case 'int':
                            case 'int64':
                                if (column.min && column.max) {
                                    row[column.name] = randomInt(
                                        column.min,
                                        column.max
                                    );
                                }
                                break;
                            case 'double':
                                if (column.min && column.max) {
                                    row[column.name] = randomDbl(
                                        column.min,
                                        column.max
                                    );
                                }
                                break;
                            case 'string':
                                if (column.options) {
                                    row[column.name] = column.options.random();
                                }
                                break;
                        }
                    }
                    rows.push(row);
                }
                global.logger.info(`${rows.length} rows generated; posting...`);

                // post
                await addPost(id, rows);
            } catch (error) {
                reject(error);
                return;
            }
        }
        resolve();
    });
}

// add rows to an existing dataset
cmd.command('add <dataset_id>')
    .option(
        '-c, --count <i>',
        'Specify the number of rows to add. Defaults to "1".',
        parseInt
    )
    .description('Adds rows to the specified dataset.')
    .action(async (id: string, options) => {
        try {
            // startup
            await startup({
                getToken: true,
                loadSchema: true
            });

            // resolve the id
            id = await resolveId(id);

            // push
            const count = options.count || 1;
            add(id, count);
        } catch (error) {
            global.logger.error(error.stack);
        }
    });

// delete a dataset
cmd.command('delete <dataset_id>')
    .description('Deletes a dataset.')
    .action(async (id: string) => {
        try {
            // startup
            await startup({
                getToken: true
            });

            // resolve the id
            id = await resolveId(id);

            // delete
            request.delete(
                {
                    headers: {
                        Authorization: `Bearer ${global.token}`
                    },
                    json: true,
                    uri: `https://api.powerbi.com/v1.0/myorg/datasets/${id}`
                },
                (error, response) => {
                    if (!error && response.statusCode === 200) {
                        global.logger.info(`deleted.`);
                    } else {
                        if (error) {
                            global.logger.error(error.stack);
                        } else {
                            global.logger.error(
                                `${response.statusCode}: ${
                                    response.statusMessage
                                }`
                            );
                        }
                        global.logger.error(JSON.stringify(response));
                    }
                }
            );
        } catch (error) {
            global.logger.error(error.stack);
        }
    });

function clear(id: string) {
    return new Promise((resolve, reject) => {
        request.delete(
            {
                headers: {
                    Authorization: `Bearer ${global.token}`
                },
                json: true,
                uri: `https://api.powerbi.com/v1.0/myorg/datasets/${id}/tables/${
                    global.schema.name
                }/rows`
            },
            (error, response) => {
                if (!error && response.statusCode === 200) {
                    global.logger.info(`deleted all rows.`);
                    resolve();
                } else {
                    if (error) {
                        global.logger.error(error.stack);
                    } else {
                        global.logger.error(
                            `${response.statusCode}: ${response.statusMessage}`
                        );
                    }
                    global.logger.error(JSON.stringify(response));
                    reject();
                }
            }
        );
    });
}

// delete all rows
cmd.command('clear <dataset_id>')
    .description('Deletes all rows from the table.')
    .action(async (id: string) => {
        try {
            // startup
            await startup({
                getToken: true,
                loadSchema: true
            });

            // resolve the id
            id = await resolveId(id);

            // delete
        } catch (error) {
            global.logger.error(error.stack);
        }
    });

// push data on a timer
cmd.command('interval <dataset_id>')
    .option(
        '-c, --count <i>',
        'Specify the number of rows to add. Defaults to "1".',
        parseInt
    )
    .option(
        '-e, --every <i>',
        'Rows will be inserted every "i" seconds. Defaults to "60".',
        parseInt
    )
    .description(
        'Clears rows and pushes a new set of count rows every few seconds.'
    )
    .action(async (id: string, options) => {
        try {
            // startup
            await startup({
                getToken: true,
                loadSchema: true
            });

            // resolve the id
            id = await resolveId(id);

            // get options
            const count = options.count || 1;
            const every = options.every || 60;

            // start processing
            const process = async () => {
                try {
                    await clear(id);
                    await add(id, count);
                } catch (error) {
                    global.logger.error(error.stack);
                }
                setTimeout(process, every * 1000);
            };
            process();
        } catch (error) {
            global.logger.error(error.stack);
        }
    });

cmd.parse(process.argv);
