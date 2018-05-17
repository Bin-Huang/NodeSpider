import test from "ava";
import * as delay from "delay";
import * as sinon from "sinon";
import { Spider } from "../src/index";
import { IPlan } from "../src/interfaces";

// export type IStatus = "active" | "end" | "pause" | "vacant";

test("testing 1 for status", async (t) => {
  const s = new Spider({ heartbeat: 4000 });

  await delay(1000);
  t.is("vacant", s._STATE.status);

  await delay(3100);
  t.is("end", s._STATE.status);
});

test("testing 2 for status", async (t) => {
  const s = new Spider({ heartbeat: 4000, concurrency: 2 });
  s.plan({
    name: "test",
    process: async () => {
      await delay(1000);
      return null;
    },
    failed: () => null,
    retries: 3,
  });

  await delay(1000);
  t.is("vacant", s._STATE.status);

  s.add("test", "http://teat1.com");
  t.is("active", s._STATE.status);

  await delay(4500);
  t.is("end", s._STATE.status);
});

test("testing 3 for status", async (t) => {
  const s = new Spider({ heartbeat: 4000, concurrency: 2 });
  s.plan({
    name: "test",
    process: async () => {
      await delay(1000);
      return null;
    },
    failed: () => null,
    retries: 3,
  });

  await delay(1000);
  t.is("vacant", s._STATE.status);

  s.pause();
  t.is("pause", s._STATE.status);

  s.add("test", "http://teat1.com");
  t.is("pause", s._STATE.status);

  await delay(4100);
  t.is("pause", s._STATE.status);

  s.active();

  await delay(8100);
  t.is("end", s._STATE.status);
});

test("testing 4 for status", async (t) => {
  const s = new Spider({ heartbeat: 4000, stillAlive: true });
  s.plan({
    name: "test",
    process: async () => {
      await delay(200);
      return null;
    },
    failed: () => null,
    retries: 3,
  });

  await delay(4100);
  t.is("vacant", s._STATE.status);

  s.add("test", "http://test1.com");

  await delay(8100);
  t.is("vacant", s._STATE.status);
});
