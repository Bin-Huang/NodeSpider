/// <reference types="node" />
import { EventEmitter } from "events";
import { IOptionInput, IPipe, IPlan, IState, ITask } from "./types";
/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    _STATE: IState;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts?: IOptionInput);
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
     * @param  {IPlan}  newPlan plan object
     * @return {void}
     */
    plan(name: string, newPlan: IPlan): NodeSpider;
    /**
     * connect new pipe
     * @param  {IPipe}  newPipe pipe object
     * @return {this}
     */
    pipe(name: string, newPipe: IPipe): NodeSpider;
    retry(current: ITask, maxRetry: number, finalErrorCallback?: () => any): any;
    /**
     * Add url(s) to the queue and specify a plan. These task will be performed as planned when it's turn. Eventually only absolute url(s) can be added to the queue, the other will be returned in an array.
     * @param planName the name of specified plan
     * @param url url or array of urls
     * @param info (Optional). Attached information for this url
     * @returns {array}
     */
    add(planName: string, url: string | string[], info?: any): any[];
    download(path: string, url: string, filename?: string): void;
    /**
     * Save data through a pipe
     * @param  {string} pipeName pipe name
     * @param  {any}    data     data you need to save
     * @return {void}
     */
    save(pipeName: string, data: any): void;
    active(): void;
    pause(): void;
    /**
     * 终止爬虫
     */
    end(): void;
    private work();
}
