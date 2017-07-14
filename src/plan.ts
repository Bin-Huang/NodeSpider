import * as request from "request";
import NodeSpider from "./spider";
import { ITask, IDefaultCurrent, IPlanProcessTaskInput } from "./types";
import preLoadJq from "./preLoadJq";
import preToUtf8 from "./preToUtf8";

export class Plan {
    public type: string;
    public options;
    public process: (task: IPlanProcessTaskInput, self: NodeSpider) => Promise<void>;

    constructor(type: string, options: any, process) {
        this.type = type;
        this.options = options;
        this.process = process;
    }
}

// TODO C move type here

// TODO C 考虑是否使用类继承的方式，代替type
// TODO C 考虑是否支持，或者删除 special
export function defaultPlan(planOptionInput) {

    // 当只传入一个rule函数，则包装成 IPlanInput 对象
    if (typeof planOptionInput === "function") {
        planOptionInput = {callback: planOptionInput};
    }
    // 类型检测
    if (typeof planOptionInput !== "object") {
        throw new Error("参数类型错误，只能是函数或则对象");
    }
    // 填充plan设置默认值
    const pre = planOptionInput.pre || [
        preToUtf8(),
        preLoadJq(),
    ];
    // TODO B 删掉默认的设置 encoding ?????
    const request = Object.assign({encoding: null}, planOptionInput.request);
    const info = planOptionInput.info || {};
    const callback = planOptionInput.callback;

    const planOption = { request, callback, pre, info };
    return new Plan("default", planOption, async (task: IPlanProcessTaskInput, self: NodeSpider) => {
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
        if (! error) {
            for (const preFun of task.specialOpts.pre) {
                let result = preFun(error, current);
                if (result instanceof Promise) {
                    await result;
                }
            }
        }

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