# Features
- Simple and flexible
- Funny **jQ** selector you must like it
- Automatically decode body into **UTF8**(as an option), never worry about encoding anymore
- Save extracted data by pipe, just enjoy
- Easy to check and filter existed urls
- Retry task easily and reliably
- Rate limit & concurrent limit
- Support async function and promise

```javascript
const { Spider } = require("nodespider");
const s = new Spider();

s.plan("getTitle", (err, current) => {
    const $ = current.$;
    console.log($("title").text());
});
s.queue("getTitle", "https://www.google.com");

s.download("./save/to/path", "https://www.npmjs.com/static/images/mountain-dot.svg");
```

More examples see: **[examples](https://github.com/Bin-Huang/NodeSpider/tree/master/doc/0.9.3/example)**

# Installation & initialization

```bash
npm install nodespider@0.9.3 --save
```

```javascript
const { Spider } = require("nodespider");

const mySpider = new Spider();

// or initialize with options
const myOtherSpider = new Spider({
    concurrency: 20,
    // or more...
})
```

Optional settings:

| option | description | type | defaults |
| --- | ---- | --- | --- |
| queue | task queue | class | NodeSpider.Queue
| concurrency | concurrent async task number | number | 20 |

# Method

## Spider.prototype.plan(planName, callback)
add a default plan

| name | type | description |
| --- | --- | --- |
| planName | string | new plan's name |
| callback | function | the function to call when successfully crawled or threw an error |

Three parameters will be passed to the callback function:

- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `response`
- - `body`  the response body in utf8 format
- - `url`
- - `planName`
- - `hasRetried`
- - `info`  current task's attached information
- - `$` the jQ selector that you can use it to extract data
- `spider`  this spider instance

```javascript
const s = new Spider();
s.plan("myPlan", (err, current, s) => {
    if (err) return s.retry(current);
    const $ = current.$;
    console.log($("title").text());
});
s.queue("myPlan", "http://www.google.com");
```

**Tips:**   If you want to cancel jQ loading or close automatic decode, and make more detailed settings (such as modifying request headers), it is recommended to use the method `add` to add the default plan.

Even if you want to decide how to crawl by yourself, you can use the method `add` to add your own plan. These will be mentioned later.

## Spider.prototype.queue(planName, url, info)

Add url(s) to the queue and specify a plan. These task will be performed as planned when it's turn. Eventually only absolute url(s) can be added to the queue, the other will be returned in an array.

| name | type | description |
| --- | --- | --- |
| planName | string | the specified plan's name |
| url | string or string array | the url(s) need to add |
| info | * | `(Optional)`. The attached information. The `Info` will be passed to the callback as ` current.info` when the task of adding url is executing |

```javascript
s.plan("myPlan", (err, current) => {
    console.log(current.url);
    if (current.info) {
        console.log(current.info.from);
    }
});
s.queue("myPlan", "https://www.quora.com");
s.queue("myPlan", [
    "https://www.github.com",
    "https://www.baidu.com",
]);
s.queue("myPlan", "https://www.npmjs.com", {
    from: "google"
});

s.queue("myPlan", [
    "it isn't a url",
    10,
]); // return ["it isn't a url", 10]
```

## Spider.prototype.download(path, url, fileName)

Add download url to the queue. The downloaded file will be saved in specified path.

| name | type | description |
| --- | --- | --- |
| path | string | the path to save downloaded file |
| url | string | the url need to add |
| fileName | string | `(Optional)` . The downloaded file's name |

```javascript
s.download("./save/to/path", "https://www.npmjs.com/static/images/mountain-dot.svg");
s.download(
    "./save/to/path",
    "https://www.npmjs.com/static/images/mountain-dot.svg",
    "download.svg"
);
```

When `fileName === undefined`, the download file will be named by url in legal. Never worry about naming problems
```javascript
s.download("./", "https://www.npmjs.com/static/images/rucksack-dot.svg");
// filename: npmjs.com!static!images!rucksack-dot.svg
```

**Warn**    When an error threw from downloading, it will automatically retry 3 times (in maximum). More than three times, it will just `console.log(error)` and do not more.

If you want to decide how to handle error by yourself, or make more detailed settings, you can use the method `add` to add download plan. These will be mentioned later.

## Spider.prototype.retry(currentTask, maxRetry, finalErrorCallback);

Retry the task. The task will be added to queue again.

| parameter | description | type |
| --- | --- | --- |
| currentTask | the task which need to be retried | object |
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

## Spider.prototype.isExist(url)

Check whether the url has been added. If the url has been crawled, or in crawling and waiting, return `true`.

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

## Spider.prototype.filter(urls)

Return a new array of all unique url items which don't exist in the queue from provided array.

| parameter | type |
| --- | --- |
| urls | array (of string) |

| return |
| --- |
| array |

```javascript
s.queue(planA, "a.com");

var urls = n.filter(["a.com", "b.com", "c.com"]);
console.log(urls); // ["http://b.com", "http://c.com"]

urls = n.filter(["a.com", "aa.com", "aa.com"]);
console.log(urls); // ["http://aa.com"]
```

## Spider.prototype.add(planObject)
add a new plan

```javascript
s.add(defaultPlan({
    name: "myPlan1",
    callbacks: [
        (err, current, s) => console.log(current.url)
    ]
}));
s.queue("myPlan1", "https://www.google.com");
```

**What is the "plan"?** What spider to do after got url from queue, we call that "plan".

**What is the "plan generator"?**   A function that returns plan, and it can reuses code.

There are three built-in plan generators that can help you quickly create a plan:

- `defaultPlan` requests and passes response body to callbacks(expose to developer)
- `streamPlan`  requests and passes response stream to callback(expose to developer)
- `downloadPlan`    downloads file and saves it in specified path.

See more: **[plan document](./plan.md)**

*In the future version, you can also create your own more flexible plan, even your own plan generator. At present version already have these base, but the api and document is not perfect, so please expect*

## Spider.prototype.connect(pipeObject)
add a new data pipe.

```javascript
s.connect(jsonPipe({
    name: "myJson",
    path: "./my.json",
    items: [title, article, publish_date],
}));
```

There are three built-in pipe generators that can help you quickly create a pipe:

- `txt pipe`    Data will be saved in the ".txt" file in tabular format
- `json pipe`   Data will be stored in a ".json" file
- `csv pipe`    Data will be stored in a ".csv" file

See more: **[pipe document](./pipe.md)**

## Spider.prototype.save(pipeName, data)

Save data through a pipe

```javascript
// connect a pipe
s.connect(jsonPipe({
    name: "myJson",
    path: "./my.json",
    items: [title, article, url],
}))
s.plan("saveDoc", (err, current, s) => {
    const $ = current.$;
    // save data through pipe
    s.save("myJson", {
        title: $("title").text(),
        article: $("#readme").text(),
        url: current.url,
    });
})
s.queue("saveDoc", "https://github.com/Bin-Huang/NodeSpider");
```

## Spider.prototype.end()
close the spider instance.

```javascript
const s = new Spider();
s.end();
s.plan(() => null); // throw error
```

# Event

## "empty"
When there aren't more task in the queue, the event "empty" will be emitted.

## "queueTask"
When add a new task to the queue, the event "queueTask" will be emitted and parameter `taskObject` will be passed to callback.

## "vacant"
When the queue is empty and all tasks has been done, the event "vacant" will be emitted.

# How to contribute
- Submit an **issue** if you need any help.
- Of course, feel free to submit **pull requests** with bug fixes or changes.
- Open source your own plan generator, pipe generator, pretreatment function or queue, etc. More better with a name `nodespider-*` to easily search, such like `nodespider-mysqlpipe`.