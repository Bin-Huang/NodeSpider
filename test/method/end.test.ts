import test from "ava";
import * as sinon from "sinon";
import { Spider } from "../../src/index";

const s = new Spider();

test("test for method 'end'", async (t) => {
  const handleStatusChange = sinon.spy();
  s.on("statusChange", handleStatusChange);

  s.end();
  t.is("end", s._STATE.status);
  t.is(1, handleStatusChange.callCount);
  t.is("end", handleStatusChange.getCall(0).args[0]);
});
