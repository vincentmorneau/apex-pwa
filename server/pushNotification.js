var admin = require('firebase-admin');
var webpush = require('web-push');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

// CHANGE_ME_1
// THE FOLLOWING FILE REFERENCE IS YOUR FIREBASE SERVICE ACCOUNT FILE
var serviceAccount = require('./firebase.json');

// CHANGE_ME_2
// THE FOLLOWING WITH YOUR EMAIL, PUBLIC KEY AND PRIVATE KEY
webpush.setVapidDetails(
  'mailto:vincent.morneau@gmail.com',
  'BOFoGrYiN1P70-UMcQ9vbfCJl9x5MXfxqCBbBqOVvim_s63i9xpM9P0PwqHvfNAs2D1rKYFOlMXhD3_Rtuybl2o',
  '2yztumiibMCOxZtKny2l4lZ-pXj01151vlV5BcWJDmY'
);

// CHANGE_ME_3
// THE FOLLOWING WITH YOUR FIREBASE DATABASE URL
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://apex-pwa.firebaseio.com/'
});

// Initializing app (express) settings
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// REST endpoint for sending push notifications
app.get('/push', function(req, res) {
  // Get the 'notifications' module from Firebase
  admin.database().ref('notifications').once('value')
    .then(function(subscriptions) {
      // Iterate through all subscriptions
      subscriptions.forEach(function(subscription) {
        // Get the end point and keys for each subscription
        var pushConfig = {
          endpoint: subscription.val().endpoint,
          keys: {
            auth: subscription.val().keys.auth,
            p256dh: subscription.val().keys.p256dh
          }
        };

        // Send a push notification for this subscription
        webpush.sendNotification(pushConfig, JSON.stringify({
            title: req.query.title,
            body: req.query.body,
            icon: req.query.icon,
            badge: req.query.badge
          }))
          .then(function() {
            res.status(200).send({
              message: 'Notifications where sent successfully'
            });
          })
          .catch(function(err) {
            res.status(500).json({
              message: 'Notifications failed',
              error: err
            });
          });
      });
    })
    .catch(function(err) {
      console.log(err);
    });
});

// Change the port below (optional)
var server = app.listen(3050, function() {
  console.log("APEX PWA Push Notification Server Running on Port", server.address().port);
});
