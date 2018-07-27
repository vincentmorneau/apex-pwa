# Part 6: Handling Background Sync

> This blog post series intends to cover everything there is to know about turning an APEX application into a Progressive Web App.
>
> This documentation is also available [on my blog](https://vmorneau.me/apex-pwa-part6).

## APEX as a PWA: The Complete Guide

* [Part 1: Introducing PWAs](./doc/part1.md)
* [Part 2: Setup and Development Tips](./doc/part2.md)
* [Part 3: JavaScript Recap](./doc/part3.md)
* [Part 4: Installing an APEX App into a Mobile Device](./doc/part4.md)
* [Part 5: Using an APEX App Offline](./doc/part5.md)
* **Part 6: Handling Background Sync**
* [Part 7: Sending Push Notifications](./doc/part7.md)
* [Part 8: Final Thoughts](./doc/part8.md)

## Part 6: Table of Content

* [Characteristics](#characteristics)

---

## Characteristics

TODO

## Going Online/Offline

TODO

### Events

TODO

```javascript
window.addEventListener('online', function() {
  // show a message when user gets back online
});

window.addEventListener('offline', function() {
  // show a message when user goes offline
});
```

Let’s start with something really simple. How do we know if a user has lost connection and when he’s regained connection.

The solution is to listen two the window ONLINE event and the OFFLINE event, which are triggered appropriately.

When these events are fired, a useful thing to do would be to show a warning message or a success message.

### Current Status

TODO

```javascript
if (navigator.onLine) {
  // Do something when
  // (user is online)
} else {
  // Store in IndexedDB
}
```

But even if we are aware of these ONLINE/OFFLINE events, we might want to know wheter a user has connectivity or not at any given point in time.

We can use NAVIGATOR.ONLINE for that.

In the case where the user is OFFLINE, we will be using the IndexedDB API to store the request for later use.

## IndexedDB

TODO

```javascript
var tasks = [];

tasks = indexedDB.getItem('offline-tasks');

tasks.push({
  'name': 'Kscope'
});

indexedDB.setItem('offline-tasks', tasks);

indexedDB.clear();
```

What is IndexedDB though?

IndexedDB is a browser API for client side storage.

It can store JSON and other formats, blobs or files.
It has to ability to query data (like SQL)
And it works with service workers, so it’s a very efficient way to communicate between the app and the service worker.

Some quick tips on how to work with IndexedDB
1- Global variable to store pending requests
2- Pull all pending tasks from IndexedDB
3- When user is offline, add data in global var
4- Save the IndexedDB
5- Clear IndexedDB

## Storing Data When Offline

TODO

```javascript
/* === #APP_IMAGES#js/app.js === */

function something() {  
  if (navigator.onLine) {
    // Do something
  } else {
    // Store data in the IndexedDB
    // ……………
    // Register a sync event
    sw.sync.register('sync-something');
  }
}
```

Now if we put all of this together, it would look similar to this.

1- Your button calls function something()
2- Immediately check if user is online / offline
3- If online, then execute normally
4- If offline, then store data to IndexedDB
5- After data is stored, register a sync event

That last part is very important.

## Posting Data When Back Online

TODO

```javascript
/* === {server_root}/sw.js === */

self.addEventListener('sync', function(event) {
  console.log('[SW] Syncing', event);
  if (event.tag === 'sync-something') {
    // Read from IndexedDB
    // Do something
  }
});
```

It’s important because we’re offshoring the task to the service worker. Remember this sw.js file works even when the app is closed.

1- So whenever the connection comes back, the service worker will trigger a sync event.
2- An effective way of dealing with pending tasks here would be to check if the event tag = sync-something
3- Then you can read from IndexedDB like I’ve shown on the previous slide

---

TODO

_Think this documentation can be enhanced? Please open a pull request and fix it!_
