const cacheStaticName = 'static-cache';
const cacheStaticPages = [1];
const cacheStaticPagesUrl = [];
const cache404Name = '404-cache';
const cache404Pages = [404];
const cache404PagesUrl = [];
const cacheDynamicName = 'dynamic-cache';

async function installSW() {
	let clientUrl;

	// Getting the current page URL (with APEX session & everything else)
	await self.clients.matchAll({
		includeUncontrolled: true
	}).then(clients => {
		for (const client of clients) {
			clientUrl = new URL(client.url);
		}
	});

	// Apply the current page URL to the array of static pages to cache (cacheStaticPages)
	for (const cacheStaticPage of cacheStaticPages) {
		let queryString = clientUrl.search.split(':');
		queryString[1] = cacheStaticPage;
		queryString = queryString.join(':');
		cacheStaticPagesUrl.push(clientUrl.origin + clientUrl.pathname + queryString);
	}

	// Apply the current page URL to the array of static pages to cache (cache404Pages)
	for (const cache404Page of cache404Pages) {
		let queryString = clientUrl.search.split(':');
		queryString[1] = cache404Page;
		queryString = queryString.join(':');
		cache404PagesUrl.push(clientUrl.origin + clientUrl.pathname + queryString);
	}

	// Store all static pages in the static cache
	const cacheStatic = await caches.open(cacheStaticName);
	cacheStatic.addAll(cacheStaticPagesUrl)
		.then(function() {
			console.log('[SW] Caching static files', cacheStaticPagesUrl);
		})
		.catch(function(err) {
			console.error(err);
		});

	// Store all 404 pages in the 404 cache
	const cache404 = await caches.open(cache404Name);
	cache404.addAll(cache404PagesUrl)
		.then(function() {
			console.log('[SW] Caching 404 files', cache404PagesUrl);
		})
		.catch(function(err) {
			console.error(err);
		});
}

async function fetchSW(event) {
	try {
		const serverResponse = await fetch(event.request);

		if (serverResponse) {
			const cacheResponse = await caches.match(event.request);

			if (cacheResponse) {
				console.log('[SW] Fetching from server. No need to cache:', event.request.url);
			} else {
				console.log('[SW] Fetching from server, then caching request:', event.request.url);
				const cacheDynamic = await caches.open(cacheDynamicName);
				cacheDynamic.put(event.request.url, serverResponse.clone());
			}
		}

		return serverResponse;
	} catch (serverErr) {
		const cacheResponse = await caches.match(event.request);

		if (cacheResponse) {
			console.log('[SW] Fetching from server failed. Fetching from cache:', event.request.url);
			return cacheResponse;
		} else {
			console.log('[SW] Fetching from server & cache failed for request:', event.request.url);
			if (event.request.headers.get('accept').includes('text/html')) {
				const cache404 = await caches.open(cache404Name);
				return cache404.match(cache404PagesUrl);
			}
		}
	}
}

self.addEventListener('install', event => {
	console.log('[SW] Installing service worker:', event);
	event.waitUntil(installSW());
});

self.addEventListener('activate', event => {
	console.log('[SW] Activating service worker:', event);
	return self.clients.claim();
});

self.addEventListener('fetch', event => {
	event.respondWith(fetchSW(event));
});

self.addEventListener('sync', event => {
	console.log('[SW] Syncing', event);
	// Reexecute the call stack
});

self.addEventListener('push', event => {
	console.log('[SW] Push Received.', event);

	notification = JSON.parse(event.data.text());

	event.waitUntil(
		self.registration.showNotification(
			notification.title, {
				body: notification.body,
				icon: "./images/icons/icon-192x192.png",
				badge: "./images/icons/icon-192x192.png"
			}
		)
	);
});

self.addEventListener('notificationclick', event => {
	console.log('[SW] Notification clicked', event);
});

self.addEventListener('notificationclose', event => {
	console.log('[SW] Notification closed', event);
});