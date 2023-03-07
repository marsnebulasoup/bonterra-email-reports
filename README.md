# bonterra-email-reports

Simple script to concurrently scrape and generate email reports from the NGP 7 API.

## Initial setup
You'll need [node.js](https://nodejs.org) to run this program.

Clone this repo
```
git clone https://github.com/marsnebulasoup/bonterra-email-reports.git
```

Install packages and build files
```
npm run setup
```

Create a `.env` file the same directory as `index.js` with the following values:
```
API_KEY=XXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXX # your NGP API key
OUTPUT_PATH="output.csv" # desired output path of the generated CSV
```

## Running
Once the initial setup is complete, you can run the program anytime with
```
node index.js
```

## Questions
**How long, roughly, did you spend working on this project? This won’t affect your evaluation; it helps us norm our problems to our expected time to complete them.**

I spent roughly 5-6 hours on this. It took me a bit longer than I had planned, because I changed my approach to concurrently fetch items rather than fetch everything sequentially, so I had to rewrite some parts. I did this because I noticed that the API sometimes took between 500-700ms to respond at times, which could result in extremely long runtimes for large reports.

**Give the steps needed to deploy and run your code, written so that someone else can follow and execute them.**

This is already provided above.

**What could you do to improve your code for this project if you had more time? Could you make it more efficient, easier to read, more maintainable? If it were your job to run this report monthly using your code, could it be made easier or more flexible? Give specifics where possible.**

There are a number of things I could do if I had more time. A few are:
  - Adding detailed error messages based on API responses (e.g. 4xx and 5xx status codes)
  - Improving the clarity of the function which obtains the top variant. Right now, it is a bit complex due to having early exit logic (if a top variant is found due to having >50% of the total opens). This could be simplified by creating a custom queue to handle concurrent requests that provides a way to exit early.

One thing we could do to make this easier to run as a scheduled job is package it and all its dependencies as a single .js file (for example, using system.js or require.js), which can be run anywhere. This would enable easy portability and allow it to run anywhere there is a node.js runtime, without having to setup an environment and install/compile/build everything.

**Outline a testing plan for this report, imagining that you are handing it off to someone else to test. What did you do to test this as you developed it? What kinds of automated testing could be helpful here?**



**Introduction**

This email reports generator scrapes statistics about emails from the NGP7 API and writes them to a CSV file.

**Scope**

What is being tested
  - API class (api.ts) [mocking]
  - CSV generation [manual]
  - User interface [manual]

**Strategy**
  - API class | The API calls are externalized from the CSV conversion logic (which is handled by an external library), so the majority of tests should focus on that class. The easiest and most helpful automated, I believe, would be to emulate the API and compare the mocked responses with the class's outputs. Since API calls are made via axios, we can use [axios-mock-adapter](https://www.npmjs.com/package/axios-mock-adapter) to mock the API.
  - CSV generation | Verify that a valid CSV file is generated. Note that CSV file generation is handled by an external module, so besides confirming that the file is generated, we don't need to do much to test this.
  - User interface | Test that the program displays the email IDs/names as they are being fetched, along with confirmation messages when complete. Also test that providing no API key displays an error message signifying so.

**Requirements**
  - Node.js v16 or higher
  - NPM (package manager)