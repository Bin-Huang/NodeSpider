// import Queue from "../build/queue";
const Queue = require("../build/queue").default;

test("task count test", () => {
    const q = new Queue();

    expect(q.getTotalUrlsNum()).toBe(0);
    expect(q.getWaitingTaskNum("default")).toBe(0);
    expect(q.getWaitingTaskNum("stream")).toBe(0);
    expect(q.getWaitingTaskNum("download")).toBe(0);

    q.addTask({url: "default1"}, "default");
    expect(q.getTotalUrlsNum()).toBe(1);
    expect(q.getWaitingTaskNum("default")).toBe(1);
    expect(q.getWaitingTaskNum("stream")).toBe(0);
    expect(q.getWaitingTaskNum("download")).toBe(0);

    q.addTask({url: "default2"}, "default");
    q.addTask({url: "download1"}, "download");
    expect(q.getTotalUrlsNum()).toBe(3);
    expect(q.getWaitingTaskNum("default")).toBe(2);
    expect(q.getWaitingTaskNum("stream")).toBe(0);
    expect(q.getWaitingTaskNum("download")).toBe(1);

    q.addTask({url: "stream1"}, "stream");
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingTaskNum("default")).toBe(2);
    expect(q.getWaitingTaskNum("stream")).toBe(1);
    expect(q.getWaitingTaskNum("download")).toBe(1);

    q.nextTask("stream");
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingTaskNum("default")).toBe(2);
    expect(q.getWaitingTaskNum("stream")).toBe(0);
    expect(q.getWaitingTaskNum("download")).toBe(1);

    // 一个type 对应的waiting task number最小应该是0，而不是负数
    q.nextTask("stream");
    q.nextTask("stream");
    q.nextTask("stream");
    q.nextTask("stream");
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingTaskNum("default")).toBe(2);
    expect(q.getWaitingTaskNum("stream")).toBe(0);
    expect(q.getWaitingTaskNum("download")).toBe(1);

    // 当添加重复的链接，total urls number 应该保持不变
    q.addTask({url: "stream1"}, "stream");
    expect(q.getTotalUrlsNum()).toBe(4);
    expect(q.getWaitingTaskNum("default")).toBe(2);
    expect(q.getWaitingTaskNum("stream")).toBe(1);
    expect(q.getWaitingTaskNum("download")).toBe(1);
});

test("task sequence test", () => {
    const q = new Queue();

    expect(q.nextTask("default")).toBeNull();
    expect(q.nextTask("download")).toBeNull();
    expect(q.nextTask("stream")).toBeNull();

    q.addTask({did: 1}, "download");
    q.addTask({id: 1}, "default");
    q.addTask({did: 2}, "download");
    q.addTask({did: 3}, "download");
    q.addTask({id: 2}, "default");
    expect(q.nextTask("default")).toEqual({id: 1});
    expect(q.nextTask("download")).toEqual({did: 1});
    q.addTask({id: 3}, "default");
    q.addTask({did: 4}, "download");
    expect(q.nextTask("default")).toEqual({id: 2});
    expect(q.nextTask("download")).toEqual({did: 2});
    expect(q.nextTask("default")).toEqual({id: 3});
    expect(q.nextTask("download")).toEqual({did: 3});
    expect(q.nextTask("download")).toEqual({did: 4});
    expect(q.nextTask("download")).toBeNull();
    expect(q.nextTask("default")).toBeNull();

    q.addTask({id: 1}, "default");
    q.addTask({id: 2}, "default");
    expect(q.nextTask("default")).toEqual({id: 1});
    q.jumpTask({id: -1}, "default");
    q.jumpTask({id: -2}, "default");
    expect(q.nextTask("default")).toEqual({id: -2});
    expect(q.nextTask("default")).toEqual({id: -1});
    expect(q.nextTask("default")).toEqual({id: 2});
    expect(q.nextTask("default")).toBeNull();

    q.jumpTask({did: 3}, "download");
    q.jumpTask({did: 2}, "download");
    q.jumpTask({did: 1}, "download");
    q.addTask({did: 4}, "download");
    expect(q.nextTask("download")).toEqual({did: 1});
    expect(q.nextTask("download")).toEqual({did: 2});
    expect(q.nextTask("download")).toEqual({did: 3});
    q.jumpTask({did: -1}, "download");
    q.addTask({did: 5}, "download");
    expect(q.nextTask("download")).toEqual({did: -1});
    expect(q.nextTask("download")).toEqual({did: 4});
    expect(q.nextTask("download")).toEqual({did: 5});
});
