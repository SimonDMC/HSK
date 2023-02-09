self.addEventListener("fetch", (event) => {
    // add to cache on network hit (network first)
    event.respondWith(
        fetch(event.request)
            .then(async (response) => {
                const cache = await caches.open("hsk");

                // don't cache HSK-firebase.js because it only works when online (set as empty file)
                if (event.request.url.includes("HSK-firebase.js")) {
                    console.log("Caching offline HSK-firebase.js");
                    cache.put(event.request, new Response("", { status: 200 }));
                    return response;
                }

                // only cache GET requests which are not firebase and not chrome-extension
                if (
                    event.request.method === "GET" &&
                    !event.request.url.includes("fire") &&
                    !event.request.url.includes("chrome-extension")
                ) {
                    cache.put(event.request, response.clone());
                }
                return response;
            })
            .catch(async () => {
                // if network fails, return from cache
                const cache = await caches.open("hsk");
                return cache.match(event.request);
            })
    );
});
