import * as request from "request";
import NodeSpider from "./spider";
import { IDefaultCurrent, IPlanProcessTaskInput, ITask } from "./types";

export default class Plan {
    public type: string;
    public options;
    public process: (task: IPlanProcessTaskInput, self: NodeSpider) => Promise<void>;

    constructor(type: string, options: any, process) {
        this.type = type;
        this.options = options;
        this.process = process;
    }
}
