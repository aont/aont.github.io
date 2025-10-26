location.href = "https://aont.github.io/suspend.html?title=" + encodeURIComponent(document.title) + "&url=" + encodeURIComponent(location.href) + Array.from(document.querySelectorAll("html > head > link[rel~=icon]")).reduce(function (queryStr, link) {
    return queryStr + "&favicon=" + encodeURIComponent(JSON.stringify(Array.from(link.attributes).reduce(function (faviconDict, attr) {
        if (attr.name == "href") {
            faviconDict[attr.name] = new URL(attr.value, window.location.href).href;
        } else {
            faviconDict[attr.name] = attr.value;
        }
        return faviconDict;
    }, {})))
}, "") + Array.from(document.querySelectorAll("html > head > meta[property=\"og:image\"]")).reduce(function (queryStr, meta) { return queryStr + "&ogimg=" + encodeURIComponent(meta.content); }, ""); void (0);
