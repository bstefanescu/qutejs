/*
 Resolve and sort dependent nodes
 A node object must provide two properties:
 1. name - the node name (string)
 2. requires - an array of required Nodes (i.e. dependencies). can be null if no deps.
*/
function Resolver() {
	var _waiting = {}; // name -> [list of nodes waiting for]
	var _resolved = {}; // state map: true - if resolved, undefined (if not yet added) or a Set of unresolved deps if unresolved
	//var unresolved = {};
	var result = []; // the sorted node (in resolve order)

	this.resolved = function() {
		return result;
	}

	this.unresolved = function() {
		//TODO
		return [];
	}
	this.missing = function() {
		// TODO
		return [];
	}

	this.add = function(node) {
		if (node.requires) {
			var reqs = node.requires;
			var waitingFor = new Set();
			for (var i=0,l=reqs.length; i<l; i++) {
				var req = reqs[i];
				var reqName = req.name;
				if (_resolved[reqName] !== true) {
					var list = _waiting[reqName];
					if (!list) _waiting[reqName] = list = [];
					list.push(node);
					waitingFor.add(req);
				}
			}
			if (waitingFor.size > 0) {
				_resolved[node.name] = waitingFor;
			} else {
				resolve(node);
			}
		} else {
			resolve(node);
		}
	}

	function resolve(node) {
		var nodeName = node.name;
		result.push(node);
		_resolved[nodeName] = true;
		// notify nodes waiting for me
		var waitingList = _waiting[nodeName];
		if (waitingList) {
			for (var i=0,l=waitingList.length; i<l; i++) {
				var depNode = waitingList[i];
				var waitingFor = _resolved[depNode.name];
				if (waitingFor && waitingFor !== true) {
					waitingFor.delete(node);
					if (!waitingFor.size) {
						resolve(depNode);
					}
				}
			}
			delete _waiting[nodeName];
		}
	}
}

module.exports = Resolver;

