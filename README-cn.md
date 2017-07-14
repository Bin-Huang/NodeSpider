# plan声明
考虑过使用 【2】 形式来声明plan，然而更加复杂、混乱，甚至不能真正地获得好处：比如按步骤更加有条理（不，更混乱）、按步骤更加稳定安全（不，很难设置可靠的报错）

```javascript
// 1. 使用这个
n.plan(planOpts);
// 2. 而不是
n.plan(requestOpts).do(callback).catch(handleError);
```

实际上，方法plan仅仅用于注册，具体设置的抓取计划需要自行设计，或者加载三方设计的计划包。比如
```javascript
n.plan(phantom({
    // some opts
}));
```
但在平时，则默认使用request计划

```javascript
n.plan((err, current) => {
    // some rules
});

n.plan({
    request: {
        cookies: "kfsjlkfs-fklsjdflksjd-sdlfsjdkfl",
        header: {
            "xxx-header": "kfjlksdj",
        },
    },
    pre: [preToUtf8, preLoadJq],
    input: inputStream; // input stream
    callback: (err, current) => {
        // some rules
    },
    info: {
        // some info
    }
});

const downloadPlan1 = n.plan({
    request: {
        // some request options
    },
    download: "path/to/save/folder",
    callback: (err, current) => {
        // some rules
    },
})

n.queue(downloadPlan1, "http://www.source.com/23.exe", "23.exe");
```

## planOptions
```javascript
n.plan(callback);
// 约等于
n.plan({
    request: {
        // default opts ????????
    },
    pre: [preToUtf8, preLoadJq],
    callback: callback,
});
```

```javascript
n.plan(planOptions);
// 约等于
n.plan(defaultPlan(planOptions));
```

设置中有 download 或 input，则为pipe特殊任务，current不包含body和response？

## pre
实际上预处理函数，即使普通的callback函数，只不过仅对current进行常规性处理并封装起来，而不能对实例进行修改

```
(error, current) => void | Promise<void>
```

## callback
不管是普通的抓取任务，还是pipe任务（input设置），或者下载任务（download设置），有必须有callback函数：
**错误失败或完成**时执行callback

current参数的成员参数不一定一样。

预处理函数本质是一个返回函数的函数。声明plan时，可在use数组中按顺序执行预处理函数。

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


```javascript
n.plan(plantom({

})).do(page => {

}).catch(e => {
    console.log(e);
})

n.plan(plantom({
    callback: (err, page) => {
        console.log(page);
    }
}));

n.plan(download({
    path: "sdjflsj",
    callback: ()  => {

    };
}));

n.plan(pipePlan({
    
}));

```