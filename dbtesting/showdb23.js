var MongoClient = require('mongodb').MongoClient;

MongoClient.connect("mongodb://localhost:27017/db23", function(err, db) {
  if(!err) {
    console.log("We are connected.");
  }
  var userdata = db.collection('userdata');

	userdata.find().toArray(function(err, result) {
		if (err) {
    		console.log(err);
  		} else if (result.length) {
    		console.log('Found:', result);
  		}
	});
});
