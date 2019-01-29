# Power BI API Example

There were 2 recent problem statements that I was trying to address:

-   [50 row table refreshing every 5 seconds](50row5sec.md)

-   [86k row chart refreshing every 10 minutes](86krow10min.md)

## Accessing the Power BI API non-interactive

Since there are no application permissions (only delegate permissions) for Power BI, you must authenticate using a user account.

## Installation and Configuration

1. This application runs in Node.js so you will need to install: https://nodejs.org/en/download/.

2. Clone this project from GitHub:

```bash
git clone https://github.com/plasne/powerbi-api
cd powerbi-api
```

3. Install the required packages:

```bash
npm install
```

4. You will need to create a user account in your AAD and then it will need a license for Power BI (could just be a free license).

5. You will need to create a Power BI Application:

![app-reg-1](/images/app-reg-1.png)

![app-reg-2](/images/app-reg-2.png)

_NOTE_ Technically the "Create content" right is not required, but I added it since I assume that at some point in the future it will be required.

6. Create a .env file in this root directory:

```env
DIRECTORY=mydir.onmicrosoft.com
REDIRECT_URL=http://mypowerbiapp.mydomain.com
APP_ID=????????-????-????-????-????????????
USERNAME=myusername@mydir.onmicrosoft.com
PASSWORD=mypassword
```

## Consent

Because the application uses delegate permissions, the user must consent to the application doing things on his behalf. There is a long URL for consent, but I baked that into this sample, so you can just type:

```bash
node dist/push.js consent
```

That will return a URL that you can use for consent. It will redirect to the redirectUri, which probably won't be a valid URL, but that's fine, it doesn't need to be - once it redirects, you are fine.

## Usage

You can get all usage parameters by:

```bash
node dist/push.js --help
```

To create a dataset:

```bash
node dist/push.js create mydataset
```

To add data to the dataset (ex. 5 rows):

```bash
node dist/push.js add mydataset --count 5
```

To clear the current data and push rows every few seconds (ex. 50 rows every 5 seconds), you can:

```bash
node dist/push.js interval mydataset --count 50 --every 5
```

To specify the schema to use (ex. create with the telemetry schema):

```bash
node dist/push.js create --schema telemetry
```

## Notes

I wasted an hour getting a 403 because I used "bearer" instead of "Bearer", it is case-sensitive, make sure you case it with a capital-B.
