/// <reference types="node" />
import { EventEmitter } from "events";
import { IDefaultPlanOptionCallback, IDefaultPlanOptionInput } from "./defaultPlan";
import { IPipe, IPlan, IState } from "./types";
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
    constructor(opts?: {});
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
     * add new plan or pipe, and return a corresponding key.
     * @param item planObject or PipeObject
     */
    add(name: string, item: IPlan | IPipe): void;
    /**
     * add new default plan, and return a corresponding key.
     * @param option default plan's option
     */
    plan(name: string, option: IDefaultPlanOptionInput | IDefaultPlanOptionCallback): void;
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planName 指定的爬取计划
     * @param url 待爬取的链接（们）
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    queue(planName: string, url: string | string[], info?: any): number;
    save(pipeName: string, data: any): TypeError | undefined;
}
