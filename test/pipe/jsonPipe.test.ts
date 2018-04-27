import test from "ava";
import * as delay from "delay";
import * as fs from "fs-extra";
import * as path from "path";
import jsonPipe from "../../src/pipe/jsonPipe";

test("test 1 for jsonPipe", async (t) => {
  const filepath = path.resolve(__dirname, "jsonPipe_test1.json");

  const pipe = jsonPipe({
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
  t.is(str, `[
{
    "item1": "data1",
    "item2": "data2"
},
{
    "item1": "data3",
    "item2": null
},
{
    "item1": "data4",
    "item2": "data5"
}
]`);

  await fs.remove(filepath);
});

test("test 2 for jsonPipe", async (t) => {
  const filepath = path.resolve(__dirname, "jsonPipe_test2.json");

  const pipe = jsonPipe({
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
  t.is(str, `[
{
    "item1": null,
    "item2": null
},
{
    "item1": "data3",
    "item2": null
},
{
    "item1": "data4",
    "item2": "data5"
}
]`);

  await fs.remove(filepath);
});
