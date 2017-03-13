var express = require('express');
var proxy = require('http-proxy-middleware');
var cheerio = require('cheerio');
var app = express();
var origianlApp = express();

var options = {
  target: 'http://localhost:4002',
  changeOrigin: true,
  onProxyRes: function onProxyRes(proxyRes, req, res) {
    var _write = res.write;
    var _writeHead = res.writeHead;
    var prependScript = '<div>injected text</div><button id="b3">Cleanup</button><script src="zone.js"></script><script src="prepend.js"></script>';
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].indexOf('text/html') > -1) {
      console.log(req.originalUrl, 'all but body elements will be striped. body element will be replaced to div.');
      res.write = function (data) {
        var $ = cheerio.load(data);
        var injected = $('body').prepend(prependScript).html();
        _write.call(res, injected+data);
      };
      res.writeHead = function(){
        if( proxyRes.headers && proxyRes.headers[ 'content-length' ] ){
          res.setHeader(
            'content-length',
            parseInt( proxyRes.headers[ 'content-length' ], 10 ) + prependScript.length
          );
        }
        _writeHead.apply( this, arguments );
      };
    }
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].indexOf('application/javascript') > -1) {
      console.log(req.originalUrl, 'wrap with a zone and inject proxy window object');
      // here we replace the window object with the proxyWindow and wrap all the script in a zone
      var wr = '(function(window){\nZone.current.fork(proxyPageZoneSpec).run(function(){\n';
      var ap= '\n})\n})(proxyWindow)';
      res.write = function (data) {
        // the actual wrapping
        _write.call(res, wr+data+ap);
      };
      res.writeHead = function(){
        if( proxyRes.headers && proxyRes.headers[ 'content-length' ] ){
          res.setHeader(
            'content-length',
            parseInt( proxyRes.headers[ 'content-length' ], 10 ) + wr.length + ap.length
          );
        }
        _writeHead.apply( this, arguments );
      };
    }
  }
};


app.use(express.static('public'));
app.use('/', proxy(options));
app.listen(3002);

origianlApp.use(express.static('public2'));
origianlApp.listen(4002);
