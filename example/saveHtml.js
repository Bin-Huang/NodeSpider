/**
 * 访问网页，获得数据流时直接将数据流写入本地
 */

const { Spider, streamPlan } = require("../build/index");
const fs = require("fs");

const s = new Spider();

let i = 1;
s.add(streamPlan({
    name: "trySpider",
    callback: (err, current, s) => {
        if (err) return console.log(err);
        const res = current.res;
        const writeStream = fs.createWriteStream(`./${i++}.html`);
        res.pipe(writeStream);  // 直接将返回的数据流传到写入流
    }
}))
s.queue("trySpider", "http://www.baidu.com");
s.queue("trySpider", "http://www.iqiyi.com");
