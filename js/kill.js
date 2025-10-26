location.href = "https://aont.github.io/suspend.html?title=" + encodeURIComponent(document.title) + "&url=" + encodeURIComponent(location.href) + Array.from(document.querySelectorAll("html > head > link[rel=icon]")).reduce(function (a, c) {
    return a + "&favicon=" + encodeURIComponent(JSON.stringify(Array.from(c.attributes).reduce(function (a, nv) {
        if (nv.name == "href") {
            a[nv.name] = new URL(nv.value, window.location.href).href;
        } else {
            a[nv.name] = nv.value;
        }
        return a;
    }, {})))
}, ""); void (0);
