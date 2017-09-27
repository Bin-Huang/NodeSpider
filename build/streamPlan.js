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
const request = require("request");
function streamPlan(option) {
    // TODO C 参数验证
    option.method = option.method || "GET";
    option.headers = option.headers || {};
    return new StreamPlan(option.name, option);
}
exports.default = streamPlan;
class StreamPlan {
    constructor(name, option) {
        this.name = name;
        this.option = option;
    }
    process(task, spider) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const requestOpts = Object.assign({ url: task.url }, this.option.headers);
                let res;
                let err = null;
                try {
                    res = request({
                        encoding: null,
                        headers: this.option.headers,
                        method: this.option.method,
                        url: task.url,
                    });
                    res.on("complete", resolve);
                    res.on("error", resolve);
                }
                catch (e) {
                    err = e;
                }
                const current = Object.assign({}, task, { res });
                // 为什么不直接监听request的close事件以resolve？
                // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
                // 所以要把resovle当前任务的工作交给开发者自行决定
                this.option.callback(err, current, spider);
                // 当请求流结束或错误，即应该认为这次任务是执行完全的
            });
        });
    }
}
exports.StreamPlan = StreamPlan;
