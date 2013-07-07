var {Cc, Ci, Cu, Cr} = require("chrome");
const IOService    = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const ScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);

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