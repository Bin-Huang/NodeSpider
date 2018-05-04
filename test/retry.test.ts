import test from "ava";
import * as delay from "delay";
import * as sinon from "sinon";
import { Spider } from "../src/index";
import { IPlan } from "../src/interfaces";

test("testing 1 for retry", async (t) => {
  const s = new Spider();

  const catchSpy = sinon.spy();
  const handleSpy = sinon.spy();

  const plan: IPlan = {
    name: "test",
    process: async () => {
      await delay(100);
      handleSpy();
      throw new Error("error");
    },
    catch: catchSpy,
    retries: 3,
  };
  s.plan(plan);
  s.add("test", "http://test1.com");

  await delay(10000);
  t.is(1, catchSpy.callCount);
  t.is(4, handleSpy.callCount);

});

test("testing 2 for retry", async (t) => {
  const s = new Spider();

  const catchSpy = sinon.spy();
  const handleSpy = sinon.spy();

  const plan: IPlan = {
    name: "test",
    process: async () => {
      await delay(100);
      handleSpy();
      throw new Error("error");
    },
    catch: catchSpy,
    retries: 1,
  };
  s.plan(plan);
  s.add("test", "http://test1.com");

  await delay(10000);
  t.is(1, catchSpy.callCount);
  t.is(2, handleSpy.callCount);

});

test("testing 3 for retry", async (t) => {
  const s = new Spider();

  const catchSpy = sinon.spy();
  const handleSpy = sinon.spy();

  let isErr = true;
  const plan: IPlan = {
    name: "test",
    process: async () => {
      await delay(100);
      handleSpy();
      if (isErr) {
        isErr = false;
        throw new Error("error");
      } else {
        return null;
      }
    },
    catch: catchSpy,
    retries: 4,
  };
  s.plan(plan);
  s.add("test", "http://test1.com");

  await delay(10000);
  t.is(0, catchSpy.callCount);
  t.is(2, handleSpy.callCount);
});
