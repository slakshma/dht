var socket_comm = require('./socketcomm');
var fs = require('fs');

var Hashtable = (function() {

   function Hashtable() {

      var table = {}; // data hash

      var count; //total number of entries 

      var config_data;

      var data = fs.readFileSync('./config.json');
          try {
            config_data = JSON.parse(data);
            console.log('config data:'+JSON.stringify(config_data));
	    socket_comm.listen(config_data.ip, config_data.port, this);

	    var members = config_data.members;
	    for (var p in members) {
		var member = members[p].split(":");
       	        //console.log(member[0] + "->" + member[1]);         
	        pc = socket_comm.connect(member[0], member[1]);
		pc.hello(); //send hello message to peer
	    }
 	    console.log("node started!");	
          }
          catch (err) {
            console.log('error while parsing JSON config');
            console.log(err);
          }
       
      this.chat = function(message) {
        var data = {'key':message};
	socket_comm.send(data);
      }


      this.add = function(key, value) {
	console.log('add function is called');
        var hash = hashCode(key);
	var hash_key = hash & 0x7FFFFFFF;
	//console.log('hash_key='+hash_key);
        var entry = table[hash_key];
	for (var e = entry; e != undefined; e = e.next) {
		   if ((e.hash == hash_key) && equals(e.key, key)) {
		      e.key = key;
		      e.value = value;
		      return e.value;
		    }
	}
	entry = table[hash_key];
	table[hash_key] = new Entry(hash_key, key, value, entry);
	count++;
	var object = {'key':key, 'value':value};
	socket_comm.send(object);
	return null;
      };

      this.get = function(key) {
    	//console.log('get function is called');
        var hash = hashCode(key);
	var hash_key = hash & 0x7FFFFFFF;
        var entry = table[hash_key];
	for (var e = entry; e != undefined; e = e.next) {
		   if ((e.hash == hash_key) && equals(e.key, key)) {
		      return e.value;
		    }
		  
	}
	return null;
      };

      this.iterator = function() {

 	 function Iterator() {

	  var keys = Object.keys(table),
	      index = 0,
	      length = keys.length;

	   this.hasNext = function() {
	      return index < length;
	   };

	   this.next = function() {
	      var element;
	      if (!this.hasNext()) {
		return null;
	      }
	      element = table[keys[index]];
	      index++;
	      return element;
	   };

	   this.current = function() {
	      return table[keys[index]];
	   }; 

	}; 	

	return new Iterator;
      }
	
    }

    function equals(key1, key2) {
	    for (var p in key1) {
		if(typeof(key1[p]) !== typeof(key2[p])) return false;
		if((key1[p]===null) !== (key2[p]===null)) return false;
		switch (typeof(key1[p])) {
		    case 'undefined':
			if (typeof(key2[p]) != 'undefined') return false;
			break;
		    case 'object':
			if(key1[p]!==null && key2[p]!==null && 
				(key1[p].constructor.toString() !== key2[p].constructor.toString() 
				|| !equals(key1[p],key2[p]))) return false;
			break;
		    case 'function':
			if (p != 'equals' && key1[p].toString() != key2[p].toString()) return false;
			break;
		    default:
			if (key1[p] !== key2[p]) return false;
		}
	    }
	    return true;
       }


      function hashCode(key) {
        var result = 1;
        if (!(key instanceof String) && !(key instanceof Number)) {
        var prime = 31;
        for (var entry in key) {
            if (key.hasOwnProperty(entry)) {
              //console.log(entry + "=> "+ this[entry]);
              result += prime * result + ((entry == null) ? 0 : hash_code(entry));
              result += prime * result + ((key[entry] == null) ? 0 : hash_code(key[entry]));
            }
         }
    	} else {
              result = hash_code(key);
        }
    	    return result;
	}

       function hash_code(input) {
	    var hash = 0;
	    input = input.toString();
	    if (input.length == 0) return hash;
	    for (var i = 0; i < input.length; i++) {
		char = input.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash;
	    }
	   //console.log('hash for '+input+ ' is '+hash);
	   return hash & 0x7FFFFFFF;
       }



   function Entry(hash, key, value, next) {
       this.hash = hash;
       this.key  = key;
       this.value = value;
       this.next = next;
   }

   return Hashtable;

})();

module.exports = new Hashtable();

