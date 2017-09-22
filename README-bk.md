**NOTE**    The package nodespider is still under development. That means frequent changes and potential bug. So it is not suggested to using it in your project.

# Features
- Simple and flexible
- Funny selector you must like it, just like jQ
- automatically convert response body to UTF8 if necessary(as an option), never worry about encoding anymore
- save data extracted from web page more easily
- easy to check and filter existed urls in queue.
- retry task easily and reliably
- rate limit & simultaneous connections limit
- written in ES6 & ES7
- support async function and promise

```javascript
const { Spider } = require("nodespider");
const s = new Spider();

s.plan("getTitle", function(err, current) {
    const $ = current.$;
    console.log($("title").text());
});
s.queue("getTitle", "https://www.google.com");

s.download("./save/to/path", "https://www.npmjs.com/static/images/mountain-dot.svg");
```

```javascript
s.add(csvPipe({
    name: "myCsv",
    file: "./save/to/my.csv",
    items: ["title", "article"]
}));
s.save("myCsv", {
    title: "this is my title",
    article: "article body",
});
```

```javascript
s.add(downloadPlan({
    name: "downloadImg",
    path: "./save/to/myFolder",
    callback: (err, current) => console.log("done!");
}));

s.queue("downloadImg", "http://example.com/example.jpg");

s.add(defaultPlan({
    name: "getImgUrl",
    headers: {
        cookie: "this-is-my-cookie-with-secret",
    },
    method: "GET",
    callbacks: [
        Spider.preToUtf8,
        Spider.preLoadJq,
        (err, current) => {
            const $ = current.$;
            s.queue("downloadImg", $("img").src());
        }
    ],
}));
s.queue("getImgUrl", "http://www.google.com");


s.add(jsonPipe({
    name: "myJson",
    file: "./path/to/myJson.json",
}));
s.save("myJson", {
    title: "nodespider",
    description: "Simple, flexible, delightful web crawler/spider package",
});
```

```javascript
const s = new Spider({
    concurrency: {
        "blogSpider": 20,
        "imgSpider": 4,
        "articleSpider + otherSpider": 10
    }
});
s.plan("blogSpider", (err, current) => {
    if (err) return current.retry(3);

    const $ = current.$;
    const newUrl = $("#next_page").url();
    if (! current.isExist(newUrl)) {
        current.queue("articleSpider", newUrl);
    }
});
s.queue("blogSpider", "http://www.baidu.com");

s.add(defaultPlan({
    name: "imgSpider",
    callbacks: [
        Spider.preToUtf8,
        Spider.preLoadJq,
        (err, current) => {
            if (err) return current.retry(3);
            const $ = current.$;
            const newUrl = $("#next_page").url();
        },
    ],
}))
```

# Installation & initialization

```bash
npm install nodespider --save
```

```javascript
const { Spider } = require("nodespider");

const mySpider = new Spider();

// or initialize with options
const myOtherSpider = new Spider({
    rateLimit: 20,
    maxConnections: 20,
    // and more options...
})
```

Optional settings:

| option | description | type | defaults |
| --- | ---- | --- | --- |
| rateLimit | request interval | number | 2(millisecond)
| queue | task queue | class | NodeSpider.Queue
| maxConnections | maximum number of simultaneous connections | number | object | 20 |

## maxConnections
Maximum number of simultaneous connections. It can be a number or object.

**when it is a `number`**

It means the amount of simultaneous connections can not exceed `maxConnections`.

```javascript
const s = new Spider({
    maxConnections: 10, // the amount of simultaneous connections of not more than 10
});
```

**when it is an `object`**

Also, you can specify the maximun number of simultaneous connections for tasks with different type of plan.

```javascript
const s = new Spider({
    maxConnections: {
        "download": 5,
        "crawl": 15,    //  the maxConnections of tasks with plan "crawl" of not more than 15
    }
});
```

*NOTE:* If option `maxConnections` is an object, there will throw an error when add a new plan but its type has not existed in the option `maxConnections`.

## add(planObject)
add new plan to this spider instance, then you can use it by method `queue`.

```javascript
const { Spider } = require("nodespider");
const s = new Spider();
s.add(defaultPlan({
    name: "myNewPlan",
    callbacks: [
        Spider.preToUtf8,
        Spider.preLoadJq,
        (err, current, s) => {
            const $ = current.$;
            console.log($("title").text());
        },
    ]
}));
s.queue("myNewPlan", "http://www.youtube.com");
```

There are some build-in plan generators can help you create your own crawling plan.
- defaultPlan

**See [plan document](./doc/plan.md)**


## plan(name, callback)

Using method `plan` is the easier way to add a default plan.

```javascript
const { Spider } = require("nodespider");
const s = new Spider();

function myCallback(err, current) {
    console.log(current.url);
}

s.plan("myPlan", myCallback);
// equal to
s.add(defaultPlan({
    name: "myPlan",
    callbacks: [
        Spider.preToUtf8,
        Spider.preLoadJq,
        myCallback,
    ]
}));
```

## queue(planName, url, info)

enqueue new task(s) with url and appointed plan.

| parameter | description | type |
| --- | ---- | --- |
| planName |  | string |
|  url | the task's url | string or array |
| info | (Optional) the task's special information object, that will be a member of parameter `current` that passed to plan's callback | Object |

```javascript
const s = new Spider();
s.plan("myPlan", function (err, current) {
    // some crawling rules
    s.queue("myPlan", $("a").url(), {from: current.url});
});

s.queue("myPlan", "https://nodejs.org");
s.queue("myPlan", [
    "http://www.github.com",
    "https://stackoverflow.com/",
    "https://nodejs.org"
]);
```

## retry(currentTask, maxRetry, finalErrorCallback);

Retry the task. The task will be added to queue again.

| parameter | description | type |
| --- | --- | --- |
| currentTask | the task which needs retry | object |
| maxRetry | (Optional) Maximum number of retries. Default: `1` | number |
| finalErrorCallback | (Optional) the function will be called when reach maximum number of retries | function |

```javascript
s.plan("myPlan", function (err, current) {
    if (err) return s.retry(current);
});
s.plan("otherPlan", function (err, current) {
    if (err) return s.retry(current, 10);
});
s.plan("anotherPlan", function (err, current) {
    if (err) return s.retry(current, 5, () => console.log(err));
});
```

## save(pipeName, data)

save data to appointed pipe.

| parameter | description | type |
| --- | --- | --- |
| pipeName | the name of appointed pipe | string |
| data | data | object |

```javascript
// create the pipe
s.add(jsonPipe({
    name: "myJson",
    path: "./my.json",
}));
s.plan(function (err, current) {
    const $ = current.$;
    // save data to file "my.json"
    s.save("myJson", {
        title: $("#title").text(),
        article: $("#article").text(),
        date: $("#date").text(),
    });
});
```

## isExist(url)

Check whether the url has been added. If the url is in the queue, is crawling or has been crawled, return `true`.

| parameter | description | type |
| --- | --- | --- |
| url | the url you want to check | string |

| return | description |
| --- | --- |
| boolean | if the url exists, return `true`

```javascript
s.queue("myPlan", "http://www.example.com");
console.log(s.isExist("http://www.example.com"));    // true
```

## filter(urls)

Method `filter` return a new array of all unique url items which don't exist in the queue from provided array.

| parameter | type |
| --- | --- |
| urls | array (of string) |

| return |
| --- |
| array |

```javascript
s.queue(planA, "http://a.com");

var urls = n.filter(["http://a.com", "http://b.com", "http://c.com"]);
console.log(urls); // ["http://b.com", "http://c.com"]

urls = n.filter(["http://a.com", "http://aa.com", "http://aa.com"]);
console.log(urls); // ["http://aa.com"]
```

## end()

close the spider instance.


# Event

## "empty"
When there aren't more task in the queue, the event "empty" will be emitted.

## "queueTask"
When add a new task to the queue, the event "queueTask" will be emitted with a parameter `taskObject`.

## "vacant"
When the queue is empty and all tasks has been done, the event "vacant" will be emitted.

# How to contribute
- Submit an **issue** if you need any help.
- Of course, feel free to submit **pull requests** with bug fixes or changes.
- Open source your own plan generator, pipe generator, pretreatment function or queue, etc. More better with a name `nodespider-*` to easily search, such like `nodespider-mysqlpipe`.
