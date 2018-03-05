/// <reference types="node" />
import { EventEmitter } from "events";
import { IOptions, IPipe, IPlan, IState, ITask } from "./types";
/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    _STATE: IState;
    /**
     * create an instance of NodeSpider
     * @param option
     */
    constructor(option?: IOptions);
    /**
     * 终止爬虫
     */
    end(): void;
    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    isExist(url: string): boolean;
    /**
     * 过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组
     * @param urlArray {array}
     * @returns {array}
     */
    filter(urlArray: string[]): string[];
    /**
     * add new plan
     * @param  {IPlan}  plan plan object
     * @return {void}
     */
    add(name: string, plan: IPlan): void;
    /**
     * connect new pipe
     * @param  {IPipe}  newPipe pipe object
     * @return {void}
     */
    connect(newPipe: IPipe): void;
    retry(current: ITask, maxRetry: number, finalErrorCallback?: () => any): any;
    /**
     * add new default plan
     * @param option default plan's option
     */
    /**
     * Add url(s) to the queue and specify a plan.
     * These task will be performed as planned when it's turn.
     * Eventually only absolute url(s) can be added to the queue, the other will be returned in an array.
     * @param planName the name of specified plan
     * @param url url or array of urls
     * @param info (Optional). Attached information for this url
     * @returns {array}
     */
    queue(planName: string, url: string | string[], info?: any): any[];
    download(path: string, url: string, filename?: string): void;
    /**
     * Save data through a pipe
     * @param  {string} pipeName pipe name
     * @param  {any}    data     data you need to save
     * @return {void}
     */
    save(pipeName: string, data: any): void;
    private work();
}
