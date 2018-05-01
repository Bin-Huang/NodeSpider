import test from "ava";
import * as sinon from "sinon";
import { Spider } from "../../src/index";

const s = new Spider();

test("test for method 'filter' & 'has'", async (t) => {
  s.plan({
    name: "test",
    process: async () => null,
    retries: 3,
    catch: () => null,
  });

  const url1 = "http://www.test.com/1";
  t.is(false, s.has(url1));
  s.add("test", url1);
  t.is(true, s.has(url1));

  const url2 = "http://www.test.com/2";
  t.is(false, s.has(url2));
  s.add("test", url2);
  t.is(true, s.has(url2));

  const urls = s.filter([
    url1,
    "http://www.test.com/3",
    url1,
    "http://www.test.com/3",
    "http://www.test.com/4",
    url2,
  ]);
  t.deepEqual(urls, [
    "http://www.test.com/3",
    "http://www.test.com/4",
  ]);
});
