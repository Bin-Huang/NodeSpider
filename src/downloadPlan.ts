import * as fs from "fs-extra";
import * as path from "path";
import * as request from "request";
import NodeSpider from "./spider";
import { IPlan, ITask } from "./types";

// TODO B
export default function downloadPlan(opts) {
    // TODO B 参数检验与默认赋值
    const planOption = opts;
    return new IPlan("download", planOption, async (task, self: NodeSpider) => {
        const reqStream = request(task.specialOpts.request);
        const fileStream = fs.createWriteStream(task.specialOpts.path);
        reqStream.pipe(fileStream);
    });
}

export interface IDownloadPlanOpion {
    request: any;
    saveFolder: string; // 保存文件夹
    fileExt: string;    // ?文件名后缀
    callback: (err: Error|null, current: ITask) => void; // 当下载完成或出错时调用
}

export class DownloadPlan implements IPlan {
    public option: IDownloadPlanOpion;
    public type: string;
    constructor(type: string, option: IDownloadPlanOpion) {
        this.option = option;
        this.type = type;
    }
    public async process(task: ITask) {
        return new Promise((resolve, reject) => {
            // TODO B 当url结尾是询问语句，此时fileName中会有?字符，而这种命名在文件系统是不支持的，需要转义
            let fileName = path.basename(task.url);
            if (typeof task.info === "string") {
                fileName = task.info;
            }
            if (typeof task.info === "object" && typeof task.info.fileName === "string") {
                fileName = task.info.fileName;
            }
            if (typeof this.option.fileExt === "string") {
                fileName += `.${this.option.fileExt}`;
            }

            const savePath = path.resolve(this.option.saveFolder, fileName);    // 保存路径
            // TODO C 保证路径存在，以及无重名文件？

            const requestOpts = Object.assign({url: task.url}, this.option.request);
            const req = request(requestOpts);   // request stream
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
