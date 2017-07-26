import * as fs from "fs";
import * as request from "request";
import IPlan from "./plan";
import NodeSpider from "./spider";
import { IPlanTask, ITask } from "./types";

export default function downloadPlan(opts) {
    // TODO B 参数检验与默认赋值
    const planOption = opts;
    return new IPlan("download", planOption, async (task, self: NodeSpider) => {
        const reqStream = request(task.specialOpts.request);
        const fileStream = fs.createWriteStream(task.specialOpts.path);
        reqStream.pipe(fileStream);
    });
}
