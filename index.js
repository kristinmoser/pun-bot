// Import express and request modules
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');


// Store our app's ID and Secret. These we got from Step 1. 
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables. 
var clientId = clientId;
var clientSecret = clientSecrets;

// Instantiates Express and assigns our app variable to it
var app = express();

app.use(bodyParser.json()); //urlencoded({extended: true}));

var puns = [];

// Again, we define a port we want to listen to
const PORT=4390;

// Lets start our server
app.listen(PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Example app listening on port " + PORT);
});


// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url);
});

app.post('/', function(req, res){
	const payload = req.body;
	const event = payload.event_id; //user reacted to a message, distinct
	res.setHeader('x-slack-no-retry', 1);
	res.sendStatus(200);
	
	if (payload.type === 'event_callback'){ 

		//if reaction is pun, if it is a message
		if (payload.event.reaction === 'pun' && payload.event.item.type === 'message') {

			//for first pun reaction ever
			if (puns.length === 0){
				puns.push({"user": payload.event.item_user, "message": payload.event.item, "user_reactions": [payload.event_id], "count": 1});
			}
			console.log("First pun reaction made on a message");

			//check if message is in puns array

			for (var j = 0; j < puns.length; j++){
				if (JSON.stringify(payload.event.item) === JSON.stringify(puns[j].message)) {
					//check if event id is in that message's user_reactions array, if not add to count
					//if event id is in message's user_reactions array, ignore
					//if event id is not in message's user_reactions array, add to the count of the message and push event_id to user_reactions array

					var selected_message = puns[j];
					for(var i = 0; i < selected_message.user_reactions.length; i++){
						if (event !== selected_message.user_reactions[i]){
							selected_message.user_reactions.push(event);
							selected_message.count++;
							console.log("user_reactions count++");
						}
					}

				} else {
					//push first instance of the reaction on the message to the puns array
					puns.push({"user": payload.event.item_user, "message": payload.event.item, "user_reactions": [payload.event_id], "count": 1});
					console.log("new pun added to puns array");
				}

			}

			console.log(puns);

		}	
			
	} else if (payload.type === 'url_verification') {
	    res.send(payload.challenge);
	} else {
	    res.status(400).end();
	}
});


// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', function(req, res) {
    // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
    if (!req.query.code) {
        res.status(500);
        res.send({"Error": "Looks like we're not getting code."});
        console.log("Looks like we're not getting code.");
    } else {
        // If it's there...

        // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
        request({
            url: 'https://slack.com/api/oauth.access', //URL to hit
            qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
            method: 'GET', //Specify the method

        }, function (error, response, body) {
            if (error) {
                console.log(error);
            } else {
                res.json(body);

            }
        })
    }
});

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
app.post('/command', function(req, res) {
    res.send('Your ngrok tunnel is up and running!');
});