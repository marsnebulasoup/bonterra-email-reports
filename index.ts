import { BroadcastEmailsFetcher } from './api';
import { createWriteStream } from "fs"
// @ts-ignore
import { AsyncParser } from '@json2csv/node';

const PATH = "test.csv";

(async () => {
  console.log("Fetching...");
  const fetcher = new BroadcastEmailsFetcher; // pass token in
  const emails = await fetcher.getFullBroadcastEmails();

  const parser = new AsyncParser();
  const stream = createWriteStream(PATH);
  parser.parse(emails).pipe(stream);

  console.log("\nComplete. Wrote", emails.length, "emails to", PATH);
})()