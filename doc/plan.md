---------------------------------------------------------
# PLAN DOCUMENT
---------------------------------------------------

There are three built-in plan generators that can help you quickly create a plan:
- `requestPlan` requests and passes response body to callbacks(expose to developer)
- `streamPlan`  requests and passes response stream to callback(expose to developer)
- `downloadPlan`    downloads file and saves it in specified path.

# default plan
```javascript
requestPlan({
    name,
    callbacks,
    headers,    // Optional, default: `{}`
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
let plan = requestPlan({
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

# stream plan
```javascript
streamPlan({
    name,
    callback,
    headers,    // Optional, default: `{}`
    method, // Optional, default: `GET`
})
```
## callback

When receiving the response stream, call the callback function immediately and pass in three parameters:

- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `res`   the response stream
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- `spider`  this spider instance

```javascript
const write = fs.createWriteStream("./data.txt");
let plan = streamPlan({
    name: "myPlan",
    callback: (err, current, s) => {
        const res = current.res;
        res.pipe(write);
    }
});
s.add(plan);
s.queue("myPlan", "http://www.baidu.com");
```

# download plan
```javascript
downloadPlan({
    name,
    path,   // the path to save downloaded file
    callback,
    headers,    // Optional, default: `{}`
    method, // Optional, default: `GET`
})
```
## callback

When the download succeeds, or when an error threw, the function will be called and passed in three parameters:

- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- `spider`  this spider instance

```javascript
let plan = downloadPlan({
    name: "downloadImg",
    path: "./myFolder"
    callback: (err, current, s) => {
        if (err) return s.retry(current);
        console.log("Successfully downloaded from " + current.url);
    }
});
s.add(plan);
s.queue("downloadImg", "http://example.com/example.png");
```

## filename
When you add url using method `queue`, if the download plan is specified, the download file will name according to` info`.

- When `info` is a string, it will be the name of download file
- When `info` is an object, if there are `info.fileName` it will be the name
- If these does not occur, it will automatically be named according to url

```javascript
s.queue("downloadImg", "http://example.com/example.png", "download.png");
s.queue("downloadImg", "http://example.com/example.png", {
    fileName: "download.png",
    data: "other attached information...",
});
s.queue("downloadImg", "http://example.com/example.png");
```
