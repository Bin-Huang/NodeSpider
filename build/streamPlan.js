"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const plan_1 = require("./plan");
function streamPlan(opts) {
    // 参数检测及补全默认值
    const planOption = opts;
    return new plan_1.default("stream", planOption, process);
}
exports.default = streamPlan;
function process(task, self) {
    return new Promise((resolve, reject) => {
        const requestOpts = Object.assign({ url: task.url }, task.specialOpts);
        const req = request(requestOpts);
        // 为什么不直接监听request的close事件以resolve？
        // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
        // 所以要把resovle当前任务的工作交给开发者自行决定
        const end = () => {
            // 结尾清理工作
            resolve();
        };
        task.specialOpts.callback(req, end);
    });
}
