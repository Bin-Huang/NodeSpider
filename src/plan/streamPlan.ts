import * as got from "got";
import * as http from "http";
import * as stream from "stream";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";

export interface IOption {
  name: string;
  handle: (stream: got.GotEmitter & stream.Duplex, done: (e?: Error) => any, current: ITask, s: Spider) => any;
  retries?: number;
  catch?: (error: Error, task: ITask, spider: Spider) => any;
  requestOpts?: http.RequestOptions;
}

const defaultOption = {
  retries: 3,
  catch: (err: Error) => { throw err; },
};

export default function streamPlan(option: IOption): IPlan {
  const opts = { ...defaultOption, ...option };
  return {
    name: opts.name,
    retries: opts.retries,
    catch: opts.catch,
    process: async (task, spider) => {
      return new Promise((resolve, reject) => {
        const flow = got.stream(task.url, opts.requestOpts);
        const done = (err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        };
        opts.handle(flow, done, task, spider);
      });
    },
  };
}
