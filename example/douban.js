const { Spider } = require("../build/index.js");

const n = new Spider();

const i = n.plan((err, current) => {
    if (err) {
        console.log(err);
    }
    console.log(current.url);

    console.log(current);
});

n.queue(i, "http://www.baidu.com")