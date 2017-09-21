"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
function streamPlan(name, opts) {
    if (typeof opts === "function") {
        opts = { callback: opts };
    }
    else if (typeof opts === "object") {
        if (typeof opts.callback !== "function") {
            throw new TypeError(`
                failed to create new stream plan
                the object of options should include the required member: 'callback' function
            `);
        }
    }
    else {
        throw new TypeError(`
            failed to create new stream plan
            the parameter can only be a function or an object
        `);
    }
    const option = {
        callback: opts.callback,
        request: opts.request || {},
    };
    return new StreamPlan(name, option);
}
exports.default = streamPlan;
class StreamPlan {
    constructor(name, option) {
        this.name = name;
        this.option = option;
    }
    process(task) {
        return new Promise((resolve, reject) => {
            const requestOpts = Object.assign({ url: task.url }, this.option.request);
            const req = request(requestOpts);
            // 为什么不直接监听request的close事件以resolve？
            // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
            // 所以要把resovle当前任务的工作交给开发者自行决定
            this.option.callback(req, task);
            // 当请求流结束或错误，即应该认为这次任务是执行完全的
            req.on("complete", resolve);
            req.on("error", resolve);
        });
    }
}
exports.StreamPlan = StreamPlan;
