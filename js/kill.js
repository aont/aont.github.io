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
        // If that fails, ignore and keep using the current location
    }

    // Collect favicon(s) and append to query (resolve relative hrefs against targetUrl)
    let favQuery = Array.from(document.querySelectorAll('html > head > link[rel~=icon]')).reduce(function (queryStr, link) {
        let faviconObj = Array.from(link.attributes).reduce(function (acc, attr) {
            if (attr.name === 'href') {
                try {
                    acc[attr.name] = new URL(attr.value, targetUrl).href;
                } catch (e) {
                    acc[attr.name] = attr.value;
                }
            } else {
                acc[attr.name] = attr.value;
            }
            return acc;
        }, {});
        return queryStr + '&favicon=' + encodeURIComponent(JSON.stringify(faviconObj));
    }, '');

    // Collect og:image meta tags
    let ogimgQuery = Array.from(document.querySelectorAll('html > head > meta[property="og:image"]')).reduce(function (q, meta) {
        return q + '&ogimg=' + encodeURIComponent(meta.content || '');
    }, '');

    // Final redirect
    location.href =
        'https://aont.github.io/suspend.html?title=' + encodeURIComponent(document.title || '') +
        '&url=' + encodeURIComponent(targetUrl) +
        favQuery +
        ogimgQuery;
})();
