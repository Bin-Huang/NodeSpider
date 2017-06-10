import NodeSpider from "./spider";
import { ICurrentCrawl } from "./types";
export default function decode(): (thisSpider: NodeSpider, currentTask: ICurrentCrawl) => ICurrentCrawl;
