var authencation = require("./OAuthAuthencation").exec;
var loadJson     = require("./loadJson").loadJson;

function getConsumer(){
	return loadJson("twitter_consumer.json");
}

exports.exec = function(){
	authenction({
		"urls": {
			"request_token": "https://api.twitter.com/oauth/request_token",
			"authorize": "https://api.twitter.com/oauth/authorize",
			"access_token": "https://api.twitter.com/oauth/access_token",
			"callback": "http://www16.atpages.jp/rikuta0209/tobeloo/auth.php"
		},
		"consumer": getConsumer(),
		"service_name": "twitter"
	});
}