# Part 7: Sending Push Notifications

> This blog post series intends to cover everything there is to know about turning an APEX application into a Progressive Web App.
>
> This documentation is also available [on my blog](https://vmorneau.me/apex-pwa-part7).

## APEX as a PWA: The Complete Guide

* [Part 1: Introducing PWA](./doc/part1.md)
* [Part 2: Setup and Development Tips](./doc/part2.md)
* [Part 3: JavaScript Recap](./doc/part3.md)
* [Part 4: Installing an APEX App into a Mobile Device](./doc/part4.md)
* [Part 5: Using an APEX App Offline](./doc/part5.md)
* [Part 6: Handling Background Sync](./doc/part6.md)
* **Part 7: Sending Push Notifications**
* [Part 8: Final Thoughts](./doc/part8.md)

## Part 7: Table of Content

* [Characteristics](#characteristics)

---

## Characteristics

Push notifications are probably my favorite PWA feature. They offer great value to the user experience and they are relatively easy to implement.

We are so used to push notifications on our native mobile apps that it has a natural feeling, but at the same time it feels fresh and innovative coming from an APEX application.

The implementation we'll cover here is part PL/SQL and part JavaScript.

Preview:

![Example](./preview-push.gif)

Observations:

* User is closing an application on a mobile device, so the app is only running in the background
* Executing a PL/SQL anonymous block in SQL Developer, which makes a REST call
* Behind the scenes, the REST process activates a push notification
* Mobile device receives the push notification

## Firebase

Before we do any coding, we'll have to register to Firebase which is a service from Google. Firebase is the central point from where notifications are sent to all subscribed mobile devices. Firebase is also the solution that [Oracle recommends](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCFA/) for sending push notifications in general.

When you have [created your account on Firebase](https://firebase.google.com/), head to your console:

![Firebase Console](./preview-console.png)

From there, you can create a new project, which we will use in our APEX application later:

![Firebase Projects](./preview-projects.png)

## Registering to Push Notifications

TODO

```javascript
/* === #APP_IMAGES#js/app.js === */

// Public key from Firebase
// CHANGE THIS VALUE TO YOUR FIREBASE PUBLIC KEY
var firebaseVapidPublicKey = 'BOFoGrYiN1P70-UMcQ9vbfCJl9x5MXfxqCBbBqOVvim_s63i9xpM9P0PwqHvfNAs2D1rKYFOlMXhD3_Rtuybl2o';

// REST endpoint where we store requests for push notifications
// CHANGE THIS VALUE TO YOUR FIREBASE DATABASE
var firebaseNotificationEndpoint = 'https: //apex-pwa.firebaseio.com/notifications.json';
```

TODO

```javascript
/* === #APP_IMAGES#js/app.js === */

pwa.notification = {
  /**
   * @function ask
   * @example pwa.notification.ask();
   * Asks the permission to allow notifications
   **/
  ask: function () {
    // Request permission to subscribe to notifications
    Notification.requestPermission(function (result) {
      if (result === 'granted') {
        console.log('Notification permission granted!');

        // Subscribe to the notification
        apexServiceWorker.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(firebaseVapidPublicKey)
          })
          .then(function (notification) {
            // POST the notification subscription to Firebase
            // notification.json below could be anything
            return fetch(firebaseNotificationEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(notification)
            });
          })
          .then(function (res) {
            if (res.ok) {
              // Show the first notification, basically to test it...
              apexServiceWorker.showNotification('Successfully subscribed!', {
                body: 'You have successfully subscribed to our APEX notification service.',
                icon: appImages + 'images/icons/icon-96x96.png',
                badge: appImages + 'images/icons/icon-96x96.png'
              });
            }
          })
          .catch(function (err) {
            console.error('Subscribing to notifications failed.', err);
          });
      } else {
        console.warn('Notification permission denied.');
      }
    });
  }
};
```

TODO

## Sending a Push Notification

TODO

```sql
declare
  l_rest_return clob;
begin
  l_rest_return := apex_web_service.make_rest_request(
    p_url => 'https://localhost:3000/push' -- My custom REST endpoint
    , p_http_method => 'GET'
    , p_parm_name => apex_util.string_to_table('title:body') -- Notification structure
    , p_parm_value => apex_util.string_to_table('Hey you:Go back to APEX now!') -- Notification Content
  );
end;
```

TODO

Once the user has registered to push notification, we want to be able to SEND notifications to them.

From an Oracle development perspective, it would make a LOT of sense to invoke a push notification from PL/SQL.

This screenshot shows a web service call to Firebase, which triggers a notifications to all registered users.

Now extrapolate this methodology. You can use this in ANY part of your back end code. In a trigger, in a package or anywhere you want.

## Setting up the REST Endpoint

TODO

```javascript
/* === ~server/pushNotification.js === */

var admin = require('firebase-admin');
var webpush = require('web-push');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
```

TODO

```javascript
/* === ~server/pushNotification.js === */

// CHANGE_ME_1
// THE FOLLOWING FILE REFERENCE IS YOUR FIREBASE SERVICE ACCOUNT FILE
var serviceAccount = require('./firebase.json');
```

TODO

```javascript
/* === ~server/pushNotification.js === */

// CHANGE_ME_2
// CHANGE THE FOLLOWING WITH YOUR EMAIL, PUBLIC KEY AND PRIVATE KEY
webpush.setVapidDetails(
  'mailto:vincent.morneau@gmail.com',
  'BOFoGrYiN1P70-UMcQ9vbfCJl9x5MXfxqCBbBqOVvim_s63i9xpM9P0PwqHvfNAs2D1rKYFOlMXhD3_Rtuybl2o',
  '2yztumiibMCOxZtKny2l4lZ-pXj01151vlV5BcWJDmY'
);
```

TODO

```javascript
/* === ~server/pushNotification.js === */

// CHANGE_ME_3
// THE FOLLOWING WITH YOUR FIREBASE DATABASE URL
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://apex-pwa.firebaseio.com/'
});
```

TODO

```javascript
/* === ~server/pushNotification.js === */

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

// CHANGE THE PORT BELOW (OPTIONAL)
var server = app.listen(3050, function() {
  console.log("APEX PWA Push Notification Server Running on Port", server.address().port);
});
```

Steps:

* Open a terminal
* Go to this directory
* Edit server.js and replace with your Firebase account information where indicated
* Run `npm install`
* Run `node server.js`

TODO

## Receiving a Push Notification

TODO

```javascript
/* === ~/sw.js === */

self.addEventListener('push', event => {
  console.log('[SW] Push Received.', event);
  event.waitUntil(pushSW(event));
});

/**
 * @function pushSW
 * Received a notification and shows it to the user
 **/
async function pushSW(event) {
  // Parse the notification received as a JSON object
  notification = JSON.parse(event.data.text());

  // Show the notification
  self.registration.showNotification(
    notification.title, {
      body: notification.body,
      icon: './images/icons/icon-192x192.png',
      badge: './images/icons/icon-192x192.png'
    }
  );
}
```

TODO

So we’ve sent a notification request from SQL developer. The request has been funneled to Firebase, and now it’s being sent back to your service worker.

1- Here’s our service worker, receiving the notification request
2- And then we display the notification.

## Push Notification Events

TODO

```javascript
/* === ~/sw.js === */

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked', event);
});

self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed', event);
});
```

These events are really useful for controlling how to get back into the application. We can also set a few actions which triggers another REST call to APEX, but that is up to you and the business logic of your application.

---

With push notifications going, we covered the last feature of our PWA guide. Here's a small piece on my [Final Thoughts](./doc/part8.md) regarding PWA in APEX.

_Think this documentation can be enhanced? Please open a pull request and fix it!_
