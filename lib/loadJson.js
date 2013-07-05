var self    = require('sdk/self');

exports.loadJson = function(filename){
	return JSON.parse(self.data.load(filename));
}