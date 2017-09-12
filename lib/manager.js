/**
 * Manager for handling communication and callbacks with a SPARQL
 * endpoint; also allows for use of templates.
 *
 * @modules bbop-manager-sparql
 */

var bbop = require('bbop-core');
var registry = require('bbop-registry');

var us = require('underscore');

var rest_manager_base = require('bbop-rest-manager').base;
var rest_manager_node = require('bbop-rest-manager').node;
var rest_manager_sync_request = require('bbop-rest-manager').sync_request;
var rest_manager_jquery = require('bbop-rest-manager').jquery;

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
 * @param {String} partial - partial
 * @returns {Array} current value(s), as array of pairs.
 */
manager.prototype.add_prefix = function(prefix, partial){
    var anchor = this;

    if( prefix && us.isString(prefix) && partial && us.isString(partial) ){
	anchor._prefixes.push([prefix, partial]);
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
 * @param {String} partial - partial
 * @returns {Object} response
 */
manager.prototype.query = function(string){
    var anchor = this;

    // Assemble 
    var prefixes = '';
    us.each(anchor.prefixes(), function(prefix){
	prefixes += prefix[0] + ':' + prefix[1] + ' ';
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


///
///
///


// // Add generic inner ops.
// us.each([manager_base], function(constructr){
// //    constructr.endpoint = constructr.resource;
//     constructr.prototype.prefixes = _prefixes;
//     constructr.prototype.add_prefix = _add_prefix;
//     constructr.prototype.query = _query;
// });

// ///
// /// Actual mechanism.
// ///

// /**
//  * Trigger a rebuild {module:bbop-response-barista} with a model.
//  * 
//  * Intent: "query".
//  * Expect: "success" and "rebuild".
//  * 
//  * @param {String} model_id - string
//  * @returns {module:bbop-barista-response#response} barista response
//  */
// manager.prototype.get_model = function(model_id){

//     var reqs = new request_set(anchor.user_token(), model_id);
//     reqs.get_model();

//     return anchor.request_with(reqs);
// };

// // /*
// //  * Method: get_model_ids
// //  * 
// //  * Trigger meta {module:bbop-response-barista} with a list of all model
// //  * ids.
// //  * 
// //  * Intent: "query".
// //  * Expect: "success" and "meta".
// //  * 
// //  * @param {}    //  *  n/a
// //  * 
// //  * @returns {}    //  *  n/a
// //  */
// // manager.prototype.get_model_ids = function(){

// // 	// 
// // 	var reqs = new request_set(anchor.user_token());
// // 	var req = new request('model', 'all-model-ids');
// // 	reqs.add(req);

// // 	var args = reqs.callable();	
// // 	anchor.apply_callbacks('prerun', [anchor]);
// // 	jqm.action(anchor._batch_url, args, 'GET');
// // };

// /**
//  * Trigger meta {module:bbop-response-barista} with a list of all model
//  * meta-information.
//  * 
//  * Intent: "query".
//  * Expect: "success" and "meta".
//  * 
//  * @returns {module:bbop-barista-response#response} barista response
//  */
// manager.prototype.get_meta = function(){

//     var reqs = new request_set(anchor.user_token());
//     reqs.get_meta();

//     return anchor.request_with(reqs);
// };

// /**
//  * Trigger meta {module:bbop-response-barista} of requested
//  * model's undo/redo information.
//  * 
//  * This will make the request whether or not the user has an okay
//  * token defined.
//  *
//  * Intent: "query".
//  * Expect: "success" and "meta".
//  * 
//  * @param {String} model_id - string
//  * @returns {module:bbop-barista-response#response} barista response
//  */
// manager.prototype.get_model_undo_redo = function(model_id){

//     // 
//     var reqs = new request_set(anchor.user_token(), model_id);
//     reqs.get_undo_redo();

//     return anchor.request_with(reqs);
// };

// /**
//  * Trigger rebuild {module:bbop-response-barista} after an attempt
//  * to roll back the model to "last" state.
//  *
//  * Intent: "action".
//  * Expect: "success" and "rebuild".
//  * 
//  * @param {String} model_id - string
//  * @returns {module:bbop-barista-response#response} barista response
//  */
// manager.prototype.perform_undo = function(model_id){

//     var reqs = new request_set(anchor.user_token(), model_id);
//     reqs.undo_last_model_batch();

//     return anchor.request_with(reqs);
// };

// /**
//  * Trigger rebuild {module:bbop-response-barista} after an attempt
//  * to roll forward the model to "next" state.
//  *
//  * Intent: "action".
//  * Expect: "success" and "rebuild".
//  * 
//  * @param {String} model_id - string
//  * @returns {module:bbop-barista-response#response} barista response
//  */
// manager.prototype.perform_redo = function(model_id){

//     var reqs = new request_set(anchor.user_token(), model_id);
//     reqs.redo_last_model_batch();

//     return anchor.request_with(reqs);
// };

///
/// Exportable body.
///

module.exports = manager;
//{
//    "base" : manager_base//,
    // "node" : manager_node,
    // "sync_request" : manager.sync_request,
    // "jquery" : manager.jquery
//};
