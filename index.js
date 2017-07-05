const NodeSpider = require("./build/spider").default;
const { jsonPipe, txtPipe } = require("./build/pipe");
const preToUtf8 = require("./build/preToUtf8");
const preLoadJq = require("./build/preLoadJq");

module.exports = {
    NodeSpider,
    jsonPipe,
    txtPipe,
    preToUtf8,
    preLoadJq,
};
