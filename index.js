const express = require("express");
app=express();
const PORT = 8000;
var server = app.listen(PORT, () => {
	console.log("Server running on PORT:",PORT);
});

// Require the upload middleware
const upload = require('./upload.js');

// Set up a route for file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  
  console.log("In POST!")
  console.log(req.query)
  // Handle the uploaded file
  res.json({ message: 'File uploaded successfully!' });
  
});

// end of multer stuff

const myLogger = function (req, res, next) {
	console.log('\nREQUEST RECEIVED '+ new Date().toUTCString());
	console.log(req.originalUrl);
	next()
}
app.use(myLogger);

// GLOBALS
var timehop = 256 ; // default
var msg = "";

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });

	if(req.query.upload) {
//		res.send("Upload is "+req.query.upload)
		console.log("In api GET upload")

	}
});
  
app.get('/',(req, res,next) => {
	var str="";
	if(req.query.timehop) {
		timehop = req.query.timehop
// 		console.log("Timehop now "+timehop+"\n")
	}
	if(req.query.encode) {
// 		console.log("In if(req.query.encode)")
		var resObj = encodeTC(req, res, next)
		str = resObj.codestring
		var tc_file = resObj.infile
// 		console.log(str)
		res.set('Content-Type', 'text/plain');
		if(!str.length) console.log(tc_file+" *** No output at timehop "+timehop)
		res.send(str+"\n");
	}
});

const test_tc_file = "../tc_test_files/LN39-3.tc"
var tc_file = test_tc_file; // will eventually be uploaded

var codestring = ""
const encodeTC = function(req, res, next) {
	var json = "";
	const fs = require('fs');
	const tabparse = require('./exports_parser.js');
	const encoding = require('./exports_label_harm_windows.js');
	var codestr = ""

// 	if(req.query.file) tc_file = "../tc_test_files/"+req.query.file
	if(req.query.file) tc_file = decodeURIComponent(req.query.file)
	console.log("File is "+tc_file)

	var tc = fs.readFileSync(tc_file, "utf8", function(err, data){	
		if(err) throw err;
	});
			
	json = tabparse.parse(tc)
	var starti = encoding.guessMetre(json,false);
	
	timehop = req.query.timehop	
	codestr = encoding.encodeTopNotes(json,timehop,starti,true)
// 	console.log(codestr)
// 	console.log("In encodeTC; timehop = "+timehop)
	

	var infile = function() {
		return "Input file is:<br>\n"+tc_file+"<br>\n";
	};
	var codestring = function() {
		return "codestring for "+tc_file+"("+timehop+") is:<br>\n"+codestr+"\n";
	};
	return {
		infile: tc_file,
		codestring: codestr
	}
};
