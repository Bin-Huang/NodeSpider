/**
 * 访问网页，获得数据流时直接将数据流写入本地
 */

const { Spider, streamPlan } = require("../build/index");
const fs = require("fs");

const s = new Spider({ concurrency: 1});

let i = 1;
s.plan("trySpider", streamPlan({
    callback: (err, current, s) => {
        if (err) return console.log(err);
        const stream = current.stream;
        const writeStream = fs.createWriteStream(`./example/${i++}.html`);
        stream.pipe(writeStream);  // 直接将返回的数据流传到写入流
        stream.on("error", () => current.done())
        stream.on("complete", () => current.done())
    }
}))

s.add("trySpider", "http://www.baidu.com");
s.add("trySpider", "http://www.iqiyi.com");
