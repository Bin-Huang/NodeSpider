import test from "ava";
import * as delay from "delay";
import * as sinon from "sinon";
import { Spider } from "../../src/index";

const s = new Spider();

test.serial("test for method 'plan'", async (t) => {
  const plan = {
    name: "test",
    process: sinon.spy(),
    catch: sinon.spy(),
    retries: 3,
  };
  s.plan(plan);
  t.true(s._STATE.planStore.find((p) => p.name === "test") !== undefined);

  const [ uid ] = s.add("test", "http://test1.com");
  await delay(1000);
  t.deepEqual(plan.process.getCall(0).args[0], {
    uid,
    url: "http://test1.com",
    planName: "test",
    info: undefined,
  });
  t.is(s, plan.process.getCall(0).args[1]);
});
