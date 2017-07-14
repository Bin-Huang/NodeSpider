```javascript
const plan1 = n.plan((err, current) => {
    if (err) {
        console.log(err);
        return n.retry(current);
    }
    const $ = current.$;
    console.log($("title").text());
});

const plan2 = n.plan({
    request: {
        header: {
            "xx-header": "sdkfj-232323",
        },
        cookies: "skdlfjklsfjklsjfksdfjkjkf",
    },
    input: writeStream,
    pre: [preToUtf8, preLoadJq],
    callback: (err, current) => {
        if (err) {
            console.log(err);
            return n.retry(current);
        }
        const $ = current.$;
        console.log($("title").text());
    },
});

const plan3 = n.plan(phantom({
    config: {
        "some-config": "options",
    },
}));

n.queue(plan3, "http://www.baidu.com");


// ==== importance ====

const downloadPlan1 = n.plan({
    download: "path/to/folder", 
    callback: (err, current) => {
        console.log("kfjs");
    },
});

n.queue(downloadPlan1, "http://www.baidu.com", "baidu.html");
```