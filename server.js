var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

// var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;// set the port
// var ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
http.listen(3000);

var INT_MAX = 1999999999;
var number = 0;

function randomBW(l, u) {	//generate random numbers from l to (u - 1)
	return parseInt(Math.random() * (u - l) + l);
}

io.on('connection', function(socket) {

	function getClientsInRoomOfSocket(s) {
		return io.sockets.adapter.rooms[s.room];
	}
	
	socket.getNumberClientsInRoom = function() {
		var room = io.sockets.adapter.rooms[this.room];
		return (Object.keys(room).length);
	}

	socket.getOtherSocketInRoomWithTwoSockets = function() {
		var clients = getClientsInRoomOfSocket(socket);
		for (var clientId in clients) {
			var clientSocket = io.sockets.connected[clientId];
		    if (clientSocket != socket) {
		    	return clientSocket;
		    }
		}
	}

	socket.on('fetch leaderboard', function() {
		MongoClient.connect("mongodb://localhost:27017/db23", function(err, db) {
			if(!err) {
				var userdata = db.collection('userdata');
				userdata.find().limit(10).sort({
	   			 	"wins": -1
				}).toArray(function(err, result) {
					if (err) {
				    	console.log(err);
				  	} else if (result.length) {
				    	socket.emit('fetch leaderboard', result);
				  	}
				});
			}
		});
	});

	socket.on('user connected', function(msg) {
		number++;
		if (number > INT_MAX) {
			number = 0;
			return ;
		}
		socket.username = msg;
		socket.room = (parseInt((number - 1) / 2)) + '';
		socket.begin = false;
		socket.join(socket.room);
		socket.player = socket.getNumberClientsInRoom();
		if (socket.player == 1) {
			socket.randomNum = [randomBW(20, 46), 1, randomBW(2, 5), 5, randomBW(6, 8)];
		}
		console.log(socket.username + " joined.\tRoom : " + socket.room + "\tPlayer : " + socket.player + "\t" + socket.begin);
		findOrCreate(socket.username);
	});

	socket.on('begin', function() {	//when begin button is clicked
		socket.begin = true;
		if (socket.getNumberClientsInRoom() == 2) {
			
			var clients = getClientsInRoomOfSocket(socket);
			for (var clientId in clients) {
				var clientSocket = io.sockets.connected[clientId];
			    if (!clientSocket.begin) {
			    	return ;
			    }
			}

			for (var clientId in clients) {
			    var clientSocket = io.sockets.connected[clientId];
			    if (clientSocket.player == 2) {
			    	clientSocket.randomNum = (clientSocket.getOtherSocketInRoomWithTwoSockets()).randomNum;
			    	console.log(clientSocket.randomNum);
			    }
			    clientSocket.emit('begin', clientSocket.player, clientSocket.randomNum);
			}
		}
	});

	socket.on('move made', function(msg) {
		console.log(msg.playerNum + "\t" + msg.move + "\t" + msg.total);

		var clients = getClientsInRoomOfSocket(socket);
		for (var clientId in clients) {
		    var clientSocket = io.sockets.connected[clientId];
		    if (clientSocket.player != msg.playerNum) {
				clientSocket.emit('give turn', msg.move);
			    if (msg.total == clientSocket.randomNum[0]) {
			    	clientSocket.emit('winner', msg.playerNum);
			    }
		    }
		}

		if (msg.total == clientSocket.randomNum[0]) {
			for (clientId in clients) {
				var clientSocket = io.sockets.connected[clientId];
			    clientSocket.begin = false;
				if (clientSocket.player == msg.playerNum) {
					console.log(clientSocket.username + " wins inc.");
					incWins(clientSocket.username);
				} else {
					console.log(clientSocket.username + " losses inc.");
					incLosses(clientSocket.username);
				}
			}
		}

	});

	socket.on('disconnect', function() {
		if (socket.begin) {
			var clients = getClientsInRoomOfSocket(socket);
			for (clientId in clients) {
				incLosses(socket.username);
				var clientSocket = io.sockets.connected[clientId];
			    clientSocket.begin = false;
				if (clientSocket.player != socket.player) {
					console.log(clientSocket.username + " wins inc.");
					incWins(clientSocket.username);
				}
			}
		}
		socket.broadcast.to(socket.room).emit('opp disconnected');
		console.log(socket.username + " disconnected.");
	});
});

function incWins(username) {
	console.log('adding win for ' + username);
	MongoClient.connect("mongodb://localhost:27017/db23", function(err, db) {
		if (!err) {	
			var userdata = db.collection('userdata');
			userdata.update({ name: username },
   							{ $inc: { wins: 1}});
		}
	});
}

function incLosses(username) {
	console.log('adding losses for ' + username);
	MongoClient.connect("mongodb://localhost:27017/db23", function(err, db) {
		if (!err) {
			var userdata = db.collection('userdata');
			userdata.update({ name: username },
   						{ $inc: { losses: 1}});
		}
	});
}

function findOrCreate(username) {
	MongoClient.connect("mongodb://localhost:27017/db23", function(err, db) {
		var userdata = db.collection('userdata');
		userdata.find({name: username}).toArray(function(err, result) {
			if (err) {
		    	return ;
		  	} else if (result.length == 0) {
		    	userdata.insert({name: username.substring(0,12), wins: 0, losses: 0});
		    	console.log(username.substring(0,12));
		  	}
		});
	});
}