
/**
 * 从百度开始，访问页面中所有的链接，并对所有访问的页面重复上述操作
 */

const { Spider, jqPlan } = require("../dist/src/index");

const s = new Spider();

s.on("statusChange", (c, p) => console.log(`${p} -> ${c}`));
s.plan(jqPlan({
  name: "take a walk",
  handle: ($, current) => {
    console.log("=============", $("title").text()); // 每经过一个页面，打印它的标题
  },
  catch: () => null,
}));

s.add("take a walk", "http://www.baidu.com");

setInterval(() => {
  console.log("tick");
}, 1000)