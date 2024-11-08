const realAsyncHooks = require('async_hooks');

realAsyncHooks.AsyncResource = class AsyncResource extends realAsyncHooks.AsyncResource {
  static bind(fn, type, thisArg) {
    const resource = new AsyncResource(type);
    return resource.bind(fn, thisArg);
  }
};

if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

module.exports = realAsyncHooks;