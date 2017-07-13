```javascript
// --------------------------------------------------------------------
const planA = n.plan((err, current) => {
    if (err) {
        console.log(err);
        return n.retry(current, 3);
    }
    const $ = current.$;
    console.log($("title").text());
})
const planA = n.plan((current) => {
    const $ = current.$;
    console.log($("title").text());
}).catch((err, current) => {
    console.log(err);
    n.retry(current, 3);
})
// --------------------------------------------------------------------
const planB = n.plan({
    header: {
        "xx-ksdfj": "klsdfjskdlj",
    },
    cookies: "klsjflksdjflsjfsjfklsjd",
}).do(preToUtf8, preLoadJq, (current) => {
    const $ = current.$;
    console.log($("title").text());
}).catch((e, current) => {
    console.log(e);
})

const planB = n.plan({
    request: {
        cookies: "lkfjsd323kn43nmi29ehuduf",
        header: {
            "xxx-sdk": "kfjenvnvnnnnnn",
        },
    },
    rule: [preToUtf8, preLoadJq, (err, current) => {
        if (err) {
            return n.retry(current, 3);
        }
        const $ = current.$;
        console.log($("titile").text());
    }],
})

// --------------------------------------------------------------------
const planC = n.plan(requestOpts)
    .do(preToUtf8, preLoadJq, myFun)
    .catch(handleError);

const planC = n.plan({
    request: requestOpts,
    rule: [preToUtf8, preLoadJq, myFun],
    handleError: handleError,
});
// --------------------------------------------------------------------
const planD = n.plan({
    header: {
        "klsdfjlksdj": "ksdjflksdjf"
    }
}).pipe(fs.createWriteStream("path/to/my.json"))
.catch((err, current) => {
    console.log(err);
    n.retry(current, 3, () => {
        console.log(current);
    });
});

const planD = n.plan({
    type: "pipe",
    request: {
        header: {
            "slkdfjsklfjs": "fjlsjxmcnvierurh",
        },
    },
    pipe: fs.createWriteStream("path/to/my.json"),
    handleError: (err, current) => {
        console.log(err);
        n.retry(current, 3, () => {
            console.log(current);
        });
    }
})
// --------------------------------------------------------------------
const planE = n.plan()
    .download("path/to/myFolder")
    .catch((err, current) => {
        console.log(err);
    });

const planE = n.plan({
    type: "download",
    path: "path/to/myFolder",
    handleError: (err, current) => {
        console.log(err);
    }
})
```
20 lines of code to create a web crawler as a geek.

# 预处理 preprocessing
## 使用
```javascript
const myPlan = n.plan({
    use: [
        NodeSpider.decode(),
        NodeSpider.loadJQ(),
        loadPlantForm({
            // some opts;
        }),
    ],
    rule: (err, current) => {
        // ...
    }
})
```
预处理函数本质是一个返回函数的函数。声明plan时，可在use数组中按顺序执行预处理函数。

## 协议
所有预处理函数执行后，返回的函数必须满足以下要求：
- [接受参数currentTask]必须接受参数: [currentTask]
- [返回参数currentTask]
- [若有异步, 必须封装到promise并返回，并以resolve传递currentTask，并以reject传递可能的error]

# 错误处理的思想
传给用户是为了让用户retry重试，或者在爬取策略中自行调试。
框架本身的问题直接报错退出，所有任务相关的全部传递给用户

```javascript
let s = new NodeSpider({
    toUtf8: true,   // Convert body to UTF8
    // or more...
});

s.start('https://en.wikipedia.org/wiki/Main_Page', function (err, currentTask, $) {
    if (err) {
        return s.retry(currentTask);   //retry when there are a error
    }

    // 你可以使用 jQuery 来提取网页内容
    console.log($('title').text()); 

    // 轻松获得超链接的绝对路径
    console.log($('a#id').url());

    // 轻松添加新的链接到待抓取列表，并自动排除重复链接
    $('a').todo();

    // 保存内容到本地
    s.save('mydata.json', {
        title: $('title').text(),
        sumary: $('p').text(),
        picture_url: $('img').attr('href')
    });

    // And more interesting thing...
});
```

```javascript
const plan1 = n.plan((err, current) => {
    if (err) {
        console.log(err);
        return n.retry(err);
    }
    const $ = current.$;
    console.log($("title").text());
});

const plan1 = n.plan({
    request: {
        cookies: "sdkfj-sdfklsj-sdfklsj",
        header: {
            "xxx-header": "ksdfjskld-sdkfjsl",
        },
    },
    pre: [preToUtf8, preLoadJq],
    callback: (err, current) => {
        if (err) {
            console.log(err);
            return n.retry(err);
        }
        const $ = current.$;
        console.log($("title").text());
    },
});


const plan2 = n.downloadPlan("path/to/my.json", (err, current) => {
    if (err) {
        console.log(err);
        return n.retry(current);
    }
    console.log(`[done] download task: ${current.url}`);
});

const plan2 = n.downloadPlan({
    path: "path/to/myjson",
    callback: (err, current) => {
        if (err) {
            console.log(err);
            return n.retry(current);
        }
        console.log(`[done] download task: ${current.url}`);
    },
});

const plan3 = n.pipePlan(inputStream, (err, current) => {
    
});
```


# Installation and import

```
npm install nodespider
```

```javascript
// in your .js file
const NodeSpider = require("NodeSpider");
```

# Initialization

## new NodeSpider( [option] )
create an instance of NodeSpider

| param | required  | type  | description   |
| :---:   | :---:   | :---:   | :---   |
| option    | no  | object    | option  |

**option:**

- **jq**    (default: `true`) whether to load jQ
- **preToUtf8** (default: `true`)   convert body to utf8
- **multiTasking**  (default: `20`) max multitasking number
- **multiDownload** (default: `2`)  max download multitasking number
- **defaultDownloadPath**   (default: `""`) default path for download file
- **defaultRetry**  (default: `3`)  default retry count

```javascript
var mySpider = new NodeSpider();

var anotherSpider = new NodeSpider({
    preToUtf8: true,
    jq: false
    // or more...
});
```

# Method

## NodeSpider.prototype.start(startUrl, callback)

Start web crawling with startUrl(s)

| param | required  | type  | description   |
| :---:   | :---:   | :---:   | :---   |
| startUrl    | yes  | string    | the url to start with. It can be a string or an array of string. |
| callback  | yes   | function  | the function about what you want to do after received response.   |

```javascript
NodeSpider.start('http://www.google.com', function (error, currentTask, $) {
    if (error) {
        return console.log(error);
    }

    // get information from currentTask
    console.log(currentTask.url);
    console.log(currentTask.response);

    // Use the $ to operate/select Elements
    console.log($('title').text());
});
```

## NodeSpider.prototype.todo(item, [opts,] callback)

Add new web-crawl task to spider's todo-list. The task will be executed automatically.

**item**    type: string, array or jQuery

The url(s) you want to crawl. It can be a url `string`, array of urls, and jQuery element object that possess `href` attribute.

If it is jQuery element object, nodespider will convert relative url into absolute url automatically, never wrong about the relative url in page.

```javascript
s.todo('http://www.google.com', yourCallback);
s.todo(['http://www.wiki.com', 'http://www.amazon.con'], yourCallback);

function yourCallback(err, current, $) {
    s.todo($('a'), yourCallback);
}
```

**opts** type: object
*optional* Special option for this task
```
var opts = {
    jq: true
    //...
}
```

**callback** type: function

the callback function for the task, about how to scrape the web

```javascript
function (err, current, $) {
    // your code
}
```

## NodeSpider.prototype.save(path, data)
Method save help you to save/collect data from website to local easier.

**path** type: string

The path to save data. 
If path or file does not exist, nodespider will create it automatically.


Different file extension lead to defferent mode to save data.
```javascript
var s = new NodeSpider();
var data = {type: 'cat', color: 'white'};

// save as json
s.save('./myFolder/myData.json', data); 

// save as txt, using '\t','\n' as separator.
// if you copy all to Excel, you will like that :)
s.save('./myFolder/myData.txt', data); 

// if there are no file extension, save as json by default
s.save('./myFolder/myData', data);
```

**data** type: object

Data you want to save/collect.

```javascript
s.save('student.json', {
    name: 'ben',
    age: 'A'  // score 不在 header, 所以 'A' 不会被保存
});
```

## NodeSpider.prototype.retry(err[, max_retry_num[, final_callback]])
遇到不可避免的错误，使用 retry 重试本次抓取任务

```javascript
var s = new NodeSpider();
s.start('http://some_url_maybe_wrong', function(err, current, $) {
    if (err) {
        s.retry(err);
        // or
        // s.retry(err, 3)
        // or
        // s.retry(err, 3, function (err) {
        //  s.save('log', err);
        // }
    }
})
```
**err** type: {Error}

直接将被传入 callback 抓取函数的error，作为 retry 方法的参数

**max_retry_num** type: {number}

可选。设置最大的重试次数，默认为 3。

**final_callback** type: {function}

可选。设置达到最大重试次数后所需要执行的函数。默认等价于：`function (err) {this.save('log', err)}`