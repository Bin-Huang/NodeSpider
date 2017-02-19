// const EventEmitter = require("events");
const iconv = require('iconv-lite');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const mkdirp = require('mkdirp');
const url = require('url');

let default_setting = {
    max_process: 20,
    decode: false,
    jq: true,
};

class Spider {
    constructor(user_setting = {}) {
        Object.assign(user_setting, default_setting);
        this._setting = user_setting;

        this._status = {
            process_num: 0, //当前正在进行的任务数量
        };

        this._todo_list = new List();
        this._download_list = new List();

        this._todo_retry_list = new List();
        this._download_retry_list = new List();


        // this.log = new Pool(this.setting.log_frequency, this.save_log);

        // this.table = {};

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
        if (this._status.process_num >= this._setting.max_process) {
            return false; //当网络连接达到限制设置，直接停止此次工作
        }
        this._status.process_num++;
        this._taskManager();

        // 不同待完成任务拥有不同优先级： 下载重试任务 > 抓取重试任务 > 下载任务 > 抓取任务
        let task = this._download_retry_list.get();
        if (task) return this._doDownloadTask(task);
        // TODO: 将 各种任务函数整合在一起

        task = this._todo_retry_list.get();
        if (task) return this._doCaptureTask(task);

        task = this._download_list.get();
        if (task) return this._doDownloadTask(task);

        task = this._todo_list.get();
        if (task) return this._doCaptureTask(task);

    }

    _doCaptureTask(task) {
        // 如果 重试次数 达到 限制
        if (task.info.retries === 0) {
            task.info.retry_callback();
            return false;
        }

        this._asyncCapture(task.url, task.opts, task.callback)
            .then(() => {
                this._status.is_capturing = false; // 抓取工作已经完成
                this._status.process_num--;
                this._taskManager();
            })
            .catch((error) => {
                console.log(error);
                this._status.is_capturing = false; // 抓取工作已经完成
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

    // TODO: 用 Promise 替代 async 和 await ? 因为用的不多
    async _asyncCapture(url, opts, callback) {
        let [error, response, body] = await this._request(url, opts);
        let $;
        if (!error) {
            try {
                body = body.toString();
                // 根据任务设置和全局设置，确定如何编码正文
                let decode = this._setting.decode;
                if (opts && opts.decode) {
                    decode = opts.decode;
                }
                if (decode) body = this.decode(body, decode);

                // 根据任务设置和全局设置，确定是否加载jQ
                if (opts && opts.jq !== undefined) {
                    $ = this.loadJq(body, url);
                } else if (this._setting.jq) {
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
    _request(url, opts) {
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


    // 根据rule转码规则对body进行转码，如果rule参数不存在，返回false
    decode(body, rule) {
        if (!rule) return false;
        let result;
        //TODO
        try {
            result = iconv.decode(body, rule);
        } catch (e) {

        }
        return result;
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
        }
        else if (typeof item === 'string') {    //如果item是一个字符串
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
        } else if (typeof item === 'object') {  // 当item是一个jQ对象
            // let href = url.parse(item.current_url);
            // // 如果出现 路径为类似 '/a.html/' 的情况，删除最后那个 '/'，以免接下来出错
            // if (href.pathname.length > 1 && href.pathname[href.pathname.length - 1] === '/') {
            //     href.pathname = href.pathname.slice(0, href.pathname.length - 1);
            // }
            // href.directory_path = href.pathname.slice(0, href.pathname.lastIndexOf('/'));   // 链接路径的上级路径
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

    /**
     *
     */
    download(url, opts, path = this._setting.download_path, errorCallback) {
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
        if (this._setting.log_more || isErr) {
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

    push(data, destination) {
        if (!destination) {
            destination = 'data'; //如果不指定table，默认推送到data
        }
        if (!this.table[destination]) { //如果目标table不存在，新建它
            this.table[destination] = new Pool(5, destination + '.txt');
        }
        this.table[destination].push(data);
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


/**
 * 链环（链节）类
 */
class Link {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}
/**
 * 可遍历的链表类（我叫它纸巾类）
 */
class Chain {
    constructor() {
        this.head = null;
        this.end = this.head;
    }
    // 在尾部增加新的链环
    add(value) {
        let new_link = new Link(value);
        if (this.head) {
            this.end.next = new_link;
            this.end = new_link;
        } else {
            this.head = this.end = new_link;
        }
    }
    // 返回头链环的值，并抛弃头链环（让第二个链环成为头链环）（你可以理解为抽面巾纸）
    next() {
        let current = this.head;
        if (!current) return null;
        else {
            this.head = this.head.next; //丢弃头链环，回收已遍历链节的内存
            return current.value;
        }
    }
}
/**
 * 清单类 for todo_list、download_list
 */
class List {
    constructor() {
        this.store = new Set();
        this.data = new Chain(); //待完成的爬取任务的队列
    }
    // 添加新的爬取任务。如果链接是添加过的，自动取消
    add({
        url,
        opts,
        callback,
        info
    }) {
        if (this.store.has(url)) return false; //如果已经存在，返回 false
        this.store.add(url);
        this.data.add({
            url,
            opts,
            callback,
            info
        });
        return true;
    }
    // 获得新的爬取任务
    get() {
        return this.data.next();
    }
}


module.exports = Spider;