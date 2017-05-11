import * as charset from "charset";
import * as iconv from "iconv-lite";
import { NodeSpider } from "./spider";
import { ICrawlCurrentTask } from "./types";

type resolve = (currentTask: ICrawlCurrentTask) => any;
type reject = (error: Error) => any;

/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 * @param thisSpider
 * @param error
 * @param currentTask
 * @param $
 */
export default function decode(thisSpider: NodeSpider, error: Error, currentTask: ICrawlCurrentTask, $) {
    return new Promise((resolve: resolve, reject: reject) => {
        try {
            let encoding = charset(currentTask.response.headers, currentTask.response.body);
            currentTask.body = iconv.decode(currentTask.response.body, encoding);
        } catch (err) {
            // 如果预处理出错，通过 reject 传回错误
            return reject(err);
        }

        // 如果预处理一切顺利，通过 resolve 传回结果
        return resolve(currentTask);
    });
}
