const config = require("config");
const adal = require("adal-node");
const request = require("request");
const cmd = require("commander");
const qs = require("querystring");

// set global variables
const authority = config.get("authority");
const directory = config.get("directory");
const redirectUri = config.get("redirectUri");
const clientId = config.get("clientId");
const username = config.get("username");
const password = config.get("password");
const sql_server = config.get("sql-server");
const sql_database = config.get("sql-database");
const sql_username = config.get("sql-username");
const sql_password = config.get("sql-password");
const resource = "https://analysis.windows.net/powerbi/api";

function random(min, max) {
    const f_min = Math.ceil(min);
    const f_max = Math.floor(max);
    const num = Math.floor(Math.random() * (f_max - f_min + 1)) + f_min;
    return num;
}

Array.prototype.random = function() {
    const index = random(0, this.length - 1);
    return this[index];
}

// command line parameters
cmd
    .version("0.3.0")
    .option("--consent", "get the consent URL")
    .option("-c, --create <value>", "create a dataset")
    .option("-ls, --list", "list all datasets")
    .option("-d, --delete", "delete a dataset, you must specify the --id")
    .option("-g, --get", "gets a dataset, you must specify the --id")
    .option("-i, --id <value>", "specifies a dataset id")
    .option("-a, --add <n>", "add n rows to the Customer table, you must specify the --id")
    .parse(process.argv);

// process
if (cmd.hasOwnProperty("consent")) {
    const stateToken = "not_needed";
    const consent = authority + directory + "/oauth2/authorize?response_type=code&client_id=" + qs.escape(clientId) + "&redirect_uri=" + qs.escape(redirectUri) + "&state=" + qs.escape(stateToken) + "&resource=" + qs.escape(resource) + "&prompt=consent";
    console.log("The consent URL is:\n" + consent);
} else {

    // get an access token
    const context = new adal.AuthenticationContext(authority + directory + "/oauth2/authorize");
    context.acquireTokenWithUsernamePassword(resource, username, password, clientId, (error, tokenResponse) => {
        if (!error) {

            // perform the appropriate action
            if (cmd.hasOwnProperty("create")) {

                // create a dataset
                request.post({
                    uri: "https://api.powerbi.com/v1.0/myorg/datasets",
                    headers: {
                        Authorization: `Bearer ${tokenResponse.accessToken}`
                    },
                    body: {
                        "name": cmd.create,
                        "defaultMode": "Push",
                        "tables": [
                            {
                                "name": "Customer",
                                "columns": [
                                    {
                                        "name": "FirstName",
                                        "dataType": "string"
                                    },
                                    {
                                        "name": "LastName",
                                        "dataType": "string"
                                    },
                                    {
                                        "name": "CompanyName",
                                        "dataType": "string"
                                    }
                                ]
                            }
                        ]
                    },
                    json: true
                }, (error, response, body) => {
                    if (!error && response.statusCode == 201) {
                        console.log("created " + body.id);
                    } else {
                        if (error) { console.error(`error(101): ${error}`) } else { console.error(`error(102) [${response.statusCode}]: ${response.statusMessage}`); console.log(body); };
                        console.log(body.error.details);
                    }
                });

            } else if (cmd.hasOwnProperty("add") && cmd.hasOwnProperty("id")) {

                // generate the rows
                const rows = [];
                for (let i = 0; i < cmd.add; i++) {
                    rows.push({
                        "FirstName": [ "Peter", "John", "Fred", "Brian", "Hugo", "Harold", "Patrick", "Allen", "Andy", "Daniel", "Eugene", "Gil", "Jason", "Oliva", "Shawn" ].random(),
                        "LastName": [ "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson" ].random(),
                        "CompanyName": [ "Walmart", "State Grid", "Sinopec Group", "China National Petroleum", "Toyota", "Volkswagen Group", "Royal Dutch Shell" ].random()
                    });
                }

                // post the rows
                request.post({
                    uri: `https://api.powerbi.com/v1.0/myorg/datasets/${cmd.id}/tables/Customer/rows`,
                    headers: {
                        Authorization: `Bearer ${tokenResponse.accessToken}`
                    },
                    body: {
                        "rows": rows
                    },
                    json: true
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log(`added ${cmd.add} rows.`);
                    } else {
                        if (error) { console.error(`error(103): ${error}`) } else { console.error(`error(104) [${response.statusCode}]: ${response.statusMessage}`); console.log(body); };
                        console.log(body.error.details);
                    }
                });

            } else if (cmd.hasOwnProperty("list")) {

                // list all datasets
                request.get({
                    uri: "https://api.powerbi.com/v1.0/myorg/datasets",
                    headers: {
                        Authorization: `Bearer ${tokenResponse.accessToken}`
                    },
                    json: true
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log(body);
                    } else {
                        if (error) { console.error(`error(105): ${error}`) } else { console.error(`error(106) [${response.statusCode}]: ${response.statusMessage}`); console.log(body); };
                    }
                });

            } else if (cmd.hasOwnProperty("delete") && cmd.hasOwnProperty("id")) {

                // delete a dataset
                request.delete({
                    uri: `https://api.powerbi.com/v1.0/myorg/datasets/${cmd.id}`,
                    headers: {
                        Authorization: `Bearer ${tokenResponse.accessToken}`
                    },
                    json: true
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log("deleted")
                    } else {
                        if (error) { console.error(`error(107): ${error}`) } else { console.error(`error(108) [${response.statusCode}]: ${response.statusMessage}`); console.log(body); };
                    }
                });

            } else if (cmd.hasOwnProperty("get") && cmd.hasOwnProperty("id")) {

                // get a dataset
                request.get({
                    uri: `https://api.powerbi.com/v1.0/myorg/datasets/${cmd.id}`,
                    headers: {
                        Authorization: `Bearer ${tokenResponse.accessToken}`
                    },
                    json: true
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log(body);
                    } else {
                        if (error) { console.error(`error(109): ${error}`) } else { console.error(`error(110) [${response.statusCode}]: ${response.statusMessage}`); console.log(body); };
                    }
                });

            }

        } else {
            console.error(`error(100): ${error}`);
        }
    });

}