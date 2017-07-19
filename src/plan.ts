import * as request from "request";
import NodeSpider from "./spider";
import { IPlanTask, ITask } from "./types";

export type TProcess = (task: IPlanTask, self: NodeSpider) => Promise<{}>;

export default class Plan {
    public type: string;
    public options: any;
    public process: TProcess;

    constructor(type: string, options: any, process: TProcess) {
        this.type = type;
        this.options = options;
        this.process = process;
    }
}
