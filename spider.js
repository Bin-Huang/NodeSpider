var EventEmitter = require('events');
var iconv = require('iconv-lite');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var default_options = {
    debug: false,

    retries: 2,
    max_connection: 20,

    save_log: 'log.txt',
    log_frequency: 10,
    log_more: false,

    // table: {
    //     default: 
    //     'data': {
    //         save_as_txt: 'data.txt',
    //     },
    // },

    sql: {
        host: '127.0.0.1',
        db: 'school',
        user: 'ben',
        password: '123123123',
    },

    table_default_max: 5,

    decode: false,
    jQ: true,

    save_as_txt: false,
    push_to_db: false
};

function Spider(todo_list, opts, callback) {
    this.todo_list = typeof todo_list === 'string' ? [todo_list] : todo_list;

    //让opts变成可选参数，且opts和callback位置可以互换，更加灵活
    if (callback) { //当用户输入了opts参数
        //opts设置覆盖
        var o;
        var i;
        if (typeof opts === 'object') { //当参数opts位置在callback前
            o = default_options;
            for (i in opts) { //使用参数opts覆盖默认设置
                o[i] = opts[i];
            }
            this.opts = o;
            this.callback = callback;
        } else if (typeof callback === 'object') { //当参数opts在callback后面
            o = default_options;
            for (i in callback) {
                o[i] = callback[i];
            }
            this.opts = o;
            this.callback = opts;
        }
    } else { //当用户没有输入opts参数
        this.opts = default_options;
        this.callback = opts;
    }

    this.done = []; //已完成的链接
    this.fail_todo_list = []; //失败的链接
    this.nervus = new EventEmitter();
    this.conn_num = 0; //当前连接数
    this.stop_add_todo = false;

    this.log = new Pool(this.opts.log_frequency, this.save_log);
    this.pushToLog = this.log.push;

    this.table = {
        'data': new Pool(5, 'data.txt'),
    };

    this.progress = {
        Updata: progressUpdata,
        init: progressInit,
        show: progressShow
    };
    //test
    this.start = function() {
        console.log(this);
    };
}

//事件监听初始化、各参数、选项检验、启动工作
Spider.prototype.start = function start() {
    var init_result = this.initCheckout();
    if (!init_result) {
        return;
    }

    if (this.opts.debug === false) {

    }

    //事件监听
    var that = this;
    that.nervus.on('crawl', function() {
        if (that.todo_list.length > 0) {
            var next_url = that.todo_list[0];
            that.todo_list.shift();
            that.crawl(next_url);
        }
    });
    that.nervus.on('next', function() {
        // if (that.conn_num > 0) {
        // that.conn_num--; //当conn大于0,说明是某次爬取成功触发的next事件，此时已完成一次连接.
        // }
        if (that.conn_num < that.opts.max_connection) {
            if (that.todo_list.length <= 0 && that.opts.retries > 0) {
                that.todo_list = that.fail_todo_list;
                that.fail_todo_list = [];
                that.opts.retries--;
            }
            if (that.todo_list.length <= 0 && that.conn_num <= 0) {
                that.nervus.emit('finish');
                return true;
            }
            that.nervus.emit('crawl');
        }
    });
    that.nervus.on('back', function() {
        that.conn_num--;
        that.nervus.emit('next');
    });
    that.nervus.on('finish', function() {
        console.log('finish');
        console.log(that.log);
    });

    that.nervus.emit('crawl');
};

Spider.prototype.crawl = function crawl(url) {
    this.conn_num++;
    var that = this;
    this.nervus.emit('next');
    request({
        url: url,
        method: 'GET',
        encoding: null
    }, function(err, res, body) {
        if (err) {
            that.showProgress('Failed', url);
            if (that.opts.debug) { //如果是debug模式，直接报错并退出当前爬取操作
                console.log('========================================');
                console.log('网络request出错 [' + url + '] 建议：检查网络和url参数');
                console.error(err);
                console.log('========================================');
            } else { //如果不是debug模式，错误信息推送到Log，并继续
                that.fail_todo_list.push(url);
                that.pushLog({ type: 'request_failed', url: url, warn: '访问失败', detail: err });
                that.nervus.emit('back');
            }
            return;
        }
        if (that.opts.decode) {
            body = iconv.decode(body, that.opts.decode);
        }
        var result = {
            err: err,
            body: body,
            res: res,
            url: url
        };
        try {
            if (that.opts.jQ) {
                var $ = cheerio.load(body, { decodeEntities: false });
                that.callback($, result);
            } else {
                that.callback(result);
            }
        } catch (e) {
            that.showProgress('Failed', url);
            if (that.opts.debug) {
                console.log('========================================');
                console.log('抓取内容出错 建议：检查callback函数，以及返回正文');
                console.log(e);
                console.log('========================================');
                return;
            } else {
                that.fail_todo_list.push(url);
                that.pushLog({ type: 'callback_failed', url: url, warn: 'callback报错', detail: e });
                that.nervus.emit('back');
                return;
            }
        }
        that.showProgress('Successful', url);
        that.done.push(url);
        that.nervus.emit('back');
    });
};

/**
 * 添加待抓取链接
 * @param {string} new_todo_list 待抓取的url
 */
Spider.prototype.todo = function todo(new_todo_list) {
    if (this.stop_add_todo) {
        return;
    }
    var x = this.todo_list.indexOf(new_todo_list);
    var y = this.done.indexOf(new_todo_list);
    var z = this.fail_todo_list.indexOf(new_todo_list);
    //如果这个链接不存在于待抓取列表、抓取成功列表、抓取失败列表，则添加到待抓取列表
    if (x === -1 && y === -1 && z === -1) {
        this.todo_list.push(new_todo_list);
        return true;
    }
    return false;
};

Spider.prototype.todoNow = function todoNow(url) {
    if (this.stop_add_todo) return;
    var x = this.todo_list.indexOf(new_todo_list);
    var y = this.done.indexOf(new_todo_list);
    var z = this.fail_todo_list.indexOf(new_todo_list);
    //如果这个链接不存在于待抓取列表、抓取成功列表、抓取失败列表，则添加到待抓取列表
    if (x === -1 && y === -1 && z === -1) {
        this.todo_list.push(new_todo_list);
        return true;
    }
    return false;
};

Spider.prototype.pushLog = function pushLog(l) {
    this.log.push({
        time: Date(),
        url: l.url,
        type: l.type,
        detail: l.detail,
        warn: l.warn
    });
};

//爬虫初始化参数检验
Spider.prototype.initCheckout = function initCheckout() {
    var result = true;
    if (typeof this.todo_list !== 'string' && !Array.isArray(this.todo_list)) {
        console.error('初始化参数出错，您没有正确输入链接字符串或链接字符串的数组');
        result = false;
    }
    if (typeof this.callback !== 'function') {
        console.error('初始化参数出错: callback格式不正确');
        result = false;
    }
    return result;
};

Spider.prototype.showProgress = function showProgress(type, url) {
    var all = this.todo_list.length + this.done.length + this.fail_todo_list.length + 1;
    var pro = this.done.length + this.fail_todo_list.length;
    var suc = this.done.length;
    var fail = this.fail_todo_list.length;
    var retries = this.opts.retries;
    var conn = this.conn_num;
    console.log('Pro:[' + pro + '/' + all + ']  retries:' + retries + '  Suc/Fail: (' + suc + '/' + fail + ')  Conn:' + conn + '  ' + type + ' | ' + url);
};

Spider.prototype.push = function push(data, destination) {
    if (!destination) {
        this.table['data'].push(data);//如果不输入位置参数，默认推送到data表
        return;
    }
    if (!this.table[destination]) { //如果目标table不存在，新建它
        this.table[destination] = new Pool(5, destination + '.txt');
    }
    this.table[destination].push(data);
};

/**
 * 资源池生成函数 for log、data_table
 * @param {number} max       最大容量。达到时将触发release函数：清空内容并写入txt
 * @param {strint} save_path 将写入数据的txt路径
 */
function Pool(max, save_path) {
    this.data = [];
    this.max = max;
    this.file = save_path ? fs.createWriteStream(save_path) : false;
    this.has_header = false; //txt文档是否有了表头
}
Pool.prototype.release = function() {
    var d = this.data;
    this.data = [];

    if (!this.file) {
        this.file = fs.createWriteStream('log.txt');
    }
    var txt = '';
    if (!this.has_header) { //如果txt文档里没有表头，写入
        for (var j in d[0]) {
            txt += j + '    ';
        }
        txt += '\n';
        this.has_header = true;
    }
    for (var i = 0; i < d.length; i++) {
        for (var j in d[i]) {
            txt += d[i][j] + '    ';
        }
        txt += '\n';
    }
    this.file.write(txt);
};
Pool.prototype.push = function(new_data) {
    if (this.max && this.max <= this.data.length) {
        return false;
    } else {
        this.data.push(new_data);
    }
    if (this.data.length >= this.max) {
        this.release();
    }
};
Pool.prototype.pop = function() {
    var d = this.data[0];
    this.data.shift();
    return d;
};

module.exports = Spider;
