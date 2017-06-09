# Accessing the Power BI API non-interactive

Since there are no application permissions (only delegate permissions) for Power BI, you must authenticate using a user account.

## Create a Native App

![app-reg-1](/images/app-reg-1.png)

![app-reg-2](/images/app-reg-2.png)

## Create a User Account

You will need to create a user account in your AAD and then it will need a license for Power BI (could just be a free license).

## Configuration

You must rename the default.sample.json file to default.json and then put in the correct values for everything:

| Option | Value |
|--------|-------|
| authority | always "https://login.microsoftonline.com" |
| directory | the name of your Azure Active Directory tenant, ie. something.onmicrosoft.com |
| subscription | your subscription ID |
| redirectUri | the URL you used when creating the app, which could be anything unique, it doesn't need to be valid |
| clientId | the client ID of the Native App |
| username | the username of the user |
| password | the password of the user |

## Consent

Because the application uses delegate permissions, the user must consent to the application doing things on his behalf. There is a long URL for consent, but I baked that into this sample, so you can just type:

``` bash
node index.js --help
```

That will return a URL that you can use for consent. It will redirect to the redirectUri, which probably won't be a valid URL, but that's fine, it doesn't need to be - once it redirects, you are fine.

## Bearer

I wasted an hour getting a 403 because I used "bearer" instead of "Bearer", it is case-sensitive, make sure you case it with a capital-B.
