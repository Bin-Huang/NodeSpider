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
const fs = require("fs");
const request = require("request");
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
    constructor(type, option, info) {
        this.option = option;
        this.type = type;
        this.info = info;
    }
    process(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const requestOpts = Object.assign({ url: task.url }, this.option.request);
                const req = request(requestOpts); // request stream
                const file = fs.createWriteStream();
                // 为什么不直接监听request的close事件以resolve？
                // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
                // 所以要把resovle当前任务的工作交给开发者自行决定
                // 当请求流结束或错误，即应该认为这次任务是执行完全的
                req.on("complete", resolve);
                req.on("error", resolve);
            });
        });
    }
}
exports.DownloadPlan = DownloadPlan;
