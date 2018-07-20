# Part 3: JavaScript Recap

If you're already comfortable with JavaScript _Promises_, _Async_ and _Await_, head to [Part 4: Installing an APEX App into a Mobile Device](./doc/part4.md), where we will tackle the first PWA feature.

> This blog post series intends to cover everything there is to know about turning an APEX application into a Progressive Web App.
>
> This documentation is also available [on my blog](https://vmorneau.me/apex-pwa-part3).

## APEX as a PWA: The Complete Guide

- [Part 1: Introducing Progressive Web Apps](./doc/part1.md)
- [Part 2: Setup and Development Tips](./doc/part2.md)
- **Part 3: JavaScript Recap**
- [Part 4: Installing an APEX App into a Mobile Device](./doc/part4.md)
- [Part 5: Using an APEX App Offline](./doc/part5.md)
- [Part 6: Handling Background Sync](./doc/part6.md)
- [Part 7: Sending Push Notifications](./doc/part7.md)
- [Part 8: Final Thoughts](./doc/part8.md)

## Part 3: Table of Content

- [Synchronous JavaScript](#synchronous-javascript)
- [Asynchronous JavaScript](#asynchronous-javascript)
- [Promises](#promises)
- [Async / Await](#async-await)
- [Namespaces](#namespaces)

---

## Synchronous JavaScript

Let’s start with synchronous JavaScript. This should feel familiar to most APEX developers because PL/SQL is mostly used this way. If we have 4 functions to execute back to back, this is how it'll go:

1. Function 1 starts and ends
2. Function 2 starts and ends
3. Function 3 starts and ends
4. Function 4 starts and ends

Simple.

![Synchronous JavaScript](./part3-synchronous.png)

**The goods:** Synchronous JavaScript is easy to read and easy to write. Executing sequentially from top to bottom, it's more logical to the human eye.

**The bads:** Synchronous JavaScript is slower, because while it's executing, it blocks the user interaction. On a web page, a synchronous JavaScript process will prevent the user from scrolling or clicking anywhere until the process is completed, feeling like the page is hanging indefinitely.

Bottom line: **synchronous coding is not the way to go in JavaScript**.

## Asynchronous JavaScript

Asynchronous coding is the opposite ideology. Functions are still launched sequentially, but they're not waiting on the code to complete until executing the next line. If we launch 4 functions again, depending on their execution time, this is how it could go:

1. Function 1 starts (will take 3 seconds)
2. Function 2 starts (will take 2 seconds)
3. Function 3 starts (will take 1 seconds)
4. Function 4 starts (will take 4 seconds)
5. Function 3 ends
6. Function 2 ends
7. Function 1 ends
8. Function 4 ends

Think of it as threads.

![Asynchronous JavaScript](./part3-asynchronous.png)

APEX Example:

```javascript
console.log(1);

apex.server.process(
  "something", {}, {
    success: function (data) {
      console.log(2);
    }
  }
);

console.log(3);
```

Reading from top to bottom in a synchronous way, we would expect the outcome to be:

```bash
1
2
3
```

But `apex.server.process` is asynchronous, resulting in the following outcome:

```bash
1
3
2
```

**The goods:** Asynchronous JavaScript is faster and more efficient.

**The bads:** Asynchronous JavaScript makes the code less readable, as it introduces callbacks which leads to a very heavy indented code.

## Promises

Promises help writing better asynchronous JavaScript. A promise is an object that returns asynchronous code. When invoking a promise, it’s defined as _Pending_, meaning that the code hasn’t finished executing yet.

A promise will remain _Pending_ until the code has finished executing. When it does finish, a promise either becomes _Resolved_ or _Rejected_, whether it succeeded or failed.

Let’s take `apex.server.process` as an example because it returns a promise:

```javascript
var something = function (param1) { // *1
  return apex.server.process(
    "process_name", {
      x01: param1
    }
  );
};

something(1) // *2
  .then(function (data) { // *3
    console.log("something is resolved:", data);
  }, function (err) { // *4
    console.error("something is rejected:", err);
  });
```

Observations:

1. I am declaring a function called `something` and all it does is returning the result of an application process called `process_name`.
2. Invoking the JavaScript function `something()` will trigger the application process without blocking the page interaction.
3. If the application process goes well, the promise becomes _Resolved_ and we can use the `.then()` syntax to indicate what to do next.
4. If the application process fails for any reason, the promise becomes _Rejected_ and we are able to catch the error.

**The goods:** Finally logical, top to bottom asynchronous JavaScript.

**The bads:** Generates a lot of syntax sugar around the code.

For more info, I wrote a [blog post](https://vmorneau.me/javascript-promises-in-apex/) just on promises in APEX.

## Async / Await

Async & Await introduces a cleaner way to deal with promises. Let’s turn the example from above into using Async & Await:

```javascript
async function something(param1) { // *1
  return apex.server.process(
    "process_name", {
      x01: param1
    } );
}

try {
  var result = await something(1); // *2
  console.log('something', result);
} catch (err) { // *3
  console.error(err);
}
```

Observations:

1. First we indicate that the function `something` is an `async` function.
2. Then we can await `something`. This will wait until `something` is _Resolved_ before moving forward.
3. The recommended approach for error handling is a simple `try {} catch {}`.

**The goods:** Using Async / Await goes back to the root of writing simple synchronous code, while benefiting from the asynchronous & promises perks.

**The bads:** Nothing that I can think of (yet).

For more info, I wrote a [blog post](https://vmorneau.me/javascript-async-await/) just on Async / Await in APEX.

## Namespaces

Namespaces are used to cut JavaScript into smaller modules, giving context to functions. It's the equivalent of PL/SQL packages.

In this guide, all the code is using the following namespace structure:

```javascript
/**
* @namespace pwa
**/
var pwa = pwa || {};

/**
* @module app
**/
pwa.app = {
  /**
  * @function init
  * @example pwa.app.init();
  **/
  init: function () {
    // Insert JavaScript here
  }
};
```

To call the `init` function above, we would have to use `pwa.app.init();`.

For more info, I wrote a [blog post](https://vmorneau.me/avoid-javascript-mess/#tip2modularizeyourjavascript) just on JavaScript namespaces in APEX.

---

That should cover the JavaScript techniques we'll be using all over this guide. Let's head to [Part 4: Installing an APEX App into a Mobile Device](./doc/part4.md), where we will tackle the first PWA feature.

_Think this documentation can be enhanced? Please open a pull request and fix it!_
