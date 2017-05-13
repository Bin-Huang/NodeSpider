import TaskQueue from "./TaskQueue";
export interface IPublicOption {
}
export interface ICrawlOption extends IPublicOption {
    preprocessing?: any[];
}
export interface ICrawlTaskInput extends ICrawlOption {
    url: string | string[];
    strategy: (err: Error, currentTask: ICrawlCurrentTask, $) => any;
}
export interface ICrawlQueueItem extends ICrawlTaskInput {
    url: string;
    _INFO?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: ICrawlCurrentTask) => any;
    };
}
export interface ICrawlCurrentTask extends ICrawlQueueItem {
    response: any;
    error: Error;
    body: string;
    $: any;
}
export interface IDownloadOption extends IPublicOption {
}
export interface IDownloadTaskInput extends IDownloadOption {
    url: string | string[];
    path?: string;
    callback?: (err: Error, currentTask: IDownloadCurrentTask) => void;
}
export interface IDownloadQueueItem extends IDownloadTaskInput {
    url: string;
    _INFO?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: IDownloadCurrentTask) => void;
    };
}
export interface IDownloadCurrentTask extends IDownloadQueueItem {
}
export interface IStatus {
    _working: boolean;
    _currentMultiTask: number;
    _currentMultiDownload: number;
}
export interface IGlobalOption extends ICrawlOption, IDownloadOption {
    multiTasking: number;
    multiDownload: number;
    defaultRetry: number;
    defaultDownloadPath: string;
    crawlQueue: TaskQueue<ICrawlQueueItem>;
    downloadQueue: TaskQueue<IDownloadQueueItem>;
    preprocessing: any[];
}
