/// <reference types="node" />
import { EventEmitter } from "events";
import { IOptions, IPipe, IPipeItems, IPlan, IState, ITask } from "./interfaces";
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
    has(url: string): boolean;
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
    plan(name: string, plan: IPlan): void;
    /**
     * connect new pipe
     * @param  {IPipe}  target pipe object
     * @return {void}
     */
    pipe(name: string, target: IPipe, items?: IPipeItems): void;
    retry(current: ITask, maxRetry: number, finalErrorCallback?: () => any): void;
    add(planName: string, url: string | string[], info?: {
        [index: string]: any;
    }): void;
    /**
     * Save data through a pipe
     * @param  {string} pipeName pipe name
     * @param  {any}    data     data you need to save
     * @return {void}
     */
    save(pipeName: string, data: {
        [index: string]: any;
    }): void;
}
