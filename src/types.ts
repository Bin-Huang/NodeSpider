import { Plan } from "./plan";
import TaskQueue from "./TaskQueue";

// public opts for crawlTask and downloadTask
export interface IPublicOption {
    // ...
}

// crawlTask special opts
export interface ICrawlOption extends IPublicOption {
    preprocessing?: any[];
}

// when new crawlTask is added by method addTask and $.fn.todo
export interface ICrawlTaskInput extends ICrawlOption {
    url: string | string[];
    strategy: (err: Error, currentTask: ICrawlCurrentTask, $) => any;
}

// for all items of CrawlQueue
export interface ICrawlQueueItem extends ICrawlTaskInput {
    url: string;

    _INFO ?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: ICrawlCurrentTask) => any;
    };
}

// for parameter currentTask in function strategy
export interface ICrawlCurrentTask extends ICrawlQueueItem {
    response: any;
    error: Error;
    body: string;
    $: any;
}

// special options for downloadTask
export interface IDownloadOption extends IPublicOption {

}
// new downloadTask that is added by method addDownload and $.fn.download
export interface IDownloadTaskInput extends IDownloadOption {
    url: string | string[];
    path?: string;
    callback?: (err: Error, currentTask: IDownloadCurrentTask) => void;
}
// for all items in DownloadQueue
export interface IDownloadQueueItem extends IDownloadTaskInput {
    url: string;
    _INFO ?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: IDownloadCurrentTask) => void;
    };
}
// for parameter currentTask in function callback in downloadTask
export interface IDownloadCurrentTask extends IDownloadQueueItem {

}

// NodeSpider' state
export interface IState {
    crawlQueue: TaskQueue<ICrawlQueueItem>;
    downloadQueue: TaskQueue<IDownloadQueueItem>;
    tables: Map<string, any>;
    planStore: Plan[];
    option: IGlobalOption;
    working: boolean;
    currentMultiTask: number;
    currentMultiDownload: number;
}

// for parameter option, when initialize an instance  of NodeSpider.
export interface IGlobalOption extends ICrawlOption, IDownloadOption {
    multiTasking: number;
    multiDownload: number;
    defaultRetry: number;
    defaultDownloadPath: string;

    crawlQueue: TaskQueue<ICrawlQueueItem>;
    downloadQueue: TaskQueue<IDownloadQueueItem>;

    preprocessing: any[];
}
