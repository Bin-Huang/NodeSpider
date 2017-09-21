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
const filenamifyUrl = require("filenamify-url");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");
function downloadPlan(name, opts) {
    return new DownloadPlan(name, opts);
}
exports.default = downloadPlan;
class DownloadPlan {
    constructor(name, option) {
        this.option = option;
        this.name = name;
    }
    process(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let fileName = filenamifyUrl(task.url); // 将url转化为合法的文件名
                if (typeof task.info === "string") {
                    if (task.info[0] === "*") {
                        fileName = task.info.replace("*", filenamifyUrl);
                    }
                    else {
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
                const requestOpts = Object.assign({ url: task.url }, this.option.request);
                const req = request(requestOpts); // request stream
                const savePath = path.resolve(this.option.path, fileName); // 安全地拼接保存路径
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
