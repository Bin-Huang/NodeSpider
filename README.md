
20 lines of code to build a web crawler as a geek.

Easier and more efficient to crawl a website and extract data, NodeSpider can save your time.

```javascript
let s = new NodeSpider({
    preToUtf8: true,   // Convert body to UTF8
    // or more...
});

s.start('https://en.wikipedia.org/wiki/Main_Page', function (err, currentTask, $) {
    if (err) {
        return s.retry(currentTask);   //retry when there are a error
    }

    // Yes, you can use jQuery 
    console.log($('title').text()); 

    // Add new task to NodeSpider's todo-list.
    s.todo($('#next_page').attr('href'), current.callback);

    // You can also write like that:
    // Before add to todo-list, convert relative url into absolute if necessary
    s.todo($('#pre_page'), current.callback);

    // Easy to save data
    s.save('./mydata.json', {
        title: $('title').text(),
        sumary: $('p').text(),
        picture_url: $('img').attr('href')
    });

    // And more interesting thing...
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
    age: 20
});
```

## NodeSpider.prototype.retry(task [, max_retry_num [, final_err_callback]])

Method `retry` can help you to retry failed task.

```javascript
var s = new NodeSpider();
s.start('http://some_url_maybe_wrong', function(err, current, $) {
    if (err) {
        s.retry(err);
        // as
        // s.retry(err, 3);
        // as
        // s.retry(err, 3, function (err) {
        //    s.save('log', err);
        // };
    }
})
```
**err** type: {Error}

the error passed into the callback.

**max_retry_num** type: {number}

*optional* Number of retries if the request fails. Default `3`

**final_callback** type: {function}

*optional* the function to execute when a task failure more than max_retry_num.
There are only parameter `error`.

Default: save error as data to log, equal to `function (err){s.save('log', err)}`.


# callback

the function about what you want to do after received response and body. 

```javascript
function myCallback(error, currentTask, $) {
    // some code
}

mySpider.start("http://www.google.com", myCallback);
mySpider.addTask({
    url: "http://www.github.com",
    callback: myCallback
})
```

There are three parameters: `error`, `currentTask` and `$`.

- **error** 

    If there are not error in the task, it is `null`

- **currentTask**

    In NodeSpider, all tasks will be executed Asynchronously. But you can get information about the current task through the 'currentTask' parameter in callback.
    - `currentTask.url` current task's url
    - `currentTask.callback` current task's callback
    - `currentTask.response` current response from website
    - ....

- **$**

    You can use the `$` to select element just like jQuery in browser. It can help you to extract urls and data more easily.
    ```javascript
    $('a').text()
    ```
    And, there are some new method

    - $.fn.url

    - $.fn.todo

    - $.fn.download