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
const resource = "https://analysis.windows.net/powerbi/api";

// command line parameters
cmd
    .version("0.1.0")
    .option("-h, --help", "get help")
    .parse(process.argv);
if (cmd.hasOwnProperty("help")) {
    const stateToken = "not_needed";
    const consent = authority + directory + "/oauth2/authorize?response_type=code&client_id=" + qs.escape(clientId) + "&redirect_uri=" + qs.escape(redirectUri) + "&state=" + qs.escape(stateToken) + "&resource=" + qs.escape(resource) + "&prompt=consent";
    console.log("The consent URL is:\n" + consent);
} else {

    // get an access token
    const context = new adal.AuthenticationContext(authority + directory + "/oauth2/authorize");
    context.acquireTokenWithUsernamePassword(resource, username, password, clientId, function(error, tokenResponse) {
        if (!error) {

            // create the dataset
            request.post({
                uri: "https://api.powerbi.com/v1.0/myorg/datasets",
                headers: {
                    Authorization: "Bearer " + tokenResponse.accessToken
                },
                body: {
                    "name": "dataset_name",
                    "tables": [
                        {
                            "name": "table_name",
                            "columns": [
                                {
                                    "name": "column_name",
                                    "dataType": "string"
                                }
                            ]
                        }
                    ]
                },
                json: true
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("success!");
                } else {
                    if (error) { console.error("error(101): " + error) } else { console.error("error(102) [" + response.statusCode + "]: " + response.statusMessage); console.log(body); };
                }
            });

        } else {
            console.error("error(100): " + error);
        }
    });

}