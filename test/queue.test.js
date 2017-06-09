import Queue from "../build/TaskQueue";

function testNum(queue, crawl, download, urls) {
    expect(queue.allUrlNum()).toBe(urls);
    expect(queue.crawlWaitingNum()).toBe(crawl);
    expect(queue.downloadWaitingNum()).toBe(download);
    expect(queue.totalWaitingNum()).toBe(crawl + download);
    if (crawl === 0) {
        // TODO: isAllCompleted
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
        plan: Symbol("plan2");
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
    testNum(q, 2, 2, 5);

    q.getTask();
    testNum(q, 2, 1, 5);

    q.addDownload({
        plan: Symbol("download3"),
        url: "download3",
    });
    testNum(q, 2, 2, 5);
});
