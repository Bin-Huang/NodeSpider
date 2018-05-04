const { Spider } = require("../build/index.js");

const s = new Spider();

s.add("plan", async (task) => console.log(task.url));

console.log(s.isExist("http://www.baidu.com"));
s.queue("plan", "http://www.baidu.com");
console.log(s.isExist("http://www.baidu.com"));

console.log(s.filter(["http://www.baidu.com", "google.com"]));
