import * as request from "request";
import * as stream from "stream";
import Spider from "../spider";
import { IPlan, IRequestOptionInput, ITask } from "../types";

export interface IStreamPlanOption extends IRequestOptionInput {
    callback: (err: Error|null, current: IStreamPlanCurrent, s: Spider) => void;
    name: string;
}

// current crawl task; for `rule` function in the plan
export interface IStreamPlanCurrent extends ITask {
    res: request.Request;
    [propName: string]: any;
}

export default function streamPlan(option: IStreamPlanOption) {
    // TODO C 参数验证
    option.method = option.method || "GET";
    option.headers = option.headers || {};
    return new StreamPlan(option.name, option);
}

export class StreamPlan implements IPlan {
    public option: IStreamPlanOption;
    public name: string;
    constructor(name: string, option: IStreamPlanOption) {
        this.name = name;
        this.option = option;
    }
    public async process(task: ITask, spider: Spider) {
        return new Promise((resolve, reject) => {
            const requestOpts = Object.assign({url: task.url}, this.option.headers);

            let res: request.Request;
            let err: Error|null = null;
            try {
                res = request({
                    encoding: null as any,
                    headers: this.option.headers, // TODO B header不存在于request的设置？可能是一个bug
                    method: this.option.method,
                    url: task.url,
                });
                (res as request.Request).on("complete", resolve);
                (res as request.Request).on("error", resolve);
            } catch (e) {
                err = e;
            }
            const current = {
                ... task,
                res,    // TODO B
            };
            // 为什么不直接监听request的close事件以resolve？
            // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
            // 所以要把resovle当前任务的工作交给开发者自行决定
            this.option.callback(err, current, spider);

            // 当请求流结束或错误，即应该认为这次任务是执行完全的
        });
    }
}
