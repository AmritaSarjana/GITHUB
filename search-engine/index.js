const elasticsearch = require('elasticsearch');
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const path = require('path');
var session = require('express-session')

const client = new elasticsearch.Client({
  hosts: ['http://localhost:9200']
});

client.ping({
  requestTimeout: 30000,
}, function (error) {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('Everything is ok');
  }
});

app.use(session({
  secret: 'secret santa',
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.set('port', process.env.PORT || 3001);

app.use(express.static(path.join(__dirname, 'views')));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// defined the base route and return with an HTML file called login-register.html
app.get('/', function (req, res) {
  if (req.session.user_name) {
    return res.sendFile('home.html', {
      root: path.join(__dirname, 'views')
    });
  } else {
    req.session.user_name = 'amrita';
    res.sendFile('login-register.html', {
      root: path.join(__dirname, 'views')
    });
  }
});

app.post('/login', function (req, res) {
  let body = {
    size: 1,
    from: 0,
    query: {
      bool: {
        must: [
          {
            match: {
              "email.keyword": req.body.user_email
            }
          },
          {
            match: {
              "password.keyword": req.body.user_pass
            }
          }
        ]
      }
    }
  }

  client.search({ index: 'user', body: body, type: 'login' })
    .then(results => {
      if (results.hits.hits.length > 0) {
        res.sendFile('home.html', {
          root: path.join(__dirname, 'views')
        });
      } else {
        res.send('invalid email or password')
      }
    })
    .catch(err => {
      console.log(err)
      res.send([]);
    });
});

app.post('/register', function (req, res) {
  const payload = {
    "name": req.body.user_name,
    "email": req.body.user_email,
    "password": req.body.user_pass
  }
  client.index({
    index: "user",
    type: "login",
    body: payload
  }).then(resp => {
    res.sendFile('home.html', {
      root: path.join(__dirname, 'views')
    });
  }).catch(err => {
    console.log(err)
    res.send('Error in storing user details to user table');
  });
});

app.get('/logout', (req, res) => {
  //session destroy
  req.session = null;
  res.redirect('/');
});

app.get('/search', function (req, res) {
  let body = {
    size: 200,
    from: 0,
    query: {
      match: {
        name: req.query['q']
      }
    }
  }
  client.search({ index: 'scotch.io-tutorial', body: body, type: 'cities_list' })
    .then(results => {
      res.send(results.hits.hits);
    })
    .catch(err => {
      console.log(err)
      res.send([]);
    });

})
app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});