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
const got = require("got");
const defaultOption = {};
function streamPlan(option) {
    let opts;
    if (typeof option === "function") {
        opts = Object.assign({}, defaultOption, { callback: option });
    }
    else {
        opts = Object.assign({}, defaultOption, option);
    }
    return (task, spider) => __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const flow = got.stream(task.url, opts.requestOpts);
            const current = Object.assign({ done: resolve }, task);
            // TODO: handle error from callback
            opts.callback(flow, current, spider);
            // TODO: 考慮自動resolve的安全模式
            // flow.on("error", resolve);
            // flow.on("end", resolve);
        });
    });
}
exports.default = streamPlan;
// export class StreamPlan implements IPlan {
//     public option: IOption;
//     public name: string;
//     constructor(name: string, option: IOption) {
//         this.name = name;
//         this.option = option;
//     }
//     public async process(task: ITask, spider: Spider) {
//         return new Promise((resolve, reject) => {
//             const requestOpts = Object.assign({url: task.url}, this.option.headers);
//
//             let res: request.Request;
//             let err: Error|null = null;
//             try {
//                 res = request({
//                     encoding: null as any,
//                     headers: this.option.headers, // TODO B header不存在于request的设置？可能是一个bug
//                     method: this.option.method,
//                     url: task.url,
//                 });
//                 (res as request.Request).on("complete", resolve);
//                 (res as request.Request).on("error", resolve);
//             } catch (e) {
//                 err = e;
//             }
//             const current = {
//                 ... task,
//                 res,    // TODO B
//             };
//             // 为什么不直接监听request的close事件以resolve？
//             // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
//             // 所以要把resovle当前任务的工作交给开发者自行决定
//             this.option.callback(err, current, spider);
//
//             // 当请求流结束或错误，即应该认为这次任务是执行完全的
//         });
//     }
// }
