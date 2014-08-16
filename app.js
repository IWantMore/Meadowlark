var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var credentials = require('./credentials.js');
var session = require('express-session')
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather.js');
var app = express();


// set up handlebars view engine
var handlebars = require('express-handlebars').create({
  defaultLayout: 'main',
  helpers: {
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.use(cookieParser(credentials.cookieSecret));

app.use(session());

//app.use(require('body-parser')());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

// this middleware injects the weather data into the res.locals.partials object
app.use(function (req, res, next) {
  if (!res.locals.partials) res.locals.partials = {};
  res.locals.partials.weather = weather.getWeatherData();
  next();
});

app.use(function (req, res, next) {
  // if there's a flash message, transfer it to the context, then clear it
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/about', function (req, res) {
  res.render('about', { fortune: fortune.getFortune() });
});

app.get('/jquery-test', function(req, res){ 
  res.render('jquery-test'); 
}); 

app.get('/thank-you', function (req, res) {
  res.render('thank-you');
});

app.get('/nursery-rhyme', function (req, res) {
  res.render('nursery-rhyme');
});

app.get('/archive', function (req, res) {
  res.render('archive');
});

app.get('/data/nursery-rhyme', function (req, res) {
  res.json({
    animal: 'squirrel',
    bodyPart: 'tail',
    adjective: 'bushy',
    noun: 'heck',
  });
});

app.get('/newsletter', function (req, res) {
  // we will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render('newsletter', { csrf: 'CSRF token goes here' });
});

// for now, we're mocking NewsletterSignup: 
function NewsletterSignup(){ 
} 
NewsletterSignup.prototype.save = function(cb){ 
	cb(); 
} 
var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/; 

app.post('/newsletter', function(req, res){
  var name = req.body.name || '', email = req.body.email || '';
  // input validation
  if(!email.match(VALID_EMAIL_REGEX)) {
    if(req.xhr) return res.json({ error: 'Invalid name email address.' });
    req.session.flash = {
      type: 'danger',
      intro: 'Validation error!',
      message: 'The email address you entered was not valid.',
    };
    return res.redirect(303, 'archive');
  }
  
  new NewsletterSignup({ name: name, email: email }).save(function(err){
    if(err) {
      if(req.xhr) return res.json({ error: 'Database error.' });
      req.session.flash = {
        type: 'danger',
        intro: 'Database error!',
        message: 'There was a database error; please try again later.',
      }
      return res.redirect(303, 'archive');
    }
    if(req.xhr) return res.json({ success: true });
    req.session.flash = {
      type: 'success',
      intro: 'Thank you!',
      message: 'You have now been signed up for the newsletter.',
    };
    return res.redirect(303, 'archive');
  });
});

// 404 catch-all handler (middleware)
app.use(function (req, res, next) {
  res.status(404);
  res.render('404');
});

// 500 error handler (middleware)
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

// Start the http server
app.listen(app.get('port'), function () {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});