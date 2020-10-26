
function isElement(element) {
    return element instanceof Element || element instanceof HTMLDocument;
}

function getJSON (input) {
    try {
        return JSON.parse(input)
    } catch (e) {
        return e;
    }
}

// to be imported with an '$' alias.
function queryProxy (selector, el) {
    if (!el) {el = document;}
    return el.querySelector(selector);
}
function queryProxyAll (selector, el) {
    if (!el) {el = document;}
    return el.querySelectorAll(selector);
    // Note: the returned object is a NodeList.
    // If you'd like to convert it to a Array for convenience, use this instead:
    // return Array.prototype.slice.call(el.querySelectorAll(selector));
}

export {
    isElement, getJSON,
    queryProxy, queryProxyAll
}
