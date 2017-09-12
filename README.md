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
const s = new Spider({
    concurrency: {
        "blogSpider": 20,
        "imgSpider": 4,
        "articleSpider + otherSpider": 10
    }
});
s.add(defaultPlan("blogSpider", function (err, current) {
    if (err) return current.retry(3);

    const $ = current.$;
    const newUrl = $("#next_page").url();
    if (! current.isExist(newUrl)) {
        current.queue("articleSpider", newUrl);
    }
}));
s.queue("blogSpider", "http://www.baidu.com");

s.add(defaultPlan({
    name: "imgSpider",
    callback: function (err, current) {
        if (err) return current.retry(3);
        const $ = current.$;
        const newUrl = $("#next_page").url();
    }
}));
```


```javascript
const { Spider, jsonPipe } = require("nodespider");

const n = new Spider({
    rateLimit: 10
});

// create a pipe to save data
const jsonFile = n.add(jsonPipe("path/to/my.json"));

// create a plan
const planA = n.plan(function (err, current) {
    if (err) {
        // if throws error, retry the task of not more than 3 times.
        return n.retry(current, 3);
    }
    const $ = current.$;    // you can use jQ
    console.log($("title").text());

    // easily save the data extracted from web page
    n.save(jsonFile, {
        user: $("#user").text(),
        description: $("#desc").text(),
        date: "2017-7-7",
    });

    n.queue(planA, $("#next_page").href());
});

n.queue(planA, "https://www.nodejs.org");
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
const n = new Spider({
    maxConnections: 10, // the amount of simultaneous connections of not more than 10
});
```

**when it is an `object`**

Also, you can specify the maximun number of simultaneous connections for tasks with different type of plan.

```javascript
const n = new Spider({
    maxConnections: {
        "download": 5,
        "crawl": 15,    //  the maxConnections of tasks with plan "crawl" of not more than 15
    }
});
```

*NOTE:* If option `maxConnections` is an object, there will throw an error when add a new plan but its type has not existed in the option `maxConnections`.

# Method

## add(item)

add new plan or pipe to this spider instance, then you can use them by method `queue` or `save`.

| parameter | description | type |
| --- | --- | --- |
| item | planObject or pipeObject | object |

```javascript
// add a stream plan
const myStreamPlan = n.add(streamPlan( /*some opts*/ }));
n.queue(myStreamPlan, "http://www.youtube.com");

// add a csv-pipe
const csvFilePipe = n.add(csvPipe("path/to/my.csv", ["name", "age"]));
n.save(csvFilePipe, {   // save data to file my.csv
    name: "ben",
    age: 20
});
```

### plan generator

*Before crawl a web page, it is required to create a crawl plan.*

NodeSpider comes with two plan generator:
- `defaultPlan` The usual plan that expose response and body to developer. 
- `streamPlan`  The plan will expose the request stream to developer (power by request). If you need to operate on request stream, this is what you want.
- `downloadPlan` Very easy to download files from web.

**See [plan document](./doc/plan.md)**

### pipe generator

*To create a pipe can help you save data extracted from web page more easily.*

NodeSpider comes with three pipe generators:
- `jsonPipe`    create a pipe that save data as json file.
- `csvPipe` create a pipe that save data as csv file.
- `txtPipe` create a pipe that save data as txt file.

**See [pipe document](./doc/pipe.md)**

## plan(option)

Using method `plan` to create a default plan directly.

```javascript
const s = new Spider();

let plan1 = s.plan(option);
// equal to 
let plan2 = s.add(defaultPlan(option));
```

## queue(planKey, url, info)

add new task(s) with url and appointed plan to the queue.

| parameter | description | type |
| --- | ---- | --- |
| planKey | the key of task's appointed plan (returned by method `pipe` | symbol |
|  url | the task's url | string or array |
| info | (Optional)the task's special information object, that will be passed to plan's callback as `current` parameter's member | Object |

```javascript
const n = new Spider();
const myPlan = n.plan(function (err, current) {
    // some crawling rules
});

n.queue(myPlan, "https://en.wikipedia.org");
n.queue(myPlan, [
    "http://www.github.com",
    "https://stackoverflow.com/",
    "https://nodejs.org"
]);
```

## retry(currentTask, maxRetry, finalErrorCallback);

Retry a task. The task will be added to the queue again and wait.

| parameter | description | type |
| --- | --- | --- |
| currentTask | the task needs retry | object |
| maxRetry | (Optional)Maximum number of retries(how many times can this task be retried?). Default: `1` | number |
| finalErrorCallback | (Optional)the function when reach maximum number of retries to call | function |

```javascript
const myPlan = n.plan(function (err, current) {
    if (err) {
        return n.retry(current);
    }
});
const otherPlan = n.plan(function (err, current) {
    if (err) {
        // if there are an error, retry the task
        return n.retry(current, 10);
    }
});
const anotherPlan = n.plan(function (err, current) {
    if (err) {
        return n.retry(current, 5, () => {
            // when the number of retries reach the maximun, print the task's url
            console.log(current.url);   
        })
    }
});
```

## save(pipeKey, data)

save data to appointed pipe.

| parameter | description | type |
| --- | --- | --- |
| pipeKey | the key of appointed pipe(the return of method `pipe`) | symbol |
| data | data | object |

```javascript
// create the pipe
const myJson = n.add(jsonPipe("save_path/my.json"));
const planA = n.plan(function (err, current) {
    if (err) {
        return n.retry(current);
    }
    const $ = current.$;

    // save data to file "my.json" 
    n.save(myJson, {
        name: $("#name").text(),
        age: $("#age").text(),
        description: $("#desc").text(),
    });
})
```

## isExist(url)

Check if you have ever added the url

| parameter | description | type |
| --- | --- | --- |
| url | the url you need to check | string |

| return | description |
| --- | --- |
| boolean | if the url exists, return `true`

```javascript
n.queue(myPlan, "http://www.example.com");
n.isExist("http://www.example.com");    // True
```

## filter(urls)

filter() method creates a new array with all unique url elements that don't exist in the queue from provided array.

| parameter | type |
| --- | --- |
| urls | array (of string) |

| return |
| --- |
| array |

```javascript
n.queue(planA, "http://a.com");

var i = n.filter(["http://a.com", "http://b.com", "http://c.com"]);
console.log(i); // ["http://b.com", "http://c.com"]

var j = n.filter(["http://a.com", "http://aa.com", "http://aa.com"]);
console.log(j); // ["http://aa.com"]
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