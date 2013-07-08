var Request     = require('sdk/request').Request;
var OAuth       = require('./oauth').OAuth;
var querystring = require('sdk/querystring');
var tabs        = require('sdk/tabs');
var parseUri    = require('./parseuri').parseUri;
var ss          = require('sdk/simple-storage');
var self        = require('sdk/self');

/*
	settings.urls.request_token : Request Token URL
	settings.urls.authorize     : Authorize URL
	settings.urls.access_token  : Access Token URL
	settings.urls.callback      : Callback URL
	settings.consumer.key       : Consumer Key
	settings.consumer.secret    : Consumer Secret
	settings.service_name       : Name of Web Service
	
*/
exports.exec = function(settings){
	if(typeof ss.storage.oauth_state !== "undefined" || ss.storage.oauth_state === "using"){
		//OAuth認証中
		return false;
	} else {
		ss.storage.oauth_state = "using";
	}
	
	var temp = ss.storage.oauth_temp[settings.service_name];
	
	//simple-storageを一時記憶として利用
	temp.consumer_key    = settings.consumer.key;
	temp.consumer_secret = settings.consumer.secret;
	
	//リクエストトークンの取得
	var message = {
		"method": "GET",
		"action": settings.urls.request_token,
		"parameters": {
			"oauth_consumer_key": temp.consumer_key,
			"oauth_signature_method": "HMAC-SHA1"
		}
	};
	
	var accessor = {
		"consumerSecret": temp.consumer_secret
	};
	
	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, accessor);
	
	Request({
		"url": OAuth.addToURL(message.action, message.parameters),
		"onComplete": function(responce){
			var params = querystring.parse(responce.text);
			var token = params.oauth_token;
			var secret = params.oauth_token_secret;
			
			//取得したリクエストトークンを記憶
			temp.request_token = token;
			temp.request_token_secret = secret;
			
			//認証URLの生成
			var next_message = {
				"method": "GET",
				"action": settings.urls.authorize,
				"parameters": {
					"oauth_consumer_key": temp.consumer_key,
					"oauth_signature_method": "HMAC-SHA1",
					"oauth_token": token
				}
			};
			
			var next_accessor = {
				"consumerSecret": temp.consumer_secret,
				"oauth_token_secret": secret
			};
			
			OAuth.setTimestampAndNonce(next_message);
			OAuth.SignatureMethod.sign(next_message, next_accessor);
			
			//認証URLを開く
			tabs.open({
				"url": OAuth.addToURL(next_message.action, next_message.parameters),
				"onReady": function(tab){
					var url_info = parseUri(tab.url); //URLに含まれるクエリを取得
					var callback_url = parseUri(settings.urls.callback);
					
					if(url_info.host == callback_url.host && url_info.path == callback_url.path){
						var final_message = {
							"method": "GET",
							"action": settings.urls.access_token,
							"parameters":{
								"oauth_consumer_key": temp.consumer_key,
								"oauth_signature_method": "HMAC-SHA1",
								"oauth_token": temp.request_token,
								"oauth_verifier": uri_info.queryKey.oauth_verifier
							}
						};
						
						var final_accessor = {
							"consumerSecret": temp.consumer_secret,
							"tokenSecret": temp.request_token_secret
						};
						
						OAuth.setTimestampAndNonce(final_message);
						OAuth.SignatureMethod.sign(final_message, final_accessor);
						
						var accToken = Request({
							"url": OAuth.addToURL(final_message.action, final_message.parameters),
							"onComplete": function(responce){
								var params = querystring.parse(responce.text);
								
								//取得したOAuthのデータをsimple-storageに保存
								ss.storage.accounts[settings.service_name].consumer_key        = settings.consumer.key;
								ss.storage.accounts[settings.service_name].consumer_secret     = settings.consumer.secret;
								ss.storage.accounts[settings.service_name].access_token        = params.oauth_token;
								ss.storage.accounts[settings.service_name].access_token_secret = params.oauth_token_secret;
								
								delete ss.storage.oauth_temp[settings.service_name]; //一時記憶として利用したsimple-storageの値を削除
								tab.close(); //タブを閉じる
								ss.storage.oauth_state = "ok";
							}
						}).get();
					}
				}
			});
		}
	}).get();
}