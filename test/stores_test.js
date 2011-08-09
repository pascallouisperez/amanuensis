var assert = require('assert');
var stores = require('stores');

exports.displayStore_init = function() {
	var s = new stores.DisplayStore();
	assert.equal(0, s.queue.length);
	s.push(['foo', 'bar']);
	assert.equal(2, s.queue.length);
}
