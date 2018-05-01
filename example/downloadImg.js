/**
 * 尝试下载某个网页所有的图片，并保存到 ./path 路径
 */

const { Spider, downloadPlan, defaultPlan } = require("../build/index");

const s = new Spider();

const plan = downloadPlan("path");

s.add("download", plan);

s.queue("download", "http://mindhacks.cn/wp-content/uploads/2016/12/card1.png")