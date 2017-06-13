var mongoose = require("mongoose");

var articlesSchema = new mongoose.Schema({
	title: {
		type: String, 
		unique: true
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
	},
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
});

var Articles = mongoose.model("Articles", articlesSchema);

module.exports = Articles;