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

