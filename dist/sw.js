const homePageURL = 'http://localhost:31810/ords/f?p=1694:1';
const page404URL = 'http://localhost:31810/ords/f?p=1694:404';

const cacheDynamicName = 'dynamic-cache';

const cacheStaticName = 'static-cache';
const cacheStaticRessources = [
	homePageURL
];

const cache404Name = '404-cache';
const cache404Ressources = [
	page404URL
];

async function installSW() {
	console.log('[SW] Caching static files', cacheStaticRessources);
	const cacheStatic = await caches.open(cacheStaticName);
	await cacheStatic.addAll(cacheStaticRessources);

	console.log('[SW] Caching 404 files', cache404Ressources);
	const cache404 = await caches.open(cache404Name);
	await cache404.addAll(cache404Ressources);
}

async function fetchSW(event) {
	const cacheDynamic = await caches.open(cacheDynamicName);
	const cache404 = await caches.open(cache404Name);

	try {
		const serverResponse = await fetch(event.request);

		if (serverResponse) {
			const cacheResponse = await caches.match(event.request);

			if (cacheResponse) {
				console.log('[SW] Fetching from server. Cache exists for request:', event.request.url);
			} else {
				console.log('[SW] Fetching from server, then caching request:', event.request.url);
				cacheDynamic.put(event.request.url, serverResponse.clone());
			}
		}

		return serverResponse;
	} catch (serverErr) {
		const cacheResponse = await caches.match(event.request);

		if (cacheResponse) {
			console.log('[SW] Fetching from server failed. Fetching from cache', event.request.url);
			return cacheResponse;
		} else {
			console.log('[SW] Fetching from server & cache failed for request.', event.request.url);
			if (event.request.headers.get('accept').includes('text/html')) {
				return cache404.match(page404URL);
			}
		}
	}
}

// async function fetchSW(event) {
// 	const response = await caches.match(event.request);
// 
// 	if (response) {
// 		console.log('[SW] Fetching from cache', event.request.url);
// 		return response;
// 	}
// 
// 	try {
// 		const cacheDynamic = await caches.open(cacheDynamicName);
// 		const res = await fetch(event.request);
// 
// 		console.log('[SW] Fetching from server, then dynamic caching', event.request.url);
// 		cacheDynamic.put(event.request.url, res.clone());
// 
// 		return res;
// 	} catch (err) {
// 		console.log('[SW] Fetching from server failed.', err);
// 		const cache404 = await caches.open(cache404Name);
// 		if (event.request.headers.get('accept').includes('text/html')) {
// 			return cache404.match(page404URL);
// 		}
// 	}
// }

self.addEventListener('install', event => {
	console.log('[SW] Installing', event);
	event.waitUntil(installSW());
});

self.addEventListener('activate', event => {
	console.log('[SW] Activating', event);
	return self.clients.claim();
});

self.addEventListener('fetch', event => {
	// console.log('[SW] Fetching', event);
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
				icon: appImages + 'images/icons/icon-96x96.png',
				badge: appImages + 'images/icons/icon-96x96.png'
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