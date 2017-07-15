import * as request from "request";
import Plan from "./plan";
import preLoadJq from "./preLoadJq";
import preToUtf8 from "./preToUtf8";
import NodeSpider from "./spider";
import { IPlanProcessTaskInput, IRequestOpts, ITask } from "./types";

export type ICallback = (err: Error, current: ICurrent) => void | Promise<void>;
export interface IPlanOptionInput {
    callback: ICallback;
    request?: IRequestOpts;
    pre?: ICallback[];
    info?: any;
}
export interface IPlanOption extends IPlanOptionInput {
    request: IRequestOpts;
    pre: ICallback[];
    callback: ICallback;
    info: any;
}
// current crawl task; for `rule` function in the plan
export interface ICurrent extends ITask {
    plan: Plan;
    response: any;
    body: string;
    error: Error;
    info: any;
    specialOpts: IPlanOption;
    [propName: string]: any;
}
interface IProcessTask extends IPlanProcessTaskInput {
    specialOpts: IPlanOption;
}

// TODO C 考虑是否使用类继承的方式，代替type
// TODO C 考虑是否支持，或者删除 special
export default function defaultPlan(planOptionInput: ICallback|IPlanOptionInput) {
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
    return new Plan("default", planOption, processFun);
}

async function processFun(task: IProcessTask, self: NodeSpider) {
    const requestOpts = Object.assign({url: task.url}, task.specialOpts.request);
    // TODO C input stream pipe support
    const {error, response, body}: any = await requestAsync(requestOpts);
    let current: ICurrent = Object.assign(task, {
        response,
        body,
        error,
        info: task.specialOpts.info,
        plan: self._STATE.planStore.get(task.planKey),
    });
    // 如果没有错误，按顺序执行预处理函数，对current进行预处理
    if (! error) {
        for (const preFun of task.specialOpts.pre) {
            const result = preFun(error, current);
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
}

function requestAsync(opts) {
    return new Promise((resolve, reject) => {
        request(opts, (error, response, body) => {
            resolve({error, response, body});
        });
    });
}
