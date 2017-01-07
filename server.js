var express = require('express');
var mongo = require('mongodb');
var app = express();

app.listen(process.env.PORT || 3000, function(){
	console.log("ShortUrl running !");
});
