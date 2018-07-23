/**
 * @global variables
 **/
var apexServiceWorker = null;
var hasSubscribedNotifications = false;
var installPrompt;
var offlineTasks;

/**
 * @namespace pwa
 **/
var pwa = {};

/**
 * @module pwa.init
 * Invoked on page load.
 * Used for registering our service worker.
 **/
pwa.init = function () {
	// Check if service workers are supported
	if ('serviceWorker' in navigator) {
		// Service workers are supported, then register our service worker
		navigator.serviceWorker
			.register('/sw.js')
			.then(function (registeredServiceWorker) {
				apexServiceWorker = registeredServiceWorker;
				apex.debug.log('Service worker registered!');
				// Controls the display (hide and show) of the PWA buttons
				pwa.ui.refresh();
			}).catch(pwa.promise.rejected);
	} else {

		// Controls the display (hide and show) of the PWA buttons
		pwa.ui.refresh();
		apex.debug.warn('Service workers are not supported by your browser.');
	}

	// Fetch the saved offline tasks from the IndexedDB and store them into global variable offlineTasks
	localforage.getItem('offline-tasks').then(function (tasks) {
		offlineTasks = tasks || [];
	}).catch(pwa.promise.rejected);
};

/**
 * @module pwa.ui
 * Controls the display (hide and show) of these buttons:
 * - Subscribe to notifications
 * - Install this app
 **/
pwa.ui = {
	refresh: function () {
		// Display the error message on screen, if any exists from a previous event
		pwa.event.offline();

		// Get the subscribe notification button object
		var subscribeBtn = document.querySelector(".pwa-subscribe-notifications-btn button");

		// Check if notifications are supported
		if ('PushManager' in window) {
			apexServiceWorker.pushManager.getSubscription()
				.then(function (subscription) {
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
			subscribeBtn.style.display = 'none';
		}

		// Get the install button object
		var installBtn = document.querySelector(".pwa-install-btn button");

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
 * @module pwa.install
 * @example pwa.install();
 **/
pwa.install = function () {
	// Show the installation prompt, using the global variable previously set
	installPrompt.prompt();
	// Wait for the user to respond to the prompt
	installPrompt.userChoice
		.then(function (choiceResult) {
			apex.debug.log('User ' + choiceResult.outcome + ' to install the app');
			// Reset the install prompt
			installPrompt = null;
			// Controls the display (hide and show) of the PWA buttons
			pwa.ui.refresh();
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
	something: function (name) {
		return apex.server.process(
			'something', {
				x01: name
			}
		);
	},

	/**
	 * Function that handles a rejected promise and logs it
	 **/
	rejected: function (err) {
		apex.debug.error('Promise is rejected: ', err);
	}
};

/**
 * @module pwa.call
 **/
pwa.call = {
	/**
	 * Function that handles a rejected promise and logs it
	 **/
	something: function (name) {
		// Check if the user is online
		if (navigator.onLine) {
			// User is online, then invoke the appropriate promise (something)
			pwa.promise.something(name)
				.then(function (data) {
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
	add: function (task) {
		// Append the new task to the existing array of pending tasks
		offlineTasks.push({
			name: task.callee.name,
			arguments: Array.prototype.slice.call(task)
		});

		localforage.setItem('offline-tasks', offlineTasks).then(function (tasks) {
			// new task was saved using IndexedDB
		}).catch(pwa.promise.rejected);

		// Update the error message with the new task
		pwa.event.offline();
	},

	/**
	 * Function that executes all tasks in the array of tasks
	 * Then resets the array of tasks to an empty array
	 **/
	run: function () {
		// Iterate through all tasks in the array of tasks
		for (var key in offlineTasks) {
			if (Object.prototype.hasOwnProperty.call(offlineTasks, key)) {
				apex.debug.log('Invoking', offlineTasks[key].name, '(', offlineTasks[key].arguments, ')');
				pwa.call[offlineTasks[key].name].apply(null, offlineTasks[key].arguments);
			}
		}

		// Resets the array of tasks to an empty array
		localforage.clear().then(function () {
			offlineTasks = [];
			apex.debug.log('Database "offline-tasks" is now empty.');
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
	online: function (event) {
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
	offline: function (event) {
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
 * @module pwa.notification
 **/
pwa.notification = {
	ask: function () {
		// Check if the user has not subscribed yet, and if Notifications are supported
		if (!hasSubscribedNotifications && 'Notification' in window && 'PushManager' in window) {
			// Request permission to subscribe to notifications
			Notification.requestPermission(function (result) {
				if (result === 'granted') {
					apex.debug.log('Notification permission granted!');

					// Public key from Firebase, change it to yours
					var vapidPublicKey = 'BOFoGrYiN1P70-UMcQ9vbfCJl9x5MXfxqCBbBqOVvim_s63i9xpM9P0PwqHvfNAs2D1rKYFOlMXhD3_Rtuybl2o';
					// Convert the public key
					var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

					// Subscribe to the notification
					apexServiceWorker.pushManager.subscribe({
							userVisibleOnly: true,
							applicationServerKey: convertedVapidPublicKey
						})
						.then(function (notification) {
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
						.then(function (res) {
							if (res.ok) {
								// Show the first notification, basically to test it...
								apexServiceWorker.showNotification('Successfully subscribed!', {
									body: 'You have successfully subscribed to our APEX notification service.',
									icon: appImages + 'images/icons/icon-96x96.png',
									badge: appImages + 'images/icons/icon-96x96.png'
								});

								pwa.ui.refresh();
							}
						})
						.catch(pwa.promise.rejected);
				} else {
					apex.debug.warn('Notification permission denied.');
				}
			});
		}
	}
};

/**
 * IIFE (Immediately-Invoked Function Expression)
 **/
(function () {
	window.addEventListener('online', pwa.event.online);
	window.addEventListener('offline', pwa.event.offline);

	// This event will be triggered after installation criteria are met
	window.addEventListener('beforeinstallprompt', function (event) {
		// Stop the automatic installation prompt
		event.preventDefault();
		// Store the event in a global variable so it can be triggered later
		installPrompt = event;
		// Controls the display (hide and show) of the PWA buttons
		pwa.ui.refresh();
	});

	// This event will be triggered after the app is installed
	window.addEventListener('appinstalled', function (event) {
		apex.debug.log('App was installed', event);
	});

	pwa.init();
})();
