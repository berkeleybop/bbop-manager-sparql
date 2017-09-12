////
//// Some unit testing for package bbop-manager-sparql.
////

var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;
var manager_base = require('..').base;

var us = require('underscore');
var each = us.each;

// var manager_base = managers.base;
// var manager_node = managers.node;
// var manager_sync_request = managers.sync_request;
// var manager_jquery = managers.jquery;

// Correct environment, ready testing.
var bbop = require('bbop-core');
var response_base = require('bbop-rest-response').base;
var response_json = require('bbop-rest-response').json;

var wikidata = 'https://query.wikidata.org/sparql';

///
/// Start unit testing.
///

describe('bbop-manager-sparql inner ops', function(){

    it('trying the basic endpoint ops', function(){

	// No action, so it doesn't matter what we use.
	var m = new manager_base(wikidata, response_base, [['fb', 'foo:bar']]);

	assert.equal(m.endpoint(), wikidata, 'simple: has endpoint');

	m.endpoint('foo');
	assert.equal(m.endpoint(), 'foo', 'simple: changed endpoint');
    });

    it('trying the basic prefix ops', function(){

	// No action, so it doesn't matter what we use.
	var m = new manager_base(wikidata, response_base, [['fb', 'foo:bar']]);

	// Init.
    	assert.equal(m.prefixes().length, 1, 'simple: prefixes are (a)');
    	assert.equal(m.prefixes()[0][1], 'foo:bar', 'simple: prefixes are (b)');

	// Add.
	m.add_prefix('a', 'b');
    	assert.equal(m.prefixes()[1][1], 'b', 'simple: add prefix');
    });
});
