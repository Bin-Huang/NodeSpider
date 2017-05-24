import * as charset from "charset";
import * as iconv from "iconv-lite";
import NodeSpider from "./spider";
import { ICrawlCurrentTask } from "./types";

/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 * @param thisSpider
 * @param currentTask
 * @return currentTask
 */
export default function decode(thisSpider: NodeSpider, currentTask: ICrawlCurrentTask) {
    const encoding = charset(currentTask.response.headers, currentTask.response.body.toString());
    // 有些时候会无法获得当前网站的编码，原因往往是网站内容过于简单，比如最简单的404界面。此时无需转码
    // TODO: 有没有可能，在需要转码的网站无法获得 encoding？
    if (encoding) {
        currentTask.body = iconv.decode(currentTask.response.body, encoding);
    }
    return currentTask;
}
