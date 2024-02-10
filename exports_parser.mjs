// Needs directory parsetab in same directory

// Parse a TabCode file and output minimal JSON data-structure
// for further analysis/voice-separation

exports.parse = function(data, debug) {
	const base = require("./parsetab/pt_include/base.js");
	const tabclasses = require("./parsetab/pt_include/tabclasses");
	const parser = require("./parsetab/pt_include/parser");
	const rules = require("./parsetab/pt_include/rules");
//        var json = {};
        var tab = "";
	var TCDoc = parseTCDoc(data,debug);
	TCDoc.make_Min_TabWords();
	var json = JSON.stringify(parser.Min_TabWords);
	tab = JSON.parse(json);
	function parseTCDoc(TC,debug){
		TabCodeDocument = new parser.Tablature(TC,debug);
		return TabCodeDocument;
	}
console.log("\tjson length = "+json.length+"\n\ttab_length = "+tab.length);
	return tab;
}
