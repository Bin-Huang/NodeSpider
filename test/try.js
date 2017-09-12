const { Spider, streamPlan, defaultPlan } = require("../build/index");

const s = new Spider();

s.add("trySpider", defaultPlan((err, current) => {
    const $ = current.$;
    console.log($("title").text());
}));

s.queue("trySpider", "http://www.baidu.com");
s.queue("trySpider", "http://www.iqiyi.com");
