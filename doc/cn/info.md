# info

有些情况，你可能需要为某个任务附带一些独有数据。在添加新任务时，附带 `info` 可以帮你做到这一点。

```javascript
const s = new Spider();
s.plan({
  name: "testPlan",
  process: async (task) => {
    console.log("from", task.info.from);  // 将打印 "from google"
  },
  catch: console.log,
  retries: 3,
});

s.add("testPlan", "https://www.npmjs.com/package/nodespider", { from: "google" })
```

如果你使用 `add` 或者 `addU` 批量添加一个 url 列表，那么传入的 `info` 将以深复制的形式，附带到本次添加的每一个新任务中。

```javascript
const urls = ["https://www.npmjs.com/package/nodespider", "https://github.com/Bin-Huang/NodeSpider"]

s.add("testPlan", urls, { from: "google" }) // 新增的两个任务都附带了 info 的拷贝

```

需要注意的是，`info` 必须是一个可以被 `(info) => JSON.parse(JSON.stringify(info))` 还原的对象，即不能有函数、正则以及其他特殊类型的成员。 