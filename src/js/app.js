/**
 * @global variables
 **/
var apexServiceWorker = null;
var hasSubscribedNotifications = false;
var installPrompt;
var offlineTasks;

/**
 * @namespace pwa
 * All functions in this demo will be encapsulated inside of this namespace
 **/
var pwa = {};

/**
 * @module pwa.init
 **/
pwa.init = {
	/**
	 * Function that is invoked on page load
	 * Used for registering our service worker
	 **/
	app: function() {
		// Check if service workers are supported
		if ('serviceWorker' in navigator) {
			// Service workers are supported, then register our service worker
			navigator.serviceWorker
				.register('/sw.js')
				.then(function(registeredServiceWorker) {
					apexServiceWorker = registeredServiceWorker;
					console.log('Service worker registered!');
					// Show & hide relevant buttons on the screen
					pwa.init.ui();
				}).catch(pwa.promise.rejected);
		} else {
			console.warn('Service workers are not supported by your browser.');
		}

		// Fetch the saved offline tasks from the IndexedDB and store them into offlineTasks
		localforage.getItem('offline-tasks').then(function(tasks) {
			offlineTasks = tasks || [];
		}).catch(pwa.promise.rejected);
	},

	/**
	 * Function that is invoked on page load
	 * Used for registering our service worker
	 **/
	ui: function() {
		// Updates the error message on screen
		pwa.event.offline();

		// Get the subscribe button object
		var subscribeBtn = document.getElementById("SUBSCRIBE_NOTIFICATIONS");

		// Check if notifications are supported
		if ('PushManager' in window) {
			apexServiceWorker.pushManager.getSubscription()
				.then(function(subscription) {
					// Check if the user has already subscribed to notifications
					// And store the value in the global variable
					if (subscription === null) {
						hasSubscribedNotifications = false;
					} else {
						hasSubscribedNotifications = true;
					}

					if (hasSubscribedNotifications) {
						// User has already subscribed, then disable the button
						subscribeBtn.disabled = true;
						subscribeBtn.textContent = 'Notifications enabled';
					} else {
						// User has not subscribed, then enable the button
						subscribeBtn.disabled = false;
						subscribeBtn.textContent = 'Enable notifications';
					}
				});
		} else {
			// Notifications are not supported, so hide the button
			installBtn.style.display = 'none';
		}

		// Hide / Show the install button
		var installBtn = document.getElementById("INSTALL_APP");

		if (installPrompt) {
			// App is ready to install, so show the button
			installBtn.style.display = 'inline-block';
		} else {
			// Install prompt is not available so hide the button. This can be because
			// (1) the app is already installed
			// (2) the browser criteria for installing the app hasn't been met
			// https://developers.google.com/web/fundamentals/app-install-banners/
			installBtn.style.display = 'none';
		}
	}
};

/**
 * @module pwa.init
 **/
pwa.install = function() {
	// Show the prompt
	installPrompt.prompt();
	// Wait for the user to respond to the prompt
	installPrompt.userChoice
		.then(function(choiceResult) {
			console.log('User ' + choiceResult.outcome + ' to install the app');
			// Reset the install prompt
			installPrompt = null;
			// Hide the install button
			pwa.init.ui();
		});
};

/**
 * @module pwa.promise
 **/
pwa.promise = {
	/**
	 * Invoke application process "something"
	 * Returns a promise
	 **/
	something: function(name) {
		return apex.server.process(
			'something', {
				x01: name
			}
		);
	},

	/**
	 * Function that handles a rejected promise and logs it
	 **/
	rejected: function(err) {
		console.error('Promise is rejected:', err);
	}
};

/**
 * @module pwa.call
 **/
pwa.call = {
	/**
	 * Function that handles a rejected promise and logs it
	 **/
	something: function(name) {
		// Check if the user is online
		if (navigator.onLine) {
			// User is online, then invoke the appropriate promise (something)
			pwa.promise.something(name)
				.then(function(data) {
					// Receives data from the server, and display the result in an alert
					apex.message.alert(JSON.stringify(data));
				}).catch(pwa.promise.rejected);
		} else {
			// User is offline, then add the promise into a stack of tasks
			pwa.task.add(arguments);
			// Trigger the sync event
			apexServiceWorker.sync.register('sync-something');
		}

		apex.item('P1_NAME').setValue('');
	}
};

/**
 * @module pwa.task
 **/
pwa.task = {
	/**
	 * Function that appends a new task to the array of tasks
	 **/
	add: function(task) {
		// Append the new task to the existing array of pending tasks
		offlineTasks.push({
			name: task.callee.name,
			arguments: Array.prototype.slice.call(task)
		});

		localforage.setItem('offline-tasks', offlineTasks).then(function(tasks) {
			// new task was saved using IndexedDB
		}).catch(pwa.promise.rejected);

		// Update the error message with the new task
		pwa.event.offline();
	},

	/**
	 * Function that executes all tasks in the array of tasks
	 * Then resets the array of tasks to an empty array
	 **/
	run: function() {
		// Iterate through all tasks in the array of tasks
		for (var key in offlineTasks) {
			if (Object.prototype.hasOwnProperty.call(offlineTasks, key)) {
				console.log('Invoking', offlineTasks[key].name, '(', offlineTasks[key].arguments, ')');
				pwa.call[offlineTasks[key].name].apply(null, offlineTasks[key].arguments);
			}
		}

		// Resets the array of tasks to an empty array
		localforage.clear().then(function() {
			offlineTasks = [];
			console.log('Database "offline-tasks" is now empty.');
		}).catch(pwa.promise.rejected);
	}
};

/**
 * @module pwa.event
 **/
pwa.event = {
	/**
	 * Things to do when user gets back online:
	 * 1) Show a message to the user that he's back onLine
	 * 2) Go to the stack of pending tasks
	 **/
	online: function(event) {
		if (navigator.onLine) {
			var message = (offlineTasks.length > 0 ? '<br>Now running ' + offlineTasks.length + ' tasks.' : '');
			apex.message.showPageSuccess('You are back online!' + message);
			pwa.task.run();
		}
	},

	/**
	 * Things to do when user loses connectivity:
	 * 1) Hide other messages
	 * 2) Show a message to the user that he's lost connection
	 **/
	offline: function(event) {
		if (!navigator.onLine) {
			$('#t_Alert_Success').remove();

			var errors = [{
				type: 'error',
				location: 'page',
				message: 'You have lost connection <span aria-hidden="true" class="fa fa-frown-o"></span>'
			}];

			// Iterate through all tasks in the array of tasks
			for (var key in offlineTasks) {
				if (Object.prototype.hasOwnProperty.call(offlineTasks, key)) {
					errors.push({
						type: 'error',
						location: 'page',
						message: '<span aria-hidden="true" class="fa fa-spinner fa-anim-spin"></span> Waiting to reconnect to execute: ' + offlineTasks[key].name
					});
				}
			}

			apex.message.clearErrors();
			apex.message.showErrors(errors);
		}
	}
};

/**
 * IIFE (Immediately-Invoked Function Expression)
 **/
(function() {
	window.addEventListener('online', pwa.event.online);
	window.addEventListener('offline', pwa.event.offline);

	window.addEventListener('beforeinstallprompt', function(event) {
		// Prevent Chrome 67 and earlier from automatically showing the prompt
		event.preventDefault();
		// Stash the event so it can be triggered later.
		installPrompt = event;
		// Display the install button on the screen
		pwa.init.ui();
	});

	window.addEventListener('appinstalled', function(event) {
		console.log('App was installed', event);
	});
})();

/**
 * @module pwa.notification
 **/
pwa.notification = {
	ask: function() {
		// Check if the user has not subscribed yet, and if Notifications are supported
		if (!hasSubscribedNotifications && 'Notification' in window && 'PushManager' in window) {
			// Request permission to subscribe to notifications
			Notification.requestPermission(function(result) {
				if (result === 'granted') {
					console.log('Notification permission granted!');

					// Public key from Firebase, change it to yours
					var vapidPublicKey = 'BOFoGrYiN1P70-UMcQ9vbfCJl9x5MXfxqCBbBqOVvim_s63i9xpM9P0PwqHvfNAs2D1rKYFOlMXhD3_Rtuybl2o';
					// Convert the public key
					var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

					// Subscribe to the notification
					apexServiceWorker.pushManager.subscribe({
							userVisibleOnly: true,
							applicationServerKey: convertedVapidPublicKey
						})
						.then(function(notification) {
							// POST the notification subscription to Firebase
							// notification.json below could be anything
							return fetch('https://apex-pwa.firebaseio.com/notifications.json', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Accept': 'application/json'
								},
								body: JSON.stringify(notification)
							});
						})
						.then(function(res) {
							if (res.ok) {
								// Show the first notification, basically to test it...
								apexServiceWorker.showNotification('Successfully subscribed!', {
									body: 'You have successfully subscribed to our APEX notification service.',
									icon: appImages + 'images/icons/icon-96x96.png',
									badge: appImages + 'images/icons/icon-96x96.png'
								});
								// Adapt UI (buttons mostly)
								pwa.init.ui();
							}
						})
						.catch(pwa.promise.rejected);
				} else {
					console.warn('Notification permission denied.');
				}
			});
		}
	}
};

/**
 * IIFE (Immediately-Invoked Function Expression)
 **/
(function() {
	pwa.init.app();
})();
