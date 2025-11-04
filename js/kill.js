(function () {
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

    // Collect favicon(s), including apple-touch-icon, and normalize rel to "icon"
    let favQuery = Array.from(
        document.querySelectorAll('html > head > link[rel~=icon], html > head > link[rel~=apple-touch-icon]')
    ).reduce(function (queryStr, link) {
        let faviconObj = Array.from(link.attributes).reduce(function (acc, attr) {
            if (attr.name === 'href') {
                try {
                    acc[attr.name] = new URL(attr.value, targetUrl).href;
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
        if (faviconObj.href && faviconObj.href.startsWith('data:')) {
            return queryStr;
        }

        return queryStr + '&favicon=' + encodeURIComponent(JSON.stringify(faviconObj));
    }, '');

    // Collect og:image meta tags (skip data URIs)
    let ogimgQuery = Array.from(
        document.querySelectorAll('html > head > meta[property="og:image"]')
    ).reduce(function (q, meta) {
        let content = meta.content || '';
        if (content.startsWith('data:')) {
            return q;
        }
        return q + '&ogimg=' + encodeURIComponent(content);
    }, '');

    // Final redirect
    location.href =
        'https://aont.github.io/suspend.html?title=' + encodeURIComponent(document.title || '') +
        '&url=' + encodeURIComponent(targetUrl) +
        favQuery +
        ogimgQuery;
})();
