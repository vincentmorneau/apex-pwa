# Part 4: Installing an APEX App into a Mobile Device

> This blog post series intends to cover everything there is to know about turning an APEX application into a Progressive Web App.
>
> This documentation is also available [on my blog](https://vmorneau.me/apex-pwa-part4).

## APEX as a PWA: The Complete Guide

- [Part 1: Introducing Progressive Web Apps](./doc/part1.md)
- [Part 2: Setup and Development Tips](./doc/part2.md)
- [Part 3: JavaScript Recap](./doc/part3.md)
- **Part 4: Installing an APEX App into a Mobile Device**
- [Part 5: Using an APEX App Offline](./doc/part5.md)
- [Part 6: Handling Background Sync](./doc/part6.md)
- [Part 7: Sending Push Notifications](./doc/part7.md)
- [Part 8: Final Thoughts](./doc/part8.md)

## Part 4: Table of Content

- [Characteristics](#characteristics)
- [manifest.json](#manifest-json)
- [Referencing manifest.json in APEX](#referencing-manifest-json-in-apex)
- [Understanding Installation Criteria](#understanding-installation-criteria)
- [Installation Prompt](#installation-prompt)
- [Using the Installed App](#using-the-installed-app)

---

## Characteristics

Installing an APEX app on a mobile device is likely the easiest part of building a PWA. It's also a very quick win towards enhancing the mobile experience, because having an APEX application sitting on a mobile device home screen will increase user engagement substantially.

**It's always easier to reach for an icon than reaching for a browser bookmark.**

We are **not** adding our APEX application to the App Store or Google play. You can use [Cordova](https://cordova.apache.org/) to build an hybrid app like that. A PWA offers an installation button within the app itself. When clicked, the PWA proceeds to install itself on the device, and the button disappears as it's no longer necessary.

Preview of the installation feature:

![Example](./preview-install.gif)

Observations:

- User clicks on a button `Install this app` in an APEX application
- Confirmation window appears, asking to add this app to the home screen
- User clicks "Add to Home Screen"
- The PWA proceeds to add an icon to the home screen
- User clicks the icon on the home screen
- Splash screen appears, like a native app
- APEX application opens in full screen

What we will be doing:

- Create the architecture to support installation: the `manifest.json` file
- Add a button to an APEX app called `Install this app` which executes JavaScript code
- Add JavaScript code that triggers the installation process
- Relaunch the app using the new icon

Then we will have a fully functional and full screen APEX app.

## manifest.json

What we need is to store a special file on our server called `manifest.json`. It HAS to be called that for the browser to recognize the purpose of this file.

```json
{
  "name": "APEX as a Progressive Web App",
  "short_name": "APEX PWA",
  "start_url": "http://localhost:31810/ords/f?p=1694:1",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#fff",
  "theme_color": "#3f51b5",
  "description": "An example of APEX as a Progressive Web Application",
  "dir": "ltr",
  "lang": "en-US",
  "gcm_sender_id": "103953800507",
  "icons": [
    {
      "src": "./images/icons/icon-72x72.png",
      "type": "image/png",
      "sizes": "72x72"
    },
    {
      "src": "./images/icons/icon-96x96.png",
      "type": "image/png",
      "sizes": "96x96"
    },
    {
      "src": "./images/icons/icon-128x128.png",
      "type": "image/png",
      "sizes": "128x128"
    },
    {
      "src": "./images/icons/icon-144x144.png",
      "type": "image/png",
      "sizes": "144x144"
    },
    {
      "src": "./images/icons/icon-152x152.png",
      "type": "image/png",
      "sizes": "152x152"
    },
    {
      "src": "./images/icons/icon-192x192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "./images/icons/icon-384x384.png",
      "type": "image/png",
      "sizes": "384x384"
    },
    {
      "src": "./images/icons/icon-512x512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ]
}
```

The manifest.json has to contains these properties:

short_name: name of your app on your home screen
Name: full name of your app, which shows briefly on the splash screen when the app is loading
Icons: list of icons for your app, in different sizes. Useful to support most device sizes.
Display: very important property. There are many options you can read about, but the most interesting one to me is standalone, which opens your application in full screen. Think about that for a second, you`re running a web app in full screen, without seeing the URL bar or anything. That itself is just amazing
Orientation: is what you can expect. You can lock your app to be in a certain orientation, wether it`s portrait or landscape.
Background color and theme color are nice addons to your manifest which allows you to pick the color of your mobile device`s notification bar and the splash screen background color.

## Referencing manifest.json in APEX

When the manifest.json file is completed, we have to reference it in APEX.

What I'm about to show is a a funny hack.

![Referencing manifest.json](./part4-referencing.png)

In the APEX shared components, under User Interface attributes, there is a section called Favicon HTML. The purpose of this is to inject the different app icons, like the one you see

1- here

The icons are injected into the HEAD section of an HTML page. The manifest.json needs to go in the HEAD section too, so we'll include the reference here, even if it's not an icon.

## Adding an "Install" button to an APEX app

TODO

## Understanding Installation Criteria

Because APEX produces web apps, the browser will be the gateway for installing the APEX application for the first time.

First the browser has to recognize a few criteria.

- Not already installed
  The web app is not already installed
- User engagement
  Meets a user engagement heuristic (currently, the user has interacted with the domain for at least 30 seconds)
- Web app manifest
  Includes a web app manifest that includes: name, icons, start_url, display must be full screen
- Security
  Served over HTTPS (required for service workers)
- Service worker
  Has registered a service worker with a fetch event handler

Source: [Google](https://developers.google.com/web/fundamentals/app-install-banners/)

## Installation Prompt

So here's the real deal.

```javascript
var installPrompt;

// Event will be triggered after criteria are met
window.addEventListener('beforeinstallprompt', function(event) {
  installPrompt = event;
});

// Show the prompt
installPrompt.prompt();
// Wait for the user to respond to the prompt
installPrompt.userChoice
  .then(function(choiceResult) {
    console.log('User ' + choiceResult.outcome);
  });

```

1. Declare a global variable to store the install prompt
2. A event called `beforeinstallprompt` will be triggered when the user has met the install criteria
3. What we want to do is store the prompt request
4. Prompt the installation on a button click, like in the demo
5. See if user has accepted or rejected

When the user accepts, the app will be added to the mobile device`s home screen, and it will launch in full screen.

## Using the Installed App

TODO

---

With an icon on the home screen and the APEX app opening in full screen, we are now one step closer to a native mobile experience. Let's continue to [Part 5: Using an APEX App Offline](./doc/part5.md) to start learning about Service Workers, which are the driving force of PWAs.

_Think this documentation can be enhanced? Please open a pull request and fix it!_
