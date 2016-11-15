const EventEmitter = require('events');
const iconv = require('iconv-lite');
const request = require('request');
const cheerio = require('cheerio');


function Spider(todo, opts, callback) {
    this.todo = Array.isArray(todo)? todo : [todo];
    this.opts = { //选项默认设置
        repeat: 2,
        max_connection: 20,
        save_log: false,
        log_path: '',
        decode: false,
        debug: false
    };

    //参数录入
    //
    if (!opts) { //至少需要两个参数，不然返回错误信息
        return new Error(1000, '请至少传入链接字符串或链接数组，以及爬虫的具体工作callback函数这两个参数');
    }
    //让opts变成可选参数，更加灵活
    if (callback) {
        //使用参数opts覆盖默认设置，是否有更好的原生方法？？
            var o = this.opts;
            for (var i in opts) {
                o[i] = opts[i];
            }
            this.opts = o;
        this.callback = callback;
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

    this.paw = paw;
    this.start = start;
}

//事件监听初始化、各参数、选项检验错误、启动工作
function start() {
    //检验
    if (typeof this.todo !== 'string' && !Array.isArray(this.todo)) {
    	console.error('todo不是字符串或数组');
    	return ;
        // return new Error(1001, 'todo不是字符串或数组');
    }
    if (typeof this.callback !== 'function') {
    	console.error('参数callback不是函数');
    	return ;
        // return new Error(1002, '参数callback不是函数');
    }

    //事件监听
    var that = this;
    that.nervus.on('next', function() {
        if (that.conn_num > 0) {
            that.conn_num--; //当conn大于0,说明是某次爬取成功触发的next事件，此时已完成一次连接.
        }
        if (that.conn_num < that.opts.max_connection) {
            if (that.todo.length <= 0 && that.opts.repeat > 0) {
                that.todo = that.fail_todo;
                that.fail_todo = [];
                that.repeat--;
            }
            if (that.todo.length <= 0 && that.conn_num <= 0) {
                that.nervus.emit('finish');
                return true;
            }
            var next_url = that.todo[0];
            that.todo.shift();
            that.paw(next_url);
        }
    });
    that.nervus.on('finish', function () {
    	console.log('finish');
    });
    that.nervus.emit('next');
}

function paw(url) {
	this.conn_num ++;
    var that = this;
    request({
        url: url,
        method: 'GET',
        encoding: null
    }, function(err, res, body) {
        if (err) {
            if (that.opts.debug) { //如果是debug模式，直接报错并退出当前爬取操作
                console.log('========================================');
                console.log('网络request出错 [' + url + '] 建议：检查网络和url参数');
                console.error(err);
                console.log('========================================');
                return;
            } else { //如果不是debug模式，错误信息推送到Log，并继续
                that.fail_todo.push(url);
                that.pushLog({ type: 'request_failed', url: url, warn: '访问失败', detail: err });
                that.nervus.emit('next');
                return;
            }
        }
        if (that.opts.decode) {
            body = iconv.decode(body, that.opts.decode);
        }
        var $ = cheerio.load(body);
        try {
            that.callback($, res, body);
        } catch (e) {
            if (that.opts.debug) {
                console.log('========================================');
                console.log('抓取内容出错 建议：检查callback函数，以及返回正文');
                console.log(e);
                console.log('========================================');
                return;
            } else {
                that.fail_todo.push(url);
                that.pushLog({ type: 'callback_failed', url: url, warn: 'callback报错', detail: e });
                that.nervus.emit('next');
                return;
            }
        }
        that.done.push(url);
        that.nervus.emit('next');
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


module.exports = Spider;