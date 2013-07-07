var {Cc, Ci, Cu, Cr} = require("chrome");
const IOService           = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const ScriptLoader        = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
const FileProtocolHandler = Cc["@mozilla.org/network/protocol;1?name=file"].getService(Ci.nsIFileProtocolHandler);
var ILocalFile = Ci.nsILocalFile;
var plugin_dir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);

var Tobeloo = require("./Tobeloo");

function simpleIterator(e, ifc, func){
	if(typeof(ifc)=='string')
	ifc = Components.interfaces[ifc];

	try{
		while(e.hasMoreElements()){
			var value = e.getNext();
			func(ifc? value.QueryInterface(ifc) : value);
		}
	} catch(e if e==StopIteration) {}
}

function getScriptFiles(dir){
	var scripts = [];
	simpleIterator(dir.directoryEntries, ILocalFile, function(file){
		if(file.leafName.match(/\.tblo\.js$/)){
			scripts.push(file);
		}
	});
	
	return scripts;
}

function loadSubScripts(files, global){
	global || (global = function(){});
	files = [].concat(files);
	
	var now = Date.now();
	for(var i=0,len=files.length ; i<len ; i++){
		// クエリを付加しキャッシュを避ける
		ScriptLoader.loadSubScript(
			FileProtocolHandler.getURLSpecFromFile(files[i]) + '?time=' + now, global, 'UTF-8');
	}
}

exports.loadPlugin = function(){
	var plugin_dir = "tobeloo";
	
	file.append(plugin_dir);
	if(!file.exists() || !file.isDirectory()){
		file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0664);
	}
	
	loadSubScripts(getScriptFiles(file), Tobeloo);
}