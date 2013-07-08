exports.SDK = {
	"require": function(str){
		return require(str);
	},
	
};

exports.lib = {
	"OAuth": require("./oauth").OAuth,
	"OAuthAuthencation": require("./OAuthAuthencation").exec,
	"parseUri": require("./parseuri").parseUri,
};

exports.system = {
	
};