import test from "ava";
import * as delay from "delay";
import * as fs from "fs-extra";
import * as path from "path";
import txtPipe from "../../src/pipe/txtPipe";

test("test 1 for txtPipe", async (t) => {
  const filepath = path.resolve(__dirname, "txtPipe_test1.txt");

  const pipe = txtPipe({
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
  t.is(str, "item1\titem2\ndata1\tdata2\ndata3\tnull\ndata4\tdata5\n");

  await fs.remove(filepath);
});

test("test 2 for txtPipe", async (t) => {
  const filepath = path.resolve(__dirname, "txtPipe_test2.txt");

  const pipe = txtPipe({
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
  t.is(str, "item1\titem2\nnull\tnull\ndata3\tnull\ndata4\tdata5\n");

  await fs.remove(filepath);
});
