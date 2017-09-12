/**
 * Manager for handling communication and callbacks with a SPARQL
 * endpoint; also allows for use of templates.
 *
 * @modules bbop-manager-sparql
 */

var bbop = require('bbop-core');
var registry = require('bbop-registry');

var us = require('underscore');
var mustache = require('mustache');
var yaml = require('yamljs');

// Aliasing.
var each = us.each;

/**
 * A manager for handling the AJAX and registry. Initial take from
 * {module:bbop-rest-manager}.
 * 
 * @constructor
 * @param {String} endpoint - string for the target endpoint URL
 * @param {Array} prefixes - a list of array pairs (e.g. [['wdt', '<http://www.wikidata.org/prop/direct/>'], ...]) that will be added to all queries, whether a template is used or not.
 * @param {Object} response_handler - the response handler class to use for each call
 * @param {Object} engine - Remote resource manager client to use (must be an instantiated {module:bbop-rest-manager} engine)
 * @param {String} *optional* mode - mode control for the engine (optional)
 * @returns {manager} a classic manager
 */
var manager = function(endpoint, prefixes, response_handler, engine, mode){
    registry.call(this, ['success',
			 'error']);
    this._is_a = 'bbop-manager-sparql';
    var anchor = this;

    // Endpoint.
    anchor._endpoint = endpoint;

    // New prefixes.
    anchor._prefixes = [];
    if( prefixes && us.isArray(prefixes) ){
	anchor._prefixes = prefixes;
    }

    //  
    anchor._engine = engine;
    anchor._mode = mode;
    anchor._runner = function(resource, payload){
	var ret = null;
	if( anchor._mode === 'sync' ){
	    ret = anchor._engine.fetch(resource, payload);
	}else if( anchor._mode === 'async' ){
	    ret = anchor._engine.start(resource, payload);
	}else{
	    throw new Error('"mode" not set in new bbop-manager-minerva');
	}
	return ret;
    };
    
    // How to deal with failure.
    function _on_fail(resp, man){	
	var retval = null;

	// See if we got any traction.
	if( ! resp || ! resp.message_type() || ! resp.message() ){
	    // Something dark has happened, try to put something
	    // together.
	    // console.log('bad resp!?: ', resp);
	    var resp_seed = {
		'message_type': 'error',
		'message': 'deep manager error'
	    };
	    resp = new response_handler(resp_seed);
	    retval = resp;
	}
	anchor.apply_callbacks('error', [resp, anchor]);

	return retval;
    }
    anchor._engine.register('error', _on_fail);

    // When we have nominal success, we still need to do some kind of
    // dispatch to the proper functionality.
    function _on_nominal_success(resp, man){
	var retval = resp;
	anchor.apply_callbacks('success', [resp, anchor]);

    	return retval;
    }
    anchor._engine.register('success', _on_nominal_success);

};
bbop.extend(manager, registry);


/**
 * Get/set the endpoint.
 * 
 * @param {String} endpoint - a string for the endpoint URL.
 * @returns {String} current value
 */
manager.prototype.endpoint = function(endpoint){
    var anchor = this;

    if( endpoint && us.isString(endpoint) ){
	anchor._endpoint = endpoint;
    }

    return anchor._endpoint;
};

/**
 * Get/set the prefixes.
 * 
 * @param {Array} prefixes - a list of array pairs (e.g. [['wdt', '<http://www.wikidata.org/prop/direct/>'], ...]) that will be added to all queries, whether a template is used or not.
 * @returns {Array} current value(s), as array of pairs.
 */
manager.prototype.prefixes = function(prefixes){
    var anchor = this;

    if( prefixes && us.isArray(prefixes) ){
	anchor._prefixes = prefixes;
    }

    return anchor._prefixes;
};

/**
 * Add a prefix.
 * 
 * @param {String} prefix - prefix
 * @param {String} expansion - expansion
 * @returns {Array} current value(s), as array of pairs.
 */
manager.prototype.add_prefix = function(prefix, expansion){
    var anchor = this;

    if( prefix && us.isString(prefix) && expansion && us.isString(expansion) ){
	anchor._prefixes.push([prefix, expansion]);
    }
    
    return anchor._prefixes;
};


/**
 * Attempt to query using the string. For shorter queries, try GET
 * (some systems will cache these), for longer, fall back on POST.
 * 
 * This is the core operator for this subclass. Any prefixes() will be
 * appended.
 * 
 * @param {String} string - the SPARQL query string
 * @returns {Object} response
 */
manager.prototype.query = function(string){
    var anchor = this;

    // Add any prefixes in the object.
    var prefixes = '';
    //console.log('prefixes', anchor.prefixes());
    us.each(anchor.prefixes(), function(prefix){
	prefixes += 'PREFIX ' + prefix[0] + ':' + prefix[1] + ' ';
    });

    var qstr = prefixes + string;
    if( qstr.length >= 255 ){
	anchor._engine.method('GET');
    }else{
	anchor._engine.method('POST');
    }
    
    var pay = {'query': qstr};
    return anchor._runner(anchor.endpoint(), pay);
};


/**
 * Attempt to query using a ??? template.
 * Binding variables into a YAML mustache template.
 * 
 * Any prefixes() will be appended.
 * 
 * @param {String} template_as_string - the SPARQL query string
 * @param {Object} bindings - variables to fill out the YAML template (mustache)
 * @returns {Object} response
 */
manager.prototype.template = function(template_as_string, bindings){
    var anchor = this;

    //
    var filled_template = mustache.render(template_as_string, bindings);
    //console.log('filled_template', filled_template);

    var obj = yaml.parse(filled_template);

    // Add any prefixes in the "yaml".
    var prefixes = '';
    //console.log('prefixes', anchor.prefixes());
    us.each(obj['prefixes'], function(prefix){
	prefixes +=
	    'PREFIX ' + prefix['prefix'] + ':' + prefix['expansion'] + ' ';
    });
    
    return anchor.query(prefixes + obj['query']);
};

///
/// Exportable body.
///

module.exports = manager;
