var express = require("express");
var app = express();
const PORT = 8000;
app.listen(PORT, () => {
 console.log("Server running on PORT:",PORT);
});
var msg = "";

app.get("/tc_encode", (req, res,next) => {

    var  tc = "";
    var time_hop = req.query.time_hop? req.query.time_hop : 256;
    if(!req.query.tc_file) {
      msg += "No tabcode file specified!!";
      res.send(msg);
    }
    var  tc_file = decodeURIComponent(req.query.tc_file);
    fs=require('fs');
    tc = fs.readFileSync(tc_file, 'utf8');
    if(!tc) {
      msg += "No tabcode present!!\ntime_hop="+time_hop;
      res.send(msg);
    }
    else {
      var debug = false;
      var tab_json = [];

      const parser = require("./exports_parser.js");
      tab_json = parser.parse(tc, debug);
      const encode = require("./exports_label_harm_windows");
      var starti = encode.guessMetre(tab_json,false);
      msg = "";
      msg = encode.encodeTopNotes(tab_json, time_hop, starti, true);
      res.setHeader('content-type', 'text/plain');
      res.send(msg);
    }

});

app.post("/tc_encode", (req, res,next) => {
    var  tc = "";
    var msg = "";
//res.send(req.query.time_hop);
//msg = "req.query :\n"+req.query;
    var time_hop = req.query.time_hop? req.query.time_hop : 256;

/*
    fs=require('fs');
    tc = fs.readFileSync(decodeURIComponent(req.query.tc_file), 'utf8');
    if(!tc) {msg="No tabcode present!!\ntime_hop="+time_hop; res.send(msg);}
    else {

//      tc = decodeURIComponent(req.query.tabcode);
      var debug = false;
      var codestring = "";

      const parser = require("./exports_parser.js");
      var tab_json = parser.parse(tc, debug);

      const encode = require("./exports_label_harm_windows");
      var starti = encode.guessMetre(tab_json,false);
      codestring = encode.encodeTopNotes(tab_json, time_hop, starti, true);
msg += "codestring = "+codestring;
*/

     msg = "tc: "+req.query.tc+" time_hop "+req.query.time_hop

     res.setHeader('content-type', 'text/plain');
     res.send(msg);
/*    } */
});
