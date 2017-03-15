const cheerio = require('cheerio');
const url = require('url');

let html = '<a href="/hello.html">hello<b href="http://www.baidu.com/d/e/sdf.html">world</b>!!!</a>';
let $ = cheerio.load(html);
let current_url = 'http://www.baidu.com';

        $.fn.url = function() {
            let result = [];
            $(this).each(function() {
                let new_url = $(this).attr('href');

                // 如果是类似 'javascirpt: void(0)' 的 js 代码，直接跳过
                if (/^javascript/.test(new_url)) return false;
                
                // 如果是锚，等效与当前 url 路径
                if (new_url[0] === '#') return result.push(current_url);

                // 如果是相对路径，补全路径为绝对路径
                if (new_url && !/^https?:\/\//.test(new_url)) {
                    new_url = url.resolve(current_url, new_url);
                }
                result.push(new_url);
            });
            if (result.length < 2) [result] = result;
            return result;
        };
console.log($('a').url());