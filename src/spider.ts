// TODO: request 传入 opts，以及更多的 option，类似 proxy
// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// TODO: 更好的命名方式和注释，让外国人看懂
// TODO: 解决 save 方法保存json格式不好用的问题： 没有[],直接也没有逗号隔开
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替

import iconv = require("iconv-lite");
import request = require("request");
import cheerio = require("cheerio");
import fs = require("fs");
import url = require("url");
import List = require("./List");
import Table = require("./Table");
import charset = require("charset");

let defaultOption = {
    multiTasking: 40,
    jq: true,
    toUTF8: true,
    defaultRetry: 3,
};

enum TaskType {
    crawling,
    download,
};

// for spider.prototype.addTask
interface ITask {
    type: TaskType;
    url: string;
    callback: (err, currentTask, $) => void;

}

// for spider.prototype._TODOLIST item
interface ITaskItem extends ITask {
    info: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (err: IError) => void;
    }
}

// for callback err and spider.prototype.retry
interface IError {
    task: ITaskItem;
}
interface IStatus {
    _working: boolean;
    _currentMultiTask: number;
}
interface IOption {
    multiTasking: number;
    jq: boolean;
    toUTF8: boolean;
    defaultRetry: number;
}
// 简单上手的回掉函数 + 自由定制的事件驱动

class NodeSpider {
    protected _OPTION: IOption;
    protected _TODOLIST: List;
    protected _STATUS: IStatus;
    protected _TABLE: object;
    constructor(userOption = {}) {
        Object.assign(defaultOption, userOption);
        this._OPTION = defaultOption;

        this._STATUS = {
            _currentMultiTask: 0, // 当前正在进行的任务数量
            _working: false,
        };

        this._TODOLIST = new List();

        this._TABLE = {};
    }

    /**
     * 向爬虫的 todo-list 添加新的任务(不检查是否重复链接)
     * @param {ITask} task
     * @memberOf NodeSpider
     */
    public addTask(task: ITask) {
        (task as ITaskItem).info = {
            finalErrorCallback: null,
            maxRetry: null,
            retried: 0,
        }
        this._TODOLIST.add(task.url, task);

        // 为什么这么设计：
        // 当没有任务，爬虫却没有关闭（待机），添加新任务将让爬虫再次执行新任务
        if (this._STATUS._working) {
            this._performATask();
        }
    }

    /**
     * 检测链接是否已添加过
     * @param {any} url 待检查的链接
     * @returns {boolean}
     * @memberOf NodeSpider
     */
    public check(url) {
        return this._TODOLIST.check(url);
    }

    public start(url, callback) {
        // TODO: init check

        this.todo(url, callback);

        this._STATUS._working = true;
        this._performATask();
    }

    // 重写
    public retry(err: IError, maxRetry: number, finalErrorCallback: (err: IError) => void ) {
        maxRetry = maxRetry || this._OPTION.defaultRetry;

        if (! finalErrorCallback) {
            finalErrorCallback = (err) => {
                this.save("log", err);
            }
        }

        if (err.task.info.maxRetry === null) {
            err.task.info.maxRetry = maxRetry;    // 本次使用了一次重试机会，故 -1
            err.task.info.finalErrorCallback = finalErrorCallback;
        }

        if (err.task.info.maxRetry > err.task.info.retried) {
            err.task.info.retried += 1;
            this._TODOLIST.jump(err.task.url, err.task);
        } else {
            err.task.info.finalErrorCallback(err);
        }

    }
    protected _performATask() {
        if (this._STATUS._currentMultiTask >= this._OPTION.multiTasking) {
            return false; //当网络连接达到限制设置，直接停止此次工作
        }
        this._STATUS._currentMultiTask++;
        this._performATask();

        let task = this._TODOLIST.next();
        if (task) {
            this._doCrawlingTask(task);
        }

        this._STATUS._currentMultiTask--;
    }

    protected _doCrawlingTask(task) {
        this._asyncCrawling(task)
            .then(() => {
                this._STATUS._currentMultiTask--;
                this._performATask();
            })
            .catch((error) => {
                console.log(error);
                this._STATUS._currentMultiTask--;
                this._performATask();
                // TODO: 错误处理
            });
        return true;
    }

    _doDownloadTask(task) {
        this._asyncDownload(task)
            .then(() => {
                this._STATUS._currentMultiTask--;
                this._performATask();
            })
            .catch((error) => {
                this._STATUS._currentMultiTask--;
                console.log(error);
                this._performATask();
                // TODO: 错误处理
            });
        return true; // 如果有待重试下载的任务，执行并忽略下面步骤
    }

    protected async _asyncCrawling(task) {
        let [error, response, body] = await this.get(task.url, task.opts);
        let $;
        if (!error) {
            try {
                // 根据任务设置和全局设置，确定如何编码正文
                let toUTF8 = this._OPTION.toUTF8;
                if (task.opts && task.opts.toUTF8 !== undefined) {
                    toUTF8 = task.opts.toUTF8;
                }
                if (toUTF8) {
                    let cha = charset(response.headers, body) || 'utf8';
                    body = iconv.decode(body, cha);
                }

                // 根据任务设置和全局设置，确定是否加载jQ
                if (task.opts && task.opts.jq !== undefined) {
                    $ = this._loadJQ(body, task.url);
                } else if (this._OPTION.jq) {
                    $ = this._loadJQ(body, task.url)
                }

            } catch (err) {
                error = err;
            }
        }

        // 更多信息的错误 for spider.prototype.retry
        if (error) {
            error.task = task;
        }

        let current = {
            url: task.url,
            opts: task.opts,
            callback: task.callback,
            response: response,
            body: body,
        };
        task.callback(error, current, $);
    }

    protected async _asyncDownload(url, opts, path) {
        return new Promise(function (resolve, reject) {
            let download = request(url);
            let write = fs.createWriteStream(path);
            // TODO: 本地空间是否足够 ?
            download.on('error', function (error) {
                reject(error);
            });
            write.on('error', function (error) {
                reject(error);
            });
            download.pipe(write);
            write.on('finish', function () {
                resolve();
            });
        });
    }

    /**
     * 发送网络请求
     */
    get(url, opts) {
        // TODO: 根据opts，更先进的请求
        return new Promise(function (resolve, reject) {
            request({
                url: url,
                method: 'GET',
                encoding: null
            }, function (error, response, body) {
                resolve([error, response, body]);
            });
        });
    }

    /**
     * 根据body加载jQuery对象，并根据当前url扩展jQuery对象path方法，以此获得属性的绝对路径
     * @param {string} body 正文
     * @param {string} current_url
     * @returns {object}
     * @memberOf NodeSpider
     */
    protected _loadJQ(body, current_url) {
        let $;
        $ = cheerio.load(body);

        /**
         * 扩充 jQ 方法：根据节点的 href 获得有效的 url 绝对路径。返回值为字符串或数组
         * 例子： $('a').url()
         * 类似 'javascirpt: void(0)' 不会有返回
         * 类似 '#key' 的锚链接等效于当前链接
         */ 
        $.fn.url = function() {
            let result = [];
            $(this).each(function() {
                let new_url = $(this).attr('href');

                // 如果是类似 'javascirpt: void(0)' 的 js 代码，直接跳过
                if (/^javascript/.test(new_url)) {
                    return false;
                }

                // 如果是锚，等效与当前 url 路径
                if (new_url[0] === '#') {
                    return result.push(current_url);
                }

                // 如果是相对路径，补全路径为绝对路径
                if (new_url && !/^https?:\/\//.test(new_url)) {
                    new_url = url.resolve(current_url, new_url);
                }
                result.push(new_url);
            });
            if (result.length < 2) {
                [result] = result;
            }
            return result;
        };

        return $;
    }


    todo(item, opts, callback) {
        //当调用todo时，opts参数和callback参数位置可以颠倒，并让opts为可选参数
        if (typeof opts === 'function') {
            let x = opts;
            opts = callback;
            callback = x;
        }

        // 参数检测
        // TODO:
        if (typeof callback !== 'function') {
            throw new Error('todo need a function-type callback');
        }

        // TODO Warn
        // 如果是 javascirpt: void(0) https://www.zhihu.com/question/20626694
        // 如果是 undefined

        if (!item) {
            return false;
        } else if (typeof item === 'string') { //如果item是一个字符串
            return this._TODOLIST.add({
                url: item,
                opts,
                callback,
                info: {
                    maxRetry_num: null,
                    final_callback: null
                }
            });
        } else if (Array.isArray(item)) {
            for (let url of item) {
                this.todo(url, opts, callback);
            }
        } else if (typeof item === 'object') { // 当item是一个jQ对象
            let that = this;
            item.attr('href', function (index, new_url) {
                // 类似 '#header 1'这种锚链，只会导致加载重复内容，故直接跳过，不添加到待爬取列表
                if (new_url && new_url[0] === '#') {
                    return false;
                }
                // 如果是类似 'javascirpt: void(0)' 的 js 代码，直接跳过，不添加到抓取列表
                if (/^javascript/.test(new_url)) {
                    return false;
                }

                // TODO: 越来越多站点使用ui框架，链接href中常混杂 ${this._state} 类似这样的代码

                // 自动补全 相对路径 为 绝对路径
                if (new_url && !/^https?:\/\//.test(new_url)) {
                    new_url = url.resolve(item.current_url, new_url);
                }
                that.todo(new_url, opts, callback);
            });
        }
        return true;
    }

    todoAll(new_url, opts, callback) {
        //当调用todo时，opts参数和callback参数位置可以颠倒
        if (typeof opts === 'function') {
            let x = opts;
            opts = callback;
            callback = x;
        }

    }

    save(item, data) {
        //TODO: 如果item为对象，则为数据库。通过用户在 item 中自定义的标识符来判断是否已存在
        // 暂时只完成保存到文本的功能，所以默认 item 为文件路径字符串
        if (this._TABLE[item]) {
            this._TABLE[item].add(data);
            return true;
        }
        //如果不存在，则新建一个table实例
        let header = Object.keys(data);
        // 根据路径中的文件后缀名，决定新建哪种table
        if (/.txt$/.test(item)) {
            this._TABLE[item] = new TxtTable(item, header);
            this._TABLE[item].add(data);
        }
        else {
            this._TABLE[item] = new JsonTable(item, header);
            this._TABLE[item].add(data);
        }
    }

    /**
     *
     */
    download(url, opts, path = this._OPTION.download_path, errorCallback) {
        // 让opts变成可选参数
        if (typeof opts === 'string') {
            let x = opts;
            opts = path;
            path = x;
        }

        // TODO: jq选择对象、url数组、相对路径

        //如果是其他协议（比如FTP）

        this._download_list.add({
            url,
            opts,
            callback: null,
            info: {
                path
            }
        });
    }

}

export = NodeSpider;
