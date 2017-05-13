import NodeSpider from "./spider";
import { ICrawlCurrentTask } from "./types";
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 * @param thisSpider
 * @param currentTask
 * @return currentTask
 */
export default function decode(thisSpider: NodeSpider, currentTask: ICrawlCurrentTask): ICrawlCurrentTask;
