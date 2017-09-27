const { Spider, streamPlan, defaultPlan, downloadPlan } = require("../build/index");
const fs = require("fs");

const s = new Spider();

// ok!
// s.plan("trySpider", (err, current) => {
//     if (err) return console.log(err);
//     const $ = current.$;
//     console.log($("title").text());
//     s.queue("trySpider", $("a").url());
// });

// ok!
// s.add(defaultPlan({
//     name: "trySpider",
//     callbacks: [
//         Spider.preToUtf8,
//         Spider.preLoadJq,
//         (err, current) => {
//             if (err) return console.log(err);
//             const $ = current.$;
//             console.log($("title").text());
//             s.queue("trySpider", $("a").url());
//         }
//     ]
// }))

// done!
// let i = 1;
// s.add(streamPlan({
//     name: "trySpider",
//     callback: (err, current, s) => {
//         if (err) return console.log(err);
//         const res = current.res;
//         const write = fs.createWriteStream(`./${i++}.html`);
//         res.pipe(write);
//     }
// }))

// done!
// s.add(downloadPlan({
//     name: "trySpider",
//     path: "./",
//     callback: (err, current) => {
//         if (err) return console.log(err);
//         console.log("done " + current.url);
//     }
// }))
// s.queue("trySpider", "http://www.baidu.com", "baidu.html");
// s.queue("trySpider", "http://www.iqiyi.com");

// done!
// s.download("./", "http://www.baidu.com", "baidu.html");
// s.download("./", "http://www.iqiyi.com");
