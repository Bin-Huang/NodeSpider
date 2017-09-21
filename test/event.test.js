const { Spider, defaultPlan } = require("../build/index");

/**
 * 异步等待指定时间
 * @param {number} times
 */
function wait(times) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, times);
    });
}

describe("check if event emitting is normal", () => {
    test("event 'queueTask' test", () => {
        let callback = jest.fn();

        const s = new Spider();
        s.plan("plan1", () => null);
        s.plan("plan2", () => null);
        s.on("queueTask", callback);

        s.queue("plan1", "exampleUrl1");
        s.queue("plan1", "exampleUrl2");
        s.queue("plan2", "exampleUrl3");

        expect(callback.mock.calls.length).toBe(3);
        expect(callback.mock.calls[0][0]).toEqual({
            info: undefined,
            planName: "plan1",
            url: "exampleUrl1",
        });
        expect(callback.mock.calls[1][0]).toEqual({
            info: undefined,
            planName: "plan1",
            url: "exampleUrl2",
        });
        expect(callback.mock.calls[2][0]).toEqual({
            info: undefined,
            planName: "plan2",
            url: "exampleUrl3",
        });
        s.end();
    });

    test("event 'empty' test", async () => {
        expect.assertions(5);

        const mockCallback = jest.fn();
        const s = new Spider();
        s.plan("plan1", () => null);
        s.on("empty", mockCallback);

        await wait(1000);
        expect(mockCallback.mock.calls.length).toBe(0);
        s.queue("plan1", "exampleUrl");

        await wait(1000);
        expect(mockCallback.mock.calls.length).not.toBe(0);
        let callNum = mockCallback.mock.calls.length;

        s.queue("plan1", "exampleUrl2");
        await wait(1000);
        expect(mockCallback.mock.calls.length).not.toBe(0);
        expect(mockCallback.mock.calls.length > callNum).toBe(true);
        callNum = mockCallback.mock.calls.length;

        s.end();
        expect(mockCallback.mock.calls.length).not.toBe(0);
        callNum = mockCallback.mock.calls.length;
    });

    test("event 'vacant' test", async () => {
        expect.assertions(5);
        const mockCallback = jest.fn();
        const s = new Spider();
        s.plan("plan1", () => null);
        s.on("vacant", mockCallback);

        await wait(1000);
        expect(mockCallback.mock.calls.length).toBe(0);
        s.queue("plan1", "exampleUrl");

        await wait(1000);
        expect(mockCallback.mock.calls.length).not.toBe(0);
        let callNum = mockCallback.mock.calls.length;
        s.queue("plan1", "exampleUrl2");

        await wait(2000);
        expect(mockCallback.mock.calls.length).not.toBe(0);
        expect(mockCallback.mock.calls.length > callNum).toBe(true);

        s.end();
        expect(mockCallback.mock.calls.length).not.toBe(0);
    });
});
