```javascript
const {Spider, defaultPlan} = require("nodespider");
const s = new Spider();
s.add(defaultPlan("plan1", (err, current, s) => {
    if (err) return current.retry(3);

    const $ = current.$;
    console.log($("title").text());

    s.queue("plan1", $("a").urls());
}));
s.queue("plan1", "https://www.wikipedia.org/");
```
There are some build-in plan generators can help you create your own crawling plan.

# default plan
```javascript
defaultPlan({
    name,
    callbacks,
    header,    // Optional, default: `{}`
    method, // Optional, default: `GET`
})
```
## callbacks
The functions to call one-by-one when fetched response body or throwed error in request.

NodeSpider supports promise and async function, so you can write some async code in your callback just wrap into promise and return, or write your callback as async function.

The three parameters will be passed in turn between each function. All changes to the three parameters will be passed to the next function

- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `response`
- - `body`
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- `spider`  this spider instance

```javascript
let plan = defaultPlan({
    name: "myPlan",
    callbacks: [
        Spider.preToUtf8,
        Spider.preLoadJq,
        async (err, current) => await saveToSql(current.url),
        (err, current) => console.log(current.url)
    ],
    method: "GET",
    headers: {
        cookies: "this-is-my-cookies"
    }
});
s.add(plan);
s.queue("myPlan", "http://www.baidu.com");
```