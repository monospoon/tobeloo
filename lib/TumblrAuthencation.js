var authencation = require("./OAuthAuthencation").exec;
var loadJson     = require("./loadJson").loadJson;

function getConsumer(){
	return loadJson("tumblr_consumer.json");
}

exports.exec = function(){
	authenction({
		"urls": {
			"request_token": "http://www.tumblr.com/oauth/request_token",
			"authorize": "http://www.tumblr.com/oauth/authorize",
			"access_token": "http://www.tumblr.com/oauth/access_token",
			"callback": "http://www16.atpages.jp/rikuta0209/tobeloo/auth.php"
		},
		"consumer": getConsumer(),
		"service_name": "tumblr"
	});
}