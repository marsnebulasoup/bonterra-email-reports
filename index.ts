import { BroadcastEmailsFetcher } from './api';
import { createWriteStream } from "fs"
import * as dotenv from 'dotenv';
// @ts-ignore
import { AsyncParser } from '@json2csv/node';

dotenv.config();

const PATH = process.env.OUTPUT_PATH || "emails.csv";
if (!process.env.API_KEY) {
  console.log("No API key found. Please create a .env file with an API_KEY entry");
  process.exit();
}

(async () => {
  console.log("Fetching...");
  const fetcher = new BroadcastEmailsFetcher(process.env.API_KEY!); // pass token in
  const emails = await fetcher.getFullBroadcastEmails();

  const parser = new AsyncParser();
  const stream = createWriteStream(PATH);
  parser.parse(emails).pipe(stream);

  console.log("\nComplete. Wrote", emails.length, "emails to", PATH);
})()