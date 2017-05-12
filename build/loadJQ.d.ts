import { NodeSpider } from "./spider";
import { ICrawlCurrentTask } from "./types";
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 * @param thisSpider
 * @param currentTask
 * @return currentTask
 */
export default function loadJQ(thisSpider: NodeSpider, currentTask: ICrawlCurrentTask): ICrawlCurrentTask;
