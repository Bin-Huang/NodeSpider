import { IQueue, ITask } from "./types";
/**
 * 为NodeSpider量身定做的taskqueue
 */
export default class Queue implements IQueue {
    protected urlPool: Set<string>;
    private queue;
    constructor();
    add(newTask: ITask): void;
    jump(newTask: ITask): void;
    /**
     * 检测一个url是否添加过，是则返回true
     * @param url
     */
    check(url: string): boolean;
    /**
     * 获得排队任务数量
     * @param type
     */
    getWaitingTaskNum(): number;
    /**
     * 获得所有添加到排队的url数（不包含重复添加）
     */
    getTotalUrlsNum(): number;
    /**
     * 返回下一个任务。该排队没有新任务，都会返回 null
     */
    next(): any;
}
