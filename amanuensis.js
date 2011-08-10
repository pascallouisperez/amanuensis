var http = require('http');
var stores = require('./lib/stores');

var display_store = new stores.DisplayStore();

// downstream stores (from args)
var downstream_stores = (function(configurations) {
	var s = configurations.map(function (conf) {
		return object2store(JSON.parse(conf));
	});
	s.push(display_store);
	return s;
})(process.argv.slice(2));

function object2store(object) {
	switch (object.type) {
		case 'console': return new stores.ConsoleStore();
		case 'file': return new stores.FileStore(object.path);
		case 'relay': return new stores.RelayStore(object.host);
		case 'buffering': return new stores.BufferingStore(object.max, object2store(object.delegate));
		case 'mongo': return new stores.MongoStore(object.dbName);
		case 'filtering': return new stores.FilteringStore(
			object.pattern,
			object.modifiers,
			object2store(object.delegate));
		default: throw new Error("unknown type " + object.type);
	}
}

// server
var server = http.createServer(function (req, res) {
	if (req.method == 'POST' && req.url == '/') {
		req.on('data', function(chunk) {
			var message = chunk.toString('utf8');
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('OK ' + message.length + '\n');
			for (var i in downstream_stores) {
				try {
					downstream_stores[i].push(message.split('\n'));
				} catch (e) {
					console.log(e);
				}
			}
		});
	} else if (req.method == 'POST' && req.url == '/close') {
		server.close();
	} else if (req.method == 'GET' && req.url == '/live') {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		for (var i in display_store.queue) {
			res.write(display_store.queue[i]);
			res.write('\n');
		}
		res.end();
	} else {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('POST your log message\n');
	}
}).listen(50000);
console.log('Server running');
