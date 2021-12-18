require('dotenv').config()
const express = require('express')
const connectLiveReload = require("connect-livereload");
const YouTubeService = require("./services/youtube")
const handlebars = require("hbs")
const moment = require("moment")
const session = require('express-session')
const bodyParser = require('body-parser')

const apiKey = process.env.API_KEY
const channelId = process.env.CHANNEL_ID
const password = process.env.PASSWORD

const youtube = YouTubeService(apiKey)

const app = express()

app.use(bodyParser.urlencoded())
app.use(session({ 
  secret: 'keyboard cat', 
  cookie: { 
    maxAge: 60000 
  },
  resave: false,
  saveUninitialized: false,
}))
app.use((req, res, next) => {
  if (req.path === "/login") {
    next()
  } else if (req.session.isAuthed) {
    next()
  } else {
    res.redirect('/login')
  }
})

app.set('view engine', 'hbs')

handlebars.registerHelper('dateformat', (date, format) => moment(date).format(format))
handlebars.registerHelper('ago', (date) => moment(date).fromNow())
handlebars.registerHelper('numberformat', (number) => new Intl.NumberFormat().format(number))

// const livereload = require("livereload");
// const liveReloadServer = livereload.createServer();
// liveReloadServer.server.once("connection", () => {
//   setTimeout(() => {
//     liveReloadServer.refresh("/");
//   }, 100);
// });

app.use(connectLiveReload());

app.get('/', async (req, res) => {
  try {
    const channel = await youtube.getChannel(channelId)
    const comments = await youtube.getAllCommentsForChannelWithVideos(channelId)    
    res.render('index', {channel, comments})  
  } catch(err) {
    console.error(err)
    res.status(500).send(err)
  }
})

app.get('/login', (req, res) => {
  req.session.isAuthed = false
  res.render('login', {message: req.session.message})
  // req.session.message = ""
})

app.post('/login', (req, res) => {
  if (req.body.password === password) {
    req.session.isAuthed = true
    req.session.message = ""
    res.redirect('/')
  } else {
    req.session.isAuthed = false
    req.session.message = "Incorrect password"
    res.redirect('/login')
  }  
})

const port = process.env.PORT || 3000

app.listen(port, err => {
  if (err) return console.log('Error', err)
  console.log(`Listening on ${port}`)
})
