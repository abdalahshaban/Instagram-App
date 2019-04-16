var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const api = require('instagram-node').instagram()

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'sercret',
  saveUninitialized: true,
  resave: true
}));

//global vars

app.use((req, res, next) => {
  //formate date
  res.locals.formateDate = (date) => {
    var myDate = new Date(date * 1000);
    return myDate.toLocaleString();
  }

  if (req.session.accesstoken && req.session.accesstoken != 'undefind') {
    res.locals.isLoggedIn = true;
  } else {
    res.locals.isLoggedIn = false;
  }

  next()
});







///instgeam route//

api.use({
  client_id: '4d3eee84476846b08a76ef65bc68f83e',
  client_secret: 'b38e2b734d2f4d9a838c59fcf3b594e7'
});




var redirect_uri = 'http://localhost:3000/handleauth'

exports.authorize_user = function (req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, {
    scope: ['likes'],
    state: 'a state'
  }));
};

exports.handleauth = function (req, res) {
  api.authorize_user(req.query.code, redirect_uri, function (err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      console.log('Access Token ' + result.access_token);
      console.log('User ID ' + result.user.id);

      req.session.accesstoken = result.access_token
      req.session.uid = result.user.id

      api.use({
        access_token: req.session.accesstoken
      })

      res.redirect('/main');
    }
  });
};
//main route
app.get('/main', (req, res) => {
  api.user(req.session.uid, function (err, result, remaining, limit) {

    if (err) {
      res.send(err)
    } else {
      api.user_media_recent(req.session.uid, {}, (err, medias, pagination, remaining, limit) => {
        if (err) {
          res.send(err)
        }
        console.log(result);
        console.log("medias", medias);

        res.render('main', {
          title: 'my instagram',
          user: result,
          medias: medias
        })
      })

    }
  });

})

app.get('/login', exports.authorize_user)

//logout route
app.get('/logout', (req, res) => {
  req.session.access_token = false;
  req.session.uid = false;
  res.redirect('/')
})

app.get('/handleauth', exports.handleauth)


//  index route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'welcome'
  })
})





// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000, () => {
  console.log('lisen on 3000')
})