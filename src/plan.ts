import * as request from "request";
import NodeSpider from "./spider";
import { IPlanTask, ITask } from "./types";

export type TProcess = (task: IPlanTask, self: NodeSpider) => any|Promise<any>;

export default class Plan {
    public type: string;
    public multi: number;
    public options: any;
    public process: TProcess;

    constructor(type: string, multi: number, options: any, process: TProcess) {
        this.type = type;
        this.multi = multi;
        this.options = options;
        this.process = process;
    }
}
