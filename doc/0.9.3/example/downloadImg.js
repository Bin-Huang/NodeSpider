/**
 * 尝试下载某个网页所有的图片，并保存到 ./img 路径
 */

const { Spider, downloadPlan } = require("../build/index");

const s = new Spider();

s.add(downloadPlan({
    callback: (err, current) => {
        if (err) return console.log(err);
        console.log(current.url + " done!");
    },
    path: "./img",
    name: "downloadImg",
}));

s.plan("getSrc", (err, current) => {
    if (err) return console.log(err);
    const $ = current.$;
    s.queue("downloadImg", $("img").src());
    $("img").src().map((src) => {
        s.download("./img", src);
    });
});

s.queue("getSrc", "https://pixabay.com/");
