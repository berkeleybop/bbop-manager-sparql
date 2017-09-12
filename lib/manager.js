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
 * @param {Object} response_handler - the response handler class to use for each call
 * @param {Array} prefixes - a list of array pairs (e.g. [['wdt', '<http://www.wikidata.org/prop/direct/>'], ...]) that will be added to all queries, whether a template is used or not.
 * @returns {manager} a classic manager
 */
var manager_base = function(endpoint, response_handler, prefixes){
    rest_manager_base.call(this, response_handler);
    this._is_a = 'bbop-manager-sparql.base';
    var anchor = this;
    anchor._endpoint = endpoint;
    anchor._prefixes = [];
    if( prefixes && us.isArray(prefixes) ){
	anchor._prefixes = prefixes;
    }
};
bbop.extend(manager_base, rest_manager_base);


/**
 * Get/set the endpoint.
 * 
 * @param {String} endpoint - string for the target endpoint URL
 * @returns {String} current value
 */
function _endpoint(endpoint){
    var anchor = this;

    if( endpoint && us.isString(endpoint) ){
	anchor._endpoint = endpoint;
    }

    return anchor._endpoint;
}

/**
 * Get/set the prefixes.
 * 
 * @param {Array} prefixes - a list of array pairs (e.g. [['wdt', '<http://www.wikidata.org/prop/direct/>'], ...]) that will be added to all queries, whether a template is used or not.
 * @returns {Array} current value(s), as array of pairs.
 */
function _prefixes(prefixes){
    var anchor = this;

    if( prefixes && us.isArray(prefixes) ){
	anchor._prefixes = prefixes;
    }

    return anchor._prefixes;
}

/**
 * Add a prefix.
 * 
 * @param {String} prefix - prefix
 * @param {String} partial - partial
 * @returns {Array} current value(s), as array of pairs.
 */
function _add_prefix(prefix, partial){
    var anchor = this;

    if( prefix && us.isString(prefix) && partial && us.isString(partial) ){
	anchor._prefixes.push([prefix, partial]);
    }

    return anchor._prefixes;
}


// Add generic bulk annotation operations to: graph, edge, and node.
us.each([manager_base], function(constructr){
    constructr.prototype.endpoint = _endpoint;
    constructr.prototype.prefixes = _prefixes;
    constructr.prototype.add_prefix = _add_prefix;
});
    
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

module.exports = {
    "base" : manager_base//,
    // "node" : manager_node,
    // "sync_request" : manager.sync_request,
    // "jquery" : manager.jquery
};
