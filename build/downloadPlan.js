"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const request = require("request");
// TODO B 完成pipe发生函数
function downloadPlan(opts) {
    // TODO B 参数检验与默认赋值
    const planOption = opts;
    return new IPlan("download", planOption, (task, self) => __awaiter(this, void 0, void 0, function* () {
        const reqStream = request(task.specialOpts.request);
        const fileStream = fs.createWriteStream(task.specialOpts.path);
        reqStream.pipe(fileStream);
    }));
}
exports.default = downloadPlan;
class DownloadPlan {
    constructor(type, option) {
        this.option = option;
        this.type = type;
    }
    process(task) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const savePath = path.resolve(this.option.saveFolder, fileName); // 保存路径
                // TODO C 保证路径存在，以及无重名文件？
                const requestOpts = Object.assign({ url: task.url }, this.option.request);
                const req = request(requestOpts); // request stream
                const file = fs.createWriteStream(savePath);
                req.pipe(file);
                // 当请求流结束或错误，即应该认为这次任务是执行完全的
                let firstCall = true; // 只callback一次
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
                file.on("error", (e) => {
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
        });
    }
}
exports.DownloadPlan = DownloadPlan;
