"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
// includes
var adal = __importStar(require("adal-node"));
var cmd = require("commander");
var dotenv = require("dotenv");
var fs = __importStar(require("fs"));
var qs = __importStar(require("querystring"));
var request = __importStar(require("request"));
var util = __importStar(require("util"));
var winston = __importStar(require("winston"));
// promisify
var readFileAsync = util.promisify(fs.readFile);
// function to get a random number
function randomInt(min, max) {
    var fmin = Math.ceil(min);
    var fmax = Math.floor(max);
    var num = Math.floor(Math.random() * (fmax - fmin + 1)) + fmin;
    return num;
}
function randomDbl(min, max) {
    var num = Math.random() * (max - min + 1) + min;
    return num;
}
// method to choose a random element from an array
Array.prototype.random = function () {
    var index = randomInt(0, this.length - 1);
    return this[index];
};
// set env
dotenv.config();
// define options
cmd.option('-l, --log-level <s>', 'LOG_LEVEL. The minimum level to log (error, warn, info, verbose, debug, silly). Defaults to "info".', /^(error|warn|info|verbose|debug|silly)$/i)
    .option('-d, --directory <s>', '[REQUIRED] DIRECTORY. The Azure Active Directory name that holds the user account (ex. mydir.onmicrosoft.com).')
    .option('-r, --redirect-url <s>', '[REQUIRED] REDIRECT_URL. The redirection URL for the Power BI Application.')
    .option('-a, --appId <s>', '[REQUIRED] APP_ID. The ID (GUID) of the Power BI Application.')
    .option('-u, --username <s>', '[REQUIRED] USERNAME. The username of the service account for Power BI.')
    .option('-p, --password <s>', '[REQUIRED] PASSWORD. The password of the service account for Power BI.')
    .option('-s, --schema <s>', 'SCHEMA. The name of the schema to apply. Defaults to "contacts".');
function startup(options) {
    var _this = this;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var schema, logColors, transport, raw, error_1, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // assign globals
                    global.AUTHORITY = 'https://login.microsoftonline.com/';
                    global.RESOURCE = 'https://analysis.windows.net/powerbi/api';
                    global.APP_ID = cmd.appId || process.env.APP_ID;
                    global.DIRECTORY = cmd.directory || process.env.DIRECTORY;
                    global.LOG_LEVEL = cmd.logLevel || process.env.LOG_LEVEL || 'info';
                    global.REDIRECT_URL = cmd.redirectUrl || process.env.REDIRECT_URL;
                    global.USERNAME = cmd.username || process.env.USERNAME;
                    global.PASSWORD = cmd.password || process.env.PASSWORD;
                    schema = cmd.schema || process.env.SCHEMA || 'contacts';
                    logColors = {
                        debug: '\x1b[32m',
                        error: '\x1b[31m',
                        info: '',
                        silly: '\x1b[32m',
                        verbose: '\x1b[32m',
                        warn: '\x1b[33m' // yellow
                    };
                    transport = new winston.transports.Console({
                        format: winston.format.combine(winston.format.timestamp(), winston.format.printf(function (event) {
                            var color = logColors[event.level] || '';
                            var level = event.level.padStart(7);
                            return event.timestamp + " " + color + level + "\u001B[0m: " + event.message;
                        }))
                    });
                    global.logger = winston.createLogger({
                        level: global.LOG_LEVEL,
                        transports: [transport]
                    });
                    // log startup options
                    console.log("LOG_LEVEL is \"" + global.LOG_LEVEL + "\".");
                    global.logger.info("APP_ID is \"" + global.APP_ID + "\".");
                    global.logger.info("DIRECTORY is \"" + global.DIRECTORY + "\".");
                    global.logger.info("REDIRECT_URL is \"" + global.REDIRECT_URL + "\".");
                    global.logger.info("USERNAME is \"" + global.USERNAME + "\".");
                    global.logger.info("PASSWORD is \"" + (global.PASSWORD ? 'assigned' : 'unassigned') + "\".");
                    global.logger.info("SCHEMA is \"" + schema + "\".");
                    if (!(options && options.loadSchema)) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, readFileAsync("./schemas/" + schema + ".json", 'utf8')];
                case 2:
                    raw = _a.sent();
                    global.schema = JSON.parse(raw);
                    global.logger.verbose("schema \"" + schema + "\" was successfully loaded.");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    global.logger.error("schema \"" + schema + "\" could not be loaded...");
                    reject(error_1);
                    return [2 /*return*/];
                case 4:
                    // get an access token
                    if (options && options.getToken) {
                        global.logger.verbose('fetching token...');
                        context = new adal.AuthenticationContext(global.AUTHORITY + global.DIRECTORY + '/oauth2/authorize');
                        context.acquireTokenWithUsernamePassword(global.RESOURCE, global.USERNAME, global.PASSWORD, global.APP_ID, function (error, tokenResponse) {
                            if (!error) {
                                var response = tokenResponse;
                                global.token = response.accessToken;
                                global.logger.verbose('access token obtained.');
                                resolve();
                            }
                            else if (global.logger) {
                                global.logger.error('Error when acquiring a token...');
                                reject(error);
                            }
                        });
                    }
                    else {
                        resolve();
                    }
                    return [2 /*return*/];
            }
        });
    }); });
}
// generate a consent link
cmd.command('consent')
    .description('Get the consent URL.')
    .action(function (_) {
    startup();
    var stateToken = 'not_needed';
    var consent = global.AUTHORITY +
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
    .action(function (name) { return __awaiter(_this, void 0, void 0, function () {
    var schema, _i, _a, column, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                // startup
                return [4 /*yield*/, startup({
                        getToken: true,
                        loadSchema: true
                    })];
            case 1:
                // startup
                _b.sent();
                schema = Object.assign({}, global.schema);
                for (_i = 0, _a = schema.columns; _i < _a.length; _i++) {
                    column = _a[_i];
                    delete column.options;
                    delete column.min;
                    delete column.max;
                }
                // post
                request.post({
                    body: {
                        defaultMode: 'Push',
                        name: name,
                        tables: [schema]
                    },
                    headers: {
                        Authorization: "Bearer " + global.token
                    },
                    json: true,
                    uri: 'https://api.powerbi.com/v1.0/myorg/datasets'
                }, function (error, response, body) {
                    if (!error && response.statusCode === 201) {
                        global.logger.info("created \"" + body.id + "\".");
                    }
                    else {
                        if (error) {
                            global.logger.error(error.stack);
                        }
                        else {
                            global.logger.error(response.statusCode + ": " + response.statusMessage);
                        }
                        global.logger.error(JSON.stringify(response));
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                global.logger.error(error_2.stack);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
function list() {
    return new Promise(function (resolve, reject) {
        request.get({
            headers: {
                Authorization: "Bearer " + global.token
            },
            json: true,
            uri: 'https://api.powerbi.com/v1.0/myorg/datasets'
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(body.value);
            }
            else {
                if (error) {
                    global.logger.error(error.stack);
                }
                else {
                    global.logger.error(response.statusCode + ": " + response.statusMessage);
                }
                global.logger.error(JSON.stringify(response));
                reject();
            }
        });
    });
}
// list all existing datasets in the workspace
cmd.command('list')
    .description('Lists all datasets in "MyWorkspace".')
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var datasets, _i, datasets_1, dataset, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, startup({
                        getToken: true
                    })];
            case 1:
                _a.sent();
                return [4 /*yield*/, list()];
            case 2:
                datasets = _a.sent();
                for (_i = 0, datasets_1 = datasets; _i < datasets_1.length; _i++) {
                    dataset = datasets_1[_i];
                    global.logger.info('--------------------------');
                    global.logger.info("id: " + dataset.id);
                    global.logger.info("name: " + dataset.name);
                    global.logger.info("addRowsAPIEnabled: " + dataset.addRowsAPIEnabled);
                    global.logger.info("isRefreshable: " + dataset.isRefreshable);
                    global.logger.info("isEffectiveIdentityRequired: " + dataset.isEffectiveIdentityRequired);
                    global.logger.info("isEffectiveIdentityRolesRequired: " + dataset.isEffectiveIdentityRolesRequired);
                    global.logger.info("isOnPremGatewayRequired: " + dataset.isOnPremGatewayRequired);
                    global.logger.info('--------------------------');
                }
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                global.logger.error(error_3.stack);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
function resolveId(id) {
    return __awaiter(this, void 0, void 0, function () {
        var datasets, dataset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!/^([0-9A-Fa-f]{8}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12})$/.test(id)) return [3 /*break*/, 1];
                    // already a valid id
                    return [2 /*return*/, id];
                case 1: return [4 /*yield*/, list()];
                case 2:
                    datasets = _a.sent();
                    dataset = datasets.find(function (d) { return d.name === id; });
                    if (!dataset)
                        throw new Error("the specified dataset cannot be found.");
                    global.logger.verbose("resolved dataset \"" + id + "\" as \"" + dataset.id + "\".");
                    return [2 /*return*/, dataset.id];
            }
        });
    });
}
function addPost(id, rows) {
    return new Promise(function (resolve, reject) {
        request.post({
            body: {
                rows: rows
            },
            headers: {
                Authorization: "Bearer " + global.token
            },
            json: true,
            uri: "https://api.powerbi.com/v1.0/myorg/datasets/" + id + "/tables/" + global.schema.name + "/rows"
        }, function (error, response) {
            if (!error && response.statusCode === 200) {
                global.logger.info("added \"" + rows.length + "\" rows.");
                resolve();
            }
            else {
                if (error) {
                    global.logger.error(error.stack);
                }
                else {
                    global.logger.error(response.statusCode + ": " + response.statusMessage);
                }
                global.logger.error(JSON.stringify(response));
                reject();
            }
        });
    });
}
function updateGauge(url, percentage) {
    return new Promise(function (resolve, reject) {
        request.post({
            body: {
                max: 100,
                min: 0,
                percentage: percentage,
                target: 100
            },
            json: true,
            uri: url
        }, function (error, response) {
            if (!error && response.statusCode === 200) {
                global.logger.verbose("gauge set to \"" + percentage + "\".");
                resolve();
            }
            else {
                if (error) {
                    global.logger.error(error.stack);
                }
                else {
                    global.logger.error(response.statusCode + ": " + response.statusMessage);
                }
                global.logger.error(JSON.stringify(response));
                reject();
            }
        });
    });
}
function add(id, count, gaugeUrl) {
    var _this = this;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var total, batch, rows, i, row, _i, _a, column, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    total = 0;
                    // set the gauge to 0%
                    if (gaugeUrl)
                        updateGauge(gaugeUrl, 0);
                    _b.label = 1;
                case 1:
                    if (!(total < count)) return [3 /*break*/, 6];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    batch = Math.min(count - total, 10000);
                    total += batch;
                    rows = [];
                    for (i = 0; i < batch; i++) {
                        row = {};
                        for (_i = 0, _a = global.schema.columns; _i < _a.length; _i++) {
                            column = _a[_i];
                            switch (column.dataType.toLowerCase()) {
                                case 'int':
                                case 'int64':
                                    if (column.min && column.max) {
                                        row[column.name] = randomInt(column.min, column.max);
                                    }
                                    break;
                                case 'double':
                                    if (column.min && column.max) {
                                        row[column.name] = randomDbl(column.min, column.max);
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
                    global.logger.info(rows.length + " rows generated; posting...");
                    // post
                    return [4 /*yield*/, addPost(id, rows)];
                case 3:
                    // post
                    _b.sent();
                    // set the gauge to x%
                    if (gaugeUrl) {
                        updateGauge(gaugeUrl, Math.ceil((total / count) * 100));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _b.sent();
                    reject(error_4);
                    return [2 /*return*/];
                case 5: return [3 /*break*/, 1];
                case 6:
                    // set the gauge to 100%
                    if (gaugeUrl)
                        updateGauge(gaugeUrl, 100);
                    resolve();
                    return [2 /*return*/];
            }
        });
    }); });
}
// add rows to an existing dataset
cmd.command('add <dataset_id>')
    .option('-c, --count <i>', 'Specify the number of rows to add. Defaults to "1".', parseInt)
    .description('Adds rows to the specified dataset.')
    .action(function (id, options) { return __awaiter(_this, void 0, void 0, function () {
    var COUNT, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // startup
                return [4 /*yield*/, startup({
                        getToken: true,
                        loadSchema: true
                    })];
            case 1:
                // startup
                _a.sent();
                return [4 /*yield*/, resolveId(id)];
            case 2:
                // resolve the id
                id = _a.sent();
                COUNT = options.count || 1;
                global.logger.info("COUNT is \"" + COUNT + "\".");
                // push
                add(id, COUNT);
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                global.logger.error(error_5.stack);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// delete a dataset
cmd.command('delete <dataset_id>')
    .description('Deletes a dataset.')
    .action(function (id) { return __awaiter(_this, void 0, void 0, function () {
    var error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // startup
                return [4 /*yield*/, startup({
                        getToken: true
                    })];
            case 1:
                // startup
                _a.sent();
                return [4 /*yield*/, resolveId(id)];
            case 2:
                // resolve the id
                id = _a.sent();
                // delete
                request.delete({
                    headers: {
                        Authorization: "Bearer " + global.token
                    },
                    json: true,
                    uri: "https://api.powerbi.com/v1.0/myorg/datasets/" + id
                }, function (error, response) {
                    if (!error && response.statusCode === 200) {
                        global.logger.info("deleted.");
                    }
                    else {
                        if (error) {
                            global.logger.error(error.stack);
                        }
                        else {
                            global.logger.error(response.statusCode + ": " + response.statusMessage);
                        }
                        global.logger.error(JSON.stringify(response));
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                global.logger.error(error_6.stack);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
function clear(id) {
    return new Promise(function (resolve, reject) {
        request.delete({
            headers: {
                Authorization: "Bearer " + global.token
            },
            json: true,
            uri: "https://api.powerbi.com/v1.0/myorg/datasets/" + id + "/tables/" + global.schema.name + "/rows"
        }, function (error, response) {
            if (!error && response.statusCode === 200) {
                global.logger.info("deleted all rows.");
                resolve();
            }
            else {
                if (error) {
                    global.logger.error(error.stack);
                }
                else {
                    global.logger.error(response.statusCode + ": " + response.statusMessage);
                }
                global.logger.error(JSON.stringify(response));
                reject();
            }
        });
    });
}
// delete all rows
cmd.command('clear <dataset_id>')
    .description('Deletes all rows from the table.')
    .action(function (id) { return __awaiter(_this, void 0, void 0, function () {
    var error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // startup
                return [4 /*yield*/, startup({
                        getToken: true,
                        loadSchema: true
                    })];
            case 1:
                // startup
                _a.sent();
                return [4 /*yield*/, resolveId(id)];
            case 2:
                // resolve the id
                id = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                global.logger.error(error_7.stack);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// push data on a timer
cmd.command('interval <dataset_id>')
    .option('-c, --count <i>', 'Specify the number of rows to add. Defaults to "1".', parseInt)
    .option('-e, --every <i>', 'Rows will be inserted every "i" seconds. Defaults to "60".', parseInt)
    .option('-g, --gauge-url <s>', 'GAUGE_URL. Specify the URL (with key) for updating a gauge during refresh.')
    .description('Clears rows and pushes a new set of count rows every few seconds.')
    .action(function (id, options) { return __awaiter(_this, void 0, void 0, function () {
    var COUNT_1, EVERY_1, GAUGE_URL_1, work_1, error_8;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // startup
                return [4 /*yield*/, startup({
                        getToken: true,
                        loadSchema: true
                    })];
            case 1:
                // startup
                _a.sent();
                return [4 /*yield*/, resolveId(id)];
            case 2:
                // resolve the id
                id = _a.sent();
                COUNT_1 = options.count || 1;
                EVERY_1 = options.every || 60;
                GAUGE_URL_1 = cmd.redirectUrl || process.env.GAUGE_URL;
                global.logger.info("COUNT is \"" + COUNT_1 + "\".");
                global.logger.info("EVERY is \"" + EVERY_1 + "\".");
                global.logger.info("GAUGE_URL is \"" + GAUGE_URL_1 + "\".");
                work_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                    var error_9;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, , 4]);
                                return [4 /*yield*/, clear(id)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, add(id, COUNT_1, GAUGE_URL_1)];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                error_9 = _a.sent();
                                global.logger.error(error_9.stack);
                                return [3 /*break*/, 4];
                            case 4:
                                setTimeout(work_1, EVERY_1 * 1000);
                                return [2 /*return*/];
                        }
                    });
                }); };
                work_1();
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                global.logger.error(error_8.stack);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
cmd.parse(process.argv);
