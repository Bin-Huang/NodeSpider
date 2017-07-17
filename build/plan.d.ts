import NodeSpider from "./spider";
import { IPlanTask } from "./types";
export declare type TProcess = (task: IPlanTask, self: NodeSpider) => Promise<void> | Promise<{}>;
export default class Plan {
    type: string;
    options: any;
    process: TProcess;
    constructor(type: string, options: any, process: TProcess);
}
