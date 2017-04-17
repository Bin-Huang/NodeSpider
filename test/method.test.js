const NodeSpider = require("../build/spider");

test("test method addTask", () => {
    let s = new NodeSpider();
    let callback = () => {};
    expect(s._TODOLIST.getLength()).toBe(0);
    expect(s._TODOLIST.getSize()).toBe(0);

    // 可用性
    expect(s.addTask({
        url: "http://www.baidu.com",
        callback: callback,
    })).toBe(1);
    expect(s._TODOLIST.getLength()).toBe(1);
    expect(s._TODOLIST.getSize()).toBe(1);
    expect(s.addTask({
        url: "http://www.iqiyi.com",
        callback: (err, currentTask, $) => {console.log(currentTask.body); },
    })).toBe(2);
    expect(s._TODOLIST.getLength()).toBe(2);
    expect(s._TODOLIST.next()).toEqual({
        url: "http://www.baidu.com",
        callback: callback,
        _INFO: {
            maxRetry: null,
            retried: null,
            finalErrorCallback: null,
        },
    });

    // 参数报错
    expect(() => {s.addTask()}).toThrow(Error);
    expect(() => {s.addTask({})}).toThrow(Error);
    expect(() => {s.addTask({url: 100, name: "helloworld"})}).toThrow(Error);
    expect(() => {s.addTask({url: "http://www.baidu.com"})}).toThrow(Error);
    expect(() => {s.addTask({url: "string", callback: "string"})}).toThrow(Error);
    expect(() => {s.addTask({url: "string", callback: () => {console.log("function");}})}).not.toThrow(Error);
});