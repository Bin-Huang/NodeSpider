const Queue = require("../build/queue").default;

test("task count test", () => {
    const q = new Queue();

    expect(q.getTotalUrlsNum()).toBe(0);
    expect(q.getWaitingTaskNum()).toBe(0);

    q.addTask({url: "1"});
    expect(q.getTotalUrlsNum()).toBe(1);
    expect(q.getWaitingTaskNum()).toBe(1);

    q.addTask({url: "2"});
    expect(q.getTotalUrlsNum()).toBe(2);
    expect(q.getWaitingTaskNum()).toBe(2);

    q.jumpTask({url: "-1"});
    expect(q.getTotalUrlsNum()).toBe(3);
    expect(q.getWaitingTaskNum()).toBe(3);

    q.nextTask();
    expect(q.getTotalUrlsNum()).toBe(3);
    expect(q.getWaitingTaskNum()).toBe(2);

    q.nextTask();
    expect(q.getTotalUrlsNum()).toBe(3);
    expect(q.getWaitingTaskNum()).toBe(1);

    q.nextTask();
    expect(q.getTotalUrlsNum()).toBe(3);
    expect(q.getWaitingTaskNum()).toBe(0);

    q.nextTask();
    expect(q.getTotalUrlsNum()).toBe(3);
    expect(q.getWaitingTaskNum()).toBe(0);

    // 重复url
    q.jumpTask({url: "-1"});
    expect(q.getTotalUrlsNum()).toBe(3);
    expect(q.getWaitingTaskNum()).toBe(1);
});

test("task sequence test", () => {
    const q = new Queue();

    expect(q.nextTask()).toBeNull();

    q.addTask({url: "1"});
    q.addTask({url: "2"});
    expect(q.nextTask()).toEqual({url: "1"});
    q.addTask({url: "3"});
    expect(q.nextTask()).toEqual({url: "2"});
    q.jumpTask({url: "-1"});
    expect(q.nextTask()).toEqual({url: "-1"});
    expect(q.nextTask()).toEqual({url: "3"});
});
