# 86k rows updated in a chart every 10 minutes

After evaluating the options for real-time streaming https://docs.microsoft.com/en-us/power-bi/service-real-time-streaming, there is only 1 suitable option, the Push dataset. The Streaming and PubNub options do not allow you to use the appropriate visuals. Though, you can turn on "Historical data analysis" in Streaming, this does the same thing as creating a Push dataset.

## Usage

```bash
node dist/push.js interval --schema telemetry --count 86000 --every 600
```

## Challenge: Automatic Refresh

We want the data to refresh automatically whenever there is a change. This is supported, when done exactly this way:

1. Create a Report with the Table Tile.

2. Pin the _Tile_ to a _Dashboard_, do not pin the Report.

3. View the Dashboard, and you will see that there is a refresh every 5 seconds.

## Challenge: Partial Refresh

The update loop transacts like this:

1. The app deletes all rows from the table.

2. Power BI refreshes the screen with a blank table.

3. The app pushes 10k rows (max batch size) into the table.

4. Power BI refreshes the screen with the appropriate data.

5. The app pushes 10k rows (max batch size) into the table.

6. Power BI refreshes the screen with the appropriate data.

7. The app pushes 10k rows (max batch size) into the table.

8. Power BI refreshes the screen with the appropriate data.

9. The app pushes 10k rows (max batch size) into the table.

10. Power BI refreshes the screen with the appropriate data.

11. The app pushes 10k rows (max batch size) into the table.

12. Power BI refreshes the screen with the appropriate data.

13. The app pushes 10k rows (max batch size) into the table.

14. Power BI refreshes the screen with the appropriate data.

15. The app pushes 10k rows (max batch size) into the table.

16. Power BI refreshes the screen with the appropriate data.

17. The app pushes 10k rows (max batch size) into the table.

18. Power BI refreshes the screen with the appropriate data.

19. The app pushes 6k rows into the table.

20. Power BI refreshes the screen with the appropriate data.

As you will notice, the time is cleared and then updated with data many times over the course of about ~20 seconds. The challenge here is that the chart is constantly refreshing but is incomplete until the last refresh. Where the process is in the refresh isn't clear and the user is looking at partial data for a period of time.

There is no particular fix for this, but I have raised a suggestion that we be able to create a transaction and refresh only on the completed transaction _or_ we could turn off automatic refresh and have an API to trigger the refresh.

## Alternative: Pre-aggregate data

If you can aggregate data in some way to get it all in 10k rows or less, then the problem mostly goes away. Your pattern becomes:

The update loop transacts like this:

1. The app deletes all rows from the table.

2. Power BI refreshes the screen with a blank table.

3. The app pushes < 10k rows into the table.

4. Power BI refreshes the screen with the appropriate data.

The time between 2 and 4 is only a few seconds, taken as a refresh every 10 minutes, this is probably acceptible.

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
