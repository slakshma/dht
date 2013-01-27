var socket_io = require('socket.io');
var socket_io_client = require('socket.io-client');

var socketcomm = (function() {

  function SocketComm() {

  var server_ip, server_port;

  var peer_connections = {};

  var hashtable;

  var _this = this;
   
    this.listen = function (ip, port, caller) {
       hashtable = caller;
       server_ip = ip;
       server_port = port;	
       var server = socket_io.listen(server_port); 
       server.enable('log level' , 1);

       server.sockets.on('connection', function (server_socket) {
	
         console.log('client connected at server :'+server_ip+' port:'+server_port);

	 server_socket.on('request', function (request) {
	       //parse the client request and reply the server response 
	     console.log('request data received:'+ JSON.stringify(request));
              //server_socket.emit('response', { server : 'Here is the response for the request' }); 
	     var key = request['key'];
	     var value = request['value'];
	     hashtable.add(key, value);
	     console.log('hashtable add key :'+key+' value :'+value);
         }); 

 	 server_socket.on('hello', function (request) {
	    //let's reconnect 
	    console.log('received hello message from peer for re-connect :'+JSON.stringify(request));
	    var ip = Object.keys(request)[0];
	    var port = request[ip];
            var key = ip + ":" + port;		
            console.log('key->'+key);		
	    console.log('pc object :'+peer_connections[key]);
	    peer_connections[key].reconnect();
	    _this.resync();
	    //console.log(typeof peer_connections[key]);
	    //for (var t in peer_connections) { console.log(t+"->"+peer_connections[t]); }
	 });
      
       });
  
    }; 

    this.resync = function() {
	var iterator = hashtable.iterator();
	while (iterator.hasNext()) {
	   var entry = iterator.next();
	   var message = {'key':entry.key, 'value':entry.value};
	   this.send(message);  
	}
    }

    this.send = function(message) {
	for (var pc in peer_connections) {
	    peer_connections[pc].send(message);
	}	
    };

    this.connect = function(_ip, _port) {
	try
	{

	   function PeerConnection() {
		   var client_socket = socket_io_client.connect(_ip, {port :_port});  		

		   client_socket.on('response', function (response) {
			console.log('response received:'+response);
		   });


		   this.reconnect = function() {
		       //client_socket = socket_io_client.connect(_ip, {port :_port});  		
		       var _to = 'http://'+_ip+':'+_port;
		       client_socket = socket_io_client.connect(_to);  		
		       console.log('reconnected to :'+_ip+ ' at port :'+_port);
		       
		   }


		   this.send = function(json_request_data) {
			try
			{
			   console.log('sending request data :'+JSON.stringify(json_request_data));
			   client_socket.emit('request', json_request_data);

			} catch (e)  { console.log(e); }
	           };

		   this.hello = function () {
 		   	var obj = {};
	           	obj[server_ip] = server_port;
		   	console.log('sending hello to :'+_ip+ ' port :'+_port
					+' message :'+JSON.stringify(obj));
	           	client_socket.emit('hello', obj);
		   }

	   }

	   var pc = new PeerConnection;	
	   var key = _ip+":"+_port;
	   console.log('storing peer connection :'+key);
 	   peer_connections[key] = pc; 
	   return pc;

	} catch (e) {
	  console.log(e);
	}
	
    };


  }

  return SocketComm;

})();

module.exports = new socketcomm();

//var sock = new socketcomm();
//sock.listen(8000);
