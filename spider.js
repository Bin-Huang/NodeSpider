var EventEmitter = require('events');
var iconv = require('iconv-lite');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

function Spider(todo, opts, callback) {
    this.todo = typeof todo === 'string' ? [todo] : todo;
    this.opts = { //选项默认设置
        repeat: 2,
        max_connection: 100,
        save_log: false,
        log_path: '',
        decode: false,
        debug: false,
        use_jQ: true
    };

    //让opts变成可选参数，更加灵活
    if (callback) {
        //opts和callback位置可以互换
        var o;
        var i;
        if (typeof opts === 'object') {
            o = this.opts;
            for (i in opts) { //使用参数opts覆盖默认设置，是否有更好的原生方法？？
                o[i] = opts[i];
            }
            this.opts = o;
            this.callback = callback;
        } else if (typeof callback === 'object') {
            o = this.opts;
            for (i in callback) {
                o[i] = callback[i];
            }
            this.opts = o;
            this.callback = opts;
        }
    } else {
        this.callback = opts;
    }

    this.done = []; //已完成的链接
    this.fail_todo = []; //失败的链接
    this.nervus = new EventEmitter();
    this.conn_num = 0; //当前连接数
    this.stop_add_todo = false;
    this.log = [];

    this.addTodo = addTodo;
    this.pushLog = pushLog;
    this.initCheckout = initCheckout;
    this.showProgress = showProgress;

    this.paw = paw;
    this.start = start;
}

//事件监听初始化、各参数、选项检验、启动工作
function start() {
    var init_result = this.initCheckout();
    if (!init_result) {
        return;
    }

    //事件监听
    var that = this;
    that.nervus.on('crawl', function() {
        if (that.todo.length > 0) {
            var next_url = that.todo[0];
            that.todo.shift();
            that.paw(next_url);
        }
    });
    that.nervus.on('next', function() {
        // if (that.conn_num > 0) {
        // that.conn_num--; //当conn大于0,说明是某次爬取成功触发的next事件，此时已完成一次连接.
        // }
        if (that.conn_num < that.opts.max_connection) {
            if (that.todo.length <= 0 && that.opts.repeat > 0) {
                that.todo = that.fail_todo;
                that.fail_todo = [];
                that.opts.repeat--;
            }
            if (that.todo.length <= 0 && that.conn_num <= 0) {
                that.nervus.emit('finish');
                return true;
            }
            that.nervus.emit('crawl');
        }
    });
    that.nervus.on('back', function () {
    	that.conn_num --;
    	that.nervus.emit('next');
    });
    that.nervus.on('finish', function() {
        console.log('finish');
        console.log(that.log)
    });

        that.nervus.emit('crawl');
}

function paw(url) {
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
                return;
            } else { //如果不是debug模式，错误信息推送到Log，并继续
                that.fail_todo.push(url);
                that.pushLog({ type: 'request_failed', url: url, warn: '访问失败', detail: err });
                that.nervus.emit('back');
                return;
            }
        }
        if (that.opts.decode) {
            body = iconv.decode(body, that.opts.decode);
        }
        var $ = cheerio.load(body, { decodeEntities: false });
        try {
            that.callback($, body, url, err, res);
        } catch (e) {
            that.showProgress('Failed', url);
            if (that.opts.debug) {
                console.log('========================================');
                console.log('抓取内容出错 建议：检查callback函数，以及返回正文');
                console.log(e);
                console.log('========================================');
                return;
            } else {
                that.fail_todo.push(url);
                that.pushLog({ type: 'callback_failed', url: url, warn: 'callback报错', detail: e });
                that.nervus.emit('back');
                return;
            }
        }
        that.showProgress('Successful', url);
        that.done.push(url);
        that.nervus.emit('back');
    });
}

/**
 * 添加待抓取链接
 * @param {string} new_todo 待抓取的url
 */
function addTodo(new_todo) {
    if (this.stop_add_todo) {
        return;
    }
    var x = this.todo.indexOf(new_todo);
    var y = this.done.indexOf(new_todo);
    var z = this.fail_todo.indexOf(new_todo);
    //如果这个链接不存在于待抓取列表、抓取成功列表、抓取失败列表，则添加到待抓取列表
    if (x === -1 && y === -1 && z === -1) {
        this.todo.push(new_todo);
        return true;
    }
    return false;
}

function pushLog(l) {
    this.log.push({
        time: Date(),
        url: l.url,
        type: l.type,
        detail: l.detail,
        warn: l.warn
    });
}

//爬虫初始化参数检验
function initCheckout() {
    var result = true;
    if (typeof this.todo !== 'string' && !Array.isArray(this.todo)) {
        console.error('初始化参数出错，您没有正确输入链接字符串或链接字符串的数组');
        result = false;
    }
    if (typeof this.callback !== 'function') {
        console.error('初始化参数出错: callback格式不正确');
        result = false;
    }
    return result;
}

function showProgress(type, url) {
    var all = this.todo.length + this.done.length + this.fail_todo.length + 1;
    var pro = this.done.length + this.fail_todo.length;
    var suc = this.done.length;
    var fail = this.fail_todo.length;
    var repeat = this.opts.repeat;
    var conn = this.conn_num;
    console.log('Pro:[' + pro + '/' + all + ']  Repeat:' + repeat + '  Suc/Fail: (' + suc + '/' + fail + ')  Conn:' + conn + '  ' + type + ' | ' + url);
}

module.exports = Spider;
