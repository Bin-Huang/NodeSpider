import NodeSpider from "./spider";
import { IPlanTask } from "./types";
export declare type TProcess = (task: IPlanTask, self: NodeSpider) => any | Promise<any>;
export default class Plan {
    type: string;
    multi: number;
    options: any;
    process: TProcess;
    constructor(type: string, multi: number, options: any, process: TProcess);
}
