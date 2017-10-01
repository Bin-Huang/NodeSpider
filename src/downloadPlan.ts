import * as filenamifyUrl from "filenamify-url";
import * as fs from "fs-extra";
import * as path from "path";
import * as request from "request";
import Spider from "./spider";
import { IPlan, IRequestOptionInput, ITask } from "./types";

/**
 * s.queue(dlPlan, "http://img.com/my.jpg"); ==> img.com!my.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "*.png"); ===> img.com!my.jpg.png
 * s.queue(dlPlan, "http://img.com/my.jpg", {fileName: "name.jpg"}); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", {ext: ".png"}); ===> img.com!my.jpg.png
 */

export interface IDownloadPlanOpion extends IRequestOptionInput {
    callback: (err: Error|null, current: ITask, s: Spider) => void; // 当下载完成或出错时调用
    name: string;
    path: string;
}

export default function downloadPlan(option: IDownloadPlanOpion) {
    // TODO C 参数检验
    option.method = option.method || "GET";
    option.headers = option.headers || {};
    return new DownloadPlan(option.name, option);
}

export class DownloadPlan implements IPlan {
    public option: IDownloadPlanOpion;
    public name: string;
    constructor(name: string, option: IDownloadPlanOpion) {
        this.option = option;
        this.name = name;
    }
    public async process(task: ITask, spider: Spider) {
        return new Promise((resolve, reject) => {
            let fileName = filenamifyUrl(task.url); // 将url转化为合法的文件名
            if (typeof task.info === "string") {
                if (task.info[0] === "*") {
                    fileName = task.info.replace("*", filenamifyUrl);
                } else {
                    fileName = task.info;
                }
            }
            if (typeof task.info === "object") {
                if (typeof task.info.fileName === "string") {
                    fileName = task.info.fileName;
                }
                if (typeof task.info.ext === "string") {
                    fileName += task.info.ext;
                }
            }

            const req = request({
                encoding: null as any,
                headers: this.option.headers, // TODO B header不存在于request的设置？可能是一个bug
                method: this.option.method,
                url: task.url,
            });   // request stream

            const savePath = path.resolve(this.option.path, fileName);    // 安全地拼接保存路径
            const file = fs.createWriteStream(savePath);
            req.pipe(file);

            // 当请求流结束或错误，即应该认为这次任务是执行完全的
            let firstCall = true;   // 只callback一次
            // req.on("complete", () => {
            //     if (firstCall) {
            //         this.option.callback(null, task, spider);
            //         firstCall = false;
            //         resolve();
            //     }
            // });
            req.on("error", (e: Error) => {
                if (firstCall) {
                    this.option.callback(e, task, spider);
                    firstCall = false;
                    resolve();
                }
            });
            file.on("error", (e: Error) => {
                if (firstCall) {
                    this.option.callback(e, task, spider);
                    firstCall = false;
                    file.close();
                    resolve();
                }
            });
            file.on("finish", () => {
                if (firstCall) {
                    this.option.callback(null, task, spider);
                    firstCall = false;
                    file.close();
                    resolve();
                }
            });
        });
    }
}
