////
//// Some unit testing for package bbop-manager-sparql.
////

var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;
var manager = require('..');

var us = require('underscore');
var each = us.each;

// Correct environment, ready testing.
var bbop = require('bbop-core');

var response_base = require('bbop-rest-response').base;
var response_json = require('bbop-rest-response').json;

// The likely main scripting engine.
var sync_engine = require('bbop-rest-manager').sync_request;
// The likely main browser engine.
var jquery_engine = require('bbop-rest-manager').jquery;
// Everybody else engine.
var node_engine = require('bbop-rest-manager').node;

var wikidata = 'https://query.wikidata.org/sparql';
// Get PMID:9999.
var wikiquery_all = 'PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/> SELECT ?rtcl ?title ?author ?journal ?date WHERE { ?rtcl wdt:P698 "999". OPTIONAL { ?rtcl wdt:P1476 ?title. } OPTIONAL { ?rtcl wdt:P2093 ?author. } OPTIONAL { ?rtcl wdt:P1433 ?journal. } OPTIONAL { ?rtcl wdt:P577 ?date. } } LIMIT 1';
var wikiquery_sans = 'SELECT ?rtcl ?title ?author ?journal ?date WHERE { ?rtcl wdt:P698 "999". OPTIONAL { ?rtcl wdt:P1476 ?title. } OPTIONAL { ?rtcl wdt:P2093 ?author. } OPTIONAL { ?rtcl wdt:P1433 ?journal. } OPTIONAL { ?rtcl wdt:P577 ?date. } } LIMIT 1';

///
/// Start unit testing.
///

describe('bbop-manager-sparql inner ops', function(){

    it('trying the basic endpoint ops', function(){

	var engine_to_use = new node_engine(response_json);

    	// No action, so it doesn't matter what we use.
    	var m = new manager(wikidata, [['fb', 'foo:bar']], response_base,
			    engine_to_use, null);

    	assert.equal(m.endpoint(), wikidata, 'simple: has endpoint');

    	m.endpoint('foo');
    	assert.equal(m.endpoint(), 'foo', 'simple: changed endpoint');
    });

    it('trying the basic prefix ops', function(){

	var engine_to_use = new node_engine(response_json);

	// No action, so it doesn't matter what we use.
	var m = new manager(wikidata, [['fb', 'foo:bar']], response_base,
			   engine_to_use);

	// Init.
    	assert.equal(m.prefixes().length, 1, 'simple: prefixes are (a)');
    	assert.equal(m.prefixes()[0][1], 'foo:bar', 'simple: prefixes are (b)');

	// Add.
	m.add_prefix('a', 'b');
    	assert.equal(m.prefixes()[1][1], 'b', 'simple: add prefix');
    });
});


describe('bbop-manager-sparql simple', function(){

    it('trying wikidata', function(done){

	var engine_to_use = new node_engine(response_json);
	engine_to_use.headers([['accept', 'application/sparql-results+json']]);
	
    	// No action, so it doesn't matter what we use.
    	var m = new manager(wikidata,
			    [],
			    response_json,
			    engine_to_use,
			    'async');

	m.query(wikiquery_all).then(function(resp){
	    //console.log('resp',resp);
    	    assert.isDefined(resp.raw()['head'], 'has json head');
    	    assert.isDefined(resp.raw()['results'], 'has json results');
    	    done();
	}).done();
    });

    // it('trying the basic prefix ops', function(){

    // 	var engine_to_use = new node_engine(response_json);

    // 	// No action, so it doesn't matter what we use.
    // 	var m = new manager(wikidata, [['fb', 'foo:bar']], response_base,
    // 			   engine_to_use);

    // 	// Init.
    // 	assert.equal(m.prefixes().length, 1, 'simple: prefixes are (a)');
    // 	assert.equal(m.prefixes()[0][1], 'foo:bar', 'simple: prefixes are (b)');

    // 	// Add.
    // 	m.add_prefix('a', 'b');
    // 	assert.equal(m.prefixes()[1][1], 'b', 'simple: add prefix');
    // });
});
