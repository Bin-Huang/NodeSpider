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
  name: string;
  path: string;
  retries?: number;
  handle?: (current: ICurrent, s: Spider) => Promise<any> | any;
  catch?: (error: Error, task: ITask, spider: Spider) => any;
  requestOpts?: http.RequestOptions;
}
const defaultOpts = {
  retries: 3,
  handle: (current: ICurrent, s: Spider) => null,
  catch: (error: Error) => { throw error; },
};

export default function downloadPlan(option: IOption): IPlan {
  const opts = { ...defaultOpts, ...option };
  return {
    name: opts.name,
    retries: opts.retries,
    catch: opts.catch,
    process: async (task: ITask, spider: Spider) => {
      let filename: string; // 将url转化为合法的文件名
      if (task.info && typeof task.info.filename === "string") {
        filename = task.info.filename;
      } else {
        filename = filenamifyUrl(task.url); // 将url转化为合法的文件名
      }
      const filepath = path.resolve(opts.path, filename);    // 安全地拼接保存路径

      await downloadAsync(task.url, filepath, opts.requestOpts);
      await opts.handle({...task, filepath}, spider);
    },
  };
}

function downloadAsync(url: string, filepath: string, opts?: http.RequestOptions ) {
  return new Promise((resolve, reject) => {
    const req = got.stream(url, opts);
    const file = fs.createWriteStream(filepath);
    req.pipe(file);
    req.on("error", reject);
    file.on("error", reject);
    file.on("finish", resolve);
  });
}
