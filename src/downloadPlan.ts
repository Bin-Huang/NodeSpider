import * as filenamifyUrl from "filenamify-url";
import * as fs from "fs-extra";
import * as path from "path";
import * as request from "request";
import NodeSpider from "./spider";
import { IPlan, ITask } from "./types";

export default function downloadPlan(opts: IDownloadPlanOpion) {
    return new DownloadPlan(opts);
}

export interface IDownloadPlanOpion {
    request?: any;
    path: string; // 保存文件夹
    ext: string;    // 保存文件后缀名
    callback: (err: Error|null, current: ITask) => void; // 当下载完成或出错时调用
    type?: string;
}
export class DownloadPlan implements IPlan {
    public option: IDownloadPlanOpion;
    public type: string;
    constructor(option: IDownloadPlanOpion) {
        this.option = option;
        this.type = option.type || "download";
    }
    public async process(task: ITask) {
        return new Promise((resolve, reject) => {
            // .ext or ext
            let fileName = filenamifyUrl(task.url) + this.option.ext; // 将url转化为合法的文件名
            if (typeof task.info === "string") {
                fileName = task.info;
            }
            if (typeof task.info === "object" && typeof task.info.fileName === "string") {
                fileName = task.info.fileName;
            }

            const requestOpts = Object.assign({url: task.url}, this.option.request);
            const req = request(requestOpts);   // request stream

            const savePath = path.resolve(this.option.path, fileName);    // 保存路径
            const file = fs.createWriteStream(savePath);
            req.pipe(file);

            // 当请求流结束或错误，即应该认为这次任务是执行完全的
            let firstCall = true;   // 只callback一次
            req.on("complete", () => {
                if (firstCall) {
                    this.option.callback(null, task);
                    firstCall = false;
                    resolve();
                }
            });
            req.on("error", (e) => {
                if (firstCall) {
                    this.option.callback(e, task);
                    firstCall = false;
                    resolve();
                }
            });
            file.on("error", (e: Error) => {
                if (firstCall) {
                    this.option.callback(e, task);
                    firstCall = false;
                    file.close();
                    resolve();
                }
            });
            file.on("finish", () => {
                if (firstCall) {
                    this.option.callback(null, task);
                    firstCall = false;
                    file.close();
                    resolve();
                }
            });

        });
    }
}
