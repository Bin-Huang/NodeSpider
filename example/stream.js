const { Spider, streamPlan, defaultPlan } = require("../build/index");

const s = new Spider({
    multiTasking: 1,
});

const p = s.plan(streamPlan({
    callback: (req, current) => {
        console.log(current.url);
    },
}));

const urls = [
    "http://www.baidu.com",
    "http://www.qq.com",
    "http://www.163.com",
    "http://www.iqiyi.com",
    "http://www.163.com",
    "http://www.51job.com",
    "http://www.bing.com",
];
s.queue(p, urls);
