import * as request from "request";
import NodeSpider from "./spider";
import { ITask, IDefaultCurrent, IPlanProcessTaskInput } from "./types";

export class Plan {
    public type;
    public options;
    public process: (task: IPlanProcessTaskInput, self: NodeSpider) => Promise<void>;

    constructor(type: string, options: any, process) {
        this.type = type;
        this.options = options;
        this.process = process;
    }
}

// TODO C 考虑是否使用类继承的方式，代替type
// TODO C 考虑是否支持，或者删除 special
export function defaultPlan(opts) {
    // opts 成员存在性检测

    return new Plan("default", opts, async (task, self: NodeSpider) => {
        const requestOpts = Object.assign({url: task.url}, task.specialOpts.request);
        const {error, response, body} = await requestAsync(requestOpts);

        let current: IDefaultCurrent = Object.assign(task, {
            response,
            plan: self._STATE.planStore.get(task.planKey),
            body,
            error,
            info: task.specialOpts.info,
        });
        // 如果没有错误，按顺序执行预处理函数，对current进行预处理
        // if (! error) {
        //     for (const preFun of task.specialOpts.pre) {
        //         let result = preFun(error, current);
        //         if (result instanceof Promise) {
        //             result = await result;
        //         }
        //     }
        // }

        // 执行该计划的爬取策略函数，根据开发者定义的抓取规则进行操作
        const result = task.specialOpts.callback(error, current);
        if (result instanceof Promise) {
            await result;
        }
        // 结尾的清理工作
        current = null;
    }); 
}

function requestAsync(requestOpts) {
    return new Promise<{error: Error, response, body: string}>((resolve, reject) => {
        request(requestOpts, (error, response, body) => {
            resolve({error, response, body});
        });
    });
}