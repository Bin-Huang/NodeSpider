// import Queue from "../build/queue";
const Queue = require("../build/queue").default;

test("task count test", () => {
    const q = new Queue();

    expect(q.getTotalUrlsNum()).toBe(0);
    expect(q.getWaitingDownloadTaskNum()).toBe(0);
    expect(q.getWaitingTaskNum()).toBe(0);

    q.addTask({ url: "task1" });
    expect(q.getTotalUrlsNum()).toBe(1);
    expect(q.getWaitingDownloadTaskNum()).toBe(0);
    expect(q.getWaitingTaskNum()).toBe(1);

    q.addTask({ url: "task2" });
    q.addDownload({ url: "download1"});
    q.addDownload({ url: "download2" });
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingDownloadTaskNum()).toBe(2);
    expect(q.getWaitingTaskNum()).toBe(2);

    q.nextCrawlTask();
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingTaskNum()).toBe(1);

    q.nextCrawlTask();
    expect(q.getWaitingTaskNum()).toBe(0);

    q.nextCrawlTask();
    q.nextCrawlTask();
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingDownloadTaskNum()).toBe(2);
    expect(q.getWaitingTaskNum()).toBe(0);

    q.nextDownloadTask();
    expect(q.getWaitingDownloadTaskNum()).toBe(1);

    q.nextDownloadTask();
    q.nextDownloadTask();
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingDownloadTaskNum()).toBe(0);
    expect(q.getWaitingTaskNum()).toBe(0);

    q.addDownload({ url: "download3" });
    expect(q.getTotalUrlsNum()).toBe(5);
    expect(q.getWaitingDownloadTaskNum()).toBe(1);

    q.jumpDownload({ url: "download4"});
    expect(q.getTotalUrlsNum()).toBe(6);
    expect(q.getWaitingDownloadTaskNum()).toBe(2);

    q.jumpTask({ url: "task3" });
    expect(q.getTotalUrlsNum()).toBe(7);
    expect(q.getWaitingDownloadTaskNum()).toBe(2);
    expect(q.getWaitingTaskNum()).toBe(1);

    q.nextCrawlTask();
    q.nextCrawlTask();
    expect(q.getWaitingTaskNum()).toBe(0);
    expect(q.getWaitingTaskNum()).toBe(0);

    q.addTask({ url: "task4" });
    expect(q.getWaitingTaskNum()).toBe(1);
});

test("task sequence test", () => {
    const q = new Queue();

    expect(q.nextCrawlTask()).toBeNull();
    expect(q.nextDownloadTask()).toBeNull();

    q.addDownload({did: 1});
    q.addTask({id: 1});
    q.addDownload({did: 2});
    q.addDownload({did: 3});
    q.addTask({id: 2});
    expect(q.nextCrawlTask()).toEqual({id: 1});
    expect(q.nextDownloadTask()).toEqual({did: 1});
    q.addTask({id: 3});
    q.addDownload({did: 4});
    expect(q.nextCrawlTask()).toEqual({id: 2});
    expect(q.nextDownloadTask()).toEqual({did: 2});
    expect(q.nextCrawlTask()).toEqual({id: 3});
    expect(q.nextDownloadTask()).toEqual({did: 3});
    expect(q.nextDownloadTask()).toEqual({did: 4});
    expect(q.nextDownloadTask()).toBeNull();
    expect(q.nextCrawlTask()).toBeNull();

    q.addTask({id: 1});
    q.addTask({id: 2});
    expect(q.nextCrawlTask()).toEqual({id: 1});
    q.jumpTask({id: -1});
    q.jumpTask({id: -2});
    expect(q.nextCrawlTask()).toEqual({id: -2});
    expect(q.nextCrawlTask()).toEqual({id: -1});
    expect(q.nextCrawlTask()).toEqual({id: 2});
    expect(q.nextCrawlTask()).toBeNull();

    q.jumpDownload({did: 3});
    q.jumpDownload({did: 2});
    q.jumpDownload({did: 1});
    q.addDownload({did: 4});
    expect(q.nextDownloadTask()).toEqual({did: 1});
    expect(q.nextDownloadTask()).toEqual({did: 2});
    expect(q.nextDownloadTask()).toEqual({did: 3});
    q.jumpDownload({did: -1});
    q.addDownload({did: 5});
    expect(q.nextDownloadTask()).toEqual({did: -1});
    expect(q.nextDownloadTask()).toEqual({did: 4});
    expect(q.nextDownloadTask()).toEqual({did: 5});
});
