import * as request from "request";
import * as stream from "stream";
import Plan from "./plan";
import preLoadJq from "./preLoadJq";
import preToUtf8 from "./preToUtf8";
import NodeSpider from "./spider";
import { IPlanProcessTask, IRequestOpts, ITask } from "./types";

export interface IStreamPlanOptionInput {
    request?: any;
    callback: (req: stream.Readable, end) => void;
}
export interface IStreamPlanOption extends IStreamPlanOptionInput {
    request: any;
    callback: (req: stream.Readable, end) => void;
}

interface IStreamPlanTask extends IPlanProcessTask {
    specialOpts: IStreamPlanOption;
}

export default function streamPlan(opts) {
    // 参数检测及补全默认值
    const planOption = opts;
    return new Plan("stream", planOption, process);
}

function process(task: IStreamPlanTask, self: NodeSpider) {
    return new Promise((resolve, reject) => {
        const requestOpts = Object.assign({url: task.url}, task.specialOpts);
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
