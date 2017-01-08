var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();

const mongoUrl = "mongodb://localhost:27017/shorturl";
const isUrl = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
const shortUrl = "https://shorturl-aranetor.herokuapp.com/";

function processNewUrl(orgUrl,res){
	mongo.connect(mongoUrl, function (err,db){
		if(err) throw err;
		let coll = db.collection("urls");

		coll.find({original_url:orgUrl}).toArray(function(err,result){
			if(!result[0]) {
				createNewUrl(orgUrl,res);
			}
			else {
				delete result[0]._id;
				res.send(JSON.stringify(result[0]));
			}
		});

		db.close();
	});
}

function createNewUrl(orgUrl,res){
	mongo.connect(mongoUrl, function (err,db){
		if(err) throw err;
		let coll = db.collection("urls");

		coll.aggregate([{$group:{_id:"last", last:{$max:"$_id"}}}]).toArray(function(err,result){
			let lastIndex=result[0].last;
			let newIndex=lastIndex+1;
			let doc = {_id:newIndex,original_url:orgUrl,short_url:shortUrl+newIndex};
			insertNewUrl(doc);
			delete doc._id;
			res.send(JSON.stringify(doc));
		});

		db.close();
	});
}

function insertNewUrl(doc){
	mongo.connect(mongoUrl, function (err,db){
		if(err) throw err;
		let coll = db.collection("urls");
		coll.insert(doc, function(err,data){
			if(err) throw err;
		});
	});
}

function getExistingUrl(short,res){
	mongo.connect(mongoUrl, function (err,db){
		if(err) throw err;
		let coll = db.collection("urls");

		coll.find({_id:short}).toArray(function(err,result){
			if(err) throw err;

			if(!result[0]){
				res.status(404).end("Invalid URL !");
			}
			else {
				res.redirect(result[0].original_url);
			}
		});
	});
}

app.get('/new/:url(*)', function(req,res){
	let url=req.params.url;

	if(!isUrl.test(url)){
		res.end(JSON.stringify({error:"Send a valid URL please"}));
	}

	processNewUrl(url,res);
});

app.get('/:short', function(req,res){
	let short=parseInt(req.params.short);
	getExistingUrl(short,res);
});

app.listen(process.env.PORT || 3000, function(){
	console.log("ShortUrl running !");
});
