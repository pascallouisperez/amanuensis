var assert = require('assert');
var stores = require('stores');

exports.displayStore_init = function() {
	var s = new stores.DisplayStore();
	assert.equal(0, s.queue.length);
	
	s.push(['foo', 'bar']);
	assert.equal(2, s.queue.length);
	
	s.push(['baz']);
	assert.equal(3, s.queue.length);
	
	s.push(['msg 4', 'msg 5', 'msg 6', 'msg 7', 'msg 8', 'msg 9', 'msg 10', 'msg 11', 'msg 12']);
	assert.equal(10, s.queue.length);
	assert.equal('baz', s.queue[0]);
	assert.equal('msg 12', s.queue[9]);
}
