import { AxiosInstance } from './node_modules/axios/index.d';
import axios from "axios";
import { CancelledError, forEachLimit, mapLimit, Queue } from "modern-async";
import * as dotenv from 'dotenv';

dotenv.config();

export class BroadcastEmailsFetcher {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.myngp.com/v2/broadcastEmails',
      headers: { 'apiKey': process.env.API_KEY }
    });
  }

  public async getFullBroadcastEmails(): Promise<BroadcastEmail[]> {
    const parallelRequests = 10;
    const emails = await this.getBroadcastEmails();

    return await mapLimit(emails, async (email) => {
      console.log("Processing email", email.emailMessageId, email.name, "...");
      return {
        ...email, // name, emailMessageId fields
        ...await this.getBroadcastEmailStatistics(email.emailMessageId) // rest of email statistics + topVariant
      }
    }, parallelRequests);
  }

  public async getBroadcastEmails(): Promise<BroadcastEmailInitial[]> {
    const emails: BroadcastEmailInitial[] = [];
    const parallelRequests = 10;  // number of batches to fetch concurrently
    const itemsPerRequest = 5;    // number of items per request...must be greater than 0 to prevent infinite looping

    // helper to fetch items and push them into `emails`
    const fetchBatch = async (fromWhere: number, howMany: number) => {
      const resp = await this.api.get('/', {
        params: {
          "$top": howMany,
          "$skip": fromWhere
        }
      })
      emails.push(...resp.data.items);
      return resp.data.count;
    }

    // get total number of items initially (and also the first batch of emails)
    const totalItems = await fetchBatch(0, itemsPerRequest);

    // now that we know the total # of items, split remaining requests into batches so they can be fetched concurrently
    const batches = [];
    for (let i = itemsPerRequest; i < totalItems; i += itemsPerRequest) {
      batches.push(i);
    }

    // run `parallelRequests` batches in parallel
    await forEachLimit(batches, (batchStart) => fetchBatch(batchStart, itemsPerRequest), parallelRequests);

    console.log("Found", emails.length, "emails");
    return emails;
  }

  public async getBroadcastEmailStatistics(emailMessageId: number): Promise<BroadcastEmailStatistics> {
    const resp = await this.api.get(`/${emailMessageId}`, {
      params: {
        "$expand": "statistics"
      }
    });

    const topVariant = await this.getBroadcastEmailTopVariant(emailMessageId, resp.data.statistics.opens, resp.data.variants);

    const statistics: BroadcastEmailStatistics = {
      ...resp.data.statistics, // clicks, opens, bounces, etc...
      topVariant: topVariant.name
    }

    return statistics;
  }


  public async getBroadcastEmailTopVariant(emailMessageId: number, totalOpens: number, variants: BroadcastEmailVariant[]): Promise<BroadcastEmailVariant> {
    const parallelRequests = 10; // number of requests to run in parallel
    const queue = new Queue(parallelRequests);

    const topVariant: BroadcastEmailVariant = await new Promise(async (resolve, reject) => {
      let topVariant: BroadcastEmailVariant = variants[0];
      const queuedRequests = []; // holds promises relating to the status of queued requests.

      for (const variant of variants) {
        const queuedRequest = queue.exec(async () => {
          const resp = await this.api.get(`/${emailMessageId}/variants/${variant.emailMessageVariantId}`, {
            params: {
              "$expand": "statistics"
            }
          });

          // set opens for current variant
          variant.opens = resp.data.statistics.opens;

          // if the top variant wasn't set yet OR the current variant has more opens than the top variant
          if (!topVariant.opens || variant.opens! >= topVariant.opens!) {
            topVariant = variant;

            // if a variant has 50% or more of the total opens, it must be the top, so we can stop searching
            if (topVariant.opens! / totalOpens >= 0.5) {
              resolve(topVariant);
            }
          }
        }).catch(e => { if (!(e instanceof CancelledError)) throw e }); // ignore errors caused by terminating requests early when a top variant was found

        queuedRequests.push(queuedRequest); // save queued request so we can wait for it later
      }

      await Promise.all(queuedRequests); // when all queued requests are finished
      resolve(topVariant);               // send the top variant back
    });

    // cancel any pending requests if the top variant was found, and the promise was exited early
    queue.cancelAllPending();

    return topVariant;
  }
}

interface BroadcastEmailInitial {
  emailMessageId: number,
  name: string
}

interface BroadcastEmailStatistics {
  recipients: number,
  opens: number,
  clicks: number,
  unsubscribes: number,
  bounces: number,
  topVariant: string,
}

interface BroadcastEmailVariant {
  emailMessageId: number,
  emailMessageVariantId: number,
  name: string,
  subject: string,
  opens?: number
}

interface BroadcastEmail {
  emailMessageId: number,
  name: string,
  recipients: number,
  opens: number,
  clicks: number,
  unsubscribes: number,
  bounces: number,
  topVariant: string
}
