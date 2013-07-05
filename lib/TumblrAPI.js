/*
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013 rikuta0209
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var Request  = require("sdk/request").Request;
var OAuth    = require("./oauth").OAuth;
var ss       = require('sdk/simple-storage');
var loadJson = require('./loadJson').loadJson;

function regValue(obj){
	return typeof obj !== "undefined" ? obj : {};
}

function TumblrHttp(request_object){
	/*
		request_object.url : URL
		request_object.headers : Headers
		request_object.parameters : Parameters
		request_object.onComplete : function 
	*/
	
	var host = "http://api.tumblr.com/v2/";
	
	if(typeof request_object.parameters === "undefined"){
		request_object.parameters = {};
	}
	
	if(typeof request_object.headers === "undefined"){
		request_object.headers = {};
	}
	
	if(request_object.url.match(/^(https?:\/\//) === null){
		request_object.url = host + request_object.url;
	}
	
	return Request({
		"url" : request_object.url,
		"headers" : request_object.headers,
		"content" : request_object.parameters,
		"onComplete" : request_object.onComplete
	});
}

function TumblrOAuth(tumblr_account){
	
	this.accessor = {
		"consumerKey" : tumblr_account.consumer_key,
		"consumerSecret" : tumblr_account.consumer_secret,
		"token" : tumblr_account.access_token,
		"tokenSecret" : tumblr_account.access_token_secret
	};
	
	this.host = "http://api.tumblr.com/v2/";
}

TumblrOAuth.prototype.get = function(request_object){
	if(request_object.url.match(/^(https?:\/\//) === null){
		request_object.url = this.host + request_object.url;
	}
	
	var message = {
		"method" : "GET",
		"action" : request_object.url,
		"parameters" : request_object.parameters
	};
	
	var request_query = OAuth.formEncode(message.parameters);
	OAuth.completeRequest(message, this.accessor);
	
	TumblrHttp({
		"url": message.action,
		"headers": {
			"Authorization" : OAuth.getAuthorizationHeader("", message.parameters)
		},
		"parameters": request_query,
		"onComplete": request_object.onComplete
	}).get();
}

TumblrOAuth.prototype.post = function(request_object){
	if(request_object.url.match(/^(https?:\/\//) === null){
		request_object.url = this.host + request_object.url;
	}
	
	var message = {
		"method" : "POST",
		"action" : request_object.url,
		"parameters" : request_object.parameters
	};
	
	var request_query = OAuth.formEncode(message.parameters);
	OAuth.completeRequest(message, this.accessor);
	
	TumblrHttp({
		"url": message.action,
		"headers": {
			"Authorization" : OAuth.getAuthorizationHeader("", message.parameters)
		},
		"parameters": request_query,
		"onComplete": request_object.onComplete
	}).post();
}

function TumblrKey(tumblr_account){
	this.key = tumblr_account.consumer_key;
}

TumblrKey.prototype.get = function(request_object){
	if(typeof request_object.parameters === "undefined"){
		request_object.parameters = {};
	}
	
	request_object.parameters.api_key = this.key;
	
	TumblrHttp(request_object).get();
}

TumblrKey.prototype.post = function(request_object){
	if(typeof request_object.parameters === "undefined"){
		request_object.parameters = {};
	}
	
	request_object.parameters.api_key = this.key;
	
	TumblrHttp(request_object).post();
}

function TumblrNone(){
	//NOP
}

TumblrNone.prototype.get = function(request_object){
	if(typeof request_object.parameters === "undefined"){
		request_object.parameters = {};
	}
	
	TumblrHttp(request_object).get();
}

TumblrNone.prototype.post = function(request_object){
	if(typeof request_object.parameters === "undefined"){
		request_object.parameters = {};
	}
	
	TumblrHttp(request_object).post();
}

function TumblrRequest(tumblr_account){
	this.oauth = new TumblrOAuth(tumblr_account);
	this.key   = new TumblrKey(tumblr_account);
	this.none  = new TumblrNone();
}

function getTumblrAccount(){
	var account = loadJson("tumblr_consumer.json");
	
	account.access_token        = ss.storage.accounts.tumblr.access_token;
	account.access_token_secret = ss.storage.accounts.tumblr.access_token_secret;
	
	return account;
}

/*
	request_object.url : URL
	request_object.headers : Headers
	request_object.parameters : Parameters
	request_object.onComplete : function 
*/

function BlogMethods(base_hostname){
	this.base_hostname = base_hostname;
	this.request = new TumblrRequest(getTumblrAccount());
}

BlogMethods.prototype.getURL = function(api){
	return "blog/" + this.base_hostname + api;
}

BlogMethods.prototype.info = function(onComplete){
	this.request.key.get({
		"url": this.getURL("info"),
		"onComplete": onComplete
	});
}

BlogMethods.prototype.avatar = function(onComplete, size){
	if(typeof size !== "undefined"){
		this.request.none.get({
			"url": this.getURL("avatar/" + size),
			"onComplete": onComplete
		});
	} else {
		this.request.none.get({
			"url": this.getURL("avatar"),
			"onComplete": onComplete
		});
	}
}

BlogMethods.prototype.likes = function(onComplete, parameters){
	this.request.key.get({
		"url": this.getURL("likes"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

BlogMethods.prototype.followers = function(onComplete, parameters){
	this.request.oauth.get({
		"url": this.getURL("followers"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

BlogMethods.prototype.posts = function(onComplete, parameters){
	
	parameters = regValue(parameters);
	var url = typeof parameters.type !== "undefined" ? this.getURL("posts/" + parameters.type) : this.getURL("posts");
	
	if(typeof parameters.type !== "undefined"){ delete parameters.type; }
	
	this.request.key.get({
		"url": url,
		"parameters": parameters,
		"onComplete": onComplete
	});
}

BlogMethods.prototype.queue = function(onComplete, parameters){
	this.request.oauth.get({
		"url": this.getURL("posts/queue"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

BlogMethods.prototype.draft = function(onComplete, filter){
	var parameters = {};
	
	if(typeof filter !== "undefined"){
		parameters.filter = filter;
	}
	
	this.request.oauth.get({
		"url": this.getURL("posts/draft"),
		"parameters": parameters,
		"onComplete": onComplete
	});
}

BlogMethods.prototype.submission = function(onComplete, parameters){
	this.request.oauth.get({
		"url": this.getURL("posts/submission"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

BlogMethods.prototype.post = function(onComplete, parameters){
	this.request.oauth.post({
		"url": this.getURL("post"),
		"parameters": parameters,
		"onComplete": onComplete
	});
}

BlogMethods.prototype.edit = function(onComplete, parameters){
	this.request.oauth.post({
		"url": this.getURL("post/edit"),
		"parameters": parameters,
		"onComplete": onComplete
	});
}

BlogMethods.prototype.reblog = function(onComplete, parameters){
	this.request.oauth.post({
		"url": this.getURL("post/reblog"),
		"parameters": parameters,
		"onComplete": onComplete
	});
}

BlogMethods.prototype.post_delete = function(onComplete, id){
	var parameters = {};
	
	parameters.id = id;
	
	this.request.oauth.post({
		"url": this.getURL("post/delete"),
		"parameters": parameters,
		"onComplete": onComplete
	});
}

function UserMethods(){
	this.request = new TumblrRequest(getTumblrAccount());
}

UserMethods.prototype.getURL = function(api){
	return "user/" + api;
}

UserMethods.prototype.info = function(onComplete){
	this.request.oauth.get({
		"url": this.getURL("info"),
		"onComplete": onComplete
	});
}

UserMethods.prototype.dashboard = function(onComplete, parameters){
	this.request.oauth.get({
		"url": this.getURL("dashboard"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

UserMethods.prototype.likes = function(onComplete, parameters){
	this.request.oauth.get({
		"url": this.getURL("likes"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

UserMethods.prototype.following = function(onComplete, parameters){
	this.request.oauth.get({
		"url": this.getURL("following"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

UserMethods.prototype.follow = function(onComplete, url){
	var parameters = {};
	parameters.url = url;
	
	this.request.oauth.post({
		"url": this.getURL("follow"),
		"parameters": parameters,
		"onComplete": onComplete
	});
}

UserMethods.prototype.unfollow = function(onComplete, url){
	var parameters = {};
	parameters.url = url;
	
	this.request.oauth.post({
		"url": this.getURL("unfollow"),
		"parameters": parameters,
		"onComplete": onComplete
	});
}

UserMethods.prototype.like = function(onComplete, parameters){
	this.request.oauth.post({
		"url": this.getURL("like"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

UserMethods.prototype.unlike = function(onComplete, parameters){
	this.request.oauth.post({
		"url": this.getURL("unlike"),
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

function TaggedMethod(){
	this.request = new TumblrRequest(getTumblrAccount());
	this.url = "tagged"
}

TaggedMethod.prototype.oauth = function(onComplete, parameters){
	this.request.oauth.get({
		"url": this.url,
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

TaggedMethod.prototype.key = function(onComplete, parameters){
	this.request.key.get({
		"url": this.url,
		"parameters": regValue(parameters),
		"onComplete": onComplete
	});
}

var TumblrAPI = {};

TumblrAPI.blog   = function(base_hostname){ return new BlogMethods(base_hostname); }
TumblrAPI.user   = new UserMethods();
TumblrAPI.tagged = new TaggedMethod();

exports.TumblrAPI = TumblrAPI;