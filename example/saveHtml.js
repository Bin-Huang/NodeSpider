/**
 * 访问网页，获得数据流时直接将数据流写入本地
 */

const { Spider, streamPlan } = require("../build/index");
const fs = require("fs");

const s = new Spider({
  concurrency: 1,
});

let i = 1;
s.add("trySpider", streamPlan((s, c) => {
  s.pipe(fs.createWriteStream(`${i++}.html`));
  s.on("end", c.done);
}));

s.queue("trySpider", "http://www.baidu.com");
s.queue("trySpider", "http://www.iqiyi.com");
