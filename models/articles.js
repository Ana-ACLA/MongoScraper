var mongoose = require("mongoose");

var articlesSchema = new mongoose.Schema({
	title: {
		type: String, 
	},
	imgLink: {
		type: String, 
	},	
	storyLink: {
		type: String, 
	},
	summary: {
		type: String, 
	},		
	createdAt: {
		type: Date, 
		default: Date.now
	}
});

var Articles = mongoose.model("Articles", articlesSchema);

module.exports = Articles;