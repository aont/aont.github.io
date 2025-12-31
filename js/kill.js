(function () {

    // Helper for generating a "domain-omitted absolute path" (pathname + search + hash)
    function toDomainOmittedPath(urlObj) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
    }

    // ChatGPT conversation URL detector
    function isChatGPTUrl(u) {
        try {
            const urlObj = (u instanceof URL) ? u : new URL(u);
            return urlObj.origin === 'https://chatgpt.com';
        } catch (e) {
            // Fallback for non-parseable strings
            return (typeof u === 'string') && u.startsWith('https://chatgpt.com/');
        }
    }

    // Returns a shortened URL string based on targetUrl and baseUrl.
    function normalizeUrl(targetUrl, baseUrl) {
        // If targetUrl itself is a ChatGPT conversation URL, always keep it as-is.
        if (typeof targetUrl === 'string' && targetUrl.startsWith('https://chatgpt.com/')) {
            return targetUrl;
        }

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
            // If it's a ChatGPT conversation URL, keep the full absolute URL
            if (isChatGPTUrl(absoluteTarget)) {
                return absoluteTarget.href;
            }

            // If the origin matches baseUrl, return the domain-omitted form (except the above case)
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

        // If the resolved URL becomes a ChatGPT conversation URL, keep the full absolute URL
        // if (isChatGPTUrl(resolved)) {
        //     return resolved.href;
        // }

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
    } catch (e) {}

    // --- Determine targetUrl using og:url then canonical ---
    try {
        let candidate = null;

        // 1. Open Graph URL
        const ogUrlMeta = document.querySelector('html > head > meta[property="og:url"]');
        if (ogUrlMeta && ogUrlMeta.content) {
            candidate = ogUrlMeta.content;
        }

        // 2. Canonical URL
        if (!candidate) {
            const canonicalLink = document.querySelector('html > head > link[rel="canonical"]');
            if (canonicalLink && canonicalLink.href) {
                candidate = canonicalLink.href;
            }
        }

        if (candidate) {
            try {
                const abs = new URL(candidate, location.href);
                targetUrl = abs.href;
            } catch (e) {
                targetUrl = candidate;
            }
        }

    } catch (e) {
        // ignore and use default targetUrl
    }
    // --- End targetUrl resolution ---

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

    // --- YouTube handling ---
    // add https://i.ytimg.com/vi/{id}/hqdefault.jpg as ogimg.
    try {
        let cu = new URL(targetUrl);
        if ((cu.hostname === 'www.youtube.com' || cu.hostname === 'm.youtube.com') && location.pathname === '/watch') {
            const vid = cu.searchParams.get('v');
            if (vid) {
                const thumbUrl = 'https://i.ytimg.com/vi/' + vid + '/mqdefault.jpg';
                params.append('ogimg', thumbUrl);
            }
        }
    } catch (e) {
        // If anything fails, just skip this special handling
    }
    // --- end YouTube mobile canonical handling ---

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

    // Build final suspend URL
    const suspendUrl = 'https://aont.github.io/suspend.html?' + params.toString();

    // Final redirect
    location.href = suspendUrl;

})();
