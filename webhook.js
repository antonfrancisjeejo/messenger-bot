const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
// Dialogflow api user secret key
const apiaiApp = require('apiai')('83edb1a921ac4caea2e6b1bbfd317c4c');
const app = express();
const CLIENT_ACCESS_TOKEN = 'EAAMyQerOkNoBAHMLXN8zOGvmNyZBTpHvMBRgHcOITIXt6HZA8nhS8oUpvmLotvMBAYu4j2aV6wKPz551kllcIe6Aqb1jVhFVR6uUHg5w2ZCAWI4Q2kwa5qvNQZAl7x3PZBvZAZBxhdCHnprSAnBUhLZAJQ6f7IdoQfu4XeCmMMreJm8e3GXbFoa1';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* For Facebook Validation */
app.get('/', (req, res) => {
  //hub.verify_token must be same when you use the verify token at facebook
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'tuxedo_cat') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/', (req, res) => {
  console.log(req.body);
  //req.body.object is the object returned from the facebook bot app
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

function sendMessage(event) {
  //Stores the sender id to send a reply to them
  let sender = event.sender.id;
  //Stores the message and send it to the Dialogflow
  let text = event.message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'tabby_cat' // use any arbitrary id
  });

  apiai.on('response', (response) => {
    let aiText = response.result.fulfillment.speech;

      request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: CLIENT_ACCESS_TOKEN},
        method: 'POST',
        json: {
          recipient: {id: sender},
          message: {text: aiText}
        }
      }, (error, response) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
      });
   });
  apiai.end();
}
//We use port forwarding using ngrok it works like their global callback url is forwarded to our localhost server
const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
