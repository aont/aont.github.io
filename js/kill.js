(function () {

    // Helper for generating a "domain-omitted absolute path" (pathname + search + hash)
    function toDomainOmittedPath(urlObj) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
    }

    // Returns a shortened URL string based on targetUrl and baseUrl.
    function normalizeUrl(targetUrl, baseUrl) {
        let base;
        try {
            base = new URL(baseUrl);
        } catch (e) {
            // If baseUrl is invalid, return targetUrl as-is
            return targetUrl;
        }

        // Try parsing targetUrl to determine whether it is an absolute URL
        let absoluteTarget;
        try {
            absoluteTarget = new URL(targetUrl);
        } catch (e) {
            absoluteTarget = null;
        }

        // 1) If targetUrl is an absolute URL
        if (absoluteTarget) {
            // If the origin matches baseUrl, return the domain-omitted form
            if (absoluteTarget.origin === base.origin) {
                return toDomainOmittedPath(absoluteTarget);
            }
            // Otherwise return targetUrl as-is
            return targetUrl;
        }

        // 2) If targetUrl is a relative URL, resolve it against baseUrl
        let resolved;
        try {
            resolved = new URL(targetUrl, base);
        } catch (e) {
            // If resolution fails, return targetUrl as-is
            return targetUrl;
        }

        const domainOmitted = toDomainOmittedPath(resolved);

        // Return the shorter form
        if (domainOmitted.length < targetUrl.length) {
            return domainOmitted;
        }

        return targetUrl;
    }

    // Default URL to pass (usually the current location.href)
    let targetUrl = location.href;

    // Detect chrome://offline and use ?reload=... value as targetUrl if present
    try {
        if (location.href.startsWith('chrome://offline')) {
            let sp = new URLSearchParams(location.search);
            let reload = sp.get('reload');
            if (reload) {
                targetUrl = reload;
            }
        }
    } catch (e) {
        // ignore and use default targetUrl
    }

    // Build query using URLSearchParams
    const params = new URLSearchParams();

    if (document.title) {
        params.set('title', document.title);
    }
    params.set('url', targetUrl);

    // Collect favicon links, normalize rel="icon", and skip data URIs
    Array.from(
        document.querySelectorAll('html > head > link[rel~=icon], html > head > link[rel~=apple-touch-icon]')
    ).forEach(function (link) {
        let faviconObj = Array.from(link.attributes).reduce(function (acc, attr) {
            if (attr.name === 'href') {
                try {
                    acc[attr.name] = normalizeUrl(attr.value, targetUrl);
                } catch (e) {
                    acc[attr.name] = attr.value;
                }
            } else if (attr.name === 'rel') {
                acc[attr.name] = 'icon'; // normalize rel value
            } else {
                acc[attr.name] = attr.value;
            }
            return acc;
        }, {});

        // Skip data URIs
        if (!faviconObj.href || faviconObj.href.startsWith('data:')) {
            return;
        }

        // Append multiple favicon entries
        params.append('favicon', JSON.stringify(faviconObj));
    });

    // Collect og:image meta tags (skip data URIs)
    Array.from(
        document.querySelectorAll('html > head > meta[property="og:image"]')
    ).forEach(function (meta) {
        let content = meta.content;
        if (!content || content.startsWith('data:')) {
            return;
        }
        content = normalizeUrl(content, targetUrl);

        // Append multiple og:image entries
        params.append('ogimg', content);
    });

    const suspendUrl = 'https://aont.github.io/suspend.html?' + params.toString();

    // Final redirect
    location.href = suspendUrl;

})();
