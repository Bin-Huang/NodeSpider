import test from "ava";
import * as delay from "delay";
import * as fs from "fs-extra";
import * as path from "path";
import csvPipe from "../../src/pipe/csvPipe";

test("test 1 for csvPipe", async (t) => {
  const filepath = path.resolve(__dirname, "csvPipe_test1.csv");

  const pipe = csvPipe({
    name: "test1",
    path: filepath,
    items: ["item1", "item2"],
  });
  pipe.write(["data1", "data2"]);
  pipe.write(["data3", null]);
  pipe.write(["data4", "data5"]);
  pipe.end();

  await delay(1000);

  t.is(pipe.name, "test1");
  const str = await fs.readFile(filepath, { encoding: "utf8" });
  t.is(str, "item1,item2\ndata1,data2\ndata3,null\ndata4,data5\n");

  await fs.remove(filepath);
});

test("test 2 for csvPipe", async (t) => {
  const filepath = path.resolve(__dirname, "csvPipe_test2.csv");

  const pipe = csvPipe({
    name: "test1",
    path: filepath,
    items: {
      item1: (a) => a,
      item2: (a) => a,
    },
  });
  pipe.write([null, null]);
  pipe.write(["data3", null]);
  pipe.write(["data4", "data5"]);
  pipe.end();

  await delay(1000);

  t.is(pipe.name, "test1");
  const str = await fs.readFile(filepath, { encoding: "utf8" });
  t.is(str, "item1,item2\nnull,null\ndata3,null\ndata4,data5\n");

  await fs.remove(filepath);
});
