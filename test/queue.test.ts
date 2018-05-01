import test from "ava";
import * as sinon from "sinon";
import Queue from "../src/queue";

test.serial("test for class Queue", async (t) => {
  const q = new Queue();

  t.is(null, q.next());
  t.is(0, q.getLength());

  const [ v1, v2, v3, v4, v5] = [ 1, 2, 3, 4, 5 ].map((v) => ({
    planName: "test",
    uid: `uid${v}`,
    url: `url${v}`,
  }));

  q.add(v2);
  q.add(v3);
  q.jump(v1);
  q.add(v4);

  t.is(4, q.getLength());
  t.is(v1, q.next());
  t.is(v2, q.next());
  t.is(v3, q.next());
  t.is(1, q.getLength());

  q.add(v5);

  t.is(v4, q.next());
  t.is(v5, q.next());
  t.is(null, q.next());
});
