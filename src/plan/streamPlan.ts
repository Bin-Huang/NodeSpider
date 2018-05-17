import * as got from "got";
import * as http from "http";
import * as stream from "stream";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";

export interface IOption {
  name: string;
  handle: (stream: got.GotEmitter & stream.Duplex, done: (e?: Error) => any, current: ITask, s: Spider) => any;
  retries?: number;
  failed?: (error: Error, task: ITask, spider: Spider) => any;
  requestOpts?: http.RequestOptions;
}

export default function streamPlan({
  name,
  requestOpts,
  handle,
  retries = 3,
  failed = (err: Error) => { throw err; },
}: IOption): IPlan {
  return {
    name,
    retries,
    failed,
    process: async (task, spider) => {
      return new Promise((resolve, reject) => {
        const flow = got.stream(task.url, requestOpts);
        const done = (err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        };
        handle(flow, done, task, spider);
      });
    },
  };
}
