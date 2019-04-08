'use strict';

const req = require('request-promise-native');
var options = {
	uri: 'http://transport.opendata.ch/v1/connections?from=Lausanne,Provence&to=Sion,Gare&limit=4',
	family: 4
};

req(options).then(function (parsedBody) {
	const data = JSON.parse(parsedBody)
	console.log("----- Trajet de " + data.from.name + " à " + data.to.name + " : " + Object.keys(data.connections).length + " résultat(s) -----")
	for(var attr in data.connections){
		var con = data.connections[attr]
		var from = con.from
		var to = con.to
		console.log((Number(attr)+1) + ". " + con.products  + " : Durée " + con.duration + ", transfert(s) : " + con.transfers)
		console.log("\tDépart " + from.departure)
		console.log("\tArrivée " + to.arrival)

		for(var attr2 in con.sections) {
			var sec = con.sections[attr2]
			if(sec.journey != undefined) {
				console.log(
					"\t\tTransport de " + sec.departure.station.name + 
					(sec.departure.platform ? " (voie " + sec.departure.platform + ")" : "") +
					" à " + sec.arrival.station.name + 
					(sec.arrival.platform ? " (voie " + sec.arrival.platform + ")" : "") +
					" avec " + sec.journey.category + " destination " + sec.journey.to)
			} else if(sec.walk != undefined) {
				console.log("\t\tMarche de " + sec.walk.duration + " secondes de " + sec.departure.station.name + " à " + sec.arrival.station.name)
			}
		}
	}
}).catch(function (err) {
	console.log(err)
})