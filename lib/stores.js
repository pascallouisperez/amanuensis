exports.ConsoleStore = ConsoleStore;
exports.DisplayStore = DisplayStore;
exports.FileStore = FileStore;
exports.RelayStore = RelayStore;
exports.BufferingStore = BufferingStore;
exports.FilteringStore = FilteringStore;
exports.MongoStore = MongoStore;

var fs = require('fs');
var http = require('http');
var mongodb = require('mongodb');

/**
 * Console store logging messages.
 */
function ConsoleStore() {}
ConsoleStore.prototype.push = function(messages) {
	for (var i in messages) {
		console.log(messages[i]);
	}
}

/**
 * Display store keeping the last 10 logs in memory for display.
 */
function DisplayStore() {
	this.queue = [];
}
DisplayStore.prototype.push = function(messages) {
	for (var i in messages) {
		var message = messages[i];
		if (this.queue.push(message) > 10) {
			this.queue = this.queue.slice(1);
		}
	}
}

/**
 * File store appending messages to a file. No in-memory buffering.
 */
function FileStore(path) {
	this.stream = fs.createWriteStream(path);
}
FileStore.prototype.push = function(messages) {
	for (var i in messages) {
		this.stream.write(messages[i]);
		this.stream.write('\n');
	}
}

/**
 * RelayStore pushing to another store.
 */
function RelayStore(relay_host) {
	this.relay_host = relay_host;
}
RelayStore.prototype.push = function(messages) {
	var data = messages.join('\n');
	var post_options = {
	  host: this.relay_host,
	  port: 50000,
	  path: '',
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/x-www-form-urlencoded',
	    'Content-Length': data.length
	  }
	};

	var post_req = http.request(post_options, function(res) {
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('Relayed: ' + chunk);
	  });
	});

	// write parameters to post body
	post_req.write(data);
	post_req.end();
}

/**
 * Buffering store keeping n items in memory and then passing then to the delegate store.
 */
function BufferingStore(max, delegate) {
	this.max = max;
	this.delegate = delegate;
	this.buffer = [];
}
BufferingStore.prototype.push = function(messages) {
	for (var i in messages) {
		this.buffer.push(messages[i]);
	}
	if (this.buffer.length >= this.max) {
		this.delegate.push(this.buffer);
		this.buffer = [];
	}
}

/**
 * Filters messages and pushes them to a delegate.
 */
function FilteringStore(pattern, modifiers, delegate) {
	var regexp = new RegExp(pattern, modifiers);
	this.predicate = function(message) {
		return regexp.test(message);
	};
	this.delegate = delegate;
}
FilteringStore.prototype.push = function(messages) {
	this.delegate.push(messages.filter(this.predicate));
}

/**
 * Store putting data in mongo.
 */
function MongoStore(dbName) {
	this.db = new mongodb.Db(dbName, new mongodb.Server('localhost', 27017, {}));
	this.db.open(function(err, db) {
	});
}
MongoStore.prototype.push = function(messages) {
	this.db.collection('logs', function(err, coll) {
		for (var i in messages) {
			try {
				coll.insert(JSON.parse(messages[i]));
			} catch (e) {
				coll.insert({"body":messages[i]});
			}
		}
	});
}
