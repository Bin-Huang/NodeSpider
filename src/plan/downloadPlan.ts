import * as filenamifyUrl from "filenamify-url";
import * as fs from "fs-extra";
import * as got from "got";
import * as http from "http";
import * as path from "path";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";

/**
 * s.queue(dlPlan, "http://img.com/my.jpg"); ==> img.com!my.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "*.png"); ===> img.com!my.jpg.png
 * s.queue(dlPlan, "http://img.com/my.jpg", {fileName: "name.jpg"}); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", {ext: ".png"}); ===> img.com!my.jpg.png
 */

export interface ICurrent extends ITask {
  filepath: string;
}

export interface IOption {
  path: string;
  callback?: (err: Error | null, current: ICurrent, s: Spider) => Promise<any> | any; // 当下载完成或出错时调用
  requestOpts?: http.RequestOptions;
}

const defaultOpts = {
  callback: (err: Error | null, current: ICurrent, s: Spider): Promise<any> | any => {
    // tslint:disable-next-line:no-console
    if (err) { console.error(err); }
    return;
  },
};

export default function downloadPlan(option: IOption | string) {
  if (typeof option === "string") {
    option = { path: option };
  }
  const opts = { ...defaultOpts, ...option };
  return (task: ITask, spider: Spider) => {
    return new Promise((resolve, reject) => {
      let filename: string; // 将url转化为合法的文件名
      if (task.info && typeof task.info.filename === "string") {
        filename = task.info.filename;
      } else {
        filename = filenamifyUrl(task.url); // 将url转化为合法的文件名
      }
      const filepath = path.resolve(opts.path, filename);    // 安全地拼接保存路径

      const req = got.stream(task.url, opts.requestOpts);
      const file = fs.createWriteStream(filepath);
      req.pipe(file);

      const current = { ...task, filepath };

      // TODO: handle callback error
      const handle = (e: Error | null, c: ICurrent, s: Spider) => {
        const result = opts.callback(e, c, s);
        if (result instanceof Promise) {
          result.then((r) => resolve(r));
        } else {
          resolve(result);
        }
      };
      req.on("error", (e) => handle(e, current, spider));
      file.on("error", (e: Error) => handle(e, current, spider));
      file.on("error", (e: Error) => handle(e, current, spider));
      file.on("finish", () => handle(null, current, spider));
    });
  };
}
