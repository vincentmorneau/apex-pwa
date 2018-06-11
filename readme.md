# APEX as a PWA

This APEX application is a Progressive Web App and demoes the following features:
1. Installing the app on a phone
2. Making the app available offline
3. Storing requests for when user gets back online
4. Sending push notifications

#### Using this demo

1. Install the app `f1694.sql`
2. Put `src/manifest.json` and `src/sw.js` on your ORDS `doc_root` folder. Can be found as part of your standalone.properties ORDS file: ![banner](/doc/doc_root.png)

#### Things you need to replace in this repository:
1. `src/manifest.json`: replace the `start_url` value with your own application URL
2. `server/apex-pwa-firebase.json`: replace this file with your Firebase project export file
3. `server/server.js`
	- replace `CHANGE ME #1` with your file from step 2.
	- replace `CHANGE ME #2` with your vapid information (email, public key and private key) from Firebase.
	- replace `CHANGE ME #3` with your Firebase database URL.

---

More more info, watch the recording of my #Kscope18 session on PWAs.

Code is well documented, so I recommend reading through the code too.
