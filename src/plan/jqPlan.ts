import * as charset from "charset";
import * as cheerio from "cheerio";
import * as got from "got";
import * as http from "http";
import * as iconv from "iconv-lite";
import * as url from "url";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";
import NodeSpider from "../spider";
import defaultPlan from "./defaultPlan";
import { ICurrent } from "./defaultPlan";

export type IHandle =
  ($: Jq, current: ICurrent, spider: Spider)
    => any | Promise<any>;

export interface IOption {
  name: string;
  handle: IHandle;
  catch?: (error: Error) => any;
  retries?: number;
  toUtf8?: boolean;
  requestOpts?: http.RequestOptions;  // encoding 必须为 null
}

const defaultOption = {
  toUtf8: true,
  requestOpts: { encoding: null },  // 当输入 option 有requestOpts 设置，将可能导致encoding 不为 null
  catch: (error) => { throw error; },
  retries: 3,
};

export interface IDefaultPlan {
  (name: string, handle: IHandle): IPlan;
  (option: IOption): IPlan;
}

export default function jqPlan(option: IOption): IPlan {
  return defaultPlan({
    name: option.name,
    catch: option.catch,
    retries: option.retries,
    toUtf8: option.toUtf8,
    requestOpts: option.requestOpts,  // encoding 必须为 null
    handle: async (current, spider) => {
      const $ = loadJq(current);
      await option.handle($, current, spider);
    },
  });
  // const requestOpts = (option.requestOpts) ? { ...defaultOption.requestOpts, ...option.requestOpts }   ;
  // const opts = { ...defaultOption, ...option, requestOpts };
  // return {
  //   name: opts.name,
  //   retries: opts.retries,
  //   catch: opts.catch,
  //   process: async (task, spider) => {
  //     const res: got.Response<Buffer> = await got(task.url, opts.requestOpts);
  //     const current = { ...task, response: res, body: res.body.toString() };

  //     if (opts.toUtf8) { current.body = preToUtf8(current.response as got.Response<Buffer>); }
  //     const $ = loadJq(current);

  //     return await opts.handle($, current, spider);
  //   },
  // };
}

export interface Jq extends CheerioStatic {
  (selector: string): Jq;
  urls: () => string[];
}

/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export function loadJq(currentTask: ICurrent): Jq {
  const $ = cheerio.load(currentTask.body);

  // 扩展：添加 url 方法
  // 返回当前节点（们）链接的的绝对路径(array)
  // 自动处理了锚和 javascript: void(0)
  // TODO B 存在不合法链接的返回
  $.prototype.urls = function(): string[] {
    const result: string[] = [];
    $(this).map((ix, ele) => {
      let newUrl = $(ele).attr("href");
      // 如果为空，或是类似 'javascirpt: void(0)' 的 js 代码，直接跳过
      if (!newUrl || /^javascript:/.test(newUrl)) {
        return false;
      }
      // 如果是相对路径，补全路径为绝对路径
      if (newUrl && !/^https?:\/\//.test(newUrl)) {
        newUrl = url.resolve(currentTask.url, newUrl);
      }
      // 去除连接中的锚
      const anchorIndex = newUrl.lastIndexOf("#");
      if (anchorIndex !== -1) {
        newUrl = newUrl.slice(0, anchorIndex);
      }
      result.push(newUrl);
    });
    return result;
  };

  /**
   * 获得选中节点（们）的 src 路径（自动补全）
   * @returns {array}
   */
  $.prototype.src = function() {
    const result: string[] = [];
    $(this).each(function() {
      let newUrl = $(this).attr("src");
      // 如果是相对路径，补全路径为绝对路径
      if (newUrl && !/^https?:\/\//.test(newUrl)) {
        newUrl = url.resolve(currentTask.url, newUrl);
      }
      result.push(newUrl);
    });
    return result;
  };

  return $ as Jq;
}
