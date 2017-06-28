const Queue = require("../build/TaskQueue").default;

function testNum(queue, crawl, download, urls) {
    expect(queue.allUrlNum()).toBe(urls);
    expect(queue.crawlWaitingNum()).toBe(crawl);
    expect(queue.downloadWaitingNum()).toBe(download);
    expect(queue.totalWaitingNum()).toBe(crawl + download);
    if (crawl === 0) {
        expect(queue.isCrawlCompleted()).toBe(true);
    } else {
        expect(queue.isCrawlCompleted()).not.toBe(true);
    }
    if (download === 0) {
        expect(queue.isDownloadCompleted()).toBe(true);
    } else {
        expect(queue.isDownloadCompleted()).not.toBe(true);
    }
    if (crawl === 0 && download === 0) {
        expect(queue.isAllCompleted()).toBe(true);
    } else {
        expect(queue.isAllCompleted()).not.toBe(true);
    }
}
test("test queue's count", () => {
    const q = new Queue();
    testNum(q, 0, 0, 0);

    q.addCrawl({
        plan: Symbol("url.com"),
        url: "http://url.com",
    });
    testNum(q, 1, 0, 1);

    q.addCrawl({
        plan: Symbol("plan2"),
        url: "url2",
    });
    testNum(q, 2, 0, 2);

    q.addDownload({
        plan: Symbol("download1"),
        url: "download1",
    });
    testNum(q, 2, 1, 3);

    q.addCrawl({
        plan: Symbol("plan3"),
        url: "url3",
    });
    testNum(q, 3, 1, 4);

    q.addDownload({
        plan: Symbol("download2"),
        url: "download2",
    });
    testNum(q, 3, 2, 5);

    q.getDownloadTask();
    testNum(q, 3, 1, 5);

    q.addDownload({
        plan: Symbol("download3"),
        url: "download3",
    });
    testNum(q, 3, 2, 6);

    q.getDownloadTask();
    testNum(q, 3, 1, 6);
    q.getDownloadTask();
    testNum(q, 3, 0, 6);
    q.getCrawlTask();
    testNum(q, 2, 0, 6);
    q.getCrawlTask();
    testNum(q, 1, 0, 6);

    q.getCrawlTask();
    testNum(q, 0, 0, 6);
    q.getCrawlTask();
    testNum(q, 0, 0, 6);
    q.getDownloadTask();
    testNum(q, 0, 0, 6);

    q.addCrawl({
        plan: "pppppp",
        url: "url000",
    });
    testNum(q, 1, 0, 7);

    q.addDownload({
        plan: "jsdkfjsklvnwe",
        url: "url999999",
    });
    testNum(q, 1, 1, 8);

    q.addCrawl({
        plan: "lppppp",
        url: "uuuu23",
    });
    testNum(q, 2, 1, 9);

    q.addCrawl({
        plan: "ijwiokdnv",
        url: "ksjkev",
    });
    testNum(q, 3, 1, 10);

    q.addDownload({
        plan: "jenejnn",
        url: "ujnnnnnn",
    });
    testNum(q, 3, 2, 11);

    q.getDownloadTask();
    testNum(q, 3, 1, 11);
});

test("queue test", () => {
    const q = new Queue();
    q.addCrawl({url: "u1"});
    q.addCrawl({url: "u2"});
    q.addCrawl({url: "u3"});
    q.addCrawl({url: "u4"});
    q.addCrawl({url: "u5"});
    q.addDownload({url: "d1"});
    q.addDownload({url: "d2"});
    q.addDownload({url: "d3"});

    expect(q.check("u1")).toBe(true);
    expect(q.check("u2")).toBe(true);
    expect(q.check("u3")).toBe(true);
    expect(q.check("u4")).toBe(true);
    expect(q.check("d1")).toBe(true);
    expect(q.check("d2")).toBe(true);
    expect(q.check("sdkjfskld")).not.toBe(true);
    expect(q.check("dddd")).not.toBe(true);

    expect(q.getDownloadTask()).toEqual({url: "d1"});
    expect(q.getDownloadTask()).toEqual({url: "d2"});
    expect(q.getDownloadTask()).toEqual({url: "d3"});
    expect(q.getCrawlTask()).toEqual({url: "u1"});
    expect(q.getCrawlTask()).toEqual({url: "u2"});
    expect(q.getCrawlTask()).toEqual({url: "u3"});
    expect(q.getCrawlTask()).toEqual({url: "u4"});
    expect(q.getCrawlTask()).toEqual({url: "u5"});
    expect(q.getCrawlTask()).toBeNull();
    expect(q.getDownloadTask()).toBeNull();

    q.addDownload({url: "top0"});
    q.addCrawl({url: "top4"});
    q.jumpCrawl({url: "top3"});
    q.addDownload({url: "top1"});
    q.jumpDownload({url: "top-1"});
    q.jumpCrawl({url: "top2"});
    expect(q.getDownloadTask()).toEqual({url: "top-1"});
    expect(q.getDownloadTask()).toEqual({url: "top0"});
    expect(q.getDownloadTask()).toEqual({url: "top1"});
    expect(q.getCrawlTask()).toEqual({url: "top2"});
    expect(q.getCrawlTask()).toEqual({url: "top3"});
    expect(q.getCrawlTask()).toEqual({url: "top4"});
    expect(q.getCrawlTask()).toBeNull();
    expect(q.getDownloadTask()).toBeNull();
});
