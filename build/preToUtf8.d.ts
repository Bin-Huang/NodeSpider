import NodeSpider from "./spider";
import { ICurrentCrawl } from "./types";
export default function preToUtf8(): (thisSpider: NodeSpider, currentTask: ICurrentCrawl) => ICurrentCrawl;
