import * as got from "got";
import * as http from "http";
import * as stream from "stream";
import Spider from "../spider";
import { IPlan, ITask } from "../types";

export interface ICurrent extends ITask {
  done: () => any;
}

export type ICallback = (stream: got.GotEmitter & stream.Duplex, current: ICurrent, s: Spider) => any;

export interface IOption {
  callback: ICallback;
  requestOpts?: http.RequestOptions;
}

const defaultOption = {};

export default function streamPlan(option: IOption | ICallback): IPlan {
  let opts: IOption;
  if (typeof option === "function") {
    opts = { ...defaultOption, callback: option };
  } else {
    opts = { ...defaultOption, ...option };
  }
  return async (task: ITask, spider: Spider) => {
    return new Promise((resolve, reject) => {
      const flow = got.stream(task.url, opts.requestOpts);
      const current: ICurrent = { done: resolve, ...task };
      // TODO: handle error from callback
      opts.callback(flow, current, spider);

      // TODO: 考慮自動resolve的安全模式
      // flow.on("error", resolve);
      // flow.on("end", resolve);
    });
  };
}

// export class StreamPlan implements IPlan {
//     public option: IOption;
//     public name: string;
//     constructor(name: string, option: IOption) {
//         this.name = name;
//         this.option = option;
//     }
//     public async process(task: ITask, spider: Spider) {
//         return new Promise((resolve, reject) => {
//             const requestOpts = Object.assign({url: task.url}, this.option.headers);
//
//             let res: request.Request;
//             let err: Error|null = null;
//             try {
//                 res = request({
//                     encoding: null as any,
//                     headers: this.option.headers, // TODO B header不存在于request的设置？可能是一个bug
//                     method: this.option.method,
//                     url: task.url,
//                 });
//                 (res as request.Request).on("complete", resolve);
//                 (res as request.Request).on("error", resolve);
//             } catch (e) {
//                 err = e;
//             }
//             const current = {
//                 ... task,
//                 res,    // TODO B
//             };
//             // 为什么不直接监听request的close事件以resolve？
//             // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
//             // 所以要把resovle当前任务的工作交给开发者自行决定
//             this.option.callback(err, current, spider);
//
//             // 当请求流结束或错误，即应该认为这次任务是执行完全的
//         });
//     }
// }
