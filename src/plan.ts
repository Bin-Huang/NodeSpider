import * as request from "request";
import NodeSpider from "./spider";
import { IPlanTask, ITask } from "./types";

type TProcess = (task: IPlanTask, self: NodeSpider) => Promise<void>|Promise<{}>;

export default class Plan {
    public type: string;
    public options;
    public process: TProcess;

    constructor(type: string, options: any, process: TProcess) {
        this.type = type;
        this.options = options;
        this.process = process;
    }
}
