# APEX as a PWA

A complete guide for turning an APEX application into a Progressive Web App.

## Covered Features

* Installing the APEX app on a mobile device
* Making the APEX app available offline
* Syncing offline requests when getting back online
* Sending push notifications

## Documentation

* [Part 1: Introducing Progressive Web Apps](./doc/part1.md)
* [Part 2: Setup and Development Tips](./doc/part2.md)
* [Part 3: JavaScript Recap](./doc/part3.md)
* [Part 4: Installing an APEX App into a Mobile Device](./doc/part4.md)
* [Part 5: Using an APEX App Offline](./doc/part5.md)
* [Part 6: Handling Background Sync](./doc/part6.md)
* [Part 7: Sending Push Notifications](./doc/part7.md)
* [Part 8: Final Thoughts](./doc/part8.md)

## Using this Demo

1. Import the demo [app](/apex/f1694.sql) on your workspace
2. Meet the requirements listed in [Part 2](./doc/part2.md)
3. Move the following files on your `doc_root` folder
    * [src/manifest.json](/src/manifest.json)
    * [src/sw.js](/src/sw.js)
4. Replace the following values in these files
    * [src/manifest.json](/src/manifest.json)
        * Replace the `start_url` value with your own application URL
    * [server/firebase.json](server/firebase.json)
        * Add your Firebase account export file, as instructed in [Part 7: Sending Push Notifications](./doc/part7.md)
    * [server/server.js](server/firebase.json)
        * Replace `CHANGE_ME_1` with your Firebase service account file
        * Replace `CHANGE_ME_2` with your email, public key and private key
        * Replace `CHANGE_ME_3` with your Firebase database URL
