var debug = false;

var tc_file = "";
if(process.argv.length > 2) tc_file = process.argv[2];
else {
	console.log("\tNo tabcode file given!!");
	console.log("\tUsage: node run.js tc_filename.tc time_hop");
	console.log("\twhere time_hop is from 64 96 128 192 256 384 512 768 or 1024");
	console.log("\tdefault 256");
	process.exit();
}
var time_hop = parseInt(process.argv[3] ? process.argv[3] : 256);

const parser = require("./exports_parser.js");
var tab_json = parser.parse(tc_file, debug);
// console.table(tab_json)

const encode = require("./exports_label_harm_windows");
starti = encode.guessMetre(tab_json,false);
var codestring = encode.encodeTopNotes(tab_json, time_hop, starti, true);
console.log(codestring)
process.exit()