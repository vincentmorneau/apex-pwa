/**
 * @global variables
 **/

// This object is our service worker
var apexServiceWorker = null;

// This object stores a flag to determine if the user has subscribed to notifications or not
var hasSubscribedNotifications = false;

// This object stores the installation prompt event
var installPrompt;

// Public key from Firebase
// CHANGE THIS VALUE
var firebaseVapidPublicKey = 'BOFoGrYiN1P70-UMcQ9vbfCJl9x5MXfxqCBbBqOVvim_s63i9xpM9P0PwqHvfNAs2D1rKYFOlMXhD3_Rtuybl2o';

// REST endpoint where we store requests for push notifications
// CHANGE THIS VALUE
var firebaseNotificationEndpoint = 'https: //apex-pwa.firebaseio.com/notifications.json';

/**
 * @namespace pwa
 **/
var pwa = {};

/**
 * @module pwa.init
 * @example pwa.init();
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
				console.log('Service worker registered!');
				// Store the service worker for future use
				apexServiceWorker = registeredServiceWorker;
				pwa.ui.refresh();
			}).catch(function (err) {
				console.error('Service worker failed to register.', err);
			});

		navigator.serviceWorker.addEventListener('message', function (event) {
			if (event.data.refreshReportIds) {
				for (var key in event.data.refreshReportIds) {
					if (event.data.refreshReportIds.hasOwnProperty(key)) {
						apex.region(event.data.refreshReportIds[key]).refresh();
					}
				}
			}
		});
	} else {
		console.warn('Service workers are not supported by your browser.');
		pwa.ui.refresh();
	}
};

/**
 * @module pwa.ui
 **/
pwa.ui = {
	/**
	 * @function refresh
	 * @example pwa.notification.refresh();
	 * Controls the display(hide and show) of these buttons:
	 * - Subscribe to notifications
	 * - Install this app
	 **/
	refresh: function () {
		// Display the error message on screen, if any exists from a previous event
		pwa.event.offline();

		// Get the subscribe notification button object
		var subscribeBtn = document.querySelector('.pwa-subscribe-notifications-btn button');

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
		var installBtn = document.querySelector('.pwa-install-btn button');

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
			console.log('User ' + choiceResult.outcome + ' to install the app');
			// Reset the install prompt
			installPrompt = null;
			pwa.ui.refresh();
		});
};

/**
 * @module pwa.p1
 **/
pwa.p1 = {
	/**
	 * @function addComment
	 * @example pwa.p1.addComment('Hello World');
	 * @param {string} comment The comment to add
	 **/
	addComment: function (comment) {
		var endpoint = '/ords/dev/pwa/comments';
		var options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				pwa_comment: comment,
				pwa_comment_by: appUser
			})
		};
		var refreshReportId = 'comments-report';

		// Check if the user is online
		if (navigator.onLine) {
			fetch(endpoint, options)
				.then(function (data) {
					apex.region(refreshReportId).refresh();
				}).catch(function (err) {
					console.error('Adding comment failed.', err);
				});
		} else {
			localforage.config({
				name: 'pwa-offline-tasks'
			});
			localforage.setItem(uuidv4(), {
					endpoint: endpoint,
					options: options,
					refreshReportId: refreshReportId
				})
				.then(function (tasks) {
					console.log('Saved offline task successfully.', tasks);
					// Register the sync event on the service worker
					apexServiceWorker.sync.register('pwa-offline-tasks');
				}).catch(function (err) {
					console.error('Setting offline tasks failed.', err);
				});

			$("#comments-report .t-Comments").prepend(
				apex.util.applyTemplate(
					'<li class="t-Comments-item"><div class="t-Comments-icon a-MediaBlock-graphic"><div class="t-Comments-userIcon u-color-15" aria-hidden="true">#USER_ICON#</div></div><div class="t-Comments-body a-MediaBlock-content"><div class="t-Comments-info">#USER_NAME# &middot;<span class="t-Comments-date">#COMMENT_DATE#</span><span class="t-Comments-actions">#ACTIONS#</span></div><div class="t-Comments-comment">#COMMENT_TEXT#</div></div></li>', {
						placeholders: {
							USER_ICON: appUser.substring(0, 2).toUpperCase(),
							USER_NAME: appUser,
							COMMENT_DATE: new Date().toLocaleString(),
							ACTIONS: '<span aria-hidden="true" class="fa fa-spinner fa-anim-spin"></span> Waiting on connection',
							COMMENT_TEXT: comment
						}
					}
				)
			);
		}

		apex.item('P1_PWA_COMMENT').setValue('');
	}
};

/**
 * @module pwa.event
 **/
pwa.event = {
	/**
	 * @function online
	 * @example pwa.event.online();
	 * Show a message to the user that he's back online
	 **/
	online: function () {
		if (navigator.onLine) {
			apex.message.showPageSuccess('You are back online!');
		}
	},

	/**
	 * @function offline
	 * @example pwa.event.offline();
	 * Show a message to the user that he's lost connection
	 **/
	offline: function () {
		if (!navigator.onLine) {
			$('#t_Alert_Success').remove();
			apex.message.clearErrors();
			apex.message.showErrors([{
				type: 'error',
				location: 'page',
				message: 'You have lost connection <span aria-hidden="true" class="fa fa-frown-o"></span>'
			}]);
		}
	}
};

/**
 * @module pwa.notification
 **/
pwa.notification = {
	/**
	 * @function ask
	 * @example pwa.notification.ask();
	 * Asks the permission to allow notifications
	 **/
	ask: function () {
		// Check if the user has not subscribed yet, and if Notifications are supported
		if (!hasSubscribedNotifications && 'Notification' in window && 'PushManager' in window) {
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

								pwa.ui.refresh();
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
		pwa.ui.refresh();
	});

	// This event will be triggered after the app is installed
	window.addEventListener('appinstalled', function (event) {
		console.log('App was installed', event);
	});

	pwa.init();
})();
