# 50 rows updated in a table every 5 seconds

After evaluating the options for real-time streaming https://docs.microsoft.com/en-us/power-bi/service-real-time-streaming, there is only 1 suitable option, the Push dataset. The Streaming and PubNub options do not allow you to use the table visual. Though, you can turn on "Historical data analysis" in Streaming, this does the same thing as creating a Push dataset.

## Usage

```bash
node dist/push.js interval --schema telemetry --count 50 --every 5
```

## Challenge: Automatic Refresh

We want the data to refresh automatically whenever there is a change. This is supported, when done exactly this way:

1. Create a Report with the Table Tile.

2. Pin the _Tile_ to a _Dashboard_, do not pin the Report.

3. View the Dashboard, and you will see that there is a refresh every 5 seconds.

## Challenge: Whitespace

The update loop transacts like this:

1. The app deletes all rows from the table.

2. Power BI refreshes the screen with a blank table.

3. The app pushes 50 rows into the table.

4. Power BI refreshes the screen with the appropriate data.

The problem is that clearing the table happens basically instantaneous, but Power BI ingesting the 50 rows of data seems to take ~2 seconds and so out of 5 seconds, there is an empty table almost 1/2 the time.

There is no particular fix for this, but I have raised a suggestion that we be able to create a transaction and refresh only on the completed transaction _or_ we could turn off automatic refresh and have an API to trigger the refresh.

## Alternative: Gauge Tile

You could add a 2nd real-time dataset, this time a Streaming dataset. Then use a Gauge Tile next to your chart visual that resets to 0 and then builds to 100 (percent) using the API as the data is refreshed. With proper context and labeling, this should let your users know that the chart is being refreshed.

You can do that with this application, by creating a Streaming dataset with the following schema:

```json
{
    "percentage": "number",
    "min": "number",
    "max": "number",
    "target": "number"
}
```

Add a Gauge Tile to your Dashboard using the dataset.

Then add the URL to the .env file:

```bash
GAUGE_URL=https://api.powerbi.com/beta/111111111-2222-3333-4444-555555555555/datasets/111111111-2222-3333-4444-555555555555/rows?key=ar...%3D%3D
```

When "interval" is run it will now update the gauge. However, you will notice that the gauge will fill once the last batch of data is pushed, but it may take a couple of seconds before the chart updates, therefore you might wish to delay updating the gauge by a second or two.

![gauge](/images/gauge.png)

## Alternative: AJAX Web Content

As an alternative, you could use the "Web content" Tile on your Dashboard that makes AJAX calls to a service and displays data in the intended fashion.

## Alterative: DirectQuery + Embedded App

Rather than using a Push dataset at all, you could consider using DirectQuery against a supported datasource like Azure SQL DB. Then you could build an Embedded App which has a refresh method: https://docs.microsoft.com/en-us/power-bi/refresh-data. 
