// No dependencies here, I hope. TC 15 Dec 2023
// This file just exports these functions:
// 		function exports.guessMetre 
// 		function exports.encodeTopNotes

var debug = false;
// var debug = true;

var best_Metre = "";
var upbeat = 0;
var chordObj_array = [];

 exports.guessMetre = function(tab, report) {
var starti = 0;
// console.log("tab.length in guessMetre = "+tab.length)
  // *** NB At present, this entirely ignores aLL RESTS which in principle will cause problems
  var barCount = 0;
  var chordCount = 0;
  var numBars = tab.length; // the whole piece - NB This is *not* the number of bars in it!
  var barDur = [];
  var durSum = 0;
  var firstChordIndex = 0;
  for (i = 0;  ((barCount <= numBars) && (tab[i].tType != "End")); i++) { // skips possible initial barline - grrrrr!
    if (tab[i].tType == "Barline") {
      barCount = tab[i].barNum - 1;
      if (barCount > numBars) break;
      if (durSum) {
        var beats = parseInt(durSum / 128);
        barDur.push({
          "barNum": barCount,
          "duration": durSum,
          "beats": beats
        })
      }
      durSum = 0;
      chordCount = 0;
    }
    else {
      if (tab[i].tType == "Chord") {
        chordCount++;
        durSum += tab[i].duration;
        if (firstChordIndex == 0) firstChordIndex = i;
      }
    }
  }
  barDur.push({
    "barNum": barCount,
    "duration": durSum,
    "beats": beats
  })

  var max = 0;
  var best = "";
  var result = findOcc(barDur, "beats")
  result.forEach((x) => {
    if (x.occurrence > max) {
      max = x.occurrence;
      best = x.beats;
    }
  });
  best_Metre = best
  if (report || debug) console.log("\tBest guess is " + parseInt(best_Metre) + " beats in bar (comes " + max + " times)")
  if (parseInt(barDur[0].beats) < parseInt(best)) {
    upbeat = barDur[0].duration;
    starti = nextBarlineIndex(tab,firstChordIndex);
    if (report || debug) console.log("\tUPBEAT! (" + upbeat + ")\n\tstarti = "+starti+" firstChordIndex = "+firstChordIndex);
  }

  function findOcc(arr, key) {
    let arr2 = [];
    arr.forEach((x) => {
      // Checking if there is any object in arr2
      // which contains the key value
      if (arr2.some((val) => {
          return val[key] == x[key]
        })) {
        // If yes! then increase the occurrence by 1
        arr2.forEach((k) => {
          if (k[key] === x[key]) {
            k["occurrence"]++
          }
        })
      }
      else {
        // If not! Then create a new object initialize 
        // it with the present iteration key's value and 
        // set the occurrence to 1
        let a = {}
        a[key] = x[key]
        a["occurrence"] = 1
        arr2.push(a);
      }
    })
    return arr2
  }
  var duration_offset = upbeat;
  var metre_type = (best_Metre % 3) ? "duple" : "triple";
//   if (debug || report) console.log("\tduration_offset = " + duration_offset + " metre_type = " + metre_type);
// console.log("starti is "+starti);
  return starti;
}

// A mess. Currently (18 July 2023) outputs notestring, rismstring (= notestring without octave) and interval codestring
// using top note of chords of duration >= time_hop .
 exports.encodeTopNotes = function(tab, time_hop, starti, use_windows) {
  var codestr = "";

  var chord = [];
// console.log("tab.length: "+tab.length);
  var old_debug = debug;
  //  debug = true;
  const MAX_DUR_INT = 512; // (arbitrary) maximum time interval for notes to sound
  var t = 0; //time offset in this bar
  var acc_t = 0; // total accumulated time
  var barNum = 0;
  var chordNum = 0;
  for (var i = 0; i < tab.length; i++) {
    switch (tab[i].tType) {
      case "Start":
      case "End":
        break;
      case "Barline":
        barNum = tab[i].barNum;
        t = 0;
        break;
      case "Chord":
        t = tab[i].time
        // Rests do not have TabNotes, so:
        if (typeof tab[i].TabNotes[0] != "undefined") {

          chord.push({
            index: i,
            time: t - upbeat, // in case there is an upbeat measure
            top_midiPitch: tab[i].TabNotes[0].midiPitch,
//             top_pitch: tab[i].TabNotes[0].morpheticPitch,
            top_pitch: dPD(tab[i].TabNotes[0].midiPitch),
            top_pitchname: diatonicPitchName((tab[i].TabNotes[0].midiPitch)),
            bottom_midiPitch: tab[i].TabNotes[tab[i].TabNotes.length - 1].midiPitch,
//             bottom_pitch: tab[i].TabNotes[tab[i].TabNotes.length - 1].morpheticPitch,
            bottom_pitch: dPD(tab[i].TabNotes[tab[i].TabNotes.length - 1].midiPitch),
            bottom_pitchname: tab[i].TabNotes[tab[i].TabNotes.length - 1].pitchName
          });
          chordNum++;
        }
        // update time *after* parsing Chord
        t = tab[i].duration;
        acc_t += t;
        break;
    }
  }

var old_debug = debug
// debug=!old_debug;
  if (debug) console.table(chord);
debug = old_debug;

  const BREAKPITCH = 60; // lowest pitch to be used in note-sequence
  if (debug) console.log(" BREAKPITCH: " + BREAKPITCH);
  var thenotes = "";
  var notestring = "";
  var rismstring = "";
  var lastpitch = 0;
  var alphabet = "abcdefghijklmnopqrstuvwxyz";
// console.log("chord.length: "+chord.length);
  for (p = 0; p < chord.length; p++) {
    if (use_windows && ((chord[p].time % time_hop) > 0)) continue; // only get pitches at start of windows
    var interval = 0;
    var int_symbol = "";
    if (debug) {
      console.log("top pitch: " + parseInt(chord[p].top_pitch))
    }
//     if ((parseInt(chord[p].top_pitch) - parseInt(BREAKPITCH)) < 0) {
//       if (debug) console.log(chord[p].top_pitch + " TOO LOW!!")
    if ((parseInt(chord[p].top_midiPitch) - parseInt(BREAKPITCH)) < 0) {
      if (debug) console.log(chord[p].top_midiPitch + " TOO LOW!!")
      continue
    };
    
    notestring += chord[p].top_pitchname + " ";
//     if (debug) console.log("Chord: "+p+" ps13 pitchName: "+ chord[p].top_pitchname)
//     notestring += PitchName_to_diatonicPitchName(chord[p].top_pitchname) + " ";
    rismstring += chord[p].top_pitchname.substr(0,1);
    if (p>0){ // no interval on first note!
	    interval = chord[p].top_pitch - lastpitch;
	    if (interval == 0) codestr += "-"
	    else if (interval < 0) int_symbol = alphabet.charAt((interval * -1) - 1);
	    else int_symbol = alphabet.charAt(interval - 1).toUpperCase();
	    codestr += int_symbol;
    }
    lastpitch = chord[p].top_pitch;
    if (debug) console.log(" interval: " + interval)
  
  }
//   if (notestring.length) {console.log("notestring");console.log(notestring)}
//   if (rismstring.length) {console.log("rismstring");console.log(rismstring)}
//   if (codestring.length) {console.log("codestring");console.log(codestring)}
//   if (codestring.length) {console.log(codestring)}
  if (debug) debug = old_debug;
  
  return codestr;
}

// Convert ps13 'PitchName' to diatonicPitchName as used in F-TEMPO ngram searches
function PitchName_to_diatonicPitchName(pitchname){
	// just remove accidental symbols like 'n', 'f', 's', 'ff', 'ss', etc.
	// so just output first and last chars
	var name = pitchname.split(""); // now an array
	var dpName = name[0].toLowerCase();
	var octave = name[name.length-1]; // assumes it's the last char and only <=9!!
	return dpName + octave;
}

// TC's old code, from ancient process.js
function dPD(midiPitch) { // Diatonic pitch degree
	const diatonics = "abcdefg";
	var octave = parseInt(((midiPitch) / 12)-1);
	var the_dPD = ((octave*7)+(diatonics.indexOf(diatonicPitchLetter(midiPitch))+5)%7);
	return the_dPD;
}
function diatonicPitchLetter(midiPitch,topCoursePitch) {
	if(typeof topCoursePitch == "undefined") topCoursePitch = 67; // Assume lute in G as default
	var noteNames = ["g","g","a","b","b","c","c","d","e","e","f","f",];	
 	var name = ""
 	if(midiPitch>=topCoursePitch) name = noteNames[((midiPitch - topCoursePitch) % 12)]
 	else name = noteNames[((midiPitch + topCoursePitch-2) % 12)]
	return name
}
function diatonicPitchName(midiPitch) {
// 	if(typeof topCoursePitch == "undefined") topCoursePitch = 67; // Assume lute in G as default
	var noteNames = ["c","c#","d","eb","e","f","f#","g","g#","a","bb","b"];	
	var name = noteNames[midiPitch % 12]
	var octave = parseInt((midiPitch) / 12 - 1)
	return(name + octave)
}
function diatonicPitch(dpitchname) {
 	var noteNames = ["c","d","e","f","g","a","b"];	
	var pitchletter = dpitchname.substr(0,1);
	var pitch = noteNames.indexOf(pitchletter);
	var octaveshift = (parseInt(dpitchname.substr(1))*7); 
// 	console.log("pitch of "+dpitchname+" is "+(pitch+octaveshift))
	return(pitch + octaveshift);
}

// The rest has been left commented out for future reference. TC 15 Dec 2023

/////////////////////////////////
//	Main processing functions //
/////////////////////////////////
/*
First an old function, encodeTopLine, which does *all* intervals through the piece.
This needs to be adapted to output top note only of first chord in window.
*/

/*
// encodeTopLine() (argv[2]="-t") encodes *chromatic* intervals in the highest-sounding note-sequence
function encodeTopLine(use_windows) {
  var old_debug = debug;
  //  debug = true;
  const MAX_DUR_INT = 512; // (arbitrary) maximum time interval for notes to sound
  var t = 0; //time offset in this bar
  var acc_t = 0; // total accumulated time
  var barNum = 0;
  var chordNum = 0;
  for (var i = 0; i < tab.length; i++) {
    switch (tab[i].tType) {
      case "Start":
      case "End":
        break;
      case "Barline":
        barNum = tab[i].barNum;
        t = 0;
        break;
      case "Chord":
        t = tab[i].time
        // Rests do not have TabNotes, so:
        if (typeof tab[i].TabNotes[0] != "undefined") {

          chord.push({
            index: i,
            time: t - upbeat, // in case there is an upbeat measure
            top_pitch: tab[i].TabNotes[0].midiPitch,
            bottom_pitch: tab[i].TabNotes[tab[i].TabNotes.length - 1].midiPitch
          });
          chordNum++;
        }
        // update time *after* parsing Chord
        t = tab[i].duration;
        acc_t += t;
        break;
    }
  }

  if (debug) console.table(chord);

  const BREAKPITCH = 55; // lowest pitch to be used in note-sequence
  if (debug) console.log(" BREAKPITCH: " + BREAKPITCH);
  var thenotes = "";
  var codestring = "";
  var lastpitch = 0;
  var alphabet = "abcdefghijklmnopqrstuvwxyz";

  for (p = 0; p < chord.length; p++) {
    if (use_windows && ((chord[p].time % time_hop) > 0)) continue; // only get pitches at start of windows
    var interval = 0;
    var int_symbol = "";
    if (debug) {
      console.log("top pitch: " + parseInt(chord[p].top_pitch))
    }
    if ((parseInt(chord[p].top_pitch) - parseInt(BREAKPITCH)) < 0) {
      if (debug) console.log(chord[p].top_pitch + " TOO LOW!!")
      continue
    };
    interval = chord[p].top_pitch - lastpitch;
    if (interval == 0) codestring += "-"
    else if (interval < 0) int_symbol = alphabet.charAt((interval * -1) - 1);
    else int_symbol = alphabet.charAt(interval - 1).toUpperCase();
    codestring += int_symbol;
    lastpitch = chord[p].top_pitch;
    if (debug) console.log(" interval: " + interval)
  }
  if (codestring.length) console.log(codestring)
  if (debug) debug = old_debug;
}

// analyseNotes just outputs basic matrix of time, time-in-bar, and midiPitches on courses
// as well as barline locations
function analyseNotes() {

  const C_major = [0.3333333, 0.05, 0.05, 0.05, 0.3333333, 0.05, 0.05, 0.3333333, 0.05, 0.05, 0.05, 0.05];
  const A_major = [0.05, 0.3333333, 0.05, 0.05, 0.3333333, 0.05, 0.05, 0.05, 0.05, 0.3333333, 0.05, 0.05];

  var duration_offset = upbeat;
  var t = 0; //time offset in this bar
  var acc_t = 0; // total accumulated time
  console.log("Start at time " + duration_offset)

  var barNum = 0;
  var barline = false;

  var chordNum = 0;
  for (var i = 0; i < tab.length; i++) {

    switch (tab[i].tType) {
      case "Start":
      case "End":
        break;
      case "Barline":
        barNum = tab[i].barNum;
        t = 0;
        barline = barNum; //next chord will be preceded by a barline
        break;
      case "Chord":
        t = tab[i].time

        if (barline) {
          chord.push({
            index: i,
            time: t - duration_offset,
            notes: [],
            barline: barline
          });
          barline = false;
        }
        else chord.push({
          index: i,
          time: t - duration_offset,
          notes: []
        });
        chordNum++;

        //	NB Remember! Actual course-number is (TabNotes array-index + 1)!
        for (var j = 0; j < tab[i].TabNotes.length; j++) {
          if (typeof tab[i].TabNotes[j].midiPitch != "undefined") {
            chord[(chord.length - 1)].notes.push({
              "course": tab[i].TabNotes[j].course,
              "midiPitch": tab[i].TabNotes[j].midiPitch
            });
          }
        }

        // update time *after* parsing Chord
        t = tab[i].duration;
        acc_t += t;
        break;
    }
  }

  window = (process.argv[3] == "-w"); // FIXME!! Needs proper getopts
  if (window) {
    w_time_hop = process.argv[4];
    if (debug) console.log("w_time_hop: " + w_time_hop)
  }

  var bar_offset = 0;
  for (p = 0; p < chord.length; p++) {
    var active_courses = chord[p].notes.length
    var start = 0;
    var thenotes = ""
    var q = 0

    if (chord[p].barline) {
      bar_offset = chord[p].time;
      if (window) console.log("------------------   (bar " + (chord[p].barline + 1) + ")");
      else console.log(chord[p].index + " " + chord[p].time + " " + (chord[p].time - bar_offset) + "   ------------------(bar " + (chord[p].barline + 1) + ")");
      // 			continue;
    }
    for (; q < active_courses; q++) {
      var n = start;
      while (n < (chord[p].notes[q].course - 1)) {
        thenotes += "-- "
        n++
      }
      thenotes += chord[p].notes[q].midiPitch + " "
      start = n + 1
    }
    while ((n + 1) < 6) { // FIXME need to handle bass notes!!
      thenotes += "-- ";
      n++
    }

    console.log(chord[p].index + "\t" + chord[p].time + " " + (chord[p].time - bar_offset) + "\t" + thenotes);
  }
}
*/

/*
  guessMetre does what it says, rather crudely.
  // *** NB At present, this entirely ignores aLL RESTS which in principle will cause problems
*/

/*
const maj_min_triads = [{
    "pcs": "0 4 7",
    "name": "C",
    "order": 11,
    "dist": 0
  },
  {
    "pcs": "0 4 9",
    "name": "a",
    "order": 12,
    "dist": 1
  },
  {
    "pcs": "0 5 9",
    "name": "F",
    "order": 13,
    "dist": 2
  },
  {
    "pcs": "2 5 9",
    "name": "d",
    "order": 14,
    "dist": 3
  },
  {
    "pcs": "2 5 10",
    "name": "Bb",
    "order": 15,
    "dist": 4
  },
  {
    "pcs": "2 7 10",
    "name": "g",
    "order": 16,
    "dist": 5
  },
  {
    "pcs": "3 7 10",
    "name": "Eb",
    "order": 17,
    "dist": 6
  },
  {
    "pcs": "0 3 7",
    "name": "c",
    "order": 18,
    "dist": 7
  },
  {
    "pcs": "0 3 8",
    "name": "Ab",
    "order": 19,
    "dist": 8
  },
  {
    "pcs": "0 5 8",
    "name": "f",
    "order": 20,
    "dist": 9
  },
  {
    "pcs": "1 5 8",
    "name": "C#",
    "order": 21,
    "dist": 10
  },
  {
    "pcs": "1 5 10",
    "name": "bb",
    "order": 22,
    "dist": 11
  },
  {
    "pcs": "1 6 10",
    "name": "F#",
    "order": 23,
    "dist": 12
  },
  {
    "pcs": "3 6 10",
    "name": "eb",
    "order": 0,
    "dist": 11
  },
  {
    "pcs": "3 6 11",
    "name": "B",
    "order": 1,
    "dist": 10
  },
  {
    "pcs": "3 8 11",
    "name": "ab",
    "order": 2,
    "dist": 9
  },
  {
    "pcs": "4 8 11",
    "name": "E",
    "order": 3,
    "dist": 8
  },
  {
    "pcs": "1 4 8",
    "name": "c#",
    "order": 4,
    "dist": 7
  },
  {
    "pcs": "1 4 9",
    "name": "A",
    "order": 5,
    "dist": 6
  },
  {
    "pcs": "1 6 9",
    "name": "f#",
    "order": 6,
    "dist": 5
  },
  {
    "pcs": "2 6 9",
    "name": "D",
    "order": 7,
    "dist": 4
  },
  {
    "pcs": "2 6 11",
    "name": "b",
    "order": 8,
    "dist": 3
  },
  {
    "pcs": "2 7 11",
    "name": "G",
    "order": 9,
    "dist": 2
  },
  {
    "pcs": "4 7 11",
    "name": "e",
    "order": 10,
    "dist": 1
  }
];

var triads_list=[];
var dist_triads_list = [];
function labelHarmonies() {
  var old_debug = debug
  debug = true;

  pitch_classes(starti)
//   if (debug) console.log("\nchordObj_array is now: ")
//   if (debug) console.table(chordObj_array);
  
  var old_debug=debug;
  var beat_indices = getStarts(chordObj_array, time_hop)
//    	console.table(beat_indices); process.exit();
//   	console.table(chordObj_array); process.exit();
  debug=old_debug;
  
  var old_debug=debug;
  debug = false;
  var triads=[];
  
    // get the pitch_classes here	
  let contexts = [];

//   let just_first_chord_in_window = true;
  
  for (x = 0; x < beat_indices.length - 1; x++) {
    let y = 0;
    let offset = 0;
//     if (debug) console.log("\nwindow "+x + " time: " + beat_indices[x + y].time);
    let context = new Array(24);
    context.fill(0.0);
    
     var found_triad=false;
//      let just_first_chord_in_window = false;
	if (process.argv[4]=="spread") just_first_chord_in_window = false;

//     Just get the notes for context from first chord in window:
    if (just_first_chord_in_window) {
        let pcs = chordObj_array[(beat_indices[x].index)].pcs;
//         if (debug) console.log("\t" +  pcs);
        for (p in pcs) {
//           if (debug) console.log(pcs[p] + "\t");
          for (t in maj_min_triads) {
              if(maj_min_triads[t].pcs==pcs.join(" ")) {
			    if(!found_triad) {
// 				    console.log("TRIAD HERE: "+maj_min_triads[t].name)
				    triads.push({"time":beat_indices[x + y].time, "name":maj_min_triads[t].name, "pos":t})
				    found_triad=true;
			    }
			    else {  // i.e. note or chord here does not complete a triad
			    }
              }
          }
        }
    }
//     Alternatively, account for contribution of later notes in the window:
    else {
 old_debug=debug;
 debug=false;
//  	if(debug) console.table(beat_indices)
      let pcs = [];

      // Go through window:
      while (beat_indices[x].index + y < beat_indices[x + 1].index) {
        offset = chordObj_array[(beat_indices[x].index + y)].time - beat_indices[x].time;

        // Gather all pcs in window, and identify possible triads; output these triads:
        let local_pcs = chordObj_array[(beat_indices[x].index + y)].pcs;
//         if(debug) console.log("At x="+x+" y="+y+" adding local_pcs "+local_pcs+" to "+pcs)
         pcs = add_and_sort(pcs,local_pcs);
//         if(debug) console.log("pcs now: "+pcs.join(" "));
        find_triads_in_pc_list(pcs);
//        if(debug) console.table(pcs);
        for(t in maj_min_triads)if(maj_min_triads[t].pcs==pcs.join(" ")) {
// 		   if(y==1) {
		   	// Avoid outputting first triad twice
		   	if(chordObj_array[(beat_indices[x].index)].pcs.join(" ")!==chordObj_array[(beat_indices[x+y].index)].pcs.join(" "));
			    triads.push({"time":beat_indices[x + y].time, "name":maj_min_triads[t].name, "pos":t})
			   triads_list.push(maj_min_triads[t].name);
			   dist_triads_list.push(maj_min_triads[t].dist);
			   if(debug)console.log(" TRIAD "+maj_min_triads[t].name+ " in "+beat_indices[x].time+" window")
// 		   }
        }
        y++;
      }
    }
debug=old_debug;
  }  

  var codestring=""; 
  var shift_string="";
  var int_symbol="";
  var alphabet = "abcdefghijklmnopqrstuvwxyz";
  
  if(just_first_chord_in_window){
  if(debug)  console.log(triads)
	  for(p=1;p<triads.length;p++) {
		shift_string+=(triads[p-1].pos - triads[p].pos)+ " "  	
	    var interval = (triads[p-1].pos - triads[p].pos);
	    if (interval == 0) codestring += "-"
	    else if (interval < 0) int_symbol = alphabet.charAt((interval * -1) - 1);
	    else int_symbol = alphabet.charAt(interval - 1).toUpperCase();
	    codestring += int_symbol;
	  }
}
	else {
  console.log(triads)
  console.log(triads_list)
  console.log(dist_triads_list)
  	  for(p=1;p<dist_triads_list.length;p++) {
	    var interval = (dist_triads_list[p-1] - dist_triads_list[p]);
	    if (interval == 0) {
		    int_symbol = "-"
	    }
	    else {
		    if (interval < 0) {
			    int_symbol = alphabet.charAt((interval * -1) - 1);
		    }
		    else {
			    int_symbol = alphabet.charAt(interval - 1).toUpperCase();
		    }
		}
	    codestring += int_symbol;
	  }
  }
  console.log(codestring)


  debug = old_debug;
}

function triads(arr) {
	test_triads.length = 0;
	len = arr.length;
	reset(0);
	for(start=0;loc3<len;start++) {
		for(loc2=loc1+1;loc2<len-1;loc2++) {
			for(loc3=loc2+1;loc3<len;loc3++) {
				printout();
			}
		}
		loc1++;
		reset(loc1);
	}
	function reset(start) {
		loc1=start;loc2=loc1+1;loc3=loc2+1;
	}
	function printout() {
		test_triads.push(arr[loc1]+" "+arr[loc2]+" "+arr[loc3]);
// 		console.log("\t"+arr[loc1]+" "+arr[loc2]+" "+arr[loc3]);
	}
}
let test_triads = [];
function find_triads_in_pc_list(pcs) {
	triads(pcs);
	for(y in test_triads) {
// 		console.log(" Testing "+ test_triads[y]+"")
		var name="";
		if(name=name_triad_in_majmin_arr(test_triads[y])) {
			triads_list.push(name)
			if(debug) console.log("TRIAD FOUND: "+name)
		}
	}
}
function triad_in_majmin_arr(value) {
  var result  = maj_min_triads.filter(function(o){return o.pcs == value;} );
  return result? result[0] : null; // or undefined
}
function name_triad_in_majmin_arr(value) {
  for (var i=0, iLen=maj_min_triads.length; i<iLen; i++) {
    if (maj_min_triads[i].pcs == value) return maj_min_triads[i].name;
  }
}
// Add elements of arr2 to arr1 and then sort arr1. NB arr1 must exist!
function compareNumbers(a, b) {
  return a - b;
}
function add_and_sort(arr1,arr2) {
	for(var x in arr2) {
		if(!arr1.includes(arr2[x])) arr1.push(arr2[x]); 
// 		else console.log(arr2[x]+" in pcs array!!")
	}
 	return arr1.sort(compareNumbers);
//	return arr1;
}

// const {
//   kldivergence
// } = require('./math.js');
var BACKGROUND = 0.00001; // very small background for null values

function encodeHarmonies(relative) {
  if (!relative) {
    var C_context = get_context("0 4 7".split(" "))
    var C_distrib = normalise_context(C_context);
  }
  
  pitch_classes(starti)
  if (debug) console.log("\nchordObj_array is now: ")
  if (debug) console.table(chordObj_array);
  var beat_indices = getStarts(chordObj_array, time_hop)

     let just_first_chord_in_window = true;
	if (process.argv[4]=="spread") just_first_chord_in_window = false;
//     Just get the notes for context from first chord in window:
if(debug){
    if (just_first_chord_in_window) {
    		 console.log("Just first chord in windows")
	 }
	 else {
		console.log("All chords in windows") 
	 }  
}     
  // get the pitch_classes here	
  let contexts = [];
  for (x = 0; x < beat_indices.length - 1; x++) {
debug=false;    
if(debug)console.log("****\nGetting values for beat index "+x )
    let y = 0;
    let offset = 0;
    if (debug) console.log(x + " " + beat_indices[x + y].time);
    let context = new Array(24);
    context.fill(0.0);
    if (just_first_chord_in_window) {
        offset = 0;
        let pcs = chordObj_array[(beat_indices[x].index)].pcs;
        if (debug) console.log("\t" +  pcs);
        for (p in pcs) {
          if (debug) console.log(pcs[p] + "\t");
          for (t in maj_min_triads) {
            if (maj_min_triads[t].pcs.split(" ").includes(pcs[p].toString())) {
              if (debug) console.log("TRIAD " + t + "(" + maj_min_triads[t].name + ")" + " contains " + pcs[p])
              if (debug) console.log("\tdistance: " + chord_distance(t, pcs[p]) + " " + (1 / (chord_distance(t, pcs[p]) + 1)))
//               context[t] += (1 / (chord_distance(t, pcs[p]) + 1));
              context[t] += chord_distance(t, pcs[p]);
//               if (debug) console.log(context)
            }
          }
        }
    }
//     Alternatively, account for contribution of later notes in the window:
    else {      
      while (beat_indices[x].index + y < beat_indices[x + 1].index) {
if(debug)console.log("****\nGetting values for beat index "+x )
        offset = chordObj_array[(beat_indices[x].index + y)].time - beat_indices[x].time;
        let pcs = chordObj_array[(beat_indices[x].index + y)].pcs;
//        let reduction_factor = reduction(offset,time_hop);
//         let reduction_factor = reduction_by_duration(beat_indices[x].index + y);
//          let reduction_factor = reduction_by_both(beat_indices[x].index + y,offset,time_hop);
         let reduction_factor = 1;
        for (p in pcs) {
          if (debug) console.log(pcs[p] + "\t" + reduction_factor);
          for (t in maj_min_triads) {
            if (debug) console.log("TRIAD " + t)
            if (maj_min_triads[t].pcs.split(" ").includes(pcs[p].toString())) {
              if (debug) console.log("triad " + t + "(" + maj_min_triads[t].name + ")" + " contains " + pcs[p])
              if (debug) console.log("\tdistance: " + chord_distance(t, pcs[p]) + " " + reduction_factor * (1 / (chord_distance(t, pcs[p]) + 1)))
//               context[t] += reduction_factor * (1 / (chord_distance(t, pcs[p]) + 1));
              context[t] += chord_distance(t, pcs[p]);
//               if (debug) console.log(context)
            }
          }
        }
        y++;
      }
   }
    contexts.push(normalise_context(context));
  }
//   if(debug)console.table(contexts)
debug=false;  
  let KLD = [];
  if (relative) {
    for (q = 0; q < contexts.length - 1; q++) {
      KLD.push(KLdist(contexts[q], contexts[q + 1]))
    }
  }
  else {
    for (q in contexts) {
      var kld = KLdist(contexts[q], C_distrib)
      KLD.push(kld);
    }
  }
  console.dir(KLD, {
    'maxArrayLength': null
  })
  // 	console.log(KLD);

  // get appropriate time-based reduction factor
  // dt is time-offset within window of duration win.
  // first effort 30/8/22 returns ((win-dt)/win)
  // Maybe better to be beat-based? Not sure.
  function reduction(dt, win) {
    return (win - dt) / win;
  }
  // An alternative (there are many) is to reduce in inverse proportion to  
  // duration of chords in the window after the first chord:
  function reduction_by_duration(index) {
    var reduction_factor = chordObj_array[index].dur / time_hop;
    return reduction_factor;
  }
  // How about both? This is what I'm now doing (from 22Apr2023)
  function reduction_by_both(index,dt,win) {
    var reduction_factor = ((win - dt) / win)*(chordObj_array[index].dur / time_hop);
    return reduction_factor;
  }
     

  function KLdist(a, b) { // a and b must be normalised probability distributions
    var div = kldivergence(a, b) + kldivergence(b, a);
//     var div = kldivergence(a, b);
    if (isNaN(div)) {
      // 			console.log("NaN in KLdist!! a="+a+" b="+b); // I think it's caused by empty windows ???
      return false;
    }
    return div;
  }

}

function justDoKLD(contexts, relative) {

  if (!relative) {
    var C_context = get_12d_context("0 4 7".split(" "))
    var C_distrib = normalise_context(C_context);
  }

  let KLD = [];
  if (relative) {
//   We're looking for distances *between* the contexts, so start at the second, ie q=1
    for (q = 1; q < contexts.length - 1; q++) {
      KLD.push(KLdist(contexts[q], contexts[q + 1]))
    }
  }
  else {
    for (q in contexts) {
      var kld = KLdist(contexts[q], C_distrib)
      KLD.push(kld);
    }
  }
  console.dir(KLD, {
    'maxArrayLength': null
  })
  

  function KLdist(a, b) { // a and b must be normalised probability distributions
//     var div = kldivergence(a, b) + kldivergence(b, a);
    var div = kldivergence(a, b);
    if (isNaN(div)) {
      // 			console.log("NaN in KLdist!! a="+a+" b="+b); // I think it's caused by empty windows ???
      return false;
    }
    return div;
  }

}

function get_context(pc_arr) {
  var context = Array(24); //24-d array, one for each triad. 
  //  if(debug) console.log("In get_context: pc_arr: " + pc_arr)
  context.fill(0);
  for (i = 0; i < 24; i++) { // elements in context distribution
    var shared_notes = notes_shared(pc_arr, i, window);
    var distance_sum = 0;
    for (j = 0; j < 11; j++) { // all pitch classes in pcs
      for (k = 0; k < 24; k++) {
        distance_sum += chord_distance(k, j)
      }
    }
    if (shared_notes) context[i] = shared_notes / ((12 * distance_sum) + 1);
  }
  //  if(debug) console.log("In get_context: context: " + context)
  return context;
}
function get_12d_context(pc_arr) {
  var context = Array(12); //24-d array, one for each triad. 
  //  if(debug) console.log("In get_context: pc_arr: " + pc_arr)
  context.fill(0);
  for (i = 0; i < 12; i++) { // elements in context distribution
    var shared_notes = notes_shared(pc_arr, i, window);
    var distance_sum = 0;
    for (j = 0; j < 11; j++) { // all pitch classes in pcs
      for (k = 0; k < 12; k++) {
        distance_sum += chord_distance(k, j)
      }
    }
    if (shared_notes) context[i] = shared_notes / ((12 * distance_sum) + 1);
  }
  //  if(debug) console.log("In get_context: context: " + context)
  return context;
}
// Here we should use Krumhansl 4-d distances, but this will do for now
function chord_distance(e, rot) {
  return Math.abs(maj_min_triads[e].dist - rot);
//    return Math.abs(e - rot);
}

function notes_shared(the_pcs, lexicon_index, window) {
  var notes_shared = 0;
//   if(debug) console.log("\tIn notes_shared " + the_pcs)
if (!the_pcs) return false;
for (p = 0; p < the_pcs.length; p++) {
  var this_chord = maj_min_triads[lexicon_index].pcs.split(" ");
  if (this_chord.includes((the_pcs[p].toString()))) notes_shared++;
}
return notes_shared;
}

//   normalise_context also substitutes a background very small number for zero values
function normalise_context(context) {
  var total = 0.00;
  var norm = [];
  for (i = 0; i < context.length; i++) {
    if (context[i] > 0) norm.push(context[i]);
    else {
      norm.push(BACKGROUND);
    }
    total += context[i];
  }
  for (i = 0; i < norm.length; i++) {
    norm[i] /= total;
  }
  return norm;
}

function getStarts(arr, hop) {
  debug=false;
  var starts = []; // array of indices to be returned - i.e. starts of windows
  var start_time = arr[0].time;
  var start = 0;
  var final_time = arr[arr.length - 1].time;
  var count = 0
  if (debug) console.log("start_time: " + start_time + " final_time: " + final_time + " window " + hop)
  var i = 0;
  for (t = start_time; t <= final_time; t += hop) {
    var index = soundingChordAtTime(arr, t, final_time)
    if ((index === false) || (typeof index == "undefined")) break;
    if (debug) console.log("index now " + index)
    var now = arr[index].time
    start = index;
    starts.push({
      index: i,
      time: now
    });
    if (debug) console.log("Entering index " + index + " in array")
  }
  return starts;

  function soundingChordAtTime(arr, t, end) { // returns index, not chord!
    if (debug) console.log("Finding sounding chord at time: " + t)
    for (i = 0; i < arr.length; i++) {
      if (arr[i].time == t) {
        if (debug) console.log("\treturning " + i)
        return i;
      }
      else if (arr[i].time > t) {
        if (debug) console.log("time at i=" + i + " is " + arr[i].time + " so returning i-1: " + (i - 1))
        return i - 1;
      }
      if (i >= arr.length - 1) {
        if (debug) console.log("\tOff the end so returning false")
        return false;
      }
    }
  }
}

const time_hop = parseInt(process.argv[3] ? process.argv[3] : 256);
// var starti = 0;

// pitch_classes(starti) (argv[2]="-p") outputs both the complete maj/min triads, and the 
// sets of pitch-classes encountered in a sliding window of duration time_hop (default 
// 256), as a first step towards computing chord labels taking account of isolated notes.
//  NB Collection of pcs begins at starti, which may be the index of the first chord of
// the *second* bar if the piece begins with a barline and/or global variable 'upbeat' > 0.

function pitch_classes(starti,only_pcs) { // if(only_pcs) it outputs just these as json, nothing else
  var chordNum = 0;

  for (var i = starti; i < tab.length; i++) {
    var t = 0; //time offset in this bar
    var acc_t = 0; // total accumulated time
    var barNum = 0;
    switch (tab[i].tType) {
      case "Start":
      case "End":
        break;
      case "Barline":
        barNum = tab[i].barNum;
        t = 0;
        break;
      case "Chord":
        t = tab[i].time
        if (barNum) {
          chord.push({
            index: i,
            time: t - duration_offset,
            notes: [],
            barline: barline
          });
          break;
        }
        chord.push({
          index: i,
          time: t,
          dur: tab[i].duration,
          notes: []
        });
        chordNum++;
        //	NB Remember! Actual course-number is (TabNotes array-index + 1)!
        for (var j = 0; j < tab[i].TabNotes.length; j++) {
          if (typeof tab[i].TabNotes[j].midiPitch != "undefined") {
            chord[(chord.length - 1)].notes.push({
              "course": tab[i].TabNotes[j].course,
              "midiPitch": tab[i].TabNotes[j].midiPitch
            });
          }
        }
        // update time *after* parsing Chord
        t = tab[i].duration;
        acc_t += t;
        break;
    }
  }
  for (p = 0; p < chord.length; p++) {
    var active_courses = chord[p].notes.length
    var start = 0;
    var thenotes = [];
    var q = 0
    for (; q < active_courses; q++) {
      //    console.log("\tNote "+q+" on course "+chord[p].notes[q].course+": "+chord[p].notes[q].midiPitch)
      var n = start;
      while (n < (chord[p].notes[q].course - 1)) {
        n++
      }
      if (chord[p].notes[q].midiPitch)
        if (!thenotes.includes(chord[p].notes[q].midiPitch % 12)) {
          thenotes.push(chord[p].notes[q].midiPitch % 12);
        }
      start = n + 1
    }
    if (thenotes.length) {
      var thenotes_sorted = thenotes.sort((a, b) => a - b);
      if(only_pcs) {
		 var pcstring=thenotes_sorted.join(" ");
 //		 var chordObj = {  "pcs": pcstring };
		 var chordObj = pcstring;
      }
      else {
		 var chordObj = {
		   "tab_index": chord[p].index,
		   "time": chord[p].time,
		   "dur": chord[p].dur,
		   "pcs": thenotes_sorted
		 };
      }
      chordObj_array.push(chordObj);
    }
  }
}

function getIndexFromChordTime(time) {
  for (var i = 0; i < chordObj_array.length; i++) {
    if (debug) console.log(i + " **Time now: " + chordObj_array[i].time)
    if ((i != false) && (chordObj_array[i].time > time)) {
      if (debug) console.log("\t** Seeking time " + time + " Found later time " + chordObj_array[i].time + " at index " + i)
      return i - 1;
    }
  }
  if (debug) console.log("Didn't find time " + time + " in chordObj_array")

  return false
}
*/
function nextBarlineIndex(tab,i) {
  for (k = i; k < tab.length; k++) {
    if (tab[k].tType == "Barline") return k;
  }
}

