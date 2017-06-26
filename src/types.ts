import { DownloadPlan, Plan } from "./plan";
import NodeSpider from "./spider";

export interface IQueue {
    addCrawl: (newTask: ITask) => void;
    addDownload: (newTask: ITask) => void;
    jumpCrawl: (newTask: ITask) => void;
    jumpDownload: (newTask: ITask) => void;
    check: (url: string) => boolean;
    crawlWaitingNum: () => number;
    downloadWaitingNum: () => number;
    totalWaitingNum: () => number;
    allUrlNum: () => number;
    isCrawlCompleted: () => boolean;
    isDownloadCompleted: () => boolean;
    isAllCompleted: () => boolean;
    getCrawlTask: () => ITask;
    getDownloadTask: () => ITask;
}

export interface IPipe {
    add: (data: any) => void;
    close: () => void;
}

// import TaskQueue from "./TaskQueue";

// NodeSpider' state
export interface IState {
    queue: IQueue;
    planStore: Map<symbol, Plan>;
    dlPlanStore: Map<symbol, DownloadPlan>;
    pipeStore: Map<symbol, IPipe>;
    option: IGlobalOption;
    working: boolean;
    currentMultiTask: number;
    currentMultiDownload: number;
}

// for parameter option, when initialize an instance  of NodeSpider.
export interface IGlobalOption {
    multiTasking: number;
    multiDownload: number;
    // defaultRetry: number;
    // defaultDownloadPath: string;

    rateLimit: number;
    queue: IQueue;

    // preprocessing: any[];
}

// for task object in the queue;
export interface ITask {
    url: string;
    planKey: symbol;
    special?: any;
    maxRetry?: number;
    hasRetried?: number;
}
export interface ICurrentCrawl extends ITask {
    plan: Plan;
    response: any;
    body: string;
    error: Error;
}
export interface ICurrentDownload extends ITask {
    plan: DownloadPlan;
    error: Error;
}

export type IRule = (err: Error, current: ICurrentCrawl) => void | Promise<void>;
export interface IPlanInput {
    rule: IRule;
    request?: any;
    use?: any[];
    info?: any;
}

export type THandleError = (err: Error, current: ICurrentDownload) => void | Promise<void>;
export type THandleFinish = (current: ICurrentDownload) => void | Promise<void>;
export interface IDownloadPlanInput {
    handleError: THandleError;
    handleFinish?: THandleFinish;
    path?: string;
    request?: any;
    use?: any[] ;
    info?: any;

}

export type TPreOperation = (thisSpider: NodeSpider, current: ICurrentCrawl) => ICurrentCrawl | Promise<ICurrentCrawl>;
