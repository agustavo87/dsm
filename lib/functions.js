import _ from "lodash";
import axios from 'axios';

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

const getDelta = {
    deltaOperations: ['insert','delete','retain'],
    hasOps: function (obj) {
        return 'ops' in obj;
    },
    matchOperations: function (array) {
        return this.deltaOperations.indexOf(_.keys(array[0])[0]) > -1;
    },
    check: function (input) {
        if (_.isArray(input)) {
            return this.matchOperations(input);
        } else if (_.isObject(input)) {
            if (this.hasOps(input)) {
                return this.matchOperations(input.ops);
            } else {
                return false;
            }
        } else {
            return false
        }
    },
    fromData: function (data) {
        if (this.check(data)) {
            return data;
        } else {
            return false;
        }
    },
    fromJSON: function (JSON) {
        return this.fromData(getJSON(JSON))
    },
    fromRaw: function (rawData) {
        let json = null;
        if (!_.isError( json = getJSON(rawData)) ) {
            return this.fromData(json)
        } else {
            return this.fromData(rawData);
        }
    }
};

function jump(h) {
    let top = document.getElementById(h).offsetTop;
    window.scrollTo(0, top);
}

function logAjaxError (error) {
    if (error.response) {
        console.log('--error: server response--');
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('data:',error.response.data);
        console.log('status:', error.response.status);
        console.log('headers:', error.response.headers);
    } else if (error.request) {
        console.log('--error: no response--');
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log('request', error.request);
    } else {
        console.log('--error: problem with requesting--');
        // Something happened in setting up the request that triggered an Error
        console.log('message:', error.message);
    }
    console.log('Error.config:',error.config);
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

function cargarPost(post, vm) {
    vm.loadingPost = true;
    axios.get('/post/' + post)
        .then(response => {
            console.log(response);
            let data = response.data;
            let delta = getDelta.fromRaw(data.body);
            if (delta) {
                quill.setContents(delta);
                postTitle.value = data.title;
                updatePostInfo(data)
            } else {
                vm.errored = true;
                console.error('Delta no válido: \'%s\'', response.data.body);
            }
        })
        .catch(e => {
            vm.errored = true;
            logAjaxError(e);
        })
        .finally( () => vm.loadingPost = false );
}

export {
    isElement, jump,
    cargarPost, getDelta, getJSON, logAjaxError,
    queryProxy, queryProxyAll
}
