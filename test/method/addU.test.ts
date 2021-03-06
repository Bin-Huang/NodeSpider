import test from "ava";
import * as sinon from "sinon";
import { Spider } from "../../src/index";

const s = new Spider();
s._STATE.status = "pause";
s.plan({
  name: "test",
  process: async () => null,
  failed: () => null,
  retries: 3,
});
const addTaskHandler = sinon.spy();
s.on("addTask", addTaskHandler);

test.serial("test for method 'addU': basic", async (t) => {
  const url1 = "http://test1.com";
  const [ uid1 ] = s.addU("test", url1);
  const task1 = {
    info: {},
    uid: uid1,
    url: url1,
    planName: "test",
  };
  t.is(1, addTaskHandler.callCount);
  t.deepEqual(task1, addTaskHandler.getCall(0).args[0]);
  t.deepEqual(task1, s._STATE.queue.next());
});

test.serial("test for method 'addU': filter", async (t) => {
  const url1 = "http://test1.com";
  const uids = s.addU("test", url1);
  t.is(0, uids.length);
  t.is(1, addTaskHandler.callCount);
  t.deepEqual(null, s._STATE.queue.next());
});

test.serial("test for method 'addU' with info", async (t) => {
  const [ uid ] = s.addU("test", "http://test2.com", { pkg: "nodespider" });
  const task1 = {
    info: { pkg: "nodespider" },
    uid,
    url: "http://test2.com",
    planName: "test",
  };
  t.is(2, addTaskHandler.callCount);
  t.deepEqual(task1, addTaskHandler.getCall(1).args[0]);
  t.deepEqual(task1, s._STATE.queue.next());
});

test.serial("test for method 'addU' with urls", async (t) => {
  const [ url1, url2 ] = [ "http://test3.com", "http://test4.com", "http://test3.com", "http://test2.com" ];
  const [ uid1, uid2 ] = s.addU("test", [ url1, url2 ]);
  const task1 = {
    info: {},
    uid: uid1,
    url: url1,
    planName: "test",
  };
  const task2 = {
    info: {},
    uid: uid2,
    url: url2,
    planName: "test",
  };
  t.deepEqual(task1, addTaskHandler.getCall(2).args[0]);
  t.deepEqual(task1, s._STATE.queue.next());
  t.deepEqual(task2, addTaskHandler.getCall(3).args[0]);
  t.deepEqual(task2, s._STATE.queue.next());
  t.is(4, addTaskHandler.callCount);
});

test.serial("test for method 'addU' with urls and info", async (t) => {
  const info = { url: "https://github.com/Bin-Huang/NodeSpider" };
  const [ url1, url2 ] = [ "http://test5.com", "http://test6.com" ];
  const [ uid1, uid2 ] = s.addU("test", [ url1, url2 ], info);
  const task1 = {
    info,
    uid: uid1,
    url: url1,
    planName: "test",
  };
  const task2 = {
    info,
    uid: uid2,
    url: url2,
    planName: "test",
  };
  t.deepEqual(task1, addTaskHandler.getCall(4).args[0]);
  t.deepEqual(task1, s._STATE.queue.next());
  t.deepEqual(task2, addTaskHandler.getCall(5).args[0]);
  t.deepEqual(task2, s._STATE.queue.next());
});
