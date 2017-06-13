//Dependencies
var express = require('express');
var exphbs 	= require('express-handlebars');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var logger = require('morgan'); // for debugging
//Models
var Articles = require('./models/articles.js');
var Comments = require('./models/comments.js');
//Express
var app = express();

app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static('public'));
//Connect when ready to deploy to Heroku
if(process.env.NODE_ENV == 'production'){
 // mongoose.connect('mongodb://heroku_64hs0sbh:tkfm4el0s5tpgj6vvu6qmd4aec@ds031607.mlab.com:31607/heroku_64hs0sbh');
}
else{
  mongoose.connect('mongodb://localhost/news-scraper-Ana');
}
var db = mongoose.connection;
db.on('error', function (err) {
	console.log('Mongoose Error: ', err);
});

//Setting handlebars as view engine
app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Routes
app.get('/', function (req, res) {
	res.redirect('/scrape');
});

//Scraping
app.get('/scrape', function(req, res) {

  // First, grab the body of the html with request
  request("https://www.newbeauty.com/", function(error, response, html) {

    var $ = cheerio.load(html);

        var result = {};
		$("div.image-container").each(function(i, element) {
			result.title = $(this).parent("article").children("div.text-container").children("div.text").children("a").children("h1").text().trim()
			result.imgLink = $(this).children("div.image").children("a").children("img").attr("src");
			result.summary = $(this).parent("article").children("div.text-container").children("div.text").children("div.summary").children("p").text().trim()
			result.storyLink = "https://www.newbeauty.com/" + $(this).parent("article").children("div.text-container").children("div.text").children("a").attr("href");
        //console.log(result.image);        
            Articles.count({ title: result.title}, function (err, test){

                // Using the Article model, create a new entry (note that the "result" object has the exact same key-value pairs of the model)
                var newArticle = new Articles (result);
                newArticle.save(function(err, doc) {
                	console.log(doc);
                });
            });
    });
    // Redirect to articles 
    res.redirect("/articles");
  });
});

//Push all articles to database
app.get('/articles', function(req, res) {
	Articles.find({}, function(err, doc)  {
		//Displays error if any
		if (err) {
			console.log(err);
		}
		else {
			res.render('articles', {
				//"articles" is the variable that will get looped over in articles.handlebars
				articles: doc
			});
		}
	});
});

//Grabbing individual articles for comments
app.get('/articles/:id', function(req, res) {
	Articles.findOne({'_id': req.params.id})
		//Grabs joined comments
		.populate('comments')
		.exec(function(err, doc) {
			//consoles error if any
			if (err) {
				console.log(err);
			}
			//Else renders comments handlebars
			else {
				res.render('comments', {
					//Utilizes article as the variable that is looped over each instance of comments for a particular article to display all comments
					article: doc
				});
			}
	});
});

//Post new comments
app.post('/articles/:id', function(req, res)  {
	var newComment = new Comment(req.body);

	//Saves new comment via Mongoose
	newComment.save( function(err, doc) {
		//If error, console log error
		if (err) {
			console.log(err);
			//Else updates article with id :id to include a new comment with same id
		} else {
			var articleId = req.params.id;
			Articles.findOneAndUpdate({'_id': articleId}, {$push: {'comments': doc._id}})
				.exec( function(err, doc)  {
					if (err) {
						console.log(err);
					} else {
						//Redirects to the specific article's comment page
						res.redirect('/articles/' + articleId);
					}
				});
		}
	});
});



//Post route to delete a comment
app.post('/articles/:aId/delete/:cId', function(req, res)  {
	var articleId = req.params.aId;
	var commentId = req.params.cId;
	//Update method in mongoose that searches for the id in the url, pulls the comments with the comment id in the url
	Articles.update({'_id': articleId}, {$pull: {'comments': commentId}}, {'multi': false}, function(err, res) {
		//consoles error
		if (err) {
			console.log(err);
			//else removes comment of that id
		} else {
			Comments.remove({'_id': commentId}, function(err, res) {
				if(err) {
					console.log(err);
				} else {
					console.log('Comment deleted');
				}
			});
		}
	});

	res.redirect('/articles/' + articleId);
});

//Get route to display saved articles
app.get('/saved', function(req, res)  {
	//Finds articles where saved is true
	Articles.find({ 'saved' : true }, function(err, doc) {
		if (err) {
			console.log(err);
		}  else {
			//Renders saved articles handlebars
			res.render('articles-saved', {
				articles: doc
			});
		}
	})
});

//Setting route to update an article to saved = true if user clicks "save article"
app.post('/saved/:id', function(req, res)  {
	Articles.update({ '_id' : req.params.id }, { $set : { 'saved' : true }}, function(err, doc) {
	res.redirect('/articles');
})
});	

//Unsaves article
app.post('/unsaved/:id', function(req, res) {
	//Updates article with parametre _id by setting parameter saved to false
	Articles.update( { '_id' : req.params.id }, { $set : { 'saved' : false }}, function(err, doc) {
	//Redirects to saved articles
	res.redirect('/saved');
});
});

//Listening to the port 3000 or the environment PORT
app.listen(process.env.PORT || 3000, function()  {
	console.log('App running on port 3000');
});
