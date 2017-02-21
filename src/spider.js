// const EventEmitter = require("events");
const iconv = require('iconv-lite');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const url = require('url');
const List = require('./List');
const {TxtTable, JsonTable} = require('./Table');
const charset = require('charset');

let default_option = {
    max_process: 50,
    jq: true,
    toUTF8: false,
};

// 简单上手的回掉函数 + 自由定制的事件驱动

class Spider {
    constructor(user_option = {}) {
        Object.assign(default_option, user_option);
        this._option = default_option;

        this._status = {
            process_num: 0, //当前正在进行的任务数量
        };

        this._todo_list = new List();
        this._download_list = new List();

        // TODO: 使用链表的插队机制，解决重试问题，不需要再有更多的list
        this._todo_retry_list = new List();
        this._download_retry_list = new List();

        this._table = {};
    }


    start(urls, callback) {
        if (callback === 'undefined') {
            console.error('callback is undefined');
            return;
        }
        //参数初始化检测，错误则全面停止爬取工作

        this.todo(urls, callback);

        this._taskManager();
    }

    _taskManager() {
        if (this._status.process_num >= this._option.max_process) {
            return false; //当网络连接达到限制设置，直接停止此次工作
        }
        this._status.process_num++;
        this._taskManager();

        // 不同待完成任务拥有不同优先级： 下载重试任务 > 抓取重试任务 > 下载任务 > 抓取任务
        let task = this._download_retry_list.get();
        if (task) return this._doDownloadTask(task);

        task = this._todo_retry_list.get();
        if (task) return this._doCaptureTask(task);

        task = this._download_list.get();
        if (task) return this._doDownloadTask(task);

        task = this._todo_list.get();
        if (task) return this._doCaptureTask(task);

        this._status.process_num--;
    }

    _doCaptureTask(task) {
        // 如果 重试次数 达到 限制
        if (task.info.retries === 0) {
            task.info.retry_callback();
            return false;
        }

        this._asyncCapture(task.url, task.opts, task.callback)
            .then(() => {
                this._status.process_num--;
                this._taskManager();
            })
            .catch((error) => {
                console.log(error);
                this._status.process_num--;
                this._taskManager();
                // TODO: 错误处理
            });
        return true;
    }

    _doDownloadTask(task) {
        let {
            url,
            opts,
            path,
            info
        } = task;
        // 如果 重试次数 达到 限制
        if (info.retries === 0) {
            info.retry_callback();
            return false;
        }
        this._asyncDownload(url, opts, path)
            .then(() => {
                this._status.process_num--;
                this._taskManager();
            })
            .catch((error) => {
                this._status.process_num--;
                console.log(error);
                this._taskManager();
                // TODO: 错误处理
            });
        return true; // 如果有待重试下载的任务，执行并忽略下面步骤
    }

    async _asyncCapture(url, opts, callback) {
        let [error, response, body] = await this.get(url, opts);
        let $;
        if (!error) {
            try {
                // 根据任务设置和全局设置，确定如何编码正文
                let toUTF8 = this._option.toUTF8;
                if (opts && opts.toUTF8 !== undefined) {
                    toUTF8 = opts.toUTF8;
                }
                if (toUTF8) {
                    let cha = charset(response.headers, body) || 'utf8';
                    body = iconv.decode(body, cha);
                }

                // 根据任务设置和全局设置，确定是否加载jQ
                if (opts && opts.jq !== undefined) {
                    $ = this.loadJq(body, url);
                } else if (this._option.jq) {
                    $ = this.loadJq(body, url)
                }

            } catch (err) {
                error = err;
            }
        }

        let current = {
            url: url,
            option: opts,
            callback: callback,
            response: response,
            body: body,
        };
        callback(error, current, $);
    }

    async _asyncDownload(url, opts, path) {
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
     * 
     * @param {string} body 正文
     * @param {string} current_url
     * @returns {object}
     * 
     * @memberOf Spider
     */
    loadJq(body, current_url) {
        let $;
        try {
            $ = cheerio.load(body);
            $.fn.current_url = current_url; // 扩展jQ，使其可以访问当前链接值，为 todo 相对路径补全工作服务
        } catch (e) {
            console.log(e);
        }
        return $;
    }

    retry(num, callback) {

    }

    log(log) {}

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

        let info = {
            retries: null
        };

        // TODO Warn
        // 如果是 javascirpt: void(0) https://www.zhihu.com/question/20626694
        // 如果是 undefined

        if (!item) {
            return false;
        } else if (typeof item === 'string') { //如果item是一个字符串
            return this._todo_list.add({
                url: item,
                opts,
                callback,
                info
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
        if (this._table[item]) {
            this._table[item].add(data);
            return true;
        }
        //如果不存在，则新建一个table实例
        let header = Object.keys(data);
        // 根据路径中的文件后缀名，决定新建哪种table
        if (/.txt$/.test(item)) {
            this._table[item] = new TxtTable(item, header);
            this._table[item].add(data);
        }
        else {
            this._table[item] = new JsonTable(item, header);
            this._table[item].add(data);
        }
    }

    /**
     *
     */
    download(url, opts, path = this._option.download_path, errorCallback) {
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

    pushLog(info, isErr) {
        if (this._option.log_more || isErr) {
            var news = {
                time: Date(),
                url: info.url,
                type: info.type,
                suggest: info.suggest,
                detail: info.detail
            };
            this.log.push(news);
        }
    }

    initCheckout() {
        var result = true;
        if (typeof this.todo_list !== "string" && !Array.isArray(this.todo_list)) {
            console.error("初始化参数出错，您没有正确输入链接字符串或链接字符串的数组");
            result = false;
        }
        if (typeof this.callback !== "function") {
            console.error("初始化参数出错: callback格式不正确");
            result = false;
        }
        return result;
    }

}


/**
 * 资源池生成函数 for log、data_table
 * @param {number} max     最大容量。达到时将触发release函数：清空内容并写入txt
 * @param {strint} save_path 将写入数据的txt路径
 * @param {array} header 表头数组
 */
class Pool {
    constructor(max, save_path, header) {
        this.data = [];
        this.max = max;
        this.file = false;
        this.path = save_path || new Date().getTime() + '.txt';
        this.header = header || false; //表头
    }

    release() {
        var d = this.data; //读取并清空数据池
        this.data = [];
        if (d === []) {
            return;
        } //如果无新数据，停止下面操作

        var i;
        if (!this.header) { //如果没有表头，新建
            this.header = [];
            for (i in d[0]) {
                this.header.push(i); //将第一个数据对象的所有属性名作为表头关键字
            }
        }

        var txt = '';
        if (!this.file) { //第一次release？新建写入流，并写入表头
            this.file = fs.createWriteStream(this.path);
            txt = '';
            for (i = 0; i < this.header.length; i++) {
                txt += this.header[i] + '\t';
            }
            txt += '\n';
            this.file.write(txt);
        }

        //根据表头将新数据写入本地文本
        txt = '';
        for (i = 0; i < d.length; i++) {
            for (var j = 0; j < this.header.length; j++) {
                txt += d[i][this.header[j]] + '\t';
            }
            txt += '\n';
        }
        this.file.write(txt);
    }

    push(new_data) {
        if (this.max && this.max <= this.data.length) {
            return false;
        } else {
            this.data.push(new_data);
        }
        if (this.data.length >= this.max) {
            this.release();
        }
    }

    pop() {
        var d = this.data[0];
        this.data.shift();
        return d;
    }

}

/**
 * 表头元素灵活可变的数据表格
 */
class Tabulation {
    constructor() {
        this.store = {};
        this.colnum = 0; //列数
        this.rownum = 0; //行数
    }
    /**
     * 以参数new_data的属性名为表头关键字，将对应属性值插入到表格中
     * 特点： 1. 允许遗漏某元素的数据（自动设为 null）
     *       2. 允许插入新的表头元素及对应值（之前项的对应值设为 null）
     */
    insert(new_data) {
        //  根据表头信息，新建一个各项表头元素值为空的数据对象data
        let data = {};
        for (let i of Object.keys(this.store)) {
            data[i] = null;
        }
        // 使用带插入的信息对象new_data覆盖（并扩充）data对象
        Object.assign(data, new_data);
        // 将data中信息写入store
        for (let heading in data) {
            //  如果新数据中存在新的表头元素，则新建它
            if (!this.store[heading]) {
                this.store[heading] = new Array(this.rownum).fill(null);
                this.colnum++;
            }
            this.store[heading].push(data[heading]);
        }
        this.rownum++;
        return this;
    }
    get() {
        return this.store;
    }
    clear() {
        for (var i in this.store) {
            this.store[i] = [];
        }
        this.rownum = 0;
    }
}




module.exports = Spider;