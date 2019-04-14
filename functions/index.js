// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
	const agent = new WebhookClient({ request, response });
	console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
	console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

	// Below to get this function to be run when a Dialogflow intent is matched
	function goFromAToB(agent) {
		var param = request.body.queryResult.parameters;

		const req = require('request-promise-native');
		var options = {
			uri: 'http://transport.opendata.ch/v1/connections?from=' + param.depart + '&to=' + param.destination + '&limit=2',
			family: 4
		};
		
		//agent.add("Trajet de " + param.depart + " à " + param.destination)
		return req(options).then(function (parsedBody) {
			const data = JSON.parse(parsedBody)
			console.log(data)
			//agent.add("Trajet de " + data.from.name + " à " + data.to.name + " : " + Object.keys(data.connections).length + " résultat(s)")
			
			// Full details
			var rep = "";
			rep += ("Prochains trajet de " + param.depart + " à " + param.destination + "\n");
			rep += (Object.keys(data.connections).length + " résultat(s) trouvé(s)" + "\n")
			for(var attr in data.connections) {
				var con = data.connections[attr]
				var from = con.from
				var to = con.to
				rep += ((Number(attr)+1) + ". " + con.products  + " : Durée " + con.duration + ", transfert(s) : " + con.transfers + "\n")
				rep += ("\tDépart " + from.departure + (from.platform ? " sur le quai " + from.platform : "") + "\n")	// platform unavailable with bus
				rep += ("\tArrivée " + to.arrival + " sur le quai " + to.platform + "\n")
				for(var attr2 in con.sections) {
					var sec = con.sections[attr2]
					if(sec.journey != undefined) {
						rep += ("\t\tTransport de " + sec.departure.station.name + " à " + sec.arrival.station.name + " avec " + sec.journey.name + " destination " + sec.journey.to + "\n")
					} else if(sec.walk != undefined) {
						rep += ("\t\tMarche de " + sec.walk.duration + " secondes de " + sec.departure.station.name + " à " + sec.arrival.station.name + "\n")
					}
				}
			}
			agent.add(rep);
			//*/			
			return Promise.resolve(agent); 
		}).catch(function (err) {
			console.log(err)
			agent.add("Server error :(")
			return Promise.resolve(agent); 
		})
	}

	function goToA(agent) {
		console.log("Go to A")
		return goFromAToB(agent)
	}

	function leaveA(agent) {
		var param = request.body.queryResult.parameters;

		const req = require('request-promise-native');
		var options = {
			uri: 'http://transport.opendata.ch/v1/stationboard?station=' + param.depart + '&limit=5',
			family: 4
		};
		
		return req(options).then(function (parsedBody) {
			const data = JSON.parse(parsedBody)
			console.log(data)
			//agent.add("Trajet de " + data.from.name + " à " + data.to.name + " : " + Object.keys(data.connections).length + " résultat(s)")
			var rep = "";
			rep += ("Trajet quittant " + param.depart + "\n")
			rep += (Object.keys(data.stationboard).length + " résultat(s) trouvé(s)" + "\n")
			//
			for(var attr in data.stationboard) {
				var con = data.stationboard[attr]
				var stop = con.stop
				rep += ((Number(attr)+1) + ". " + con.category + " " + con.number  + " vers " + con.to + "\n")
				rep += ("\tDépart à " + stop.departure + (stop.platform ? " sur le quai " + stop.platform : "") + "\n")		// platform unavailable with bus
			}
			agent.add(rep);
			//*/			
			return Promise.resolve(agent); 
		}).catch(function (err) {
			console.log(err)
			agent.add("Server error :(")
			return Promise.resolve(agent); 
		})
	}

	// Run the proper function handler based on the matched Dialogflow intent name
	let intentMap = new Map();
	intentMap.set('AllerDeAaB', goFromAToB);
	intentMap.set('PartirDeA', leaveA);
	intentMap.set('AllerVersA', goToA);
	agent.handleRequest(intentMap);
});