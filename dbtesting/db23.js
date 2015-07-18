var MongoClient = require('mongodb').MongoClient;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/db23", function(err, db) {
  if(!err) {
    console.log("We are connected.");
  }
  var userdata = db.collection('userdata');
  // userdata.remove({}); //clear database
  // userdata.insert({name:'a', wins:10, losses:3});
  // userdata.insert({name:'b', wins:3, losses:3});
  // userdata.insert({name:'c', wins:6, losses:1});
  // userdata.insert({name:'d', wins:11, losses:4});
  // userdata.insert({name:'e', wins:5, losses:4});
  // userdata.insert({name:'f', wins:10, losses:3});
  // userdata.insert({name:'g', wins:0, losses:3});
  // userdata.insert({name:'h', wins:9, losses:1});
  // userdata.insert({name:'i', wins:1, losses:4});
  // userdata.insert({name:'j', wins:5, losses:4});

	userdata.find().limit(1).sort({
		"wins": -1
	}).toArray(function(err, result) {
		if (err) {
    		console.log(err);
  		} else if (result.length) {
    		console.log('Found:', result);
  		}
	});

	// userdata.update({ name: 'd' },
 //   				{ $inc: { wins: 1}});

  // userdata.find({name: 'Z'}).toArray(function(err, result) {
  // 	if (err) {
  //       console.log(err);
  //     } else if (result.length) {
  //       console.log('Found:', result);
  //     }
  // });

  // console.log(userdata.count());
  // var a = new Array();
  // a = (userdata.find().toArray());
  // for (i = 0; i < a.length; i++) {
  // 	console.log(i);
  // }
  // print (userdata.find());
});