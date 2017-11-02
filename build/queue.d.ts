import { IQueue, ITask } from "./types";
/**
 * 为NodeSpider量身定做的taskqueue
 */
export default class Queue implements IQueue {
    protected urlPool: Set<string>;
    private queue;
    constructor();
    /**
     * 添加新的任务到指定type队列末尾。如果type队列不存在则新建
     * @param newTask
     * @param type
     */
    addTask(newTask: ITask): void;
    /**
     * 将新的任务插队到指定type队列头部。如果type队列不存在则新建
     * @param newTask
     * @param type
     */
    jumpTask(newTask: ITask): void;
    /**
     * 检测一个url是否添加过，是则返回true
     * @param url
     */
    check(url: string): boolean;
    /**
     * 获得指定type队列的排队任务数量。当type对应的队列不存在，返回0
     * @param type
     */
    getWaitingTaskNum(): number;
    /**
     * 获得所有添加到排队的url数（不包含重复添加）
     */
    getTotalUrlsNum(): number;
    /**
     * 返回下一个任务。如果type对应的排队不存在，或该排队没有新任务，都会返回 null
     * @param type 任务类型type
     */
    nextTask(): any;
}
