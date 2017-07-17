import * as request from "request";
import * as stream from "stream";
import Plan from "./plan";
import preLoadJq from "./preLoadJq";
import preToUtf8 from "./preToUtf8";
import NodeSpider from "./spider";
import { ICurrent, IPlanTask, IRequestOpts, ITask } from "./types";

export type TStreamPlanOptionCallback = (req: request.Request, current: ICurrent) => void;
export interface IStreamPlanOptionInput {
    request?: any;
    callback: TStreamPlanOptionCallback;
    info?: any;
}
export interface IStreamPlanOption extends IStreamPlanOptionInput {
    request: any;
    callback: TStreamPlanOptionCallback;
    info: any;
}

interface IStreamPlanTask extends IPlanTask {
    specialOpts: IStreamPlanOption;
}

export default function streamPlan(opts: TStreamPlanOptionCallback|IStreamPlanOptionInput) {
    if (typeof opts === "function") {
        opts = {callback: opts};
    } else if (typeof opts === "object") {
        if (typeof opts.callback !== "function") {
            throw new Error("新建streamPlan错误，参数对象需要携带函数类型的callback成员");
        }
    } else {
        throw new Error("新建streamPlan错误，参数类型只能是对象或者函数");
    }

    // 过滤掉opts中无关的成员
    const planOption = {
        callback: opts.callback,
        info: opts.info || {},
        request: opts.request || {},
    };
    return new Plan("streamPlan", planOption, process);
}

function process(task: IStreamPlanTask, self: NodeSpider) {
    return new Promise((resolve, reject) => {
        const requestOpts = Object.assign({url: task.url}, task.specialOpts.request);
        const req = request(requestOpts);

        req.on("complete", resolve);
        req.on("error", resolve);

        // 为什么不直接监听request的close事件以resolve？
        // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
        // 所以要把resovle当前任务的工作交给开发者自行决定
        const current: ICurrent = {
            ...task,
            info: task.specialOpts.info,
            plan: self._STATE.planStore.get(task.planKey),
            specialOpts: task.specialOpts,
        };
        task.specialOpts.callback(req, current);
    });
}
