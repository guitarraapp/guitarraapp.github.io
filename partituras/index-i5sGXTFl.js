// \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
// \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
// node_modules/scheduler/cjs/scheduler.production.js
/**
* @license React
* scheduler.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_scheduler_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	function push(heap, node) {
		var index = heap.length;
		heap.push(node);
		a: for (; 0 < index;) {
			var parentIndex = index - 1 >>> 1, parent = heap[parentIndex];
			if (0 < compare(parent, node)) heap[parentIndex] = node, heap[index] = parent, index = parentIndex;
			else break a;
		}
	}
	function peek(heap) {
		return 0 === heap.length ? null : heap[0];
	}
	function pop(heap) {
		if (0 === heap.length) return null;
		var first = heap[0], last = heap.pop();
		if (last !== first) {
			heap[0] = last;
			a: for (var index = 0, length = heap.length, halfLength = length >>> 1; index < halfLength;) {
				var leftIndex = 2 * (index + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
				if (0 > compare(left, last)) rightIndex < length && 0 > compare(right, left) ? (heap[index] = right, heap[rightIndex] = last, index = rightIndex) : (heap[index] = left, heap[leftIndex] = last, index = leftIndex);
				else if (rightIndex < length && 0 > compare(right, last)) heap[index] = right, heap[rightIndex] = last, index = rightIndex;
				else break a;
			}
		}
		return first;
	}
	function compare(a, b) {
		var diff = a.sortIndex - b.sortIndex;
		return 0 !== diff ? diff : a.id - b.id;
	}
	exports.unstable_now = void 0;
	if ("object" === typeof performance && "function" === typeof performance.now) {
		var localPerformance = performance;
		exports.unstable_now = function() {
			return localPerformance.now();
		};
	} else {
		var localDate = Date, initialTime = localDate.now();
		exports.unstable_now = function() {
			return localDate.now() - initialTime;
		};
	}
	var taskQueue = [];
	var timerQueue = [];
	var taskIdCounter = 1;
	var currentTask = null;
	var currentPriorityLevel = 3;
	var isPerformingWork = !1;
	var isHostCallbackScheduled = !1;
	var isHostTimeoutScheduled = !1;
	var needsPaint = !1;
	var localSetTimeout = "function" === typeof setTimeout ? setTimeout : null;
	var localClearTimeout = "function" === typeof clearTimeout ? clearTimeout : null;
	var localSetImmediate = "undefined" !== typeof setImmediate ? setImmediate : null;
	function advanceTimers(currentTime) {
		for (var timer = peek(timerQueue); null !== timer;) {
			if (null === timer.callback) pop(timerQueue);
			else if (timer.startTime <= currentTime) pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
			else break;
			timer = peek(timerQueue);
		}
	}
	function handleTimeout(currentTime) {
		isHostTimeoutScheduled = !1;
		advanceTimers(currentTime);
		if (!isHostCallbackScheduled) if (null !== peek(taskQueue)) isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline());
		else {
			var firstTimer = peek(timerQueue);
			null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
		}
	}
	var isMessageLoopRunning = !1;
	var taskTimeoutID = -1;
	var frameInterval = 5;
	var startTime = -1;
	function shouldYieldToHost() {
		return needsPaint ? !0 : exports.unstable_now() - startTime < frameInterval ? !1 : !0;
	}
	function performWorkUntilDeadline() {
		needsPaint = !1;
		if (isMessageLoopRunning) {
			var currentTime = exports.unstable_now();
			startTime = currentTime;
			var hasMoreWork = !0;
			try {
				a: {
					isHostCallbackScheduled = !1;
					isHostTimeoutScheduled && (isHostTimeoutScheduled = !1, localClearTimeout(taskTimeoutID), taskTimeoutID = -1);
					isPerformingWork = !0;
					var previousPriorityLevel = currentPriorityLevel;
					try {
						b: {
							advanceTimers(currentTime);
							for (currentTask = peek(taskQueue); null !== currentTask && !(currentTask.expirationTime > currentTime && shouldYieldToHost());) {
								var callback = currentTask.callback;
								if ("function" === typeof callback) {
									currentTask.callback = null;
									currentPriorityLevel = currentTask.priorityLevel;
									var continuationCallback = callback(currentTask.expirationTime <= currentTime);
									currentTime = exports.unstable_now();
									if ("function" === typeof continuationCallback) {
										currentTask.callback = continuationCallback;
										advanceTimers(currentTime);
										hasMoreWork = !0;
										break b;
									}
									currentTask === peek(taskQueue) && pop(taskQueue);
									advanceTimers(currentTime);
								} else pop(taskQueue);
								currentTask = peek(taskQueue);
							}
							if (null !== currentTask) hasMoreWork = !0;
							else {
								var firstTimer = peek(timerQueue);
								null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
								hasMoreWork = !1;
							}
						}
						break a;
					} finally {
						currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = !1;
					}
					hasMoreWork = void 0;
				}
			} finally {
				hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = !1;
			}
		}
	}
	var schedulePerformWorkUntilDeadline;
	if ("function" === typeof localSetImmediate) schedulePerformWorkUntilDeadline = function() {
		localSetImmediate(performWorkUntilDeadline);
	};
	else if ("undefined" !== typeof MessageChannel) {
		var channel = new MessageChannel(), port = channel.port2;
		channel.port1.onmessage = performWorkUntilDeadline;
		schedulePerformWorkUntilDeadline = function() {
			port.postMessage(null);
		};
	} else schedulePerformWorkUntilDeadline = function() {
		localSetTimeout(performWorkUntilDeadline, 0);
	};
	function requestHostTimeout(callback, ms) {
		taskTimeoutID = localSetTimeout(function() {
			callback(exports.unstable_now());
		}, ms);
	}
	exports.unstable_IdlePriority = 5;
	exports.unstable_ImmediatePriority = 1;
	exports.unstable_LowPriority = 4;
	exports.unstable_NormalPriority = 3;
	exports.unstable_Profiling = null;
	exports.unstable_UserBlockingPriority = 2;
	exports.unstable_cancelCallback = function(task) {
		task.callback = null;
	};
	exports.unstable_forceFrameRate = function(fps) {
		0 > fps || 125 < fps ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
	};
	exports.unstable_getCurrentPriorityLevel = function() {
		return currentPriorityLevel;
	};
	exports.unstable_next = function(eventHandler) {
		switch (currentPriorityLevel) {
			case 1:
			case 2:
			case 3:
				var priorityLevel = 3;
				break;
			default: priorityLevel = currentPriorityLevel;
		}
		var previousPriorityLevel = currentPriorityLevel;
		currentPriorityLevel = priorityLevel;
		try {
			return eventHandler();
		} finally {
			currentPriorityLevel = previousPriorityLevel;
		}
	};
	exports.unstable_requestPaint = function() {
		needsPaint = !0;
	};
	exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
		switch (priorityLevel) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: priorityLevel = 3;
		}
		var previousPriorityLevel = currentPriorityLevel;
		currentPriorityLevel = priorityLevel;
		try {
			return eventHandler();
		} finally {
			currentPriorityLevel = previousPriorityLevel;
		}
	};
	exports.unstable_scheduleCallback = function(priorityLevel, callback, options) {
		var currentTime = exports.unstable_now();
		"object" === typeof options && null !== options ? (options = options.delay, options = "number" === typeof options && 0 < options ? currentTime + options : currentTime) : options = currentTime;
		switch (priorityLevel) {
			case 1:
				var timeout = -1;
				break;
			case 2:
				timeout = 250;
				break;
			case 5:
				timeout = 1073741823;
				break;
			case 4:
				timeout = 1e4;
				break;
			default: timeout = 5e3;
		}
		timeout = options + timeout;
		priorityLevel = {
			id: taskIdCounter++,
			callback,
			priorityLevel,
			startTime: options,
			expirationTime: timeout,
			sortIndex: -1
		};
		options > currentTime ? (priorityLevel.sortIndex = options, push(timerQueue, priorityLevel), null === peek(taskQueue) && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = !0, requestHostTimeout(handleTimeout, options - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline())));
		return priorityLevel;
	};
	exports.unstable_shouldYield = shouldYieldToHost;
	exports.unstable_wrapCallback = function(callback) {
		var parentPriorityLevel = currentPriorityLevel;
		return function() {
			var previousPriorityLevel = currentPriorityLevel;
			currentPriorityLevel = parentPriorityLevel;
			try {
				return callback.apply(this, arguments);
			} finally {
				currentPriorityLevel = previousPriorityLevel;
			}
		};
	};
}));
// node_modules/scheduler/index.js
var require_scheduler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_scheduler_production();
}));
// node_modules/react/cjs/react.production.js
/**
* @license React
* react.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_PORTAL_TYPE = Symbol.for("react.portal");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
	var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
	var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
	var REACT_CONTEXT_TYPE = Symbol.for("react.context");
	var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
	var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
	var REACT_MEMO_TYPE = Symbol.for("react.memo");
	var REACT_LAZY_TYPE = Symbol.for("react.lazy");
	var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
	var REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition");
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	function getIteratorFn(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var ReactNoopUpdateQueue = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	};
	var assign = Object.assign;
	var emptyObject = {};
	function Component(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	Component.prototype.isReactComponent = {};
	Component.prototype.setState = function(partialState, callback) {
		if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, partialState, callback, "setState");
	};
	Component.prototype.forceUpdate = function(callback) {
		this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
	};
	function ComponentDummy() {}
	ComponentDummy.prototype = Component.prototype;
	function PureComponent(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
	pureComponentPrototype.constructor = PureComponent;
	assign(pureComponentPrototype, Component.prototype);
	pureComponentPrototype.isPureReactComponent = !0;
	var isArrayImpl = Array.isArray;
	function noop() {}
	var ReactSharedInternals = {
		H: null,
		A: null,
		T: null,
		S: null
	};
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function ReactElement(type, key, props) {
		var refProp = props.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== refProp ? refProp : null,
			props
		};
	}
	function cloneAndReplaceKey(oldElement, newKey) {
		return ReactElement(oldElement.type, newKey, oldElement.props);
	}
	function isValidElement(object) {
		return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function escape(key) {
		var escaperLookup = {
			"=": "=0",
			":": "=2"
		};
		return "$" + key.replace(/[=:]/g, function(match) {
			return escaperLookup[match];
		});
	}
	var userProvidedKeyEscapeRegex = /\/+/g;
	function getElementKey(element, index) {
		return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
	}
	function resolveThenable(thenable) {
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default: switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
				"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
			}, function(error) {
				"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			})), thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
			}
		}
		throw thenable;
	}
	function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
		var type = typeof children;
		if ("undefined" === type || "boolean" === type) children = null;
		var invokeCallback = !1;
		if (null === children) invokeCallback = !0;
		else switch (type) {
			case "bigint":
			case "string":
			case "number":
				invokeCallback = !0;
				break;
			case "object": switch (children.$$typeof) {
				case REACT_ELEMENT_TYPE:
				case REACT_PORTAL_TYPE:
					invokeCallback = !0;
					break;
				case REACT_LAZY_TYPE: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
			}
		}
		if (invokeCallback) return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
			return c;
		})) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
		invokeCallback = 0;
		var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
		if (isArrayImpl(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if (i = getIteratorFn(children), "function" === typeof i) for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if ("object" === type) {
			if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
			array = String(children);
			throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
		}
		return invokeCallback;
	}
	function mapChildren(children, func, context) {
		if (null == children) return children;
		var result = [], count = 0;
		mapIntoArray(children, result, "", "", function(child) {
			return func.call(context, child, count++);
		});
		return result;
	}
	function lazyInitializer(payload) {
		if (-1 === payload._status) {
			var ctor = payload._result, thenable = ctor();
			thenable.then(function(moduleObject) {
				if (0 === payload._status || -1 === payload._status) payload._status = 1, payload._result = moduleObject, void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
			}, function(error) {
				if (0 === payload._status || -1 === payload._status) payload._status = 2, payload._result = error, void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			});
			-1 === payload._status && (payload._status = 0, payload._result = thenable);
		}
		if (1 === payload._status) return payload._result.default;
		throw payload._result;
	}
	var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
		if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
			var event = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
				error
			});
			if (!window.dispatchEvent(event)) return;
		} else if ("object" === typeof process && "function" === typeof process.emit) {
			process.emit("uncaughtException", error);
			return;
		}
		console.error(error);
	};
	function startTransition(scope) {
		var prevTransition = ReactSharedInternals.T, currentTransition = {};
		currentTransition.types = null !== prevTransition ? prevTransition.types : null;
		ReactSharedInternals.T = currentTransition;
		try {
			var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
			null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
			"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
		} catch (error) {
			reportGlobalError(error);
		} finally {
			null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
		}
	}
	function addTransitionType(type) {
		var transition = ReactSharedInternals.T;
		if (null !== transition) {
			var transitionTypes = transition.types;
			null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
		} else startTransition(addTransitionType.bind(null, type));
	}
	var Children = {
		map: mapChildren,
		forEach: function(children, forEachFunc, forEachContext) {
			mapChildren(children, function() {
				forEachFunc.apply(this, arguments);
			}, forEachContext);
		},
		count: function(children) {
			var n = 0;
			mapChildren(children, function() {
				n++;
			});
			return n;
		},
		toArray: function(children) {
			return mapChildren(children, function(child) {
				return child;
			}) || [];
		},
		only: function(children) {
			if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
			return children;
		}
	};
	exports.Activity = REACT_ACTIVITY_TYPE;
	exports.Children = Children;
	exports.Component = Component;
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.Profiler = REACT_PROFILER_TYPE;
	exports.PureComponent = PureComponent;
	exports.StrictMode = REACT_STRICT_MODE_TYPE;
	exports.Suspense = REACT_SUSPENSE_TYPE;
	exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
	exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
	exports.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(size) {
			return ReactSharedInternals.H.useMemoCache(size);
		}
	};
	exports.addTransitionType = addTransitionType;
	exports.cache = function(fn) {
		return function() {
			return fn.apply(null, arguments);
		};
	};
	exports.cacheSignal = function() {
		return null;
	};
	exports.cloneElement = function(element, config, children) {
		if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
		var props = assign({}, element.props), key = element.key;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
		var propName = arguments.length - 2;
		if (1 === propName) props.children = children;
		else if (1 < propName) {
			for (var childArray = Array(propName), i = 0; i < propName; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		return ReactElement(element.type, key, props);
	};
	exports.createContext = function(defaultValue) {
		defaultValue = {
			$$typeof: REACT_CONTEXT_TYPE,
			_currentValue: defaultValue,
			_currentValue2: defaultValue,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		};
		defaultValue.Provider = defaultValue;
		defaultValue.Consumer = {
			$$typeof: REACT_CONSUMER_TYPE,
			_context: defaultValue
		};
		return defaultValue;
	};
	exports.createElement = function(type, config, children) {
		var propName, props = {}, key = null;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
		var childrenLength = arguments.length - 2;
		if (1 === childrenLength) props.children = children;
		else if (1 < childrenLength) {
			for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === props[propName] && (props[propName] = childrenLength[propName]);
		return ReactElement(type, key, props);
	};
	exports.createRef = function() {
		return { current: null };
	};
	exports.forwardRef = function(render) {
		return {
			$$typeof: REACT_FORWARD_REF_TYPE,
			render
		};
	};
	exports.isValidElement = isValidElement;
	exports.lazy = function(ctor) {
		return {
			$$typeof: REACT_LAZY_TYPE,
			_payload: {
				_status: -1,
				_result: ctor
			},
			_init: lazyInitializer
		};
	};
	exports.memo = function(type, compare) {
		return {
			$$typeof: REACT_MEMO_TYPE,
			type,
			compare: void 0 === compare ? null : compare
		};
	};
	exports.startTransition = startTransition;
	exports.unstable_useCacheRefresh = function() {
		return ReactSharedInternals.H.useCacheRefresh();
	};
	exports.use = function(usable) {
		return ReactSharedInternals.H.use(usable);
	};
	exports.useActionState = function(action, initialState, permalink) {
		return ReactSharedInternals.H.useActionState(action, initialState, permalink);
	};
	exports.useCallback = function(callback, deps) {
		return ReactSharedInternals.H.useCallback(callback, deps);
	};
	exports.useContext = function(Context) {
		return ReactSharedInternals.H.useContext(Context);
	};
	exports.useDebugValue = function() {};
	exports.useDeferredValue = function(value, initialValue) {
		return ReactSharedInternals.H.useDeferredValue(value, initialValue);
	};
	exports.useEffect = function(create, deps) {
		return ReactSharedInternals.H.useEffect(create, deps);
	};
	exports.useEffectEvent = function(callback) {
		return ReactSharedInternals.H.useEffectEvent(callback);
	};
	exports.useId = function() {
		return ReactSharedInternals.H.useId();
	};
	exports.useImperativeHandle = function(ref, create, deps) {
		return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
	};
	exports.useInsertionEffect = function(create, deps) {
		return ReactSharedInternals.H.useInsertionEffect(create, deps);
	};
	exports.useLayoutEffect = function(create, deps) {
		return ReactSharedInternals.H.useLayoutEffect(create, deps);
	};
	exports.useMemo = function(create, deps) {
		return ReactSharedInternals.H.useMemo(create, deps);
	};
	exports.useOptimistic = function(passthrough, reducer) {
		return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
	};
	exports.useReducer = function(reducer, initialArg, init) {
		return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
	};
	exports.useRef = function(initialValue) {
		return ReactSharedInternals.H.useRef(initialValue);
	};
	exports.useState = function(initialState) {
		return ReactSharedInternals.H.useState(initialState);
	};
	exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
		return ReactSharedInternals.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	};
	exports.useTransition = function() {
		return ReactSharedInternals.H.useTransition();
	};
	exports.version = "19.3.1";
}));
// node_modules/react/index.js
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_production();
}));
// node_modules/react-dom/cjs/react-dom.production.js
/**
* @license React
* react-dom.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_dom_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react();
	function formatProdErrorMessage(code) {
		var url = "https://react.dev/errors/" + code;
		if (1 < arguments.length) {
			url += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var i = 2; i < arguments.length; i++) url += "&args[]=" + encodeURIComponent(arguments[i]);
		}
		return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function noop() {}
	var Internals = {
		d: {
			f: noop,
			r: function() {
				throw Error(formatProdErrorMessage(522));
			},
			D: noop,
			C: noop,
			L: noop,
			m: noop,
			X: noop,
			S: noop,
			M: noop
		},
		p: 0,
		findDOMNode: null
	};
	var REACT_PORTAL_TYPE = Symbol.for("react.portal");
	var REACT_RECOVERABLE_TYPE = Symbol.for("react.recoverable");
	var REACT_OPTIMISTIC_KEY = Symbol.for("react.optimistic_key");
	function createPortal$1(children, containerInfo, implementation) {
		var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
		return {
			$$typeof: REACT_PORTAL_TYPE,
			key: null == key ? null : key === REACT_OPTIMISTIC_KEY ? REACT_OPTIMISTIC_KEY : "" + key,
			children,
			containerInfo,
			implementation
		};
	}
	var ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function getCrossOriginStringAs(as, input) {
		if ("font" === as) return "";
		if ("string" === typeof input) return "use-credentials" === input ? input : "";
	}
	exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
	exports.browser = function(reason) {
		return {
			$$typeof: REACT_RECOVERABLE_TYPE,
			_reason: reason
		};
	};
	exports.createPortal = function(children, container) {
		var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
		if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType) throw Error(formatProdErrorMessage(299));
		return createPortal$1(children, container, null, key);
	};
	exports.flushSync = function(fn) {
		var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
		try {
			if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
		} finally {
			ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
		}
	};
	exports.preconnect = function(href, options) {
		"string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
	};
	exports.prefetchDNS = function(href) {
		"string" === typeof href && Internals.d.D(href);
	};
	exports.preinit = function(href, options) {
		if ("string" === typeof href && options && "string" === typeof options.as) {
			var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
			"style" === as ? Internals.d.S(href, "string" === typeof options.precedence ? options.precedence : void 0, {
				crossOrigin,
				integrity,
				fetchPriority
			}) : "script" === as && Internals.d.X(href, {
				crossOrigin,
				integrity,
				fetchPriority,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0
			});
		}
	};
	exports.preinitModule = function(href, options) {
		if ("string" === typeof href) if ("object" === typeof options && null !== options) {
			if (null == options.as || "script" === options.as) {
				var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
				Internals.d.M(href, {
					crossOrigin,
					integrity: "string" === typeof options.integrity ? options.integrity : void 0,
					nonce: "string" === typeof options.nonce ? options.nonce : void 0,
					fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0
				});
			}
		} else options ?? Internals.d.M(href);
	};
	exports.preload = function(href, options) {
		if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
			var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin);
			Internals.d.L(href, as, {
				crossOrigin,
				integrity: "string" === typeof options.integrity ? options.integrity : void 0,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0,
				type: "string" === typeof options.type ? options.type : void 0,
				fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
				referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
				imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
				imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
				media: "string" === typeof options.media ? options.media : void 0
			});
		}
	};
	exports.preloadModule = function(href, options) {
		if ("string" === typeof href) if (options) {
			var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
			Internals.d.m(href, {
				as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
				crossOrigin,
				integrity: "string" === typeof options.integrity ? options.integrity : void 0,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0,
				fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0
			});
		} else Internals.d.m(href);
	};
	exports.requestFormReset = function(form) {
		Internals.d.r(form);
	};
	exports.unstable_batchedUpdates = function(fn, a) {
		return fn(a);
	};
	exports.useFormState = function(action, initialState, permalink) {
		return ReactSharedInternals.H.useFormState(action, initialState, permalink);
	};
	exports.useFormStatus = function() {
		return ReactSharedInternals.H.useHostTransitionStatus();
	};
	exports.version = "19.3.1";
}));
// node_modules/react-dom/index.js
var require_react_dom = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function checkDCE() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") return;
		try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
		} catch (err) {
			console.error(err);
		}
	}
	checkDCE();
	module.exports = require_react_dom_production();
}));
// node_modules/react-dom/cjs/react-dom-client.production.js
/**
* @license React
* react-dom-client.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_dom_client_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scheduler = require_scheduler();
	var React = require_react();
	var ReactDOM = require_react_dom();
	function formatProdErrorMessage(code) {
		var url = "https://react.dev/errors/" + code;
		if (1 < arguments.length) {
			url += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var i = 2; i < arguments.length; i++) url += "&args[]=" + encodeURIComponent(arguments[i]);
		}
		return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function isValidContainer(node) {
		return !(!node || 1 !== node.nodeType && 9 !== node.nodeType && 11 !== node.nodeType);
	}
	function getNearestMountedFiber(fiber) {
		for (var node = fiber, nextNode = node; nextNode && !nextNode.alternate;) node = nextNode, 0 !== (node.flags & 4098) && (fiber = node.return), nextNode = node.return;
		for (; node.return;) node = node.return;
		return 3 === node.tag ? fiber : null;
	}
	function getSuspenseInstanceFromFiber(fiber) {
		if (13 === fiber.tag) {
			var suspenseState = fiber.memoizedState;
			null === suspenseState && (fiber = fiber.alternate, null !== fiber && (suspenseState = fiber.memoizedState));
			if (null !== suspenseState) return suspenseState.dehydrated;
		}
		return null;
	}
	function getActivityInstanceFromFiber(fiber) {
		if (31 === fiber.tag) {
			var activityState = fiber.memoizedState;
			null === activityState && (fiber = fiber.alternate, null !== fiber && (activityState = fiber.memoizedState));
			if (null !== activityState) return activityState.dehydrated;
		}
		return null;
	}
	function assertIsMounted(fiber) {
		if (getNearestMountedFiber(fiber) !== fiber) throw Error(formatProdErrorMessage(188));
	}
	function findCurrentFiberUsingSlowPath(fiber) {
		var alternate = fiber.alternate;
		if (!alternate) {
			alternate = getNearestMountedFiber(fiber);
			if (null === alternate) throw Error(formatProdErrorMessage(188));
			return alternate !== fiber ? null : fiber;
		}
		for (var a = fiber, b = alternate;;) {
			var parentA = a.return;
			if (null === parentA) break;
			var parentB = parentA.alternate;
			if (null === parentB) {
				b = parentA.return;
				if (null !== b) {
					a = b;
					continue;
				}
				break;
			}
			if (parentA.child === parentB.child) {
				for (parentB = parentA.child; parentB;) {
					if (parentB === a) return assertIsMounted(parentA), fiber;
					if (parentB === b) return assertIsMounted(parentA), alternate;
					parentB = parentB.sibling;
				}
				throw Error(formatProdErrorMessage(188));
			}
			if (a.return !== b.return) a = parentA, b = parentB;
			else {
				for (var didFindChild = !1, child$0 = parentA.child; child$0;) {
					if (child$0 === a) {
						didFindChild = !0;
						a = parentA;
						b = parentB;
						break;
					}
					if (child$0 === b) {
						didFindChild = !0;
						b = parentA;
						a = parentB;
						break;
					}
					child$0 = child$0.sibling;
				}
				if (!didFindChild) {
					for (child$0 = parentB.child; child$0;) {
						if (child$0 === a) {
							didFindChild = !0;
							a = parentB;
							b = parentA;
							break;
						}
						if (child$0 === b) {
							didFindChild = !0;
							b = parentB;
							a = parentA;
							break;
						}
						child$0 = child$0.sibling;
					}
					if (!didFindChild) throw Error(formatProdErrorMessage(189));
				}
			}
			if (a.alternate !== b) throw Error(formatProdErrorMessage(190));
		}
		if (3 !== a.tag) throw Error(formatProdErrorMessage(188));
		return a.stateNode.current === a ? fiber : alternate;
	}
	function findCurrentHostFiberImpl(node) {
		var tag = node.tag;
		if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
		for (node = node.child; null !== node;) {
			tag = findCurrentHostFiberImpl(node);
			if (null !== tag) return tag;
			node = node.sibling;
		}
		return null;
	}
	function traverseVisibleInstancesAndTextInstances(child, searchWithinHosts, fn, a, b, c) {
		for (; null !== child;) {
			if ((5 === child.tag || 27 === child.tag || 6 === child.tag) && fn(child, a, b, c) || (22 !== child.tag || null === child.memoizedState) && (searchWithinHosts || 5 !== child.tag && 27 !== child.tag) && traverseVisibleInstancesAndTextInstances(child.child, searchWithinHosts, fn, a, b, c)) return !0;
			child = child.sibling;
		}
		return !1;
	}
	function getFragmentParentInstanceOrContainerFiber(fiber) {
		for (fiber = fiber.return; null !== fiber;) {
			if (3 === fiber.tag || 5 === fiber.tag || 27 === fiber.tag) return fiber;
			fiber = fiber.return;
		}
		return null;
	}
	function fiberIsPortaledIntoHost(fiber) {
		var foundPortalParent = !1;
		for (fiber = fiber.return; null !== fiber;) {
			4 === fiber.tag && (foundPortalParent = !0);
			if (3 === fiber.tag || 5 === fiber.tag || 27 === fiber.tag) break;
			fiber = fiber.return;
		}
		return foundPortalParent;
	}
	function getFragmentInstanceOrTextInstanceSiblings(fiber) {
		var result = [null, null], parentHostFiber = getFragmentParentInstanceOrContainerFiber(fiber);
		if (null === parentHostFiber) return result;
		findFragmentInstanceOrTextInstanceSiblings(result, fiber, parentHostFiber.child, { foundSelf: !1 });
		return result;
	}
	function findFragmentInstanceOrTextInstanceSiblings(result, self, child, state) {
		for (; null !== child;) {
			if (child === self) state.foundSelf = !0;
			else if (5 === child.tag || 27 === child.tag || 6 === child.tag) {
				if (state.foundSelf) return result[1] = child, !0;
				result[0] = child;
			} else if ((22 !== child.tag || null === child.memoizedState) && findFragmentInstanceOrTextInstanceSiblings(result, self, child.child, state)) return !0;
			child = child.sibling;
		}
		return !1;
	}
	function getInstanceFromHostFiber(fiber) {
		switch (fiber.tag) {
			case 5:
			case 27:
			case 6: return fiber.stateNode;
			case 3: return fiber.stateNode.containerInfo;
			default: throw Error(formatProdErrorMessage(559));
		}
	}
	var searchTarget = null;
	var searchBoundary = null;
	function isFiberPrecedingCheck(child, target, boundary) {
		return child === boundary ? !0 : child === target ? (searchTarget = child, !0) : !1;
	}
	function isFiberFollowingCheck(child, target, boundary) {
		return child === boundary ? (searchBoundary = child, !1) : child === target ? (null !== searchBoundary && (searchTarget = child), !0) : !1;
	}
	function getParentForFragmentAncestors(inst) {
		if (null === inst) return null;
		do
			inst = null === inst ? null : inst.return;
		while (inst && 5 !== inst.tag && 27 !== inst.tag && 3 !== inst.tag);
		return inst ? inst : null;
	}
	function getLowestCommonAncestor(instA, instB, getParent) {
		for (var depthA = 0, tempA = instA; tempA; tempA = getParent(tempA)) depthA++;
		tempA = 0;
		for (var tempB = instB; tempB; tempB = getParent(tempB)) tempA++;
		for (; 0 < depthA - tempA;) instA = getParent(instA), depthA--;
		for (; 0 < tempA - depthA;) instB = getParent(instB), tempA--;
		for (; depthA--;) {
			if (instA === instB || null !== instB && instA === instB.alternate) return instA;
			instA = getParent(instA);
			instB = getParent(instB);
		}
		return null;
	}
	var assign = Object.assign;
	var REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element");
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_PORTAL_TYPE = Symbol.for("react.portal");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
	var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
	var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
	var REACT_CONTEXT_TYPE = Symbol.for("react.context");
	var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
	var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
	var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
	var REACT_MEMO_TYPE = Symbol.for("react.memo");
	var REACT_LAZY_TYPE = Symbol.for("react.lazy");
	var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
	var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
	var REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
	var REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition");
	var REACT_RECOVERABLE_TYPE = Symbol.for("react.recoverable");
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	function getIteratorFn(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
	function getComponentNameFromType(type) {
		if (null == type) return null;
		if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
		if ("string" === typeof type) return type;
		switch (type) {
			case REACT_FRAGMENT_TYPE: return "Fragment";
			case REACT_PROFILER_TYPE: return "Profiler";
			case REACT_STRICT_MODE_TYPE: return "StrictMode";
			case REACT_SUSPENSE_TYPE: return "Suspense";
			case REACT_SUSPENSE_LIST_TYPE: return "SuspenseList";
			case REACT_ACTIVITY_TYPE: return "Activity";
			case REACT_VIEW_TRANSITION_TYPE: return "ViewTransition";
		}
		if ("object" === typeof type) switch (type.$$typeof) {
			case REACT_PORTAL_TYPE: return "Portal";
			case REACT_CONTEXT_TYPE: return type.displayName || "Context";
			case REACT_CONSUMER_TYPE: return (type._context.displayName || "Context") + ".Consumer";
			case REACT_FORWARD_REF_TYPE:
				var innerType = type.render;
				type = type.displayName;
				type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
				return type;
			case REACT_MEMO_TYPE: return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
			case REACT_LAZY_TYPE:
				innerType = type._payload;
				type = type._init;
				try {
					return getComponentNameFromType(type(innerType));
				} catch (x) {}
		}
		return null;
	}
	var isArrayImpl = Array.isArray;
	var ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	var ReactDOMSharedInternals = ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	var sharedNotPendingObject = {
		pending: !1,
		data: null,
		method: null,
		action: null
	};
	var valueStack = [];
	var index = -1;
	function createCursor(defaultValue) {
		return { current: defaultValue };
	}
	function pop(cursor) {
		0 > index || (cursor.current = valueStack[index], valueStack[index] = null, index--);
	}
	function push(cursor, value) {
		index++;
		valueStack[index] = cursor.current;
		cursor.current = value;
	}
	var contextStackCursor = createCursor(null);
	var contextFiberStackCursor = createCursor(null);
	var rootInstanceStackCursor = createCursor(null);
	var hostTransitionProviderCursor = createCursor(null);
	function pushHostContainer(fiber, nextRootInstance) {
		push(rootInstanceStackCursor, nextRootInstance);
		push(contextFiberStackCursor, fiber);
		push(contextStackCursor, null);
		switch (nextRootInstance.nodeType) {
			case 9:
			case 11:
				fiber = (fiber = nextRootInstance.documentElement) ? (fiber = fiber.namespaceURI) ? getOwnHostContext(fiber) : 0 : 0;
				break;
			default: if (fiber = nextRootInstance.tagName, nextRootInstance = nextRootInstance.namespaceURI) nextRootInstance = getOwnHostContext(nextRootInstance), fiber = getChildHostContextProd(nextRootInstance, fiber);
			else switch (fiber) {
				case "svg":
					fiber = 1;
					break;
				case "math":
					fiber = 2;
					break;
				default: fiber = 0;
			}
		}
		pop(contextStackCursor);
		push(contextStackCursor, fiber);
	}
	function popHostContainer() {
		pop(contextStackCursor);
		pop(contextFiberStackCursor);
		pop(rootInstanceStackCursor);
	}
	function pushHostContext(fiber) {
		var stateHook = fiber.memoizedState;
		null !== stateHook && (HostTransitionContext._currentValue = stateHook.memoizedState, push(hostTransitionProviderCursor, fiber));
		stateHook = contextStackCursor.current;
		var JSCompiler_inline_result = getChildHostContextProd(stateHook, fiber.type);
		stateHook !== JSCompiler_inline_result && (push(contextFiberStackCursor, fiber), push(contextStackCursor, JSCompiler_inline_result));
	}
	function popHostContext(fiber) {
		contextFiberStackCursor.current === fiber && (pop(contextStackCursor), pop(contextFiberStackCursor));
		hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor), HostTransitionContext._currentValue = sharedNotPendingObject);
	}
	var prefix;
	var suffix;
	function describeBuiltInComponentFrame(name) {
		if (void 0 === prefix) try {
			throw Error();
		} catch (x) {
			var match = x.stack.trim().match(/\n( *(at )?)/);
			prefix = match && match[1] || "";
			suffix = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + prefix + name + suffix;
	}
	var reentry = !1;
	function describeNativeComponentFrame(fn, construct) {
		if (!fn || reentry) return "";
		reentry = !0;
		var previousPrepareStackTrace = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var RunInRootFrame = { DetermineComponentFrameRoot: function() {
				try {
					if (construct) {
						var Fake = function() {
							throw Error();
						};
						Object.defineProperty(Fake.prototype, "props", { set: function() {
							throw Error();
						} });
						if ("object" === typeof Reflect && Reflect.construct) {
							try {
								Reflect.construct(Fake, []);
							} catch (x) {
								var control = x;
							}
							Reflect.construct(fn, [], Fake);
						} else {
							try {
								Fake.call();
							} catch (x$1) {
								control = x$1;
							}
							Fake = !1;
							try {
								var prevProps = Object.getOwnPropertyDescriptor(fn.prototype, "props");
								Object.defineProperty(fn.prototype, "props", {
									configurable: !0,
									set: function() {
										throw Error();
									}
								});
								Fake = !0;
								new fn();
							} finally {
								Fake && (void 0 !== prevProps ? Object.defineProperty(fn.prototype, "props", prevProps) : delete fn.prototype.props);
							}
						}
					} else {
						try {
							throw Error();
						} catch (x$2) {
							control = x$2;
						}
						(Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {});
					}
				} catch (sample) {
					if (sample && control && "string" === typeof sample.stack) return [sample.stack, control.stack];
				}
				return [null, null];
			} };
			RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, "name");
			namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
			if (sampleStack && controlStack) {
				var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
				for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot");) RunInRootFrame++;
				for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes("DetermineComponentFrameRoot");) namePropDescriptor++;
				if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length) for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor];) namePropDescriptor--;
				for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--) if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
					if (1 !== RunInRootFrame || 1 !== namePropDescriptor) do
						if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
							var frame = "\n" + sampleLines[RunInRootFrame].replace(" at new ", " at ");
							fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName));
							return frame;
						}
					while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
					break;
				}
			}
		} finally {
			reentry = !1, Error.prepareStackTrace = previousPrepareStackTrace;
		}
		return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
	}
	function describeFiber(fiber, childFiber) {
		switch (fiber.tag) {
			case 26:
			case 27:
			case 5: return describeBuiltInComponentFrame(fiber.type);
			case 16: return describeBuiltInComponentFrame("Lazy");
			case 13: return fiber.child !== childFiber && null !== childFiber ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
			case 19: return describeBuiltInComponentFrame("SuspenseList");
			case 0:
			case 15: return describeNativeComponentFrame(fiber.type, !1);
			case 11: return describeNativeComponentFrame(fiber.type.render, !1);
			case 1: return describeNativeComponentFrame(fiber.type, !0);
			case 31: return describeBuiltInComponentFrame("Activity");
			case 30: return describeBuiltInComponentFrame("ViewTransition");
			default: return "";
		}
	}
	function getStackByFiberInDevAndProd(workInProgress) {
		try {
			var info = "", previous = null;
			do
				info += describeFiber(workInProgress, previous), previous = workInProgress, workInProgress = workInProgress.return;
			while (workInProgress);
			return info;
		} catch (x) {
			return "\nError generating stack: " + x.message + "\n" + x.stack;
		}
	}
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var scheduleCallback$3 = Scheduler.unstable_scheduleCallback;
	var cancelCallback$1 = Scheduler.unstable_cancelCallback;
	var shouldYield = Scheduler.unstable_shouldYield;
	var requestPaint = Scheduler.unstable_requestPaint;
	var now = Scheduler.unstable_now;
	var getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
	var ImmediatePriority = Scheduler.unstable_ImmediatePriority;
	var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
	var NormalPriority$1 = Scheduler.unstable_NormalPriority;
	var LowPriority = Scheduler.unstable_LowPriority;
	var IdlePriority = Scheduler.unstable_IdlePriority;
	var log$1 = Scheduler.log;
	var unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue;
	var rendererID = null;
	var injectedHook = null;
	function setIsStrictModeForDevtools(newIsStrictMode) {
		"function" === typeof log$1 && unstable_setDisableYieldValue(newIsStrictMode);
		if (injectedHook && "function" === typeof injectedHook.setStrictMode) try {
			injectedHook.setStrictMode(rendererID, newIsStrictMode);
		} catch (err) {}
	}
	var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
	var log = Math.log;
	var LN2 = Math.LN2;
	function clz32Fallback(x) {
		x >>>= 0;
		return 0 === x ? 32 : 31 - (log(x) / LN2 | 0) | 0;
	}
	var nextTransitionUpdateLane = 256;
	var nextTransitionDeferredLane = 262144;
	var nextRetryLane = 4194304;
	function getHighestPriorityLanes(lanes) {
		var pendingSyncLanes = lanes & 42;
		if (0 !== pendingSyncLanes) return pendingSyncLanes;
		switch (lanes & -lanes) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return lanes & -lanes;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return lanes & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return lanes & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return lanes;
		}
	}
	function getNextLanes(root, wipLanes, rootHasPendingCommit) {
		var pendingLanes = root.pendingLanes;
		if (0 === pendingLanes) return 0;
		var nextLanes = 0, suspendedLanes = root.suspendedLanes, pingedLanes = root.pingedLanes;
		root = root.warmLanes;
		var nonIdlePendingLanes = pendingLanes & 134217727;
		0 !== nonIdlePendingLanes ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, 0 !== pendingLanes ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, 0 !== nonIdlePendingLanes ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
		return 0 === nextLanes ? 0 : 0 !== wipLanes && wipLanes !== nextLanes && 0 === (wipLanes & suspendedLanes) && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || 32 === suspendedLanes && 0 !== (rootHasPendingCommit & 4194048)) ? wipLanes : nextLanes;
	}
	function checkIfRootIsPrerendering(root, renderLanes) {
		return 0 === (root.pendingLanes & ~(root.suspendedLanes & ~root.pingedLanes) & renderLanes);
	}
	function getEntangledLanes(root, renderLanes) {
		0 !== (renderLanes & 8) && (renderLanes |= renderLanes & 32);
		var allEntangledLanes = root.entangledLanes;
		if (0 !== allEntangledLanes) for (root = root.entanglements, allEntangledLanes &= renderLanes; 0 < allEntangledLanes;) {
			var index$4 = 31 - clz32(allEntangledLanes), lane = 1 << index$4;
			renderLanes |= root[index$4];
			allEntangledLanes &= ~lane;
		}
		return renderLanes;
	}
	function computeExpirationTime(lane, currentTime) {
		switch (lane) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return currentTime + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return currentTime + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function claimNextRetryLane() {
		var lane = nextRetryLane;
		nextRetryLane <<= 1;
		0 === (nextRetryLane & 62914560) && (nextRetryLane = 4194304);
		return lane;
	}
	function createLaneMap(initial) {
		for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
		return laneMap;
	}
	function markRootUpdated$1(root, updateLane) {
		root.pendingLanes |= updateLane;
		268435456 !== updateLane && (root.suspendedLanes = 0, root.pingedLanes = 0, root.warmLanes = 0);
	}
	function markRootFinished(root, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
		var previouslyPendingLanes = root.pendingLanes;
		root.pendingLanes = remainingLanes;
		root.suspendedLanes = 0;
		root.pingedLanes = 0;
		root.warmLanes = 0;
		root.expiredLanes &= remainingLanes;
		root.entangledLanes &= remainingLanes;
		root.errorRecoveryDisabledLanes &= remainingLanes;
		root.shellSuspendCounter = 0;
		var entanglements = root.entanglements, expirationTimes = root.expirationTimes, hiddenUpdates = root.hiddenUpdates;
		for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes;) {
			var index$7 = 31 - clz32(remainingLanes), lane = 1 << index$7;
			entanglements[index$7] = 0;
			expirationTimes[index$7] = -1;
			var hiddenUpdatesForLane = hiddenUpdates[index$7];
			if (null !== hiddenUpdatesForLane) for (hiddenUpdates[index$7] = null, index$7 = 0; index$7 < hiddenUpdatesForLane.length; index$7++) {
				var update = hiddenUpdatesForLane[index$7];
				null !== update && (update.lane &= -536870913);
			}
			remainingLanes &= ~lane;
		}
		0 !== spawnedLane && markSpawnedDeferredLane(root, spawnedLane, 0);
		0 !== suspendedRetryLanes && 0 === updatedLanes && 0 !== root.tag && (root.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
	}
	function markSpawnedDeferredLane(root, spawnedLane, entangledLanes) {
		root.pendingLanes |= spawnedLane;
		root.suspendedLanes &= ~spawnedLane;
		var spawnedLaneIndex = 31 - clz32(spawnedLane);
		root.entangledLanes |= spawnedLane;
		root.entanglements[spawnedLaneIndex] = root.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
	}
	function markRootEntangled(root, entangledLanes) {
		var rootEntangledLanes = root.entangledLanes |= entangledLanes;
		for (root = root.entanglements; rootEntangledLanes;) {
			var index$8 = 31 - clz32(rootEntangledLanes), lane = 1 << index$8;
			lane & entangledLanes | root[index$8] & entangledLanes && (root[index$8] |= entangledLanes);
			rootEntangledLanes &= ~lane;
		}
	}
	function getBumpedLaneForHydration(root, renderLanes) {
		var renderLane = renderLanes & -renderLanes;
		renderLane = 0 !== (renderLane & 42) ? 1 : getBumpedLaneForHydrationByLane(renderLane);
		return 0 !== (renderLane & (root.suspendedLanes | renderLanes)) ? 0 : renderLane;
	}
	function getBumpedLaneForHydrationByLane(lane) {
		switch (lane) {
			case 2:
				lane = 1;
				break;
			case 8:
				lane = 4;
				break;
			case 32:
				lane = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				lane = 128;
				break;
			case 268435456:
				lane = 134217728;
				break;
			default: lane = 0;
		}
		return lane;
	}
	function lanesToEventPriority(lanes) {
		lanes &= -lanes;
		return 2 < lanes ? 8 < lanes ? 0 !== (lanes & 134217727) ? 32 : 268435456 : 8 : 2;
	}
	function resolveUpdatePriority() {
		var updatePriority = ReactDOMSharedInternals.p;
		if (0 !== updatePriority) return updatePriority;
		updatePriority = window.event;
		return void 0 === updatePriority ? 32 : getEventPriority(updatePriority.type);
	}
	function runWithPriority(priority, fn) {
		var previousPriority = ReactDOMSharedInternals.p;
		try {
			return ReactDOMSharedInternals.p = priority, fn();
		} finally {
			ReactDOMSharedInternals.p = previousPriority;
		}
	}
	var randomKey = Math.random().toString(36).slice(2);
	var internalInstanceKey = "__reactFiber$" + randomKey;
	var internalPropsKey = "__reactProps$" + randomKey;
	var internalContainerInstanceKey = "__reactContainer$" + randomKey;
	var internalEventHandlersKey = "__reactEvents$" + randomKey;
	var internalEventHandlerListenersKey = "__reactListeners$" + randomKey;
	var internalEventHandlesSetKey = "__reactHandles$" + randomKey;
	var internalRootNodeResourcesKey = "__reactResources$" + randomKey;
	var internalHoistableMarker = "__reactMarker$" + randomKey;
	var internalLoadPendingKey = "__reactLoad$" + randomKey;
	function detachDeletedInstance(node) {
		delete node[internalInstanceKey];
		delete node[internalPropsKey];
		delete node[internalEventHandlerListenersKey];
		delete node[internalEventHandlesSetKey];
	}
	function getClosestInstanceFromNode(targetNode) {
		var targetInst;
		if (targetInst = targetNode[internalInstanceKey]) return targetInst;
		for (var parentNode = targetNode.parentNode; parentNode;) {
			if (targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey]) {
				parentNode = targetInst.alternate;
				if (null !== targetInst.child || null !== parentNode && null !== parentNode.child) for (targetNode = getParentHydrationBoundary(targetNode); null !== targetNode;) {
					if (parentNode = targetNode[internalInstanceKey]) return parentNode;
					targetNode = getParentHydrationBoundary(targetNode);
				}
				return targetInst;
			}
			targetNode = parentNode;
			parentNode = targetNode.parentNode;
		}
		return null;
	}
	function getInstanceFromNode(node) {
		if (node = node[internalInstanceKey] || node[internalContainerInstanceKey]) {
			var tag = node.tag;
			if (5 === tag || 6 === tag || 13 === tag || 31 === tag || 26 === tag || 27 === tag || 3 === tag) return node;
		}
		return null;
	}
	function getNodeFromInstance(inst) {
		var tag = inst.tag;
		if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return inst.stateNode;
		throw Error(formatProdErrorMessage(33));
	}
	function getResourcesFromRoot(root) {
		var resources = root[internalRootNodeResourcesKey];
		resources || (resources = root[internalRootNodeResourcesKey] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		});
		return resources;
	}
	function markNodeAsHoistable(node) {
		node[internalHoistableMarker] = !0;
	}
	function clearPendingLoadOnNode(node) {
		node[internalLoadPendingKey] = void 0;
	}
	var allNativeEvents = /* @__PURE__ */ new Set();
	var registrationNameDependencies = {};
	function registerTwoPhaseEvent(registrationName, dependencies) {
		registerDirectEvent(registrationName, dependencies);
		registerDirectEvent(registrationName + "Capture", dependencies);
	}
	function registerDirectEvent(registrationName, dependencies) {
		registrationNameDependencies[registrationName] = dependencies;
		for (registrationName = 0; registrationName < dependencies.length; registrationName++) allNativeEvents.add(dependencies[registrationName]);
	}
	var VALID_ATTRIBUTE_NAME_REGEX = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$");
	var illegalAttributeNameCache = {};
	var validatedAttributeNameCache = {};
	function isAttributeNameSafe(attributeName) {
		if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) return !0;
		if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) return !1;
		if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) return validatedAttributeNameCache[attributeName] = !0;
		illegalAttributeNameCache[attributeName] = !0;
		return !1;
	}
	var viewTransitionMutationContext = !1;
	function pushMutationContext() {
		var prev = viewTransitionMutationContext;
		viewTransitionMutationContext = !1;
		return prev;
	}
	function setValueForAttribute(node, name, value) {
		if (isAttributeNameSafe(name)) if (null === value) node.removeAttribute(name);
		else {
			switch (typeof value) {
				case "undefined":
				case "function":
				case "symbol":
					node.removeAttribute(name);
					return;
				case "boolean":
					var prefix$10 = name.toLowerCase().slice(0, 5);
					if ("data-" !== prefix$10 && "aria-" !== prefix$10) {
						node.removeAttribute(name);
						return;
					}
			}
			node.setAttribute(name, value);
		}
	}
	function setValueForKnownAttribute(node, name, value) {
		if (null === value) node.removeAttribute(name);
		else {
			switch (typeof value) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					node.removeAttribute(name);
					return;
			}
			node.setAttribute(name, value);
		}
	}
	function setValueForNamespacedAttribute(node, namespace, name, value) {
		if (null === value) node.removeAttribute(name);
		else {
			switch (typeof value) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					node.removeAttribute(name);
					return;
			}
			node.setAttributeNS(namespace, name, value);
		}
	}
	function getToStringValue(value) {
		switch (typeof value) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return value;
			case "object": return value;
			default: return "";
		}
	}
	function isCheckable(elem) {
		var type = elem.type;
		return (elem = elem.nodeName) && "input" === elem.toLowerCase() && ("checkbox" === type || "radio" === type);
	}
	function trackValueOnNode(node, valueField, currentValue) {
		var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);
		if (!node.hasOwnProperty(valueField) && "undefined" !== typeof descriptor && "function" === typeof descriptor.get && "function" === typeof descriptor.set) {
			var get = descriptor.get, set = descriptor.set;
			Object.defineProperty(node, valueField, {
				configurable: !0,
				get: function() {
					return get.call(this);
				},
				set: function(value) {
					currentValue = "" + value;
					set.call(this, value);
				}
			});
			Object.defineProperty(node, valueField, { enumerable: descriptor.enumerable });
			return {
				getValue: function() {
					return currentValue;
				},
				setValue: function(value) {
					currentValue = "" + value;
				},
				stopTracking: function() {
					node._valueTracker = null;
					delete node[valueField];
				}
			};
		}
	}
	function track(node) {
		if (!node._valueTracker) {
			var valueField = isCheckable(node) ? "checked" : "value";
			node._valueTracker = trackValueOnNode(node, valueField, "" + node[valueField]);
		}
	}
	function updateValueIfChanged(node) {
		if (!node) return !1;
		var tracker = node._valueTracker;
		if (!tracker) return !0;
		var lastValue = tracker.getValue();
		var value = "";
		node && (value = isCheckable(node) ? node.checked ? "true" : "false" : node.value);
		node = value;
		return node !== lastValue ? (tracker.setValue(node), !0) : !1;
	}
	var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
	function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
		return value.replace(escapeSelectorAttributeValueInsideDoubleQuotesRegex, function(ch) {
			return "\\" + ch.charCodeAt(0).toString(16) + " ";
		});
	}
	function updateInput(element, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name) {
		element.name = "";
		null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type ? element.type = type : element.removeAttribute("type");
		if (null != value) if ("number" === type) {
			if (0 === value && "" === element.value || element.value != value) element.value = "" + getToStringValue(value);
		} else element.value !== "" + getToStringValue(value) && (element.value = "" + getToStringValue(value));
		else "submit" !== type && "reset" !== type || element.removeAttribute("value");
		null != value ? "number" === type && element.value == value ? setDefaultValue(element, getToStringValue(element.value)) : setDefaultValue(element, getToStringValue(value)) : null != defaultValue ? setDefaultValue(element, getToStringValue(defaultValue)) : null != lastDefaultValue && element.removeAttribute("value");
		null == checked && null != defaultChecked && (element.defaultChecked = !!defaultChecked);
		null != checked && (element.checked = checked && "function" !== typeof checked && "symbol" !== typeof checked);
		null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name ? element.name = "" + getToStringValue(name) : element.removeAttribute("name");
	}
	function initInput(element, value, defaultValue, checked, defaultChecked, type, name, isHydrating) {
		null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type && (element.type = type);
		if (null != value || null != defaultValue) {
			if (!("submit" !== type && "reset" !== type || void 0 !== value && null !== value)) {
				track(element);
				return;
			}
			defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
			value = null != value ? "" + getToStringValue(value) : defaultValue;
			isHydrating || value === element.value || (element.value = value);
			element.defaultValue = value;
		}
		checked = null != checked ? checked : defaultChecked;
		checked = "function" !== typeof checked && "symbol" !== typeof checked && !!checked;
		element.checked = isHydrating ? element.checked : !!checked;
		element.defaultChecked = !!checked;
		null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name && (element.name = name);
		track(element);
	}
	function setDefaultValue(node, value) {
		node.defaultValue !== "" + value && (node.defaultValue = "" + value);
	}
	function updateOptions(node, multiple, propValue, setDefaultSelected) {
		node = node.options;
		if (multiple) {
			multiple = {};
			for (var i = 0; i < propValue.length; i++) multiple["$" + propValue[i]] = !0;
			for (propValue = 0; propValue < node.length; propValue++) i = multiple.hasOwnProperty("$" + node[propValue].value), node[propValue].selected !== i && (node[propValue].selected = i), i && setDefaultSelected && (node[propValue].defaultSelected = !0);
		} else {
			propValue = "" + getToStringValue(propValue);
			multiple = null;
			for (i = 0; i < node.length; i++) {
				if (node[i].value === propValue) {
					node[i].selected = !0;
					setDefaultSelected && (node[i].defaultSelected = !0);
					return;
				}
				null !== multiple || node[i].disabled || (multiple = node[i]);
			}
			null !== multiple && (multiple.selected = !0);
		}
	}
	function updateTextarea(element, value, defaultValue) {
		if (null != value && (value = "" + getToStringValue(value), value !== element.value && (element.value = value), null == defaultValue)) {
			element.defaultValue !== value && (element.defaultValue = value);
			return;
		}
		element.defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
	}
	function initTextarea(element, value, defaultValue, children) {
		if (null == value) {
			if (null != children) {
				if (null != defaultValue) throw Error(formatProdErrorMessage(92));
				if (isArrayImpl(children)) {
					if (1 < children.length) throw Error(formatProdErrorMessage(93));
					children = children[0];
				}
				defaultValue = children;
			}
			defaultValue ??= "";
			value = defaultValue;
		}
		defaultValue = getToStringValue(value);
		element.defaultValue = defaultValue;
		children = element.textContent;
		children === defaultValue && "" !== children && null !== children && (element.value = children);
		track(element);
	}
	function setTextContent(node, text) {
		if (text) {
			var firstChild = node.firstChild;
			if (firstChild && firstChild === node.lastChild && 3 === firstChild.nodeType) {
				firstChild.nodeValue = text;
				return;
			}
		}
		node.textContent = text;
	}
	var unitlessNumbers = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function setValueForStyle(style, styleName, value) {
		var isCustomProperty = 0 === styleName.indexOf("--");
		null == value || "boolean" === typeof value || "" === value ? isCustomProperty ? style.setProperty(styleName, "") : "float" === styleName ? style.cssFloat = "" : style[styleName] = "" : isCustomProperty ? style.setProperty(styleName, value) : "number" !== typeof value || 0 === value || unitlessNumbers.has(styleName) ? "float" === styleName ? style.cssFloat = value : style[styleName] = ("" + value).trim() : style[styleName] = value + "px";
	}
	function setValueForStyles(node, styles, prevStyles) {
		if (null != styles && "object" !== typeof styles) throw Error(formatProdErrorMessage(62));
		node = node.style;
		if (null != prevStyles) {
			for (var styleName in prevStyles) !prevStyles.hasOwnProperty(styleName) || null != styles && styles.hasOwnProperty(styleName) || (0 === styleName.indexOf("--") ? node.setProperty(styleName, "") : "float" === styleName ? node.cssFloat = "" : node[styleName] = "", viewTransitionMutationContext = !0);
			for (var styleName$16 in styles) styleName = styles[styleName$16], styles.hasOwnProperty(styleName$16) && prevStyles[styleName$16] !== styleName && (setValueForStyle(node, styleName$16, styleName), viewTransitionMutationContext = !0);
		} else for (var styleName$17 in styles) styles.hasOwnProperty(styleName$17) && setValueForStyle(node, styleName$17, styles[styleName$17]);
	}
	function isCustomElement(tagName) {
		if (-1 === tagName.indexOf("-")) return !1;
		switch (tagName) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var aliases = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["maskType", "mask-type"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]);
	var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function sanitizeURL(url) {
		return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
	}
	function noop$1() {}
	var currentReplayingEvent = null;
	function getEventTarget(nativeEvent) {
		nativeEvent = nativeEvent.target || nativeEvent.srcElement || window;
		nativeEvent.correspondingUseElement && (nativeEvent = nativeEvent.correspondingUseElement);
		return 3 === nativeEvent.nodeType ? nativeEvent.parentNode : nativeEvent;
	}
	var restoreTarget = null;
	var restoreQueue = null;
	function restoreStateOfTarget(target) {
		var internalInstance = getInstanceFromNode(target);
		if (internalInstance && (target = internalInstance.stateNode)) {
			var props = target[internalPropsKey] || null;
			a: switch (target = internalInstance.stateNode, internalInstance.type) {
				case "input":
					updateInput(target, props.value, props.defaultValue, props.defaultValue, props.checked, props.defaultChecked, props.type, props.name);
					internalInstance = props.name;
					if ("radio" === props.type && null != internalInstance) {
						for (props = target; props.parentNode;) props = props.parentNode;
						props = props.querySelectorAll("input[name=\"" + escapeSelectorAttributeValueInsideDoubleQuotes("" + internalInstance) + "\"][type=\"radio\"]");
						for (internalInstance = 0; internalInstance < props.length; internalInstance++) {
							var otherNode = props[internalInstance];
							if (otherNode !== target && otherNode.form === target.form) {
								var otherProps = otherNode[internalPropsKey] || null;
								if (!otherProps) throw Error(formatProdErrorMessage(90));
								updateInput(otherNode, otherProps.value, otherProps.defaultValue, otherProps.defaultValue, otherProps.checked, otherProps.defaultChecked, otherProps.type, otherProps.name);
							}
						}
						for (internalInstance = 0; internalInstance < props.length; internalInstance++) otherNode = props[internalInstance], otherNode.form === target.form && updateValueIfChanged(otherNode);
					}
					break a;
				case "textarea":
					updateTextarea(target, props.value, props.defaultValue);
					break a;
				case "select": internalInstance = props.value, null != internalInstance && updateOptions(target, !!props.multiple, internalInstance, !1);
			}
		}
	}
	var isInsideEventHandler = !1;
	function batchedUpdates$1(fn, a, b) {
		if (isInsideEventHandler) return fn(a, b);
		isInsideEventHandler = !0;
		try {
			return fn(a);
		} finally {
			if (isInsideEventHandler = !1, null !== restoreTarget || null !== restoreQueue) {
				if (flushSyncWork$1(), restoreTarget && (a = restoreTarget, fn = restoreQueue, restoreQueue = restoreTarget = null, restoreStateOfTarget(a), fn)) for (a = 0; a < fn.length; a++) restoreStateOfTarget(fn[a]);
			}
		}
	}
	function getListener(inst, registrationName) {
		var stateNode = inst.stateNode;
		if (null === stateNode) return null;
		var props = stateNode[internalPropsKey] || null;
		if (null === props) return null;
		stateNode = props[registrationName];
		a: switch (registrationName) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(props = !props.disabled) || (inst = inst.type, props = !("button" === inst || "input" === inst || "select" === inst || "textarea" === inst));
				inst = !props;
				break a;
			default: inst = !1;
		}
		if (inst) return null;
		if (stateNode && "function" !== typeof stateNode) throw Error(formatProdErrorMessage(231, registrationName, typeof stateNode));
		return stateNode;
	}
	var canUseDOM = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
	var passiveBrowserEventsSupported = !1;
	if (canUseDOM) try {
		var options = {};
		Object.defineProperty(options, "passive", { get: function() {
			passiveBrowserEventsSupported = !0;
		} });
		window.addEventListener("test", options, options);
		window.removeEventListener("test", options, options);
	} catch (e) {
		passiveBrowserEventsSupported = !1;
	}
	var root = null;
	var startText = null;
	var fallbackText = null;
	function getData() {
		if (fallbackText) return fallbackText;
		var start, startValue = startText, startLength = startValue.length, end, endValue = "value" in root ? root.value : root.textContent, endLength = endValue.length;
		for (start = 0; start < startLength && startValue[start] === endValue[start]; start++);
		var minEnd = startLength - start;
		for (end = 1; end <= minEnd && startValue[startLength - end] === endValue[endLength - end]; end++);
		return fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0);
	}
	function getEventCharCode(nativeEvent) {
		var keyCode = nativeEvent.keyCode;
		"charCode" in nativeEvent ? (nativeEvent = nativeEvent.charCode, 0 === nativeEvent && 13 === keyCode && (nativeEvent = 13)) : nativeEvent = keyCode;
		10 === nativeEvent && (nativeEvent = 13);
		return 32 <= nativeEvent || 13 === nativeEvent ? nativeEvent : 0;
	}
	function functionThatReturnsTrue() {
		return !0;
	}
	function functionThatReturnsFalse() {
		return !1;
	}
	function createSyntheticEvent(Interface) {
		function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
			this._reactName = reactName;
			this._targetInst = targetInst;
			this.type = reactEventType;
			this.nativeEvent = nativeEvent;
			this.target = nativeEventTarget;
			this.currentTarget = null;
			for (var propName in Interface) Interface.hasOwnProperty(propName) && (reactName = Interface[propName], this[propName] = reactName ? reactName(nativeEvent) : nativeEvent[propName]);
			this.isDefaultPrevented = (null != nativeEvent.defaultPrevented ? nativeEvent.defaultPrevented : !1 === nativeEvent.returnValue) ? functionThatReturnsTrue : functionThatReturnsFalse;
			this.isPropagationStopped = functionThatReturnsFalse;
			return this;
		}
		assign(SyntheticBaseEvent.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var event = this.nativeEvent;
				event && (event.preventDefault ? event.preventDefault() : "unknown" !== typeof event.returnValue && (event.returnValue = !1), this.isDefaultPrevented = functionThatReturnsTrue);
			},
			stopPropagation: function() {
				var event = this.nativeEvent;
				event && (event.stopPropagation ? event.stopPropagation() : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = !0), this.isPropagationStopped = functionThatReturnsTrue);
			},
			persist: function() {},
			isPersistent: functionThatReturnsTrue
		});
		return SyntheticBaseEvent;
	}
	var EventInterface = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(event) {
			return event.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	};
	var SyntheticEvent = createSyntheticEvent(EventInterface);
	var UIEventInterface = assign({}, EventInterface, {
		view: 0,
		detail: 0
	});
	var SyntheticUIEvent = createSyntheticEvent(UIEventInterface);
	var lastMovementX;
	var lastMovementY;
	var lastMouseEvent;
	var MouseEventInterface = assign({}, UIEventInterface, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: getEventModifierState,
		button: 0,
		buttons: 0,
		relatedTarget: function(event) {
			return void 0 === event.relatedTarget ? event.fromElement === event.srcElement ? event.toElement : event.fromElement : event.relatedTarget;
		},
		movementX: function(event) {
			if ("movementX" in event) return event.movementX;
			event !== lastMouseEvent && (lastMouseEvent && "mousemove" === event.type ? (lastMovementX = event.screenX - lastMouseEvent.screenX, lastMovementY = event.screenY - lastMouseEvent.screenY) : lastMovementY = lastMovementX = 0, lastMouseEvent = event);
			return lastMovementX;
		},
		movementY: function(event) {
			return "movementY" in event ? event.movementY : lastMovementY;
		}
	});
	var SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
	var SyntheticDragEvent = createSyntheticEvent(assign({}, MouseEventInterface, { dataTransfer: 0 }));
	var SyntheticFocusEvent = createSyntheticEvent(assign({}, UIEventInterface, { relatedTarget: 0 }));
	var SyntheticAnimationEvent = createSyntheticEvent(assign({}, EventInterface, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	}));
	var SyntheticClipboardEvent = createSyntheticEvent(assign({}, EventInterface, { clipboardData: function(event) {
		return "clipboardData" in event ? event.clipboardData : window.clipboardData;
	} }));
	var SyntheticCompositionEvent = createSyntheticEvent(assign({}, EventInterface, { data: 0 }));
	var normalizeKey = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	};
	var translateToKey = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	};
	var modifierKeyToProp = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function modifierStateGetter(keyArg) {
		var nativeEvent = this.nativeEvent;
		return nativeEvent.getModifierState ? nativeEvent.getModifierState(keyArg) : (keyArg = modifierKeyToProp[keyArg]) ? !!nativeEvent[keyArg] : !1;
	}
	function getEventModifierState() {
		return modifierStateGetter;
	}
	var SyntheticKeyboardEvent = createSyntheticEvent(assign({}, UIEventInterface, {
		key: function(nativeEvent) {
			if (nativeEvent.key) {
				var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
				if ("Unidentified" !== key) return key;
			}
			return "keypress" === nativeEvent.type ? (nativeEvent = getEventCharCode(nativeEvent), 13 === nativeEvent ? "Enter" : String.fromCharCode(nativeEvent)) : "keydown" === nativeEvent.type || "keyup" === nativeEvent.type ? translateToKey[nativeEvent.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: getEventModifierState,
		charCode: function(event) {
			return "keypress" === event.type ? getEventCharCode(event) : 0;
		},
		keyCode: function(event) {
			return "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
		},
		which: function(event) {
			return "keypress" === event.type ? getEventCharCode(event) : "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
		}
	}));
	var SyntheticPointerEvent = createSyntheticEvent(assign({}, MouseEventInterface, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	}));
	var SyntheticSubmitEvent = createSyntheticEvent(assign({}, EventInterface, { submitter: 0 }));
	var SyntheticTouchEvent = createSyntheticEvent(assign({}, UIEventInterface, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: getEventModifierState
	}));
	var SyntheticTransitionEvent = createSyntheticEvent(assign({}, EventInterface, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	}));
	var SyntheticWheelEvent = createSyntheticEvent(assign({}, MouseEventInterface, {
		deltaX: function(event) {
			return "deltaX" in event ? event.deltaX : "wheelDeltaX" in event ? -event.wheelDeltaX : 0;
		},
		deltaY: function(event) {
			return "deltaY" in event ? event.deltaY : "wheelDeltaY" in event ? -event.wheelDeltaY : "wheelDelta" in event ? -event.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	}));
	var SyntheticToggleEvent = createSyntheticEvent(assign({}, EventInterface, {
		newState: 0,
		oldState: 0,
		source: 0
	}));
	var END_KEYCODES = [
		9,
		13,
		27,
		32
	];
	var canUseCompositionEvent = canUseDOM && "CompositionEvent" in window;
	var documentMode = null;
	canUseDOM && "documentMode" in document && (documentMode = document.documentMode);
	var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode;
	var useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || documentMode && 8 < documentMode && 11 >= documentMode);
	var SPACEBAR_CHAR = String.fromCharCode(32);
	var hasSpaceKeypress = !1;
	function isFallbackCompositionEnd(domEventName, nativeEvent) {
		switch (domEventName) {
			case "keyup": return -1 !== END_KEYCODES.indexOf(nativeEvent.keyCode);
			case "keydown": return 229 !== nativeEvent.keyCode;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function getDataFromCustomEvent(nativeEvent) {
		nativeEvent = nativeEvent.detail;
		return "object" === typeof nativeEvent && "data" in nativeEvent ? nativeEvent.data : null;
	}
	var isComposing = !1;
	function getNativeBeforeInputChars(domEventName, nativeEvent) {
		switch (domEventName) {
			case "compositionend": return getDataFromCustomEvent(nativeEvent);
			case "keypress":
				if (32 !== nativeEvent.which) return null;
				hasSpaceKeypress = !0;
				return SPACEBAR_CHAR;
			case "textInput": return domEventName = nativeEvent.data, domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName;
			default: return null;
		}
	}
	function getFallbackBeforeInputChars(domEventName, nativeEvent) {
		if (isComposing) return "compositionend" === domEventName || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent) ? (domEventName = getData(), fallbackText = startText = root = null, isComposing = !1, domEventName) : null;
		switch (domEventName) {
			case "paste": return null;
			case "keypress":
				if (!(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) || nativeEvent.ctrlKey && nativeEvent.altKey) {
					if (nativeEvent.char && 1 < nativeEvent.char.length) return nativeEvent.char;
					if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
				}
				return null;
			case "compositionend": return useFallbackCompositionData && "ko" !== nativeEvent.locale ? null : nativeEvent.data;
			default: return null;
		}
	}
	var supportedInputTypes = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function isTextInputElement(elem) {
		var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
		return "input" === nodeName ? !!supportedInputTypes[elem.type] : "textarea" === nodeName ? !0 : !1;
	}
	function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
		restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [target] : restoreTarget = target;
		inst = accumulateTwoPhaseListeners(inst, "onChange");
		0 < inst.length && (nativeEvent = new SyntheticEvent("onChange", "change", null, nativeEvent, target), dispatchQueue.push({
			event: nativeEvent,
			listeners: inst
		}));
	}
	var activeElement$1 = null;
	var activeElementInst$1 = null;
	function runEventInBatch(dispatchQueue) {
		processDispatchQueue(dispatchQueue, 0);
	}
	function getInstIfValueChanged(targetInst) {
		if (updateValueIfChanged(getNodeFromInstance(targetInst))) return targetInst;
	}
	function getTargetInstForChangeEvent(domEventName, targetInst) {
		if ("change" === domEventName) return targetInst;
	}
	var isInputEventSupported = !1;
	if (canUseDOM) {
		var JSCompiler_inline_result$jscomp$318;
		if (canUseDOM) {
			var isSupported$jscomp$inline_474 = "oninput" in document;
			if (!isSupported$jscomp$inline_474) {
				var element$jscomp$inline_475 = document.createElement("div");
				element$jscomp$inline_475.setAttribute("oninput", "return;");
				isSupported$jscomp$inline_474 = "function" === typeof element$jscomp$inline_475.oninput;
			}
			JSCompiler_inline_result$jscomp$318 = isSupported$jscomp$inline_474;
		} else JSCompiler_inline_result$jscomp$318 = !1;
		isInputEventSupported = JSCompiler_inline_result$jscomp$318 && (!document.documentMode || 9 < document.documentMode);
	}
	function stopWatchingForValueChange() {
		activeElement$1 && (activeElement$1.detachEvent("onpropertychange", handlePropertyChange), activeElementInst$1 = activeElement$1 = null);
	}
	function handlePropertyChange(nativeEvent) {
		if ("value" === nativeEvent.propertyName && getInstIfValueChanged(activeElementInst$1)) {
			var dispatchQueue = [];
			createAndAccumulateChangeEvent(dispatchQueue, activeElementInst$1, nativeEvent, getEventTarget(nativeEvent));
			batchedUpdates$1(runEventInBatch, dispatchQueue);
		}
	}
	function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
		"focusin" === domEventName ? (stopWatchingForValueChange(), activeElement$1 = target, activeElementInst$1 = targetInst, activeElement$1.attachEvent("onpropertychange", handlePropertyChange)) : "focusout" === domEventName && stopWatchingForValueChange();
	}
	function getTargetInstForInputEventPolyfill(domEventName) {
		if ("selectionchange" === domEventName || "keyup" === domEventName || "keydown" === domEventName) return getInstIfValueChanged(activeElementInst$1);
	}
	function getTargetInstForClickEvent(domEventName, targetInst) {
		if ("click" === domEventName) return getInstIfValueChanged(targetInst);
	}
	function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
		if ("input" === domEventName || "change" === domEventName) return getInstIfValueChanged(targetInst);
	}
	function is(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs = "function" === typeof Object.is ? Object.is : is;
	function shallowEqual(objA, objB) {
		if (objectIs(objA, objB)) return !0;
		if ("object" !== typeof objA || null === objA || "object" !== typeof objB || null === objB) return !1;
		var keysA = Object.keys(objA), keysB = Object.keys(objB);
		if (keysA.length !== keysB.length) return !1;
		for (keysB = 0; keysB < keysA.length; keysB++) {
			var currentKey = keysA[keysB];
			if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey])) return !1;
		}
		return !0;
	}
	function getActiveElement(doc) {
		doc = doc || ("undefined" !== typeof document ? document : void 0);
		if ("undefined" === typeof doc) return null;
		try {
			return doc.activeElement || doc.body;
		} catch (e$20) {
			return doc.body;
		}
	}
	function getLeafNode(node) {
		for (; node && node.firstChild;) node = node.firstChild;
		return node;
	}
	function getNodeForCharacterOffset(root, offset) {
		var node = getLeafNode(root);
		root = 0;
		for (var nodeEnd; node;) {
			if (3 === node.nodeType) {
				nodeEnd = root + node.textContent.length;
				if (root <= offset && nodeEnd >= offset) return {
					node,
					offset: offset - root
				};
				root = nodeEnd;
			}
			a: {
				for (; node;) {
					if (node.nextSibling) {
						node = node.nextSibling;
						break a;
					}
					node = node.parentNode;
				}
				node = void 0;
			}
			node = getLeafNode(node);
		}
	}
	function containsNode(outerNode, innerNode) {
		return outerNode && innerNode ? outerNode === innerNode ? !0 : outerNode && 3 === outerNode.nodeType ? !1 : innerNode && 3 === innerNode.nodeType ? containsNode(outerNode, innerNode.parentNode) : "contains" in outerNode ? outerNode.contains(innerNode) : outerNode.compareDocumentPosition ? !!(outerNode.compareDocumentPosition(innerNode) & 16) : !1 : !1;
	}
	function getActiveElementDeep(containerInfo) {
		containerInfo = null != containerInfo && null != containerInfo.ownerDocument && null != containerInfo.ownerDocument.defaultView ? containerInfo.ownerDocument.defaultView : window;
		for (var element = getActiveElement(containerInfo.document); element instanceof containerInfo.HTMLIFrameElement;) {
			try {
				var JSCompiler_inline_result = "string" === typeof element.contentWindow.location.href;
			} catch (err) {
				JSCompiler_inline_result = !1;
			}
			if (JSCompiler_inline_result) containerInfo = element.contentWindow;
			else break;
			element = getActiveElement(containerInfo.document);
		}
		return element;
	}
	function hasSelectionCapabilities(elem) {
		var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
		return nodeName && ("input" === nodeName && ("text" === elem.type || "search" === elem.type || "tel" === elem.type || "url" === elem.type || "password" === elem.type) || "textarea" === nodeName || "true" === elem.contentEditable);
	}
	var skipSelectionChangeEvent = canUseDOM && "documentMode" in document && 11 >= document.documentMode;
	var activeElement = null;
	var activeElementInst = null;
	var lastSelection = null;
	var mouseDown = !1;
	function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
		var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : 9 === nativeEventTarget.nodeType ? nativeEventTarget : nativeEventTarget.ownerDocument;
		mouseDown || null == activeElement || activeElement !== getActiveElement(doc) || (doc = activeElement, "selectionStart" in doc && hasSelectionCapabilities(doc) ? doc = {
			start: doc.selectionStart,
			end: doc.selectionEnd
		} : (doc = (doc.ownerDocument && doc.ownerDocument.defaultView || window).getSelection(), doc = {
			anchorNode: doc.anchorNode,
			anchorOffset: doc.anchorOffset,
			focusNode: doc.focusNode,
			focusOffset: doc.focusOffset
		}), lastSelection && shallowEqual(lastSelection, doc) || (lastSelection = doc, doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect"), 0 < doc.length && (nativeEvent = new SyntheticEvent("onSelect", "select", null, nativeEvent, nativeEventTarget), dispatchQueue.push({
			event: nativeEvent,
			listeners: doc
		}), nativeEvent.target = activeElement)));
	}
	function makePrefixMap(styleProp, eventName) {
		var prefixes = {};
		prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
		prefixes["Webkit" + styleProp] = "webkit" + eventName;
		prefixes["Moz" + styleProp] = "moz" + eventName;
		return prefixes;
	}
	var vendorPrefixes = {
		animationend: makePrefixMap("Animation", "AnimationEnd"),
		animationiteration: makePrefixMap("Animation", "AnimationIteration"),
		animationstart: makePrefixMap("Animation", "AnimationStart"),
		transitionrun: makePrefixMap("Transition", "TransitionRun"),
		transitionstart: makePrefixMap("Transition", "TransitionStart"),
		transitioncancel: makePrefixMap("Transition", "TransitionCancel"),
		transitionend: makePrefixMap("Transition", "TransitionEnd")
	};
	var prefixedEventNames = {};
	var style = {};
	canUseDOM && (style = document.createElement("div").style, "AnimationEvent" in window || (delete vendorPrefixes.animationend.animation, delete vendorPrefixes.animationiteration.animation, delete vendorPrefixes.animationstart.animation), "TransitionEvent" in window || delete vendorPrefixes.transitionend.transition);
	function getVendorPrefixedEventName(eventName) {
		if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
		if (!vendorPrefixes[eventName]) return eventName;
		var prefixMap = vendorPrefixes[eventName], styleProp;
		for (styleProp in prefixMap) if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) return prefixedEventNames[eventName] = prefixMap[styleProp];
		return eventName;
	}
	var ANIMATION_END = getVendorPrefixedEventName("animationend");
	var ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration");
	var ANIMATION_START = getVendorPrefixedEventName("animationstart");
	var TRANSITION_RUN = getVendorPrefixedEventName("transitionrun");
	var TRANSITION_START = getVendorPrefixedEventName("transitionstart");
	var TRANSITION_CANCEL = getVendorPrefixedEventName("transitioncancel");
	var TRANSITION_END = getVendorPrefixedEventName("transitionend");
	var topLevelEventsToReactNames = /* @__PURE__ */ new Map();
	var simpleEventPluginEvents = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	simpleEventPluginEvents.push("scrollEnd");
	function registerSimpleEvent(domEventName, reactName) {
		topLevelEventsToReactNames.set(domEventName, reactName);
		registerTwoPhaseEvent(reactName, [domEventName]);
	}
	var globalClientIdCounter$1 = 0;
	function getViewTransitionName(props, instance) {
		if (null != props.name && "auto" !== props.name) return props.name;
		if (null !== instance.autoName) return instance.autoName;
		props = pendingEffectsRoot.identifierPrefix;
		var globalClientId = globalClientIdCounter$1++;
		props = "_" + props + "t_" + globalClientId.toString(32) + "_";
		return instance.autoName = props;
	}
	function getClassNameByType(classByType) {
		if (null == classByType || "string" === typeof classByType) return classByType;
		var className = null, activeTypes = pendingTransitionTypes;
		if (null !== activeTypes) for (var i = 0; i < activeTypes.length; i++) {
			var match = classByType[activeTypes[i]];
			if (null != match) {
				if ("none" === match) return "none";
				className = null == className ? match : className + (" " + match);
			}
		}
		return null == className ? classByType.default : className;
	}
	function getViewTransitionClassName(defaultClass, eventClass) {
		defaultClass = getClassNameByType(defaultClass);
		eventClass = getClassNameByType(eventClass);
		return null == eventClass ? "auto" === defaultClass ? null : defaultClass : "auto" === eventClass ? null : eventClass;
	}
	var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
		if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
			var event = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
				error
			});
			if (!window.dispatchEvent(event)) return;
		} else if ("object" === typeof process && "function" === typeof process.emit) {
			process.emit("uncaughtException", error);
			return;
		}
		console.error(error);
	};
	var concurrentQueues = [];
	var concurrentQueuesIndex = 0;
	var concurrentlyUpdatedLanes = 0;
	function finishQueueingConcurrentUpdates() {
		for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i < endIndex;) {
			var fiber = concurrentQueues[i];
			concurrentQueues[i++] = null;
			var queue = concurrentQueues[i];
			concurrentQueues[i++] = null;
			var update = concurrentQueues[i];
			concurrentQueues[i++] = null;
			var lane = concurrentQueues[i];
			concurrentQueues[i++] = null;
			if (null !== queue && null !== update) {
				var pending = queue.pending;
				null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
				queue.pending = update;
			}
			0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
		}
	}
	function enqueueUpdate$1(fiber, queue, update, lane) {
		concurrentQueues[concurrentQueuesIndex++] = fiber;
		concurrentQueues[concurrentQueuesIndex++] = queue;
		concurrentQueues[concurrentQueuesIndex++] = update;
		concurrentQueues[concurrentQueuesIndex++] = lane;
		concurrentlyUpdatedLanes |= lane;
		fiber.lanes |= lane;
		fiber = fiber.alternate;
		null !== fiber && (fiber.lanes |= lane);
	}
	function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
		enqueueUpdate$1(fiber, queue, update, lane);
		return getRootForUpdatedFiber(fiber);
	}
	function enqueueConcurrentRenderForLane(fiber, lane) {
		enqueueUpdate$1(fiber, null, null, lane);
		return getRootForUpdatedFiber(fiber);
	}
	function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
		sourceFiber.lanes |= lane;
		var alternate = sourceFiber.alternate;
		null !== alternate && (alternate.lanes |= lane);
		for (var isHidden = !1, parent = sourceFiber.return; null !== parent;) parent.childLanes |= lane, alternate = parent.alternate, null !== alternate && (alternate.childLanes |= lane), 22 === parent.tag && (sourceFiber = parent.stateNode, null === sourceFiber || sourceFiber._visibility & 1 || (isHidden = !0)), sourceFiber = parent, parent = parent.return;
		return 3 === sourceFiber.tag ? (parent = sourceFiber.stateNode, isHidden && null !== update && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], null === alternate ? sourceFiber[isHidden] = [update] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
	}
	function getRootForUpdatedFiber(sourceFiber) {
		if (50 < nestedUpdateCount) throw nestedUpdateCount = 0, rootWithNestedUpdates = null, Error(formatProdErrorMessage(185));
		for (var parent = sourceFiber.return; null !== parent;) sourceFiber = parent, parent = sourceFiber.return;
		return 3 === sourceFiber.tag ? sourceFiber.stateNode : null;
	}
	var emptyContextObject = {};
	function FiberNode(tag, pendingProps, key, mode) {
		this.tag = tag;
		this.key = key;
		this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
		this.index = 0;
		this.refCleanup = this.ref = null;
		this.pendingProps = pendingProps;
		this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
		this.mode = mode;
		this.subtreeFlags = this.flags = 0;
		this.deletions = null;
		this.childLanes = this.lanes = 0;
		this.alternate = null;
	}
	function createFiberImplClass(tag, pendingProps, key, mode) {
		return new FiberNode(tag, pendingProps, key, mode);
	}
	function shouldConstruct(Component) {
		Component = Component.prototype;
		return !(!Component || !Component.isReactComponent);
	}
	function createWorkInProgress(current, pendingProps) {
		var workInProgress = current.alternate;
		null === workInProgress ? (workInProgress = createFiberImplClass(current.tag, pendingProps, current.key, current.mode), workInProgress.elementType = current.elementType, workInProgress.type = current.type, workInProgress.stateNode = current.stateNode, workInProgress.alternate = current, current.alternate = workInProgress) : (workInProgress.pendingProps = pendingProps, workInProgress.type = current.type, workInProgress.flags = 0, workInProgress.subtreeFlags = 0, workInProgress.deletions = null);
		workInProgress.flags = current.flags & 1206910976;
		workInProgress.childLanes = current.childLanes;
		workInProgress.lanes = current.lanes;
		workInProgress.child = current.child;
		workInProgress.memoizedProps = current.memoizedProps;
		workInProgress.memoizedState = current.memoizedState;
		workInProgress.updateQueue = current.updateQueue;
		pendingProps = current.dependencies;
		workInProgress.dependencies = null === pendingProps ? null : {
			lanes: pendingProps.lanes,
			firstContext: pendingProps.firstContext
		};
		workInProgress.sibling = current.sibling;
		workInProgress.index = current.index;
		workInProgress.ref = current.ref;
		workInProgress.refCleanup = current.refCleanup;
		return workInProgress;
	}
	function resetWorkInProgress(workInProgress, renderLanes) {
		workInProgress.flags &= 1206910978;
		var current = workInProgress.alternate;
		null === current ? (workInProgress.childLanes = 0, workInProgress.lanes = renderLanes, workInProgress.child = null, workInProgress.subtreeFlags = 0, workInProgress.memoizedProps = null, workInProgress.memoizedState = null, workInProgress.updateQueue = null, workInProgress.dependencies = null, workInProgress.stateNode = null) : (workInProgress.childLanes = current.childLanes, workInProgress.lanes = current.lanes, workInProgress.child = current.child, workInProgress.subtreeFlags = 0, workInProgress.deletions = null, workInProgress.memoizedProps = current.memoizedProps, workInProgress.memoizedState = current.memoizedState, workInProgress.updateQueue = current.updateQueue, workInProgress.type = current.type, renderLanes = current.dependencies, workInProgress.dependencies = null === renderLanes ? null : {
			lanes: renderLanes.lanes,
			firstContext: renderLanes.firstContext
		});
		return workInProgress;
	}
	function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
		var fiberTag = 0;
		owner = type;
		if ("function" === typeof owner) shouldConstruct(owner) && (fiberTag = 1);
		else if ("string" === typeof owner) fiberTag = isHostHoistableType(type, pendingProps, contextStackCursor.current) ? 26 : "html" === type || "head" === type || "body" === type ? 27 : 5;
		else a: switch (owner) {
			case REACT_ACTIVITY_TYPE: return type = createFiberImplClass(31, pendingProps, key, mode), type.elementType = REACT_ACTIVITY_TYPE, type.lanes = lanes, type;
			case REACT_FRAGMENT_TYPE: return createFiberFromFragment(pendingProps.children, mode, lanes, key);
			case REACT_STRICT_MODE_TYPE:
				fiberTag = 8;
				mode |= 24;
				break;
			case REACT_PROFILER_TYPE: return type = createFiberImplClass(12, pendingProps, key, mode | 2), type.elementType = REACT_PROFILER_TYPE, type.lanes = lanes, type;
			case REACT_SUSPENSE_TYPE: return type = createFiberImplClass(13, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_TYPE, type.lanes = lanes, type;
			case REACT_SUSPENSE_LIST_TYPE: return type = createFiberImplClass(19, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_LIST_TYPE, type.lanes = lanes, type;
			case REACT_LEGACY_HIDDEN_TYPE:
			case REACT_VIEW_TRANSITION_TYPE: return type = mode | 32, type = createFiberImplClass(30, pendingProps, key, type), type.elementType = REACT_VIEW_TRANSITION_TYPE, type.lanes = lanes, type.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, type;
			default:
				if ("object" === typeof owner && null !== owner) switch (owner.$$typeof) {
					case REACT_CONTEXT_TYPE:
						fiberTag = 10;
						break a;
					case REACT_CONSUMER_TYPE:
						fiberTag = 9;
						break a;
					case REACT_FORWARD_REF_TYPE:
						fiberTag = 11;
						break a;
					case REACT_MEMO_TYPE:
						fiberTag = 14;
						break a;
					case REACT_LAZY_TYPE:
						fiberTag = 16;
						owner = null;
						break a;
				}
				fiberTag = 29;
				pendingProps = Error(formatProdErrorMessage(130, null === type ? "null" : typeof type, ""));
				owner = null;
		}
		key = createFiberImplClass(fiberTag, pendingProps, key, mode);
		key.elementType = type;
		key.type = owner;
		key.lanes = lanes;
		return key;
	}
	function createFiberFromFragment(elements, mode, lanes, key) {
		elements = createFiberImplClass(7, elements, key, mode);
		elements.lanes = lanes;
		return elements;
	}
	function createFiberFromText(content, mode, lanes) {
		content = createFiberImplClass(6, content, null, mode);
		content.lanes = lanes;
		return content;
	}
	function createFiberFromDehydratedFragment(dehydratedNode) {
		var fiber = createFiberImplClass(18, null, null, 0);
		fiber.stateNode = dehydratedNode;
		return fiber;
	}
	function createFiberFromPortal(portal, mode, lanes) {
		mode = createFiberImplClass(4, null !== portal.children ? portal.children : [], portal.key, mode);
		mode.lanes = lanes;
		mode.stateNode = {
			containerInfo: portal.containerInfo,
			pendingChildren: null,
			implementation: portal.implementation
		};
		return mode;
	}
	var CapturedStacks = /* @__PURE__ */ new WeakMap();
	function createCapturedValueAtFiber(value, source) {
		if ("object" === typeof value && null !== value) {
			var existing = CapturedStacks.get(value);
			if (void 0 !== existing) return existing;
			source = {
				value,
				source,
				stack: getStackByFiberInDevAndProd(source)
			};
			CapturedStacks.set(value, source);
			return source;
		}
		return {
			value,
			source,
			stack: getStackByFiberInDevAndProd(source)
		};
	}
	var forkStack = [];
	var forkStackIndex = 0;
	var treeForkProvider = null;
	var treeForkCount = 0;
	var idStack = [];
	var idStackIndex = 0;
	var treeContextProvider = null;
	var treeContextId = 1;
	var treeContextOverflow = "";
	function pushTreeFork(workInProgress, totalChildren) {
		forkStack[forkStackIndex++] = treeForkCount;
		forkStack[forkStackIndex++] = treeForkProvider;
		treeForkProvider = workInProgress;
		treeForkCount = totalChildren;
	}
	function pushTreeId(workInProgress, totalChildren, index) {
		idStack[idStackIndex++] = treeContextId;
		idStack[idStackIndex++] = treeContextOverflow;
		idStack[idStackIndex++] = treeContextProvider;
		treeContextProvider = workInProgress;
		var baseIdWithLeadingBit = treeContextId;
		workInProgress = treeContextOverflow;
		var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
		baseIdWithLeadingBit &= ~(1 << baseLength);
		index += 1;
		var length = 32 - clz32(totalChildren) + baseLength;
		if (30 < length) {
			var numberOfOverflowBits = baseLength - baseLength % 5;
			length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
			baseIdWithLeadingBit >>= numberOfOverflowBits;
			baseLength -= numberOfOverflowBits;
			treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index << baseLength | baseIdWithLeadingBit;
			treeContextOverflow = length + workInProgress;
		} else treeContextId = 1 << length | index << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress;
	}
	function pushMaterializedTreeId(workInProgress) {
		null !== workInProgress.return && (pushTreeFork(workInProgress, 1), pushTreeId(workInProgress, 1, 0));
	}
	function popTreeContext(workInProgress) {
		for (; workInProgress === treeForkProvider;) treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
		for (; workInProgress === treeContextProvider;) treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
	}
	function restoreSuspendedTreeContext(workInProgress, suspendedContext) {
		idStack[idStackIndex++] = treeContextId;
		idStack[idStackIndex++] = treeContextOverflow;
		idStack[idStackIndex++] = treeContextProvider;
		treeContextId = suspendedContext.id;
		treeContextOverflow = suspendedContext.overflow;
		treeContextProvider = workInProgress;
	}
	var hydrationParentFiber = null;
	var nextHydratableInstance = null;
	var isHydrating = !1;
	var hydrationErrors = null;
	var rootOrSingletonContext = !1;
	var HydrationMismatchException = Error(formatProdErrorMessage(519));
	function throwOnHydrationMismatch(fiber) {
		queueHydrationError(createCapturedValueAtFiber(Error(formatProdErrorMessage(418, 1 < arguments.length && void 0 !== arguments[1] && arguments[1] ? "text" : "HTML", "")), fiber));
		throw HydrationMismatchException;
	}
	function prepareToHydrateHostInstance(fiber) {
		var instance = fiber.stateNode, type = fiber.type, props = fiber.memoizedProps;
		instance[internalInstanceKey] = fiber;
		instance[internalPropsKey] = props;
		switch (type) {
			case "dialog":
				listenToNonDelegatedEvent("cancel", instance);
				listenToNonDelegatedEvent("close", instance);
				break;
			case "iframe":
			case "object":
			case "embed":
				listenToNonDelegatedEvent("load", instance);
				break;
			case "video":
			case "audio":
				for (type = 0; type < mediaEventTypes.length; type++) listenToNonDelegatedEvent(mediaEventTypes[type], instance);
				break;
			case "source":
				listenToNonDelegatedEvent("error", instance);
				break;
			case "img":
			case "image":
			case "link":
				listenToNonDelegatedEvent("error", instance);
				listenToNonDelegatedEvent("load", instance);
				break;
			case "details":
				listenToNonDelegatedEvent("toggle", instance);
				break;
			case "input":
				listenToNonDelegatedEvent("invalid", instance);
				initInput(instance, props.value, props.defaultValue, props.checked, props.defaultChecked, props.type, props.name, !0);
				break;
			case "select":
				listenToNonDelegatedEvent("invalid", instance);
				break;
			case "textarea": listenToNonDelegatedEvent("invalid", instance), initTextarea(instance, props.value, props.defaultValue, props.children);
		}
		type = props.children;
		"string" !== typeof type && "number" !== typeof type && "bigint" !== typeof type || instance.textContent === "" + type || !0 === props.suppressHydrationWarning || checkForUnmatchedText(instance.textContent, type) ? (null != props.popover && (listenToNonDelegatedEvent("beforetoggle", instance), listenToNonDelegatedEvent("toggle", instance)), null != props.onScroll && listenToNonDelegatedEvent("scroll", instance), null != props.onScrollEnd && listenToNonDelegatedEvent("scrollend", instance), null != props.onClick && (instance.onclick = noop$1), instance = !0) : instance = !1;
		instance || throwOnHydrationMismatch(fiber, !0);
	}
	function popToNextHostParent(fiber) {
		for (hydrationParentFiber = fiber.return; hydrationParentFiber;) switch (hydrationParentFiber.tag) {
			case 5:
			case 31:
			case 13:
				rootOrSingletonContext = !1;
				return;
			case 27:
			case 3:
				rootOrSingletonContext = !0;
				return;
			default: hydrationParentFiber = hydrationParentFiber.return;
		}
	}
	function popHydrationState(fiber) {
		if (fiber !== hydrationParentFiber) return !1;
		if (!isHydrating) return popToNextHostParent(fiber), isHydrating = !0, !1;
		var tag = fiber.tag, JSCompiler_temp;
		if (JSCompiler_temp = 3 !== tag && 27 !== tag) {
			if (JSCompiler_temp = 5 === tag) JSCompiler_temp = fiber.type, JSCompiler_temp = !("form" !== JSCompiler_temp && "button" !== JSCompiler_temp) || shouldSetTextContent(fiber.type, fiber.memoizedProps);
			JSCompiler_temp = !JSCompiler_temp;
		}
		JSCompiler_temp && nextHydratableInstance && throwOnHydrationMismatch(fiber);
		popToNextHostParent(fiber);
		if (13 === tag) {
			fiber = fiber.memoizedState;
			fiber = null !== fiber ? fiber.dehydrated : null;
			if (!fiber) throw Error(formatProdErrorMessage(317));
			nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
		} else if (31 === tag) {
			fiber = fiber.memoizedState;
			fiber = null !== fiber ? fiber.dehydrated : null;
			if (!fiber) throw Error(formatProdErrorMessage(317));
			nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
		} else 27 === tag ? (tag = nextHydratableInstance, isSingletonScope(fiber.type) ? (fiber = previousHydratableOnEnteringScopedSingleton, previousHydratableOnEnteringScopedSingleton = null, nextHydratableInstance = fiber) : nextHydratableInstance = tag) : nextHydratableInstance = hydrationParentFiber ? getNextHydratable(fiber.stateNode.nextSibling) : null;
		return !0;
	}
	function resetHydrationState() {
		nextHydratableInstance = hydrationParentFiber = null;
		isHydrating = !1;
	}
	function upgradeHydrationErrorsToRecoverable() {
		var queuedErrors = hydrationErrors;
		null !== queuedErrors && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, queuedErrors), hydrationErrors = null);
		return queuedErrors;
	}
	function queueHydrationError(error) {
		null === hydrationErrors ? hydrationErrors = [error] : hydrationErrors.push(error);
	}
	var valueCursor = createCursor(null);
	var currentlyRenderingFiber$1 = null;
	var lastContextDependency = null;
	function pushProvider(providerFiber, context, nextValue) {
		push(valueCursor, context._currentValue);
		context._currentValue = nextValue;
	}
	function popProvider(context) {
		context._currentValue = valueCursor.current;
		pop(valueCursor);
	}
	function scheduleContextWorkOnParentPath(parent, renderLanes, propagationRoot) {
		for (; null !== parent;) {
			var alternate = parent.alternate;
			(parent.childLanes & renderLanes) !== renderLanes ? (parent.childLanes |= renderLanes, null !== alternate && (alternate.childLanes |= renderLanes)) : null !== alternate && (alternate.childLanes & renderLanes) !== renderLanes && (alternate.childLanes |= renderLanes);
			if (parent === propagationRoot) break;
			parent = parent.return;
		}
	}
	function propagateContextChanges(workInProgress, contexts, renderLanes, forcePropagateEntireTree) {
		var fiber = workInProgress.child;
		null !== fiber && (fiber.return = workInProgress);
		for (; null !== fiber;) {
			var list = fiber.dependencies;
			if (null !== list) {
				var nextFiber = fiber.child;
				list = list.firstContext;
				a: for (; null !== list;) {
					var dependency = list;
					list = fiber;
					for (var i = 0; i < contexts.length; i++) if (dependency.context === contexts[i]) {
						list.lanes |= renderLanes;
						dependency = list.alternate;
						null !== dependency && (dependency.lanes |= renderLanes);
						scheduleContextWorkOnParentPath(list.return, renderLanes, workInProgress);
						forcePropagateEntireTree || (nextFiber = null);
						break a;
					}
					list = dependency.next;
				}
			} else if (18 === fiber.tag) {
				nextFiber = fiber.return;
				if (null === nextFiber) throw Error(formatProdErrorMessage(341));
				nextFiber.lanes |= renderLanes;
				list = nextFiber.alternate;
				null !== list && (list.lanes |= renderLanes);
				scheduleContextWorkOnParentPath(nextFiber, renderLanes, workInProgress);
				nextFiber = null;
			} else 13 === fiber.tag && null !== fiber.memoizedState && null === fiber.memoizedState.dehydrated ? (fiber.lanes |= renderLanes, nextFiber = fiber.alternate, null !== nextFiber && (nextFiber.lanes |= renderLanes), scheduleContextWorkOnParentPath(fiber.return, renderLanes, workInProgress), nextFiber = fiber.child, nextFiber = null !== nextFiber ? nextFiber.sibling : null) : nextFiber = fiber.child;
			if (null !== nextFiber) nextFiber.return = fiber;
			else for (nextFiber = fiber; null !== nextFiber;) {
				if (nextFiber === workInProgress) {
					nextFiber = null;
					break;
				}
				fiber = nextFiber.sibling;
				if (null !== fiber) {
					fiber.return = nextFiber.return;
					nextFiber = fiber;
					break;
				}
				nextFiber = nextFiber.return;
			}
			fiber = nextFiber;
		}
	}
	function propagateParentContextChanges(current, workInProgress, renderLanes, forcePropagateEntireTree) {
		current = null;
		for (var parent = workInProgress, isInsidePropagationBailout = !1; null !== parent;) {
			if (!isInsidePropagationBailout) {
				if (0 !== (parent.flags & 524288)) isInsidePropagationBailout = !0;
				else if (0 !== (parent.flags & 262144)) break;
			}
			if (10 === parent.tag) {
				var currentParent = parent.alternate;
				if (null === currentParent) throw Error(formatProdErrorMessage(387));
				currentParent = currentParent.memoizedProps;
				if (null !== currentParent) {
					var context = parent.type;
					objectIs(parent.pendingProps.value, currentParent.value) || (null !== current ? current.push(context) : current = [context]);
				}
			} else if (parent === hostTransitionProviderCursor.current) {
				currentParent = parent.alternate;
				if (null === currentParent) throw Error(formatProdErrorMessage(387));
				currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (null !== current ? current.push(HostTransitionContext) : current = [HostTransitionContext]);
			}
			parent = parent.return;
		}
		null !== current && propagateContextChanges(workInProgress, current, renderLanes, forcePropagateEntireTree);
		workInProgress.flags |= 262144;
		return null !== current;
	}
	function checkIfContextChanged(currentDependencies) {
		for (currentDependencies = currentDependencies.firstContext; null !== currentDependencies;) {
			if (!objectIs(currentDependencies.context._currentValue, currentDependencies.memoizedValue)) return !0;
			currentDependencies = currentDependencies.next;
		}
		return !1;
	}
	function prepareToReadContext(workInProgress) {
		currentlyRenderingFiber$1 = workInProgress;
		lastContextDependency = null;
		workInProgress = workInProgress.dependencies;
		null !== workInProgress && (workInProgress.firstContext = null);
	}
	function readContext(context) {
		return readContextForConsumer(currentlyRenderingFiber$1, context);
	}
	function readContextDuringReconciliation(consumer, context) {
		null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
		return readContextForConsumer(consumer, context);
	}
	function readContextForConsumer(consumer, context) {
		var value = context._currentValue;
		context = {
			context,
			memoizedValue: value,
			next: null
		};
		if (null === lastContextDependency) {
			if (null === consumer) throw Error(formatProdErrorMessage(308));
			lastContextDependency = context;
			consumer.dependencies = {
				lanes: 0,
				firstContext: context
			};
			consumer.flags |= 524288;
		} else lastContextDependency = lastContextDependency.next = context;
		return value;
	}
	var AbortControllerLocal = "undefined" !== typeof AbortController ? AbortController : function() {
		var listeners = [], signal = this.signal = {
			aborted: !1,
			addEventListener: function(type, listener) {
				listeners.push(listener);
			}
		};
		this.abort = function() {
			signal.aborted = !0;
			listeners.forEach(function(listener) {
				return listener();
			});
		};
	};
	var scheduleCallback$2 = Scheduler.unstable_scheduleCallback;
	var NormalPriority = Scheduler.unstable_NormalPriority;
	var CacheContext = {
		$$typeof: REACT_CONTEXT_TYPE,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function createCache() {
		return {
			controller: new AbortControllerLocal(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function releaseCache(cache) {
		cache.refCount--;
		0 === cache.refCount && scheduleCallback$2(NormalPriority, function() {
			cache.controller.abort();
		});
	}
	function queueTransitionTypes(root, transitionTypes) {
		if (0 !== (root.pendingLanes & 4194048)) {
			var queued = root.transitionTypes;
			null === queued && (queued = root.transitionTypes = []);
			for (root = 0; root < transitionTypes.length; root++) {
				var transitionType = transitionTypes[root];
				-1 === queued.indexOf(transitionType) && queued.push(transitionType);
			}
		}
	}
	var entangledTransitionTypes = null;
	function claimQueuedTransitionTypes(root) {
		var claimed = root.transitionTypes;
		root.transitionTypes = null;
		return claimed;
	}
	var currentEntangledListeners = null;
	var currentEntangledPendingCount = 0;
	var currentEntangledLane = 0;
	var currentEntangledActionThenable = null;
	function entangleAsyncAction(transition, thenable) {
		if (null === currentEntangledListeners) {
			var entangledListeners = currentEntangledListeners = [];
			currentEntangledPendingCount = 0;
			currentEntangledLane = requestTransitionLane();
			currentEntangledActionThenable = {
				status: "pending",
				value: void 0,
				then: function(resolve) {
					entangledListeners.push(resolve);
				}
			};
		}
		currentEntangledPendingCount++;
		thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
		return thenable;
	}
	function pingEngtangledActionScope() {
		if (0 === --currentEntangledPendingCount && (entangledTransitionTypes = null, null !== currentEntangledListeners)) {
			null !== currentEntangledActionThenable && (currentEntangledActionThenable.status = "fulfilled");
			var listeners = currentEntangledListeners;
			currentEntangledListeners = null;
			currentEntangledLane = 0;
			currentEntangledActionThenable = null;
			for (var i = 0; i < listeners.length; i++) (0, listeners[i])();
		}
	}
	function chainThenableValue(thenable, result) {
		var listeners = [], thenableWithOverride = {
			status: "pending",
			value: null,
			reason: null,
			then: function(resolve) {
				listeners.push(resolve);
			}
		};
		thenable.then(function() {
			thenableWithOverride.status = "fulfilled";
			thenableWithOverride.value = result;
			for (var i = 0; i < listeners.length; i++) (0, listeners[i])(result);
		}, function(error) {
			thenableWithOverride.status = "rejected";
			thenableWithOverride.reason = error;
			for (error = 0; error < listeners.length; error++) (0, listeners[error])(void 0);
		});
		return thenableWithOverride;
	}
	var prevOnStartTransitionFinish = ReactSharedInternals.S;
	ReactSharedInternals.S = function(transition, returnValue) {
		globalMostRecentTransitionTime = now();
		"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && entangleAsyncAction(transition, returnValue);
		if (null !== entangledTransitionTypes) for (var root$28 = firstScheduledRoot; null !== root$28;) queueTransitionTypes(root$28, entangledTransitionTypes), root$28 = root$28.next;
		root$28 = transition.types;
		if (null !== root$28) {
			for (var root$29 = firstScheduledRoot; null !== root$29;) queueTransitionTypes(root$29, root$28), root$29 = root$29.next;
			if (0 !== currentEntangledLane) {
				root$29 = entangledTransitionTypes;
				null === root$29 && (root$29 = entangledTransitionTypes = []);
				for (var i = 0; i < root$28.length; i++) {
					var transitionType = root$28[i];
					-1 === root$29.indexOf(transitionType) && root$29.push(transitionType);
				}
			}
		}
		null !== prevOnStartTransitionFinish && prevOnStartTransitionFinish(transition, returnValue);
	};
	var resumedCache = createCursor(null);
	function peekCacheFromPool() {
		var cacheResumedFromPreviousRender = resumedCache.current;
		return null !== cacheResumedFromPreviousRender ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
	}
	function pushTransition(offscreenWorkInProgress, prevCachePool) {
		null === prevCachePool ? push(resumedCache, resumedCache.current) : push(resumedCache, prevCachePool.pool);
	}
	function getSuspendedCache() {
		var cacheFromPool = peekCacheFromPool();
		return null === cacheFromPool ? null : {
			parent: CacheContext._currentValue,
			pool: cacheFromPool
		};
	}
	var SuspenseException = Error(formatProdErrorMessage(460));
	var SuspenseyCommitException = Error(formatProdErrorMessage(474));
	var SuspenseActionException = Error(formatProdErrorMessage(542));
	var noopSuspenseyCommitThenable = { then: function() {} };
	function isThenableResolved(thenable) {
		thenable = thenable.status;
		return "fulfilled" === thenable || "rejected" === thenable;
	}
	function trackUsedThenable(thenableState, thenable, index) {
		index = thenableState[index];
		void 0 === index ? thenableState.push(thenable) : index !== thenable && (thenable.then(noop$1, noop$1), thenable = index);
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected":
				thenableState = thenable.reason;
				checkIfUseWrappedInAsyncCatch(thenableState);
				if (void 0 === thenableState && !("reason" in thenable)) throw Error(formatProdErrorMessage(600));
				throw thenableState;
			default:
				if ("string" === typeof thenable.status) thenable.then(noop$1, noop$1);
				else {
					thenableState = workInProgressRoot;
					if (null !== thenableState && 100 < thenableState.shellSuspendCounter) throw Error(formatProdErrorMessage(482));
					thenableState = thenable;
					thenableState.status = "pending";
					thenableState.then(function(fulfilledValue) {
						if ("pending" === thenable.status) {
							var fulfilledThenable = thenable;
							fulfilledThenable.status = "fulfilled";
							fulfilledThenable.value = fulfilledValue;
						}
					}, function(error) {
						if ("pending" === thenable.status) {
							var rejectedThenable = thenable;
							rejectedThenable.status = "rejected";
							rejectedThenable.reason = error;
						}
					});
				}
				switch (thenable.status) {
					case "fulfilled": return thenable.value;
					case "rejected": throw thenableState = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState), thenableState;
				}
				suspendedThenable = thenable;
				throw SuspenseException;
		}
	}
	function resolveLazy(lazyType) {
		try {
			var init = lazyType._init;
			return init(lazyType._payload);
		} catch (x) {
			if (null !== x && "object" === typeof x && "function" === typeof x.then) throw suspendedThenable = x, SuspenseException;
			throw x;
		}
	}
	var suspendedThenable = null;
	function getSuspendedThenable() {
		if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
		var thenable = suspendedThenable;
		suspendedThenable = null;
		return thenable;
	}
	function checkIfUseWrappedInAsyncCatch(rejectedReason) {
		if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException) throw Error(formatProdErrorMessage(483));
	}
	var thenableState$1 = null;
	var thenableIndexCounter$1 = 0;
	function unwrapThenable(thenable) {
		var index = thenableIndexCounter$1;
		thenableIndexCounter$1 += 1;
		null === thenableState$1 && (thenableState$1 = []);
		return trackUsedThenable(thenableState$1, thenable, index);
	}
	function coerceRef(workInProgress, element) {
		element = element.props.ref;
		workInProgress.ref = void 0 !== element ? element : null;
	}
	function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
		if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE) throw Error(formatProdErrorMessage(525));
		returnFiber = Object.prototype.toString.call(newChild);
		throw Error(formatProdErrorMessage(31, "[object Object]" === returnFiber ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber));
	}
	function createChildReconciler(shouldTrackSideEffects) {
		function deleteChild(returnFiber, childToDelete) {
			if (shouldTrackSideEffects) {
				var deletions = returnFiber.deletions;
				null === deletions ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
			}
		}
		function deleteRemainingChildren(returnFiber, currentFirstChild) {
			if (!shouldTrackSideEffects) return null;
			for (; null !== currentFirstChild;) deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
			return null;
		}
		function mapRemainingChildren(currentFirstChild) {
			for (var existingChildren = /* @__PURE__ */ new Map(); null !== currentFirstChild;) null === currentFirstChild.key ? existingChildren.set(currentFirstChild.index, currentFirstChild) : existingChildren.set(currentFirstChild.key, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
			return existingChildren;
		}
		function useFiber(fiber, pendingProps) {
			fiber = createWorkInProgress(fiber, pendingProps);
			fiber.index = 0;
			fiber.sibling = null;
			return fiber;
		}
		function placeChild(newFiber, lastPlacedIndex, newIndex) {
			newFiber.index = newIndex;
			if (!shouldTrackSideEffects) return newFiber.flags |= 1048576, lastPlacedIndex;
			newIndex = newFiber.alternate;
			if (null !== newIndex) return newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 2, lastPlacedIndex) : newIndex;
			newFiber.flags |= 134217730;
			return lastPlacedIndex;
		}
		function placeSingleChild(newFiber) {
			shouldTrackSideEffects && null === newFiber.alternate && (newFiber.flags |= 134217730);
			return newFiber;
		}
		function updateTextNode(returnFiber, current, textContent, lanes) {
			if (null === current || 6 !== current.tag) return current = createFiberFromText(textContent, returnFiber.mode, lanes), current.return = returnFiber, current;
			current = useFiber(current, textContent);
			current.return = returnFiber;
			return current;
		}
		function updateElement(returnFiber, current, element, lanes) {
			var elementType = element.type;
			if (elementType === REACT_FRAGMENT_TYPE) return returnFiber = updateFragment(returnFiber, current, element.props.children, lanes, element.key), coerceRef(returnFiber, element), returnFiber;
			if (null !== current && (current.elementType === elementType || "object" === typeof elementType && null !== elementType && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === current.type)) return current = useFiber(current, element.props), coerceRef(current, element), current.return = returnFiber, current;
			current = createFiberFromTypeAndProps(element.type, element.key, element.props, null, returnFiber.mode, lanes);
			coerceRef(current, element);
			current.return = returnFiber;
			return current;
		}
		function updatePortal(returnFiber, current, portal, lanes) {
			if (null === current || 4 !== current.tag || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation) return current = createFiberFromPortal(portal, returnFiber.mode, lanes), current.return = returnFiber, current;
			current = useFiber(current, portal.children || []);
			current.return = returnFiber;
			return current;
		}
		function updateFragment(returnFiber, current, fragment, lanes, key) {
			if (null === current || 7 !== current.tag) return current = createFiberFromFragment(fragment, returnFiber.mode, lanes, key), current.return = returnFiber, current;
			current = useFiber(current, fragment);
			current.return = returnFiber;
			return current;
		}
		function createChild(returnFiber, newChild, lanes) {
			if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild) return newChild = createFiberFromText("" + newChild, returnFiber.mode, lanes), newChild.return = returnFiber, newChild;
			if ("object" === typeof newChild && null !== newChild) {
				switch (newChild.$$typeof) {
					case REACT_ELEMENT_TYPE: return lanes = createFiberFromTypeAndProps(newChild.type, newChild.key, newChild.props, null, returnFiber.mode, lanes), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes;
					case REACT_PORTAL_TYPE: return newChild = createFiberFromPortal(newChild, returnFiber.mode, lanes), newChild.return = returnFiber, newChild;
					case REACT_LAZY_TYPE: return newChild = resolveLazy(newChild), createChild(returnFiber, newChild, lanes);
				}
				if (isArrayImpl(newChild) || getIteratorFn(newChild)) return newChild = createFiberFromFragment(newChild, returnFiber.mode, lanes, null), newChild.return = returnFiber, newChild;
				if ("function" === typeof newChild.then) return createChild(returnFiber, unwrapThenable(newChild), lanes);
				if (newChild.$$typeof === REACT_CONTEXT_TYPE) return createChild(returnFiber, readContextDuringReconciliation(returnFiber, newChild), lanes);
				throwOnInvalidObjectTypeImpl(returnFiber, newChild);
			}
			return null;
		}
		function updateSlot(returnFiber, oldFiber, newChild, lanes) {
			var key = null !== oldFiber ? oldFiber.key : null;
			if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild) return null !== key ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
			if ("object" === typeof newChild && null !== newChild) {
				switch (newChild.$$typeof) {
					case REACT_ELEMENT_TYPE: return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, lanes) : null;
					case REACT_PORTAL_TYPE: return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
					case REACT_LAZY_TYPE: return newChild = resolveLazy(newChild), updateSlot(returnFiber, oldFiber, newChild, lanes);
				}
				if (isArrayImpl(newChild) || getIteratorFn(newChild)) return null !== key ? null : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
				if ("function" === typeof newChild.then) return updateSlot(returnFiber, oldFiber, unwrapThenable(newChild), lanes);
				if (newChild.$$typeof === REACT_CONTEXT_TYPE) return updateSlot(returnFiber, oldFiber, readContextDuringReconciliation(returnFiber, newChild), lanes);
				throwOnInvalidObjectTypeImpl(returnFiber, newChild);
			}
			return null;
		}
		function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
			if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild) return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
			if ("object" === typeof newChild && null !== newChild) {
				switch (newChild.$$typeof) {
					case REACT_ELEMENT_TYPE: return existingChildren = existingChildren.get(null === newChild.key ? newIdx : newChild.key) || null, updateElement(returnFiber, existingChildren, newChild, lanes);
					case REACT_PORTAL_TYPE: return existingChildren = existingChildren.get(null === newChild.key ? newIdx : newChild.key) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
					case REACT_LAZY_TYPE: return newChild = resolveLazy(newChild), updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes);
				}
				if (isArrayImpl(newChild) || getIteratorFn(newChild)) return existingChildren = existingChildren.get(newIdx) || null, updateFragment(returnFiber, existingChildren, newChild, lanes, null);
				if ("function" === typeof newChild.then) return updateFromMap(existingChildren, returnFiber, newIdx, unwrapThenable(newChild), lanes);
				if (newChild.$$typeof === REACT_CONTEXT_TYPE) return updateFromMap(existingChildren, returnFiber, newIdx, readContextDuringReconciliation(returnFiber, newChild), lanes);
				throwOnInvalidObjectTypeImpl(returnFiber, newChild);
			}
			return null;
		}
		function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
			for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null; null !== oldFiber && newIdx < newChildren.length; newIdx++) {
				oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
				var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);
				if (null === newFiber) {
					null === oldFiber && (oldFiber = nextOldFiber);
					break;
				}
				shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
				currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
				null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
				previousNewFiber = newFiber;
				oldFiber = nextOldFiber;
			}
			if (newIdx === newChildren.length) return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
			if (null === oldFiber) {
				for (; newIdx < newChildren.length; newIdx++) oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), null !== oldFiber && (currentFirstChild = placeChild(oldFiber, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
				isHydrating && pushTreeFork(returnFiber, newIdx);
				return resultingFirstChild;
			}
			for (oldFiber = mapRemainingChildren(oldFiber); newIdx < newChildren.length; newIdx++) nextOldFiber = updateFromMap(oldFiber, returnFiber, newIdx, newChildren[newIdx], lanes), null !== nextOldFiber && (shouldTrackSideEffects && (newFiber = nextOldFiber.alternate, null !== newFiber && oldFiber.delete(null === newFiber.key ? newIdx : newFiber.key)), currentFirstChild = placeChild(nextOldFiber, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
			shouldTrackSideEffects && oldFiber.forEach(function(child) {
				return deleteChild(returnFiber, child);
			});
			isHydrating && pushTreeFork(returnFiber, newIdx);
			return resultingFirstChild;
		}
		function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
			if (null == newChildren) throw Error(formatProdErrorMessage(151));
			for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, step = newChildren.next(); null !== oldFiber && !step.done; newIdx++, step = newChildren.next()) {
				oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
				var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
				if (null === newFiber) {
					null === oldFiber && (oldFiber = nextOldFiber);
					break;
				}
				shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
				currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
				null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
				previousNewFiber = newFiber;
				oldFiber = nextOldFiber;
			}
			if (step.done) return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
			if (null === oldFiber) {
				for (; !step.done; newIdx++, step = newChildren.next()) step = createChild(returnFiber, step.value, lanes), null !== step && (currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
				isHydrating && pushTreeFork(returnFiber, newIdx);
				return resultingFirstChild;
			}
			for (oldFiber = mapRemainingChildren(oldFiber); !step.done; newIdx++, step = newChildren.next()) step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes), null !== step && (shouldTrackSideEffects && (nextOldFiber = step.alternate, null !== nextOldFiber && oldFiber.delete(null === nextOldFiber.key ? newIdx : nextOldFiber.key)), currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
			shouldTrackSideEffects && oldFiber.forEach(function(child) {
				return deleteChild(returnFiber, child);
			});
			isHydrating && pushTreeFork(returnFiber, newIdx);
			return resultingFirstChild;
		}
		function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
			"object" === typeof newChild && null !== newChild && newChild.type === REACT_FRAGMENT_TYPE && null === newChild.key && void 0 === newChild.props.ref && (newChild = newChild.props.children);
			if ("object" === typeof newChild && null !== newChild) {
				switch (newChild.$$typeof) {
					case REACT_ELEMENT_TYPE:
						a: {
							for (var key = newChild.key; null !== currentFirstChild;) {
								if (currentFirstChild.key === key) {
									key = newChild.type;
									if (key === REACT_FRAGMENT_TYPE) {
										if (7 === currentFirstChild.tag) {
											deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
											lanes = useFiber(currentFirstChild, newChild.props.children);
											coerceRef(lanes, newChild);
											lanes.return = returnFiber;
											returnFiber = lanes;
											break a;
										}
									} else if (currentFirstChild.elementType === key || "object" === typeof key && null !== key && key.$$typeof === REACT_LAZY_TYPE && resolveLazy(key) === currentFirstChild.type) {
										deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
										lanes = useFiber(currentFirstChild, newChild.props);
										coerceRef(lanes, newChild);
										lanes.return = returnFiber;
										returnFiber = lanes;
										break a;
									}
									deleteRemainingChildren(returnFiber, currentFirstChild);
									break;
								} else deleteChild(returnFiber, currentFirstChild);
								currentFirstChild = currentFirstChild.sibling;
							}
							newChild.type === REACT_FRAGMENT_TYPE ? (lanes = createFiberFromFragment(newChild.props.children, returnFiber.mode, lanes, newChild.key), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes) : (lanes = createFiberFromTypeAndProps(newChild.type, newChild.key, newChild.props, null, returnFiber.mode, lanes), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes);
						}
						return placeSingleChild(returnFiber);
					case REACT_PORTAL_TYPE:
						a: {
							for (key = newChild.key; null !== currentFirstChild;) {
								if (currentFirstChild.key === key) if (4 === currentFirstChild.tag && currentFirstChild.stateNode.containerInfo === newChild.containerInfo && currentFirstChild.stateNode.implementation === newChild.implementation) {
									deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
									lanes = useFiber(currentFirstChild, newChild.children || []);
									lanes.return = returnFiber;
									returnFiber = lanes;
									break a;
								} else {
									deleteRemainingChildren(returnFiber, currentFirstChild);
									break;
								}
								else deleteChild(returnFiber, currentFirstChild);
								currentFirstChild = currentFirstChild.sibling;
							}
							lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes);
							lanes.return = returnFiber;
							returnFiber = lanes;
						}
						return placeSingleChild(returnFiber);
					case REACT_LAZY_TYPE: return newChild = resolveLazy(newChild), reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes);
				}
				if (isArrayImpl(newChild)) return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
				if (getIteratorFn(newChild)) {
					key = getIteratorFn(newChild);
					if ("function" !== typeof key) throw Error(formatProdErrorMessage(150));
					newChild = key.call(newChild);
					return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
				}
				if ("function" === typeof newChild.then) return reconcileChildFibersImpl(returnFiber, currentFirstChild, unwrapThenable(newChild), lanes);
				if (newChild.$$typeof === REACT_CONTEXT_TYPE) return reconcileChildFibersImpl(returnFiber, currentFirstChild, readContextDuringReconciliation(returnFiber, newChild), lanes);
				throwOnInvalidObjectTypeImpl(returnFiber, newChild);
			}
			return "string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild ? (newChild = "" + newChild, null !== currentFirstChild && 6 === currentFirstChild.tag ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling), lanes = useFiber(currentFirstChild, newChild), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes), placeSingleChild(returnFiber)) : deleteRemainingChildren(returnFiber, currentFirstChild);
		}
		return function(returnFiber, currentFirstChild, newChild, lanes) {
			try {
				thenableIndexCounter$1 = 0;
				var firstChildFiber = reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes);
				thenableState$1 = null;
				return firstChildFiber;
			} catch (x) {
				if (x === SuspenseException || x === SuspenseActionException) throw x;
				var fiber = createFiberImplClass(29, x, null, returnFiber.mode);
				fiber.lanes = lanes;
				fiber.return = returnFiber;
				return fiber;
			}
		};
	}
	var reconcileChildFibers = createChildReconciler(!0);
	var mountChildFibers = createChildReconciler(!1);
	var hasForceUpdate = !1;
	function initializeUpdateQueue(fiber) {
		fiber.updateQueue = {
			baseState: fiber.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function cloneUpdateQueue(current, workInProgress) {
		current = current.updateQueue;
		workInProgress.updateQueue === current && (workInProgress.updateQueue = {
			baseState: current.baseState,
			firstBaseUpdate: current.firstBaseUpdate,
			lastBaseUpdate: current.lastBaseUpdate,
			shared: current.shared,
			callbacks: null
		});
	}
	function createUpdate(lane) {
		return {
			lane,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function enqueueUpdate(fiber, update, lane) {
		var updateQueue = fiber.updateQueue;
		if (null === updateQueue) return null;
		updateQueue = updateQueue.shared;
		if (0 !== (executionContext & 2)) {
			var pending = updateQueue.pending;
			null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
			updateQueue.pending = update;
			update = getRootForUpdatedFiber(fiber);
			markUpdateLaneFromFiberToRoot(fiber, null, lane);
			return update;
		}
		enqueueUpdate$1(fiber, updateQueue, update, lane);
		return getRootForUpdatedFiber(fiber);
	}
	function entangleTransitions(root, fiber, lane) {
		fiber = fiber.updateQueue;
		if (null !== fiber && (fiber = fiber.shared, 0 !== (lane & 4194048))) {
			var queueLanes = fiber.lanes;
			queueLanes &= root.pendingLanes;
			lane |= queueLanes;
			fiber.lanes = lane;
			markRootEntangled(root, lane);
		}
	}
	function enqueueCapturedUpdate(workInProgress, capturedUpdate) {
		var queue = workInProgress.updateQueue, current = workInProgress.alternate;
		if (null !== current && (current = current.updateQueue, queue === current)) {
			var newFirst = null, newLast = null;
			queue = queue.firstBaseUpdate;
			if (null !== queue) {
				do {
					var clone = {
						lane: queue.lane,
						tag: queue.tag,
						payload: queue.payload,
						callback: null,
						next: null
					};
					null === newLast ? newFirst = newLast = clone : newLast = newLast.next = clone;
					queue = queue.next;
				} while (null !== queue);
				null === newLast ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
			} else newFirst = newLast = capturedUpdate;
			queue = {
				baseState: current.baseState,
				firstBaseUpdate: newFirst,
				lastBaseUpdate: newLast,
				shared: current.shared,
				callbacks: current.callbacks
			};
			workInProgress.updateQueue = queue;
			return;
		}
		workInProgress = queue.lastBaseUpdate;
		null === workInProgress ? queue.firstBaseUpdate = capturedUpdate : workInProgress.next = capturedUpdate;
		queue.lastBaseUpdate = capturedUpdate;
	}
	var didReadFromEntangledAsyncAction = !1;
	function suspendIfUpdateReadFromEntangledAsyncAction() {
		if (didReadFromEntangledAsyncAction) {
			var entangledActionThenable = currentEntangledActionThenable;
			if (null !== entangledActionThenable) throw entangledActionThenable;
		}
	}
	function processUpdateQueue(workInProgress$jscomp$0, props, instance$jscomp$0, renderLanes) {
		didReadFromEntangledAsyncAction = !1;
		var queue = workInProgress$jscomp$0.updateQueue;
		hasForceUpdate = !1;
		var firstBaseUpdate = queue.firstBaseUpdate, lastBaseUpdate = queue.lastBaseUpdate, pendingQueue = queue.shared.pending;
		if (null !== pendingQueue) {
			queue.shared.pending = null;
			var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
			lastPendingUpdate.next = null;
			null === lastBaseUpdate ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate;
			lastBaseUpdate = lastPendingUpdate;
			var current = workInProgress$jscomp$0.alternate;
			null !== current && (current = current.updateQueue, pendingQueue = current.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (null === pendingQueue ? current.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current.lastBaseUpdate = lastPendingUpdate));
		}
		if (null !== firstBaseUpdate) {
			var newState = queue.baseState;
			lastBaseUpdate = 0;
			current = firstPendingUpdate = lastPendingUpdate = null;
			pendingQueue = firstBaseUpdate;
			do {
				var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
				if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
					0 !== updateLane && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = !0);
					null !== current && (current = current.next = {
						lane: 0,
						tag: pendingQueue.tag,
						payload: pendingQueue.payload,
						callback: null,
						next: null
					});
					a: {
						var workInProgress = workInProgress$jscomp$0, update = pendingQueue;
						updateLane = props;
						var instance = instance$jscomp$0;
						switch (update.tag) {
							case 1:
								workInProgress = update.payload;
								if ("function" === typeof workInProgress) {
									newState = workInProgress.call(instance, newState, updateLane);
									break a;
								}
								newState = workInProgress;
								break a;
							case 3: workInProgress.flags = workInProgress.flags & -65537 | 128;
							case 0:
								workInProgress = update.payload;
								updateLane = "function" === typeof workInProgress ? workInProgress.call(instance, newState, updateLane) : workInProgress;
								if (null === updateLane || void 0 === updateLane) break a;
								newState = assign({}, newState, updateLane);
								break a;
							case 2: hasForceUpdate = !0;
						}
					}
					updateLane = pendingQueue.callback;
					null !== updateLane && (workInProgress$jscomp$0.flags |= 64, isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192), isHiddenUpdate = queue.callbacks, null === isHiddenUpdate ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
				} else isHiddenUpdate = {
					lane: updateLane,
					tag: pendingQueue.tag,
					payload: pendingQueue.payload,
					callback: pendingQueue.callback,
					next: null
				}, null === current ? (firstPendingUpdate = current = isHiddenUpdate, lastPendingUpdate = newState) : current = current.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
				pendingQueue = pendingQueue.next;
				if (null === pendingQueue) if (pendingQueue = queue.shared.pending, null === pendingQueue) break;
				else isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
			} while (1);
			null === current && (lastPendingUpdate = newState);
			queue.baseState = lastPendingUpdate;
			queue.firstBaseUpdate = firstPendingUpdate;
			queue.lastBaseUpdate = current;
			null === firstBaseUpdate && (queue.shared.lanes = 0);
			workInProgressRootSkippedLanes |= lastBaseUpdate;
			workInProgress$jscomp$0.lanes = lastBaseUpdate;
			workInProgress$jscomp$0.memoizedState = newState;
		}
	}
	function callCallback(callback, context) {
		if ("function" !== typeof callback) throw Error(formatProdErrorMessage(191, callback));
		callback.call(context);
	}
	function commitCallbacks(updateQueue, context) {
		var callbacks = updateQueue.callbacks;
		if (null !== callbacks) for (updateQueue.callbacks = null, updateQueue = 0; updateQueue < callbacks.length; updateQueue++) callCallback(callbacks[updateQueue], context);
	}
	var currentTreeHiddenStackCursor = createCursor(null);
	var prevEntangledRenderLanesCursor = createCursor(0);
	function pushHiddenContext(fiber, context) {
		fiber = entangledRenderLanes;
		push(prevEntangledRenderLanesCursor, fiber);
		push(currentTreeHiddenStackCursor, context);
		entangledRenderLanes = fiber | context.baseLanes;
	}
	function reuseHiddenContextOnStack() {
		push(prevEntangledRenderLanesCursor, entangledRenderLanes);
		push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
	}
	function popHiddenContext() {
		entangledRenderLanes = prevEntangledRenderLanesCursor.current;
		pop(currentTreeHiddenStackCursor);
		pop(prevEntangledRenderLanesCursor);
	}
	var suspenseHandlerStackCursor = createCursor(null);
	var shellBoundary = null;
	function pushPrimaryTreeSuspenseHandler(handler) {
		var current = handler.alternate;
		push(suspenseStackCursor, suspenseStackCursor.current & 1);
		push(suspenseHandlerStackCursor, handler);
		null === shellBoundary && (null === current || null !== currentTreeHiddenStackCursor.current ? shellBoundary = handler : null !== current.memoizedState && (shellBoundary = handler));
	}
	function pushDehydratedActivitySuspenseHandler(fiber) {
		push(suspenseStackCursor, suspenseStackCursor.current);
		push(suspenseHandlerStackCursor, fiber);
		null === shellBoundary && (shellBoundary = fiber);
	}
	function pushOffscreenSuspenseHandler(fiber) {
		22 === fiber.tag ? (push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), null === shellBoundary && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack();
	}
	function reuseSuspenseHandlerOnStack() {
		push(suspenseStackCursor, suspenseStackCursor.current);
		push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
	}
	function popSuspenseHandler(fiber) {
		pop(suspenseHandlerStackCursor);
		shellBoundary === fiber && (shellBoundary = null);
		pop(suspenseStackCursor);
	}
	var suspenseStackCursor = createCursor(0);
	function pushSuspenseListContext(fiber, newContext) {
		push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
		push(suspenseStackCursor, newContext);
	}
	function popSuspenseListContext(fiber) {
		pop(suspenseStackCursor);
		pop(suspenseHandlerStackCursor);
		shellBoundary === fiber && (shellBoundary = null);
	}
	function findFirstSuspended(row) {
		for (var node = row; null !== node;) {
			if (13 === node.tag) {
				var state = node.memoizedState;
				if (null !== state && (state = state.dehydrated, null === state || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state))) return node;
			} else if (19 === node.tag && "independent" !== node.memoizedProps.revealOrder) {
				if (0 !== (node.flags & 128)) return node;
			} else if (null !== node.child) {
				node.child.return = node;
				node = node.child;
				continue;
			}
			if (node === row) break;
			for (; null === node.sibling;) {
				if (null === node.return || node.return === row) return null;
				node = node.return;
			}
			node.sibling.return = node.return;
			node = node.sibling;
		}
		return null;
	}
	var renderLanes = 0;
	var currentlyRenderingFiber = null;
	var currentHook = null;
	var workInProgressHook = null;
	var didScheduleRenderPhaseUpdate = !1;
	var didScheduleRenderPhaseUpdateDuringThisPass = !1;
	var shouldDoubleInvokeUserFnsInHooksDEV = !1;
	var localIdCounter = 0;
	var thenableIndexCounter = 0;
	var thenableState = null;
	var globalClientIdCounter = 0;
	function throwInvalidHookError() {
		throw Error(formatProdErrorMessage(321));
	}
	function areHookInputsEqual(nextDeps, prevDeps) {
		if (null === prevDeps) return !1;
		for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
		return !0;
	}
	function renderWithHooks(current, workInProgress, Component, props, secondArg, nextRenderLanes) {
		renderLanes = nextRenderLanes;
		currentlyRenderingFiber = workInProgress;
		workInProgress.memoizedState = null;
		workInProgress.updateQueue = null;
		workInProgress.lanes = 0;
		ReactSharedInternals.H = null === current || null === current.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
		shouldDoubleInvokeUserFnsInHooksDEV = !1;
		nextRenderLanes = Component(props, secondArg);
		shouldDoubleInvokeUserFnsInHooksDEV = !1;
		didScheduleRenderPhaseUpdateDuringThisPass && (nextRenderLanes = renderWithHooksAgain(workInProgress, Component, props, secondArg));
		finishRenderingHooks(current);
		return nextRenderLanes;
	}
	function finishRenderingHooks(current) {
		ReactSharedInternals.H = ContextOnlyDispatcher;
		var didRenderTooFewHooks = null !== currentHook && null !== currentHook.next;
		renderLanes = 0;
		workInProgressHook = currentHook = currentlyRenderingFiber = null;
		didScheduleRenderPhaseUpdate = !1;
		thenableIndexCounter = 0;
		thenableState = null;
		if (didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
		null === current || didReceiveUpdate || (current = current.dependencies, null !== current && checkIfContextChanged(current) && (didReceiveUpdate = !0));
	}
	function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
		currentlyRenderingFiber = workInProgress;
		var numberOfReRenders = 0;
		do {
			didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
			thenableIndexCounter = 0;
			didScheduleRenderPhaseUpdateDuringThisPass = !1;
			if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
			numberOfReRenders += 1;
			workInProgressHook = currentHook = null;
			if (null != workInProgress.updateQueue) {
				var children = workInProgress.updateQueue;
				children.lastEffect = null;
				children.events = null;
				children.stores = null;
				null != children.memoCache && (children.memoCache.index = 0);
			}
			ReactSharedInternals.H = HooksDispatcherOnRerender;
			children = Component(props, secondArg);
		} while (didScheduleRenderPhaseUpdateDuringThisPass);
		return children;
	}
	function TransitionAwareHostComponent() {
		var dispatcher = ReactSharedInternals.H, maybeThenable = dispatcher.useState()[0];
		maybeThenable = "function" === typeof maybeThenable.then ? useThenable(maybeThenable) : maybeThenable;
		dispatcher = dispatcher.useState()[0];
		(null !== currentHook ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024);
		return maybeThenable;
	}
	function checkDidRenderIdHook() {
		var didRenderIdHook = 0 !== localIdCounter;
		localIdCounter = 0;
		return didRenderIdHook;
	}
	function bailoutHooks(current, workInProgress, lanes) {
		workInProgress.updateQueue = current.updateQueue;
		workInProgress.flags &= -2053;
		current.lanes &= ~lanes;
	}
	function resetHooksOnUnwind(workInProgress) {
		if (didScheduleRenderPhaseUpdate) {
			for (workInProgress = workInProgress.memoizedState; null !== workInProgress;) {
				var queue = workInProgress.queue;
				null !== queue && (queue.pending = null);
				workInProgress = workInProgress.next;
			}
			didScheduleRenderPhaseUpdate = !1;
		}
		renderLanes = 0;
		workInProgressHook = currentHook = currentlyRenderingFiber = null;
		didScheduleRenderPhaseUpdateDuringThisPass = !1;
		thenableIndexCounter = localIdCounter = 0;
		thenableState = null;
	}
	function mountWorkInProgressHook() {
		var hook = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook;
		return workInProgressHook;
	}
	function updateWorkInProgressHook() {
		if (null === currentHook) {
			var nextCurrentHook = currentlyRenderingFiber.alternate;
			nextCurrentHook = null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
		} else nextCurrentHook = currentHook.next;
		var nextWorkInProgressHook = null === workInProgressHook ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
		if (null !== nextWorkInProgressHook) workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
		else {
			if (null === nextCurrentHook) {
				if (null === currentlyRenderingFiber.alternate) throw Error(formatProdErrorMessage(467));
				throw Error(formatProdErrorMessage(310));
			}
			currentHook = nextCurrentHook;
			nextCurrentHook = {
				memoizedState: currentHook.memoizedState,
				baseState: currentHook.baseState,
				baseQueue: currentHook.baseQueue,
				queue: currentHook.queue,
				next: null
			};
			null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
		}
		return workInProgressHook;
	}
	function createFunctionComponentUpdateQueue() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function useThenable(thenable) {
		var index = thenableIndexCounter;
		thenableIndexCounter += 1;
		null === thenableState && (thenableState = []);
		thenable = trackUsedThenable(thenableState, thenable, index);
		index = currentlyRenderingFiber;
		null === (null === workInProgressHook ? index.memoizedState : workInProgressHook.next) && (index = index.alternate, ReactSharedInternals.H = null === index || null === index.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate);
		return thenable;
	}
	function use(usable) {
		if (null !== usable && "object" === typeof usable) {
			if ("function" === typeof usable.then) return useThenable(usable);
			if (usable.$$typeof === REACT_RECOVERABLE_TYPE) return;
			if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
		}
		throw Error(formatProdErrorMessage(438, String(usable)));
	}
	function useMemoCache(size) {
		var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
		null !== updateQueue && (memoCache = updateQueue.memoCache);
		if (null == memoCache) {
			var current = currentlyRenderingFiber.alternate;
			null !== current && (current = current.updateQueue, null !== current && (current = current.memoCache, null != current && (memoCache = {
				data: current.data.map(function(array) {
					return array.slice();
				}),
				index: 0
			})));
		}
		memoCache ??= {
			data: [],
			index: 0
		};
		null === updateQueue && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue);
		updateQueue.memoCache = memoCache;
		updateQueue = memoCache.data[memoCache.index];
		if (void 0 === updateQueue) for (updateQueue = memoCache.data[memoCache.index] = Array(size), current = 0; current < size; current++) updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
		memoCache.index++;
		return updateQueue;
	}
	function basicStateReducer(state, action) {
		return "function" === typeof action ? action(state) : action;
	}
	function updateReducer(reducer) {
		return updateReducerImpl(updateWorkInProgressHook(), currentHook, reducer);
	}
	function updateReducerImpl(hook, current, reducer) {
		var queue = hook.queue;
		if (null === queue) throw Error(formatProdErrorMessage(311));
		queue.lastRenderedReducer = reducer;
		var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
		if (null !== pendingQueue) {
			if (null !== baseQueue) {
				var baseFirst = baseQueue.next;
				baseQueue.next = pendingQueue.next;
				pendingQueue.next = baseFirst;
			}
			current.baseQueue = baseQueue = pendingQueue;
			queue.pending = null;
		}
		pendingQueue = hook.baseState;
		if (null === baseQueue) hook.memoizedState = pendingQueue;
		else {
			current = baseQueue.next;
			var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current, didReadFromEntangledAsyncAction$64 = !1;
			do {
				var updateLane = update.lane & -536870913;
				if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
					var revertLane = update.revertLane;
					if (0 === revertLane) null !== newBaseQueueLast && (newBaseQueueLast = newBaseQueueLast.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: update.action,
						hasEagerState: update.hasEagerState,
						eagerState: update.eagerState,
						next: null
					}), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction$64 = !0);
					else if ((renderLanes & revertLane) === revertLane) {
						update = update.next;
						revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction$64 = !0);
						continue;
					} else updateLane = {
						lane: 0,
						revertLane: update.revertLane,
						gesture: null,
						action: update.action,
						hasEagerState: update.hasEagerState,
						eagerState: update.eagerState,
						next: null
					}, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
					updateLane = update.action;
					shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane);
					pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
				} else revertLane = {
					lane: updateLane,
					revertLane: update.revertLane,
					gesture: update.gesture,
					action: update.action,
					hasEagerState: update.hasEagerState,
					eagerState: update.eagerState,
					next: null
				}, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
				update = update.next;
			} while (null !== update && update !== current);
			null === newBaseQueueLast ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst;
			if (!objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = !0, didReadFromEntangledAsyncAction$64 && (reducer = currentEntangledActionThenable, null !== reducer))) throw reducer;
			hook.memoizedState = pendingQueue;
			hook.baseState = baseFirst;
			hook.baseQueue = newBaseQueueLast;
			queue.lastRenderedState = pendingQueue;
		}
		null === baseQueue && (queue.lanes = 0);
		return [hook.memoizedState, queue.dispatch];
	}
	function rerenderReducer(reducer) {
		var hook = updateWorkInProgressHook(), queue = hook.queue;
		if (null === queue) throw Error(formatProdErrorMessage(311));
		queue.lastRenderedReducer = reducer;
		var dispatch = queue.dispatch, lastRenderPhaseUpdate = queue.pending, newState = hook.memoizedState;
		if (null !== lastRenderPhaseUpdate) {
			queue.pending = null;
			var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
			do
				newState = reducer(newState, update.action), update = update.next;
			while (update !== lastRenderPhaseUpdate);
			objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0);
			hook.memoizedState = newState;
			null === hook.baseQueue && (hook.baseState = newState);
			queue.lastRenderedState = newState;
		}
		return [newState, dispatch];
	}
	function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
		var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
		if (isHydrating$jscomp$0) {
			if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
			getServerSnapshot = getServerSnapshot();
		} else getServerSnapshot = getSnapshot();
		var snapshotChanged = !objectIs((currentHook || hook).memoizedState, getServerSnapshot);
		snapshotChanged && (hook.memoizedState = getServerSnapshot, didReceiveUpdate = !0);
		hook = hook.queue;
		updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [subscribe]);
		subscribe = hook.getSnapshot !== getSnapshot || snapshotChanged || null !== workInProgressHook && 0 !== (workInProgressHook.memoizedState.tag & 1);
		pushSimpleEffect(subscribe ? 9 : 8, { destroy: void 0 }, updateStoreInstance.bind(null, fiber, hook, getServerSnapshot, getSnapshot), null);
		if (subscribe) {
			fiber.flags |= 2048;
			if (null === workInProgressRoot) throw Error(formatProdErrorMessage(349));
			isHydrating$jscomp$0 || 0 !== (renderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
		}
		return getServerSnapshot;
	}
	function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
		fiber.flags |= 16384;
		fiber = {
			getSnapshot,
			value: renderedSnapshot
		};
		getSnapshot = currentlyRenderingFiber.updateQueue;
		null === getSnapshot ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, null === renderedSnapshot ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
	}
	function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
		inst.value = nextSnapshot;
		inst.getSnapshot = getSnapshot;
		checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
	}
	function subscribeToStore(fiber, inst, subscribe) {
		return subscribe(function() {
			checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
		});
	}
	function checkIfSnapshotChanged(inst) {
		var latestGetSnapshot = inst.getSnapshot;
		inst = inst.value;
		try {
			var nextValue = latestGetSnapshot();
			return !objectIs(inst, nextValue);
		} catch (error) {
			return !0;
		}
	}
	function forceStoreRerender(fiber) {
		var root = enqueueConcurrentRenderForLane(fiber, 2);
		null !== root && scheduleUpdateOnFiber(root, fiber, 2);
	}
	function mountStateImpl(initialState) {
		var hook = mountWorkInProgressHook();
		if ("function" === typeof initialState) {
			var initialStateInitializer = initialState;
			initialState = initialStateInitializer();
			if (shouldDoubleInvokeUserFnsInHooksDEV) {
				setIsStrictModeForDevtools(!0);
				try {
					initialStateInitializer();
				} finally {
					setIsStrictModeForDevtools(!1);
				}
			}
		}
		hook.memoizedState = hook.baseState = initialState;
		hook.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: basicStateReducer,
			lastRenderedState: initialState
		};
		return hook;
	}
	function updateOptimisticImpl(hook, current, passthrough, reducer) {
		hook.baseState = passthrough;
		return updateReducerImpl(hook, currentHook, "function" === typeof reducer ? reducer : basicStateReducer);
	}
	function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
		if (isRenderPhaseUpdate(fiber)) throw Error(formatProdErrorMessage(485));
		fiber = actionQueue.action;
		if (null !== fiber) {
			var actionNode = {
				payload,
				action: fiber,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(listener) {
					actionNode.listeners.push(listener);
				}
			};
			null !== ReactSharedInternals.T ? setPendingState(!0) : actionNode.isTransition = !1;
			setState(actionNode);
			setPendingState = actionQueue.pending;
			null === setPendingState ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
		}
	}
	function runActionStateAction(actionQueue, node) {
		var action = node.action, payload = node.payload, prevState = actionQueue.state;
		if (node.isTransition) {
			var prevTransition = ReactSharedInternals.T, currentTransition = {};
			currentTransition.types = null !== prevTransition ? prevTransition.types : null;
			ReactSharedInternals.T = currentTransition;
			try {
				var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals.S;
				null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
				handleActionReturnValue(actionQueue, node, returnValue);
			} catch (error) {
				onActionError(actionQueue, node, error);
			} finally {
				null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
			}
		} else try {
			prevTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, prevTransition);
		} catch (error$70) {
			onActionError(actionQueue, node, error$70);
		}
	}
	function handleActionReturnValue(actionQueue, node, returnValue) {
		null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then ? returnValue.then(function(nextState) {
			onActionSuccess(actionQueue, node, nextState);
		}, function(error) {
			return onActionError(actionQueue, node, error);
		}) : onActionSuccess(actionQueue, node, returnValue);
	}
	function onActionSuccess(actionQueue, actionNode, nextState) {
		actionNode.status = "fulfilled";
		actionNode.value = nextState;
		notifyActionListeners(actionNode);
		actionQueue.state = nextState;
		actionNode = actionQueue.pending;
		null !== actionNode && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
	}
	function onActionError(actionQueue, actionNode, error) {
		var last = actionQueue.pending;
		actionQueue.pending = null;
		if (null !== last) {
			last = last.next;
			do
				actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
			while (actionNode !== last);
		}
		actionQueue.action = null;
	}
	function notifyActionListeners(actionNode) {
		actionNode = actionNode.listeners;
		for (var i = 0; i < actionNode.length; i++) (0, actionNode[i])();
	}
	function actionStateReducer(oldState, newState) {
		return newState;
	}
	function mountActionState(action, initialStateProp) {
		if (isHydrating) {
			var ssrFormState = workInProgressRoot.formState;
			if (null !== ssrFormState) {
				a: {
					var JSCompiler_inline_result = currentlyRenderingFiber;
					if (isHydrating) {
						if (nextHydratableInstance) {
							b: {
								var JSCompiler_inline_result$jscomp$0 = nextHydratableInstance;
								for (var inRootOrSingleton = rootOrSingletonContext; 8 !== JSCompiler_inline_result$jscomp$0.nodeType;) {
									if (!inRootOrSingleton) {
										JSCompiler_inline_result$jscomp$0 = null;
										break b;
									}
									JSCompiler_inline_result$jscomp$0 = getNextHydratable(JSCompiler_inline_result$jscomp$0.nextSibling);
									if (null === JSCompiler_inline_result$jscomp$0) {
										JSCompiler_inline_result$jscomp$0 = null;
										break b;
									}
								}
								inRootOrSingleton = JSCompiler_inline_result$jscomp$0.data;
								JSCompiler_inline_result$jscomp$0 = "F!" === inRootOrSingleton || "F" === inRootOrSingleton ? JSCompiler_inline_result$jscomp$0 : null;
							}
							if (JSCompiler_inline_result$jscomp$0) {
								nextHydratableInstance = getNextHydratable(JSCompiler_inline_result$jscomp$0.nextSibling);
								JSCompiler_inline_result = "F!" === JSCompiler_inline_result$jscomp$0.data;
								break a;
							}
						}
						throwOnHydrationMismatch(JSCompiler_inline_result);
					}
					JSCompiler_inline_result = !1;
				}
				JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
			}
		}
		ssrFormState = mountWorkInProgressHook();
		ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
		JSCompiler_inline_result = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: actionStateReducer,
			lastRenderedState: initialStateProp
		};
		ssrFormState.queue = JSCompiler_inline_result;
		ssrFormState = dispatchSetState.bind(null, currentlyRenderingFiber, JSCompiler_inline_result);
		JSCompiler_inline_result.dispatch = ssrFormState;
		JSCompiler_inline_result = mountStateImpl(!1);
		inRootOrSingleton = dispatchOptimisticSetState.bind(null, currentlyRenderingFiber, !1, JSCompiler_inline_result.queue);
		JSCompiler_inline_result = mountWorkInProgressHook();
		JSCompiler_inline_result$jscomp$0 = {
			state: initialStateProp,
			dispatch: null,
			action,
			pending: null
		};
		JSCompiler_inline_result.queue = JSCompiler_inline_result$jscomp$0;
		ssrFormState = dispatchActionState.bind(null, currentlyRenderingFiber, JSCompiler_inline_result$jscomp$0, inRootOrSingleton, ssrFormState);
		JSCompiler_inline_result$jscomp$0.dispatch = ssrFormState;
		JSCompiler_inline_result.memoizedState = action;
		return [
			initialStateProp,
			ssrFormState,
			!1
		];
	}
	function updateActionState(action) {
		return updateActionStateImpl(updateWorkInProgressHook(), currentHook, action);
	}
	function updateActionStateImpl(stateHook, currentStateHook, action) {
		currentStateHook = updateReducerImpl(stateHook, currentStateHook, actionStateReducer)[0];
		stateHook = updateReducer(basicStateReducer)[0];
		if ("object" === typeof currentStateHook && null !== currentStateHook && "function" === typeof currentStateHook.then) try {
			var state = useThenable(currentStateHook);
		} catch (x) {
			if (x === SuspenseException) throw SuspenseActionException;
			throw x;
		}
		else state = currentStateHook;
		currentStateHook = updateWorkInProgressHook();
		var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
		action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(9, { destroy: void 0 }, actionStateActionEffect.bind(null, actionQueue, action), null));
		return [
			state,
			dispatch,
			stateHook
		];
	}
	function actionStateActionEffect(actionQueue, action) {
		actionQueue.action = action;
	}
	function rerenderActionState(action) {
		var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
		if (null !== currentStateHook) return updateActionStateImpl(stateHook, currentStateHook, action);
		updateWorkInProgressHook();
		stateHook = stateHook.memoizedState;
		currentStateHook = updateWorkInProgressHook();
		var dispatch = currentStateHook.queue.dispatch;
		currentStateHook.memoizedState = action;
		return [
			stateHook,
			dispatch,
			!1
		];
	}
	function pushSimpleEffect(tag, inst, create, deps) {
		tag = {
			tag,
			create,
			deps,
			inst,
			next: null
		};
		inst = currentlyRenderingFiber.updateQueue;
		null === inst && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst);
		create = inst.lastEffect;
		null === create ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag);
		return tag;
	}
	function updateRef() {
		return updateWorkInProgressHook().memoizedState;
	}
	function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
		var hook = mountWorkInProgressHook();
		currentlyRenderingFiber.flags |= fiberFlags;
		hook.memoizedState = pushSimpleEffect(1 | hookFlags, { destroy: void 0 }, create, void 0 === deps ? null : deps);
	}
	function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
		var hook = updateWorkInProgressHook();
		deps = void 0 === deps ? null : deps;
		var inst = hook.memoizedState.inst;
		null !== currentHook && null !== deps && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(1 | hookFlags, inst, create, deps));
	}
	function mountEffect(create, deps) {
		mountEffectImpl(8390656, 8, create, deps);
	}
	function updateEffect(create, deps) {
		updateEffectImpl(2048, 8, create, deps);
	}
	function useEffectEventImpl(payload) {
		currentlyRenderingFiber.flags |= 4;
		var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
		if (null === componentUpdateQueue) componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
		else {
			var events = componentUpdateQueue.events;
			null === events ? componentUpdateQueue.events = [payload] : events.push(payload);
		}
	}
	function updateEvent(callback) {
		var ref = updateWorkInProgressHook().memoizedState;
		useEffectEventImpl({
			ref,
			nextImpl: callback
		});
		return function() {
			if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
			return ref.impl.apply(void 0, arguments);
		};
	}
	function updateInsertionEffect(create, deps) {
		return updateEffectImpl(4, 2, create, deps);
	}
	function updateLayoutEffect(create, deps) {
		return updateEffectImpl(4, 4, create, deps);
	}
	function imperativeHandleEffect(create, ref) {
		if ("function" === typeof ref) {
			create = create();
			var refCleanup = ref(create);
			return function() {
				"function" === typeof refCleanup ? refCleanup() : ref(null);
			};
		}
		if (null !== ref && void 0 !== ref) return create = create(), ref.current = create, function() {
			ref.current = null;
		};
	}
	function updateImperativeHandle(ref, create, deps) {
		deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
		updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
	}
	function mountDebugValue() {}
	function updateCallback(callback, deps) {
		var hook = updateWorkInProgressHook();
		deps = void 0 === deps ? null : deps;
		var prevState = hook.memoizedState;
		if (null !== deps && areHookInputsEqual(deps, prevState[1])) return prevState[0];
		hook.memoizedState = [callback, deps];
		return callback;
	}
	function updateMemo(nextCreate, deps) {
		var hook = updateWorkInProgressHook();
		deps = void 0 === deps ? null : deps;
		var prevState = hook.memoizedState;
		if (null !== deps && areHookInputsEqual(deps, prevState[1])) return prevState[0];
		prevState = nextCreate();
		if (shouldDoubleInvokeUserFnsInHooksDEV) {
			setIsStrictModeForDevtools(!0);
			try {
				nextCreate();
			} finally {
				setIsStrictModeForDevtools(!1);
			}
		}
		hook.memoizedState = [prevState, deps];
		return prevState;
	}
	function mountDeferredValueImpl(hook, value, initialValue) {
		if (void 0 === initialValue || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930)) return hook.memoizedState = value;
		hook.memoizedState = initialValue;
		hook = requestDeferredLane();
		currentlyRenderingFiber.lanes |= hook;
		workInProgressRootSkippedLanes |= hook;
		return initialValue;
	}
	function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
		if (objectIs(value, prevValue)) return value;
		if (null !== currentTreeHiddenStackCursor.current) return hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = !0), hook;
		if (0 === (renderLanes & 106) || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930)) return didReceiveUpdate = !0, hook.memoizedState = value;
		hook = requestDeferredLane();
		currentlyRenderingFiber.lanes |= hook;
		workInProgressRootSkippedLanes |= hook;
		return prevValue;
	}
	function startTransition(fiber, queue, pendingState, finishedState, callback) {
		var previousPriority = ReactDOMSharedInternals.p;
		ReactDOMSharedInternals.p = 0 !== previousPriority && 8 > previousPriority ? previousPriority : 8;
		var prevTransition = ReactSharedInternals.T, currentTransition = {};
		currentTransition.types = null !== prevTransition ? prevTransition.types : null;
		ReactSharedInternals.T = currentTransition;
		dispatchOptimisticSetState(fiber, !1, queue, pendingState);
		try {
			var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals.S;
			null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
			if (null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then) dispatchSetStateInternal(fiber, queue, chainThenableValue(returnValue, finishedState), requestUpdateLane(fiber));
			else dispatchSetStateInternal(fiber, queue, finishedState, requestUpdateLane(fiber));
		} catch (error) {
			dispatchSetStateInternal(fiber, queue, {
				then: function() {},
				status: "rejected",
				reason: error
			}, requestUpdateLane());
		} finally {
			ReactDOMSharedInternals.p = previousPriority, null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
		}
	}
	function noop() {}
	function startHostTransition(formFiber, pendingState, action, formData) {
		if (5 !== formFiber.tag) throw Error(formatProdErrorMessage(476));
		var queue = ensureFormComponentIsStateful(formFiber).queue;
		startTransition(formFiber, queue, pendingState, sharedNotPendingObject, null === action ? noop : function() {
			requestFormReset$1(formFiber);
			return action(formData);
		});
	}
	function ensureFormComponentIsStateful(formFiber) {
		var existingStateHook = formFiber.memoizedState;
		if (null !== existingStateHook) return existingStateHook;
		existingStateHook = {
			memoizedState: sharedNotPendingObject,
			baseState: sharedNotPendingObject,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: basicStateReducer,
				lastRenderedState: sharedNotPendingObject
			},
			next: null
		};
		var initialResetState = {};
		existingStateHook.next = {
			memoizedState: initialResetState,
			baseState: initialResetState,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: basicStateReducer,
				lastRenderedState: initialResetState
			},
			next: null
		};
		formFiber.memoizedState = existingStateHook;
		formFiber = formFiber.alternate;
		null !== formFiber && (formFiber.memoizedState = existingStateHook);
		return existingStateHook;
	}
	function requestFormReset$1(formFiber) {
		var stateHook = ensureFormComponentIsStateful(formFiber);
		null === stateHook.next && (stateHook = formFiber.alternate.memoizedState);
		dispatchSetStateInternal(formFiber, stateHook.next.queue, {}, requestUpdateLane());
	}
	function useHostTransitionStatus() {
		return readContext(HostTransitionContext);
	}
	function updateId() {
		return updateWorkInProgressHook().memoizedState;
	}
	function updateRefresh() {
		return updateWorkInProgressHook().memoizedState;
	}
	function refreshCache(fiber) {
		for (var provider = fiber.return; null !== provider;) {
			switch (provider.tag) {
				case 24:
				case 3:
					var lane = requestUpdateLane();
					fiber = createUpdate(lane);
					var root$73 = enqueueUpdate(provider, fiber, lane);
					null !== root$73 && (scheduleUpdateOnFiber(root$73, provider, lane), entangleTransitions(root$73, provider, lane));
					provider = { cache: createCache() };
					fiber.payload = provider;
					return;
			}
			provider = provider.return;
		}
	}
	function dispatchReducerAction(fiber, queue, action) {
		var lane = requestUpdateLane();
		action = {
			lane,
			revertLane: 0,
			gesture: null,
			action,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, action) : (action = enqueueConcurrentHookUpdate(fiber, queue, action, lane), null !== action && (scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane)));
	}
	function dispatchSetState(fiber, queue, action) {
		dispatchSetStateInternal(fiber, queue, action, requestUpdateLane());
	}
	function dispatchSetStateInternal(fiber, queue, action, lane) {
		var update = {
			lane,
			revertLane: 0,
			gesture: null,
			action,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
		else {
			var alternate = fiber.alternate;
			if (0 === fiber.lanes && (null === alternate || 0 === alternate.lanes) && (alternate = queue.lastRenderedReducer, null !== alternate)) try {
				var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
				update.hasEagerState = !0;
				update.eagerState = eagerState;
				if (objectIs(eagerState, currentState)) return enqueueUpdate$1(fiber, queue, update, 0), null === workInProgressRoot && finishQueueingConcurrentUpdates(), !1;
			} catch (error) {}
			action = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
			if (null !== action) return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), !0;
		}
		return !1;
	}
	function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
		action = {
			lane: 2,
			revertLane: requestTransitionLane(),
			gesture: null,
			action,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (isRenderPhaseUpdate(fiber)) {
			if (throwIfDuringRender) throw Error(formatProdErrorMessage(479));
		} else throwIfDuringRender = enqueueConcurrentHookUpdate(fiber, queue, action, 2), null !== throwIfDuringRender && scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
	}
	function isRenderPhaseUpdate(fiber) {
		var alternate = fiber.alternate;
		return fiber === currentlyRenderingFiber || null !== alternate && alternate === currentlyRenderingFiber;
	}
	function enqueueRenderPhaseUpdate(queue, update) {
		didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = !0;
		var pending = queue.pending;
		null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
		queue.pending = update;
	}
	function entangleTransitionUpdate(root, queue, lane) {
		if (0 !== (lane & 4194048)) {
			var queueLanes = queue.lanes;
			queueLanes &= root.pendingLanes;
			lane |= queueLanes;
			queue.lanes = lane;
			markRootEntangled(root, lane);
		}
	}
	var ContextOnlyDispatcher = {
		readContext,
		use,
		useCallback: throwInvalidHookError,
		useContext: throwInvalidHookError,
		useEffect: throwInvalidHookError,
		useImperativeHandle: throwInvalidHookError,
		useLayoutEffect: throwInvalidHookError,
		useInsertionEffect: throwInvalidHookError,
		useMemo: throwInvalidHookError,
		useReducer: throwInvalidHookError,
		useRef: throwInvalidHookError,
		useState: throwInvalidHookError,
		useDebugValue: throwInvalidHookError,
		useDeferredValue: throwInvalidHookError,
		useTransition: throwInvalidHookError,
		useSyncExternalStore: throwInvalidHookError,
		useId: throwInvalidHookError,
		useHostTransitionStatus: throwInvalidHookError,
		useFormState: throwInvalidHookError,
		useActionState: throwInvalidHookError,
		useOptimistic: throwInvalidHookError,
		useMemoCache: throwInvalidHookError,
		useCacheRefresh: throwInvalidHookError,
		useEffectEvent: throwInvalidHookError
	};
	var HooksDispatcherOnMount = {
		readContext,
		use,
		useCallback: function(callback, deps) {
			mountWorkInProgressHook().memoizedState = [callback, void 0 === deps ? null : deps];
			return callback;
		},
		useContext: readContext,
		useEffect: mountEffect,
		useImperativeHandle: function(ref, create, deps) {
			deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
			mountEffectImpl(4194308, 4, imperativeHandleEffect.bind(null, create, ref), deps);
		},
		useLayoutEffect: function(create, deps) {
			return mountEffectImpl(4194308, 4, create, deps);
		},
		useInsertionEffect: function(create, deps) {
			mountEffectImpl(4, 2, create, deps);
		},
		useMemo: function(nextCreate, deps) {
			var hook = mountWorkInProgressHook();
			deps = void 0 === deps ? null : deps;
			var nextValue = nextCreate();
			if (shouldDoubleInvokeUserFnsInHooksDEV) {
				setIsStrictModeForDevtools(!0);
				try {
					nextCreate();
				} finally {
					setIsStrictModeForDevtools(!1);
				}
			}
			hook.memoizedState = [nextValue, deps];
			return nextValue;
		},
		useReducer: function(reducer, initialArg, init) {
			var hook = mountWorkInProgressHook();
			if (void 0 !== init) {
				var initialState = init(initialArg);
				if (shouldDoubleInvokeUserFnsInHooksDEV) {
					setIsStrictModeForDevtools(!0);
					try {
						init(initialArg);
					} finally {
						setIsStrictModeForDevtools(!1);
					}
				}
			} else initialState = initialArg;
			hook.memoizedState = hook.baseState = initialState;
			reducer = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: reducer,
				lastRenderedState: initialState
			};
			hook.queue = reducer;
			reducer = reducer.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, reducer);
			return [hook.memoizedState, reducer];
		},
		useRef: function(initialValue) {
			var hook = mountWorkInProgressHook();
			initialValue = { current: initialValue };
			return hook.memoizedState = initialValue;
		},
		useState: function(initialState) {
			initialState = mountStateImpl(initialState);
			var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
			queue.dispatch = dispatch;
			return [initialState.memoizedState, dispatch];
		},
		useDebugValue: mountDebugValue,
		useDeferredValue: function(value, initialValue) {
			return mountDeferredValueImpl(mountWorkInProgressHook(), value, initialValue);
		},
		useTransition: function() {
			var stateHook = mountStateImpl(!1);
			stateHook = startTransition.bind(null, currentlyRenderingFiber, stateHook.queue, !0, !1);
			mountWorkInProgressHook().memoizedState = stateHook;
			return [!1, stateHook];
		},
		useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
			var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
			if (isHydrating) {
				if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
				getServerSnapshot = getServerSnapshot();
			} else {
				getServerSnapshot = getSnapshot();
				if (null === workInProgressRoot) throw Error(formatProdErrorMessage(349));
				0 !== (workInProgressRootRenderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
			}
			hook.memoizedState = getServerSnapshot;
			var inst = {
				value: getServerSnapshot,
				getSnapshot
			};
			hook.queue = inst;
			mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
			fiber.flags |= 2048;
			pushSimpleEffect(9, { destroy: void 0 }, updateStoreInstance.bind(null, fiber, inst, getServerSnapshot, getSnapshot), null);
			return getServerSnapshot;
		},
		useId: function() {
			var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
			if (isHydrating) {
				var JSCompiler_inline_result = treeContextOverflow;
				var idWithLeadingBit = treeContextId;
				JSCompiler_inline_result = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + JSCompiler_inline_result;
				identifierPrefix = "_" + identifierPrefix + "R_" + JSCompiler_inline_result;
				JSCompiler_inline_result = localIdCounter++;
				0 < JSCompiler_inline_result && (identifierPrefix += "H" + JSCompiler_inline_result.toString(32));
				identifierPrefix += "_";
			} else JSCompiler_inline_result = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + JSCompiler_inline_result.toString(32) + "_";
			return hook.memoizedState = identifierPrefix;
		},
		useHostTransitionStatus,
		useFormState: mountActionState,
		useActionState: mountActionState,
		useOptimistic: function(passthrough) {
			var hook = mountWorkInProgressHook();
			hook.memoizedState = hook.baseState = passthrough;
			var queue = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			hook.queue = queue;
			hook = dispatchOptimisticSetState.bind(null, currentlyRenderingFiber, !0, queue);
			queue.dispatch = hook;
			return [passthrough, hook];
		},
		useMemoCache,
		useCacheRefresh: function() {
			return mountWorkInProgressHook().memoizedState = refreshCache.bind(null, currentlyRenderingFiber);
		},
		useEffectEvent: function(callback) {
			var hook = mountWorkInProgressHook(), ref = { impl: callback };
			hook.memoizedState = ref;
			return function() {
				if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
				return ref.impl.apply(void 0, arguments);
			};
		}
	};
	var HooksDispatcherOnUpdate = {
		readContext,
		use,
		useCallback: updateCallback,
		useContext: readContext,
		useEffect: updateEffect,
		useImperativeHandle: updateImperativeHandle,
		useInsertionEffect: updateInsertionEffect,
		useLayoutEffect: updateLayoutEffect,
		useMemo: updateMemo,
		useReducer: updateReducer,
		useRef: updateRef,
		useState: function() {
			return updateReducer(basicStateReducer);
		},
		useDebugValue: mountDebugValue,
		useDeferredValue: function(value, initialValue) {
			return updateDeferredValueImpl(updateWorkInProgressHook(), currentHook.memoizedState, value, initialValue);
		},
		useTransition: function() {
			var booleanOrThenable = updateReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
			return ["boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable), start];
		},
		useSyncExternalStore: updateSyncExternalStore,
		useId: updateId,
		useHostTransitionStatus,
		useFormState: updateActionState,
		useActionState: updateActionState,
		useOptimistic: function(passthrough, reducer) {
			return updateOptimisticImpl(updateWorkInProgressHook(), currentHook, passthrough, reducer);
		},
		useMemoCache,
		useCacheRefresh: updateRefresh,
		useEffectEvent: updateEvent
	};
	var HooksDispatcherOnRerender = {
		readContext,
		use,
		useCallback: updateCallback,
		useContext: readContext,
		useEffect: updateEffect,
		useImperativeHandle: updateImperativeHandle,
		useInsertionEffect: updateInsertionEffect,
		useLayoutEffect: updateLayoutEffect,
		useMemo: updateMemo,
		useReducer: rerenderReducer,
		useRef: updateRef,
		useState: function() {
			return rerenderReducer(basicStateReducer);
		},
		useDebugValue: mountDebugValue,
		useDeferredValue: function(value, initialValue) {
			var hook = updateWorkInProgressHook();
			return null === currentHook ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(hook, currentHook.memoizedState, value, initialValue);
		},
		useTransition: function() {
			var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
			return ["boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable), start];
		},
		useSyncExternalStore: updateSyncExternalStore,
		useId: updateId,
		useHostTransitionStatus,
		useFormState: rerenderActionState,
		useActionState: rerenderActionState,
		useOptimistic: function(passthrough, reducer) {
			var hook = updateWorkInProgressHook();
			if (null !== currentHook) return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
			hook.baseState = passthrough;
			return [passthrough, hook.queue.dispatch];
		},
		useMemoCache,
		useCacheRefresh: updateRefresh,
		useEffectEvent: updateEvent
	};
	function applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, nextProps) {
		ctor = workInProgress.memoizedState;
		getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
		getDerivedStateFromProps = null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps ? ctor : assign({}, ctor, getDerivedStateFromProps);
		workInProgress.memoizedState = getDerivedStateFromProps;
		0 === workInProgress.lanes && (workInProgress.updateQueue.baseState = getDerivedStateFromProps);
	}
	var classComponentUpdater = {
		enqueueSetState: function(inst, payload, callback) {
			inst = inst._reactInternals;
			var lane = requestUpdateLane(), update = createUpdate(lane);
			update.payload = payload;
			void 0 !== callback && null !== callback && (update.callback = callback);
			payload = enqueueUpdate(inst, update, lane);
			null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
		},
		enqueueReplaceState: function(inst, payload, callback) {
			inst = inst._reactInternals;
			var lane = requestUpdateLane(), update = createUpdate(lane);
			update.tag = 1;
			update.payload = payload;
			void 0 !== callback && null !== callback && (update.callback = callback);
			payload = enqueueUpdate(inst, update, lane);
			null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
		},
		enqueueForceUpdate: function(inst, callback) {
			inst = inst._reactInternals;
			var lane = requestUpdateLane(), update = createUpdate(lane);
			update.tag = 2;
			void 0 !== callback && null !== callback && (update.callback = callback);
			callback = enqueueUpdate(inst, update, lane);
			null !== callback && (scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
		}
	};
	function checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext) {
		workInProgress = workInProgress.stateNode;
		return "function" === typeof workInProgress.shouldComponentUpdate ? workInProgress.shouldComponentUpdate(newProps, newState, nextContext) : ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState) : !0;
	}
	function callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext) {
		workInProgress = instance.state;
		"function" === typeof instance.componentWillReceiveProps && instance.componentWillReceiveProps(newProps, nextContext);
		"function" === typeof instance.UNSAFE_componentWillReceiveProps && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
		instance.state !== workInProgress && classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
	}
	function resolveClassComponentProps(Component, baseProps) {
		var newProps = baseProps;
		if ("ref" in baseProps) {
			newProps = {};
			for (var propName in baseProps) "ref" !== propName && (newProps[propName] = baseProps[propName]);
		}
		if (Component = Component.defaultProps) {
			newProps === baseProps && (newProps = assign({}, newProps));
			for (var propName$77 in Component) void 0 === newProps[propName$77] && (newProps[propName$77] = Component[propName$77]);
		}
		return newProps;
	}
	function defaultOnUncaughtError(error) {
		reportGlobalError(error);
	}
	function defaultOnCaughtError(error) {
		console.error(error);
	}
	function defaultOnRecoverableError(error) {
		reportGlobalError(error);
	}
	function logUncaughtError(root, errorInfo) {
		try {
			var onUncaughtError = root.onUncaughtError;
			onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
		} catch (e$78) {
			setTimeout(function() {
				throw e$78;
			});
		}
	}
	function logCaughtError(root, boundary, errorInfo) {
		try {
			var onCaughtError = root.onCaughtError;
			onCaughtError(errorInfo.value, {
				componentStack: errorInfo.stack,
				errorBoundary: 1 === boundary.tag ? boundary.stateNode : null
			});
		} catch (e$79) {
			setTimeout(function() {
				throw e$79;
			});
		}
	}
	function createRootErrorUpdate(root, errorInfo, lane) {
		lane = createUpdate(lane);
		lane.tag = 3;
		lane.payload = { element: null };
		lane.callback = function() {
			logUncaughtError(root, errorInfo);
		};
		return lane;
	}
	function createClassErrorUpdate(lane) {
		lane = createUpdate(lane);
		lane.tag = 3;
		return lane;
	}
	function initializeClassErrorUpdate(update, root, fiber, errorInfo) {
		var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
		if ("function" === typeof getDerivedStateFromError) {
			var error = errorInfo.value;
			update.payload = function() {
				return getDerivedStateFromError(error);
			};
			update.callback = function() {
				logCaughtError(root, fiber, errorInfo);
			};
		}
		var inst = fiber.stateNode;
		null !== inst && "function" === typeof inst.componentDidCatch && (update.callback = function() {
			logCaughtError(root, fiber, errorInfo);
			"function" !== typeof getDerivedStateFromError && (null === legacyErrorBoundariesThatAlreadyFailed ? legacyErrorBoundariesThatAlreadyFailed = /* @__PURE__ */ new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
			var stack = errorInfo.stack;
			this.componentDidCatch(errorInfo.value, { componentStack: null !== stack ? stack : "" });
		});
	}
	function throwException(root, returnFiber, sourceFiber, value, rootRenderLanes) {
		sourceFiber.flags |= 32768;
		if (null !== value && "object" === typeof value && "function" === typeof value.then) {
			returnFiber = sourceFiber.alternate;
			null !== returnFiber && propagateParentContextChanges(returnFiber, sourceFiber, rootRenderLanes, !0);
			sourceFiber = suspenseHandlerStackCursor.current;
			if (null !== sourceFiber) {
				switch (sourceFiber.tag) {
					case 31:
					case 13:
					case 19: return null === shellBoundary ? renderDidSuspendDelayIfPossible() : null === sourceFiber.alternate && 0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 3), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? sourceFiber.updateQueue = /* @__PURE__ */ new Set([value]) : returnFiber.add(value), attachPingListener(root, value, rootRenderLanes)), !1;
					case 22: return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? (returnFiber = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([value])
					}, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, null === sourceFiber ? returnFiber.retryQueue = /* @__PURE__ */ new Set([value]) : sourceFiber.add(value)), attachPingListener(root, value, rootRenderLanes)), !1;
				}
				throw Error(formatProdErrorMessage(435, sourceFiber.tag));
			}
			attachPingListener(root, value, rootRenderLanes);
			renderDidSuspendDelayIfPossible();
			return !1;
		}
		if (isHydrating) return returnFiber = suspenseHandlerStackCursor.current, null !== returnFiber ? (0 === (returnFiber.flags & 65536) && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && (root = Error(formatProdErrorMessage(422), { cause: value }), queueHydrationError(createCapturedValueAtFiber(root, sourceFiber)))) : (value !== HydrationMismatchException && (returnFiber = Error(formatProdErrorMessage(423), { cause: value }), queueHydrationError(createCapturedValueAtFiber(returnFiber, sourceFiber))), root = root.current.alternate, root.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(root.stateNode, value, rootRenderLanes), enqueueCapturedUpdate(root, rootRenderLanes), 4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2)), !1;
		var wrapperError = Error(formatProdErrorMessage(520), { cause: value });
		wrapperError = createCapturedValueAtFiber(wrapperError, sourceFiber);
		null === workInProgressRootConcurrentErrors ? workInProgressRootConcurrentErrors = [wrapperError] : workInProgressRootConcurrentErrors.push(wrapperError);
		4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2);
		if (null === returnFiber) return !0;
		value = createCapturedValueAtFiber(value, sourceFiber);
		sourceFiber = returnFiber;
		do {
			switch (sourceFiber.tag) {
				case 3: return sourceFiber.flags |= 65536, root = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root, root = createRootErrorUpdate(sourceFiber.stateNode, value, root), enqueueCapturedUpdate(sourceFiber, root), !1;
				case 1:
					returnFiber = sourceFiber.type;
					wrapperError = sourceFiber.stateNode;
					if (0 === (sourceFiber.flags & 128) && ("function" === typeof returnFiber.getDerivedStateFromError || null !== wrapperError && "function" === typeof wrapperError.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(wrapperError)))) return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(rootRenderLanes, root, sourceFiber, value), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), !1;
					break;
				case 22: if (null !== sourceFiber.memoizedState) return sourceFiber.flags |= 65536, !1;
			}
			sourceFiber = sourceFiber.return;
		} while (null !== sourceFiber);
		return !1;
	}
	var SelectiveHydrationException = Error(formatProdErrorMessage(461));
	var didReceiveUpdate = !1;
	function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
		workInProgress.child = null === current ? mountChildFibers(workInProgress, null, nextChildren, renderLanes) : reconcileChildFibers(workInProgress, current.child, nextChildren, renderLanes);
	}
	function updateForwardRef(current, workInProgress, Component, nextProps, renderLanes) {
		Component = Component.render;
		var ref = workInProgress.ref;
		if ("ref" in nextProps) {
			var propsWithoutRef = {};
			for (var key in nextProps) "ref" !== key && (propsWithoutRef[key] = nextProps[key]);
		} else propsWithoutRef = nextProps;
		prepareToReadContext(workInProgress);
		nextProps = renderWithHooks(current, workInProgress, Component, propsWithoutRef, ref, renderLanes);
		key = checkDidRenderIdHook();
		if (null !== current && !didReceiveUpdate) return bailoutHooks(current, workInProgress, renderLanes), bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
		isHydrating && key && pushMaterializedTreeId(workInProgress);
		workInProgress.flags |= 1;
		reconcileChildren(current, workInProgress, nextProps, renderLanes);
		return workInProgress.child;
	}
	function updateMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
		if (null === current) {
			var type = Component.type;
			if ("function" === typeof type && !shouldConstruct(type) && void 0 === type.defaultProps && null === Component.compare) return workInProgress.tag = 15, workInProgress.type = type, updateSimpleMemoComponent(current, workInProgress, type, nextProps, renderLanes);
			current = createFiberFromTypeAndProps(Component.type, null, nextProps, workInProgress, workInProgress.mode, renderLanes);
			current.ref = workInProgress.ref;
			current.return = workInProgress;
			return workInProgress.child = current;
		}
		type = current.child;
		if (!checkScheduledUpdateOrContext(current, renderLanes)) {
			var prevProps = type.memoizedProps;
			Component = Component.compare;
			Component = null !== Component ? Component : shallowEqual;
			if (Component(prevProps, nextProps) && current.ref === workInProgress.ref) return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
		}
		workInProgress.flags |= 1;
		current = createWorkInProgress(type, nextProps);
		current.ref = workInProgress.ref;
		current.return = workInProgress;
		return workInProgress.child = current;
	}
	function updateSimpleMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
		if (null !== current) {
			var prevProps = current.memoizedProps;
			if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress.ref) if (didReceiveUpdate = !1, workInProgress.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current, renderLanes)) 0 !== (current.flags & 131072) && (didReceiveUpdate = !0);
			else return workInProgress.lanes = current.lanes, bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
		}
		return updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes);
	}
	function updateOffscreenComponent(current, workInProgress, renderLanes, nextProps) {
		var nextChildren = nextProps.children, prevState = null !== current ? current.memoizedState : null;
		null === current && null === workInProgress.stateNode && (workInProgress.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		});
		if ("hidden" === nextProps.mode) {
			if (0 !== (workInProgress.flags & 128)) {
				prevState = null !== prevState ? prevState.baseLanes | renderLanes : renderLanes;
				if (null !== current) {
					nextProps = workInProgress.child = current.child;
					for (nextChildren = 0; null !== nextProps;) nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
					nextProps = nextChildren & ~prevState;
				} else nextProps = 0, workInProgress.child = null;
				return deferHiddenOffscreenComponent(current, workInProgress, prevState, renderLanes, nextProps);
			}
			if (0 !== (renderLanes & 536870912)) workInProgress.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, null !== current && pushTransition(workInProgress, null !== prevState ? prevState.cachePool : null), null !== prevState ? pushHiddenContext(workInProgress, prevState) : reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress);
			else return nextProps = workInProgress.lanes = 536870912, deferHiddenOffscreenComponent(current, workInProgress, null !== prevState ? prevState.baseLanes | renderLanes : renderLanes, renderLanes, nextProps);
		} else null !== prevState ? (pushTransition(workInProgress, prevState.cachePool), pushHiddenContext(workInProgress, prevState), reuseSuspenseHandlerOnStack(), workInProgress.memoizedState = null) : (null !== current && pushTransition(workInProgress, null), reuseHiddenContextOnStack(), reuseSuspenseHandlerOnStack());
		reconcileChildren(current, workInProgress, nextChildren, renderLanes);
		return workInProgress.child;
	}
	function bailoutOffscreenComponent(current, workInProgress) {
		null !== current && 22 === current.tag || null !== workInProgress.stateNode || (workInProgress.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		});
		return workInProgress.sibling;
	}
	function deferHiddenOffscreenComponent(current, workInProgress, nextBaseLanes, renderLanes, remainingChildLanes) {
		var JSCompiler_inline_result = peekCacheFromPool();
		JSCompiler_inline_result = null === JSCompiler_inline_result ? null : {
			parent: CacheContext._currentValue,
			pool: JSCompiler_inline_result
		};
		workInProgress.memoizedState = {
			baseLanes: nextBaseLanes,
			cachePool: JSCompiler_inline_result
		};
		null !== current && pushTransition(workInProgress, null);
		reuseHiddenContextOnStack();
		pushOffscreenSuspenseHandler(workInProgress);
		null !== current && propagateParentContextChanges(current, workInProgress, renderLanes, !0);
		workInProgress.childLanes = remainingChildLanes;
		return null;
	}
	function mountActivityChildren(workInProgress, nextProps) {
		nextProps = mountWorkInProgressOffscreenFiber({
			mode: nextProps.mode,
			children: nextProps.children
		}, workInProgress.mode);
		nextProps.ref = workInProgress.ref;
		workInProgress.child = nextProps;
		nextProps.return = workInProgress;
		return nextProps;
	}
	function retryActivityComponentWithoutHydrating(current, workInProgress, renderLanes) {
		reconcileChildFibers(workInProgress, current.child, null, renderLanes);
		current = mountActivityChildren(workInProgress, workInProgress.pendingProps);
		current.flags |= 2;
		popSuspenseHandler(workInProgress);
		workInProgress.memoizedState = null;
		return current;
	}
	function updateActivityComponent(current, workInProgress, renderLanes) {
		var nextProps = workInProgress.pendingProps, didSuspend = 0 !== (workInProgress.flags & 128);
		workInProgress.flags &= -129;
		if (null === current) {
			if (isHydrating) {
				if ("hidden" === nextProps.mode) return current = mountActivityChildren(workInProgress, nextProps), workInProgress.lanes = 536870912, current.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, bailoutOffscreenComponent(null, current);
				pushDehydratedActivitySuspenseHandler(workInProgress);
				(current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(current, rootOrSingletonContext), current = null !== current && "&" === current.data ? current : null, null !== current && (workInProgress.memoizedState = {
					dehydrated: current,
					treeContext: null !== treeContextProvider ? {
						id: treeContextId,
						overflow: treeContextOverflow
					} : null,
					retryLane: 536870912,
					hydrationErrors: null
				}, renderLanes = createFiberFromDehydratedFragment(current), renderLanes.return = workInProgress, workInProgress.child = renderLanes, hydrationParentFiber = workInProgress, nextHydratableInstance = null)) : current = null;
				if (null === current) throw throwOnHydrationMismatch(workInProgress);
				workInProgress.lanes = 536870912;
				return null;
			}
			return mountActivityChildren(workInProgress, nextProps);
		}
		var prevState = current.memoizedState;
		if (null !== prevState) {
			var dehydrated = prevState.dehydrated;
			pushDehydratedActivitySuspenseHandler(workInProgress);
			if (didSuspend) if (workInProgress.flags & 256) workInProgress.flags &= -257, workInProgress = retryActivityComponentWithoutHydrating(current, workInProgress, renderLanes);
			else if (null !== workInProgress.memoizedState) workInProgress.child = current.child, workInProgress.flags |= 128, workInProgress = null;
			else throw Error(formatProdErrorMessage(558));
			else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress, renderLanes, !1), didSuspend = 0 !== (renderLanes & current.childLanes), didReceiveUpdate || didSuspend) {
				if (null === currentTreeHiddenStackCursor.current) {
					nextProps = workInProgressRoot;
					if (null !== nextProps && (dehydrated = getBumpedLaneForHydration(nextProps, renderLanes), 0 !== dehydrated && dehydrated !== prevState.retryLane)) throw prevState.retryLane = dehydrated, enqueueConcurrentRenderForLane(current, dehydrated), scheduleUpdateOnFiber(nextProps, current, dehydrated), SelectiveHydrationException;
					renderDidSuspendDelayIfPossible();
				}
				workInProgress = retryActivityComponentWithoutHydrating(current, workInProgress, renderLanes);
			} else current = prevState.treeContext, nextHydratableInstance = getNextHydratable(dehydrated.nextSibling), hydrationParentFiber = workInProgress, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !1, null !== current && restoreSuspendedTreeContext(workInProgress, current), workInProgress = mountActivityChildren(workInProgress, nextProps), workInProgress.flags |= 134221824;
			return workInProgress;
		}
		current = createWorkInProgress(current.child, {
			mode: nextProps.mode,
			children: nextProps.children
		});
		current.ref = workInProgress.ref;
		workInProgress.child = current;
		current.return = workInProgress;
		return current;
	}
	function markRef(current, workInProgress) {
		var ref = workInProgress.ref;
		if (null === ref) null !== current && null !== current.ref && (workInProgress.flags |= 4194816);
		else {
			if ("function" !== typeof ref && "object" !== typeof ref) throw Error(formatProdErrorMessage(284));
			if (null === current || current.ref !== ref) workInProgress.flags |= 4194816;
		}
	}
	function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {
		prepareToReadContext(workInProgress);
		Component = renderWithHooks(current, workInProgress, Component, nextProps, void 0, renderLanes);
		nextProps = checkDidRenderIdHook();
		if (null !== current && !didReceiveUpdate) return bailoutHooks(current, workInProgress, renderLanes), bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
		isHydrating && nextProps && pushMaterializedTreeId(workInProgress);
		workInProgress.flags |= 1;
		reconcileChildren(current, workInProgress, Component, renderLanes);
		return workInProgress.child;
	}
	function replayFunctionComponent(current, workInProgress, nextProps, Component, secondArg, renderLanes) {
		prepareToReadContext(workInProgress);
		workInProgress.updateQueue = null;
		nextProps = renderWithHooksAgain(workInProgress, Component, nextProps, secondArg);
		finishRenderingHooks(current);
		Component = checkDidRenderIdHook();
		if (null !== current && !didReceiveUpdate) return bailoutHooks(current, workInProgress, renderLanes), bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
		isHydrating && Component && pushMaterializedTreeId(workInProgress);
		workInProgress.flags |= 1;
		reconcileChildren(current, workInProgress, nextProps, renderLanes);
		return workInProgress.child;
	}
	function updateClassComponent(current, workInProgress, Component, nextProps, renderLanes) {
		prepareToReadContext(workInProgress);
		if (null === workInProgress.stateNode) {
			var context = emptyContextObject, contextType = Component.contextType;
			"object" === typeof contextType && null !== contextType && (context = readContext(contextType));
			context = new Component(nextProps, context);
			workInProgress.memoizedState = null !== context.state && void 0 !== context.state ? context.state : null;
			context.updater = classComponentUpdater;
			workInProgress.stateNode = context;
			context._reactInternals = workInProgress;
			context = workInProgress.stateNode;
			context.props = nextProps;
			context.state = workInProgress.memoizedState;
			context.refs = {};
			initializeUpdateQueue(workInProgress);
			contextType = Component.contextType;
			context.context = "object" === typeof contextType && null !== contextType ? readContext(contextType) : emptyContextObject;
			context.state = workInProgress.memoizedState;
			contextType = Component.getDerivedStateFromProps;
			"function" === typeof contextType && (applyDerivedStateFromProps(workInProgress, Component, contextType, nextProps), context.state = workInProgress.memoizedState);
			"function" === typeof Component.getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || (contextType = context.state, "function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount(), contextType !== context.state && classComponentUpdater.enqueueReplaceState(context, context.state, null), processUpdateQueue(workInProgress, nextProps, context, renderLanes), suspendIfUpdateReadFromEntangledAsyncAction(), context.state = workInProgress.memoizedState);
			"function" === typeof context.componentDidMount && (workInProgress.flags |= 4194308);
			nextProps = !0;
		} else if (null === current) {
			context = workInProgress.stateNode;
			var unresolvedOldProps = workInProgress.memoizedProps, oldProps = resolveClassComponentProps(Component, unresolvedOldProps);
			context.props = oldProps;
			var oldContext = context.context, contextType$jscomp$0 = Component.contextType;
			contextType = emptyContextObject;
			"object" === typeof contextType$jscomp$0 && null !== contextType$jscomp$0 && (contextType = readContext(contextType$jscomp$0));
			var getDerivedStateFromProps = Component.getDerivedStateFromProps;
			contextType$jscomp$0 = "function" === typeof getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate;
			unresolvedOldProps = workInProgress.pendingProps !== unresolvedOldProps;
			contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (unresolvedOldProps || oldContext !== contextType) && callComponentWillReceiveProps(workInProgress, context, nextProps, contextType);
			hasForceUpdate = !1;
			var oldState = workInProgress.memoizedState;
			context.state = oldState;
			processUpdateQueue(workInProgress, nextProps, context, renderLanes);
			suspendIfUpdateReadFromEntangledAsyncAction();
			oldContext = workInProgress.memoizedState;
			unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? ("function" === typeof getDerivedStateFromProps && (applyDerivedStateFromProps(workInProgress, Component, getDerivedStateFromProps, nextProps), oldContext = workInProgress.memoizedState), (oldProps = hasForceUpdate || checkShouldComponentUpdate(workInProgress, Component, oldProps, nextProps, oldState, oldContext, contextType)) ? (contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || ("function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount()), "function" === typeof context.componentDidMount && (workInProgress.flags |= 4194308)) : ("function" === typeof context.componentDidMount && (workInProgress.flags |= 4194308), workInProgress.memoizedProps = nextProps, workInProgress.memoizedState = oldContext), context.props = nextProps, context.state = oldContext, context.context = contextType, nextProps = oldProps) : ("function" === typeof context.componentDidMount && (workInProgress.flags |= 4194308), nextProps = !1);
		} else {
			context = workInProgress.stateNode;
			cloneUpdateQueue(current, workInProgress);
			contextType = workInProgress.memoizedProps;
			contextType$jscomp$0 = resolveClassComponentProps(Component, contextType);
			context.props = contextType$jscomp$0;
			getDerivedStateFromProps = workInProgress.pendingProps;
			oldState = context.context;
			oldContext = Component.contextType;
			oldProps = emptyContextObject;
			"object" === typeof oldContext && null !== oldContext && (oldProps = readContext(oldContext));
			unresolvedOldProps = Component.getDerivedStateFromProps;
			(oldContext = "function" === typeof unresolvedOldProps || "function" === typeof context.getSnapshotBeforeUpdate) || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (contextType !== getDerivedStateFromProps || oldState !== oldProps) && callComponentWillReceiveProps(workInProgress, context, nextProps, oldProps);
			hasForceUpdate = !1;
			oldState = workInProgress.memoizedState;
			context.state = oldState;
			processUpdateQueue(workInProgress, nextProps, context, renderLanes);
			suspendIfUpdateReadFromEntangledAsyncAction();
			var newState = workInProgress.memoizedState;
			contextType !== getDerivedStateFromProps || oldState !== newState || hasForceUpdate || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies) ? ("function" === typeof unresolvedOldProps && (applyDerivedStateFromProps(workInProgress, Component, unresolvedOldProps, nextProps), newState = workInProgress.memoizedState), (contextType$jscomp$0 = hasForceUpdate || checkShouldComponentUpdate(workInProgress, Component, contextType$jscomp$0, nextProps, oldState, newState, oldProps) || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies)) ? (oldContext || "function" !== typeof context.UNSAFE_componentWillUpdate && "function" !== typeof context.componentWillUpdate || ("function" === typeof context.componentWillUpdate && context.componentWillUpdate(nextProps, newState, oldProps), "function" === typeof context.UNSAFE_componentWillUpdate && context.UNSAFE_componentWillUpdate(nextProps, newState, oldProps)), "function" === typeof context.componentDidUpdate && (workInProgress.flags |= 4), "function" === typeof context.getSnapshotBeforeUpdate && (workInProgress.flags |= 1024)) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress.flags |= 1024), workInProgress.memoizedProps = nextProps, workInProgress.memoizedState = newState), context.props = nextProps, context.state = newState, context.context = oldProps, nextProps = contextType$jscomp$0) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress.flags |= 1024), nextProps = !1);
		}
		context = nextProps;
		markRef(current, workInProgress);
		nextProps = 0 !== (workInProgress.flags & 128);
		context || nextProps ? (context = workInProgress.stateNode, Component = nextProps && "function" !== typeof Component.getDerivedStateFromError ? null : context.render(), workInProgress.flags |= 1, null !== current && nextProps ? (workInProgress.child = reconcileChildFibers(workInProgress, current.child, null, renderLanes), workInProgress.child = reconcileChildFibers(workInProgress, null, Component, renderLanes)) : reconcileChildren(current, workInProgress, Component, renderLanes), workInProgress.memoizedState = context.state, current = workInProgress.child) : current = bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
		return current;
	}
	function mountHostRootWithoutHydrating(current, workInProgress, nextChildren, renderLanes) {
		resetHydrationState();
		workInProgress.flags |= 256;
		reconcileChildren(current, workInProgress, nextChildren, renderLanes);
		return workInProgress.child;
	}
	var SUSPENDED_MARKER = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function mountSuspenseOffscreenState(renderLanes) {
		return {
			baseLanes: renderLanes,
			cachePool: getSuspendedCache()
		};
	}
	function getRemainingWorkInPrimaryTree(current, primaryTreeDidDefer, renderLanes) {
		current = null !== current ? current.childLanes & ~renderLanes : 0;
		primaryTreeDidDefer && (current |= workInProgressDeferredLane);
		return current;
	}
	function updateSuspenseComponent(current, workInProgress, renderLanes) {
		var nextProps = workInProgress.pendingProps, showFallback = !1, didSuspend = 0 !== (workInProgress.flags & 128), JSCompiler_temp;
		(JSCompiler_temp = didSuspend) || (JSCompiler_temp = null !== current && null === current.memoizedState ? !1 : 0 !== (suspenseStackCursor.current & 2));
		JSCompiler_temp && (showFallback = !0, workInProgress.flags &= -129);
		JSCompiler_temp = 0 !== (workInProgress.flags & 32);
		workInProgress.flags &= -33;
		if (null === current) {
			if (isHydrating) {
				showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress) : reuseSuspenseHandlerOnStack();
				(current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(current, rootOrSingletonContext), current = null !== current && "&" !== current.data ? current : null, null !== current && (workInProgress.memoizedState = {
					dehydrated: current,
					treeContext: null !== treeContextProvider ? {
						id: treeContextId,
						overflow: treeContextOverflow
					} : null,
					retryLane: 536870912,
					hydrationErrors: null
				}, renderLanes = createFiberFromDehydratedFragment(current), renderLanes.return = workInProgress, workInProgress.child = renderLanes, hydrationParentFiber = workInProgress, nextHydratableInstance = null)) : current = null;
				if (null === current) throw throwOnHydrationMismatch(workInProgress);
				isSuspenseInstanceFallback(current) ? workInProgress.lanes = 32 : workInProgress.lanes = 536870912;
				return null;
			}
			didSuspend = nextProps.children;
			nextProps = nextProps.fallback;
			if (showFallback) return reuseSuspenseHandlerOnStack(), showFallback = workInProgress.mode, didSuspend = mountWorkInProgressOffscreenFiber({
				mode: "hidden",
				children: didSuspend
			}, showFallback), nextProps = createFiberFromFragment(nextProps, showFallback, renderLanes, null), didSuspend.return = workInProgress, nextProps.return = workInProgress, didSuspend.sibling = nextProps, workInProgress.child = didSuspend, nextProps = workInProgress.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes), nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes), workInProgress.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps);
			pushPrimaryTreeSuspenseHandler(workInProgress);
			return mountSuspensePrimaryChildren(workInProgress, didSuspend);
		}
		var prevState = current.memoizedState;
		if (null !== prevState) {
			var dehydrated$96 = prevState.dehydrated;
			if (null !== dehydrated$96) return updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, JSCompiler_temp, nextProps, dehydrated$96, prevState, renderLanes);
		}
		if (showFallback) return reuseSuspenseHandlerOnStack(), showFallback = nextProps.fallback, didSuspend = workInProgress.mode, prevState = current.child, dehydrated$96 = prevState.sibling, nextProps = createWorkInProgress(prevState, {
			mode: "hidden",
			children: nextProps.children
		}), nextProps.subtreeFlags = prevState.subtreeFlags & 1206910976, null !== dehydrated$96 ? showFallback = createWorkInProgress(dehydrated$96, showFallback) : (showFallback = createFiberFromFragment(showFallback, didSuspend, renderLanes, null), showFallback.flags |= 2), showFallback.return = workInProgress, nextProps.return = workInProgress, nextProps.sibling = showFallback, workInProgress.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress.child, showFallback = current.child.memoizedState, null === showFallback ? showFallback = mountSuspenseOffscreenState(renderLanes) : (didSuspend = showFallback.cachePool, null !== didSuspend ? (prevState = CacheContext._currentValue, didSuspend = didSuspend.parent !== prevState ? {
			parent: prevState,
			pool: prevState
		} : didSuspend) : didSuspend = getSuspendedCache(), showFallback = {
			baseLanes: showFallback.baseLanes | renderLanes,
			cachePool: didSuspend
		}), nextProps.memoizedState = showFallback, nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes), workInProgress.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current.child, nextProps);
		pushPrimaryTreeSuspenseHandler(workInProgress);
		renderLanes = current.child;
		current = renderLanes.sibling;
		renderLanes = createWorkInProgress(renderLanes, {
			mode: "visible",
			children: nextProps.children
		});
		renderLanes.return = workInProgress;
		renderLanes.sibling = null;
		null !== current && (JSCompiler_temp = workInProgress.deletions, null === JSCompiler_temp ? (workInProgress.deletions = [current], workInProgress.flags |= 16) : JSCompiler_temp.push(current));
		workInProgress.child = renderLanes;
		workInProgress.memoizedState = null;
		return renderLanes;
	}
	function mountSuspensePrimaryChildren(workInProgress, primaryChildren) {
		primaryChildren = mountWorkInProgressOffscreenFiber({
			mode: "visible",
			children: primaryChildren
		}, workInProgress.mode);
		primaryChildren.return = workInProgress;
		return workInProgress.child = primaryChildren;
	}
	function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
		offscreenProps = createFiberImplClass(22, offscreenProps, null, mode);
		offscreenProps.lanes = 0;
		return offscreenProps;
	}
	function retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes) {
		reconcileChildFibers(workInProgress, current.child, null, renderLanes);
		current = mountSuspensePrimaryChildren(workInProgress, workInProgress.pendingProps.children);
		current.flags |= 2;
		workInProgress.memoizedState = null;
		return current;
	}
	function updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, didPrimaryChildrenDefer, nextProps, suspenseInstance, suspenseState, renderLanes) {
		if (didSuspend) {
			if (workInProgress.flags & 256) return pushPrimaryTreeSuspenseHandler(workInProgress), workInProgress.flags &= -257, retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes);
			if (null !== workInProgress.memoizedState) return reuseSuspenseHandlerOnStack(), workInProgress.child = current.child, workInProgress.flags |= 128, null;
			reuseSuspenseHandlerOnStack();
			suspenseInstance = nextProps.fallback;
			suspenseState = workInProgress.mode;
			nextProps = mountWorkInProgressOffscreenFiber({
				mode: "visible",
				children: nextProps.children
			}, suspenseState);
			suspenseInstance = createFiberFromFragment(suspenseInstance, suspenseState, renderLanes, null);
			suspenseInstance.flags |= 2;
			nextProps.return = workInProgress;
			suspenseInstance.return = workInProgress;
			nextProps.sibling = suspenseInstance;
			workInProgress.child = nextProps;
			reconcileChildFibers(workInProgress, current.child, null, renderLanes);
			nextProps = workInProgress.child;
			nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes);
			nextProps.childLanes = getRemainingWorkInPrimaryTree(current, didPrimaryChildrenDefer, renderLanes);
			workInProgress.memoizedState = SUSPENDED_MARKER;
			return bailoutOffscreenComponent(null, nextProps);
		}
		pushPrimaryTreeSuspenseHandler(workInProgress);
		if (isSuspenseInstanceFallback(suspenseInstance)) {
			didPrimaryChildrenDefer = suspenseInstance.nextSibling && suspenseInstance.nextSibling.dataset;
			if (didPrimaryChildrenDefer) var digest = didPrimaryChildrenDefer.dgst;
			didPrimaryChildrenDefer = digest;
			"" !== didPrimaryChildrenDefer && (nextProps = Error(formatProdErrorMessage(419)), nextProps.stack = "", nextProps.digest = didPrimaryChildrenDefer, queueHydrationError({
				value: nextProps,
				source: null,
				stack: null
			}));
			return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes);
		}
		didReceiveUpdate || propagateParentContextChanges(current, workInProgress, renderLanes, !1);
		didPrimaryChildrenDefer = 0 !== (renderLanes & current.childLanes);
		if (didReceiveUpdate || didPrimaryChildrenDefer) {
			if (null !== currentTreeHiddenStackCursor.current) return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes);
			didPrimaryChildrenDefer = workInProgressRoot;
			if (null !== didPrimaryChildrenDefer && (nextProps = getBumpedLaneForHydration(didPrimaryChildrenDefer, renderLanes), 0 !== nextProps && nextProps !== suspenseState.retryLane)) throw suspenseState.retryLane = nextProps, enqueueConcurrentRenderForLane(current, nextProps), scheduleUpdateOnFiber(didPrimaryChildrenDefer, current, nextProps), SelectiveHydrationException;
			isSuspenseInstancePending(suspenseInstance) || renderDidSuspendDelayIfPossible();
			return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes);
		}
		if (isSuspenseInstancePending(suspenseInstance)) return workInProgress.flags |= 192, workInProgress.child = current.child, null;
		current = suspenseState.treeContext;
		nextHydratableInstance = getNextHydratable(suspenseInstance.nextSibling);
		hydrationParentFiber = workInProgress;
		isHydrating = !0;
		hydrationErrors = null;
		rootOrSingletonContext = !1;
		null !== current && restoreSuspendedTreeContext(workInProgress, current);
		workInProgress = mountSuspensePrimaryChildren(workInProgress, nextProps.children);
		workInProgress.flags |= 134221824;
		return workInProgress;
	}
	function scheduleSuspenseWorkOnFiber(fiber, renderLanes, propagationRoot) {
		fiber.lanes |= renderLanes;
		var alternate = fiber.alternate;
		null !== alternate && (alternate.lanes |= renderLanes);
		scheduleContextWorkOnParentPath(fiber.return, renderLanes, propagationRoot);
	}
	function findLastContentRow(firstChild) {
		for (var lastContentRow = null; null !== firstChild;) {
			var currentRow = firstChild.alternate;
			null !== currentRow && null === findFirstSuspended(currentRow) && (lastContentRow = firstChild);
			firstChild = firstChild.sibling;
		}
		return lastContentRow;
	}
	function initSuspenseListRenderState(workInProgress, isBackwards, tail, lastContentRow, tailMode, treeForkCount) {
		var renderState = workInProgress.memoizedState;
		null === renderState ? workInProgress.memoizedState = {
			isBackwards,
			rendering: null,
			renderingStartTime: 0,
			last: lastContentRow,
			tail,
			tailMode,
			treeForkCount
		} : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount);
	}
	function reverseChildren(fiber) {
		var row = fiber.child;
		for (fiber.child = null; null !== row;) {
			var nextRow = row.sibling;
			row.sibling = fiber.child;
			fiber.child = row;
			row = nextRow;
		}
	}
	function updateSuspenseListComponent(current, workInProgress, renderLanes) {
		var nextProps = workInProgress.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail;
		nextProps = nextProps.children;
		var suspenseContext = suspenseStackCursor.current;
		if (workInProgress.flags & 128) return pushSuspenseListContext(workInProgress, suspenseContext), null;
		var shouldForceFallback = 0 !== (suspenseContext & 2);
		shouldForceFallback ? (suspenseContext = suspenseContext & 1 | 2, workInProgress.flags |= 128) : suspenseContext &= 1;
		pushSuspenseListContext(workInProgress, suspenseContext);
		"backwards" === revealOrder && null !== current ? (reverseChildren(current), reconcileChildren(current, workInProgress, nextProps, renderLanes), reverseChildren(current)) : reconcileChildren(current, workInProgress, nextProps, renderLanes);
		nextProps = isHydrating ? treeForkCount : 0;
		if (!shouldForceFallback && null !== current && 0 !== (current.flags & 128)) a: for (current = workInProgress.child; null !== current;) {
			if (13 === current.tag) null !== current.memoizedState && scheduleSuspenseWorkOnFiber(current, renderLanes, workInProgress);
			else if (19 === current.tag) scheduleSuspenseWorkOnFiber(current, renderLanes, workInProgress);
			else if (null !== current.child) {
				current.child.return = current;
				current = current.child;
				continue;
			}
			if (current === workInProgress) break a;
			for (; null === current.sibling;) {
				if (null === current.return || current.return === workInProgress) break a;
				current = current.return;
			}
			current.sibling.return = current.return;
			current = current.sibling;
		}
		switch (revealOrder) {
			case "backwards":
				renderLanes = findLastContentRow(workInProgress.child);
				null === renderLanes ? (revealOrder = workInProgress.child, workInProgress.child = null) : (revealOrder = renderLanes.sibling, renderLanes.sibling = null, reverseChildren(workInProgress));
				initSuspenseListRenderState(workInProgress, !0, revealOrder, null, tailMode, nextProps);
				break;
			case "unstable_legacy-backwards":
				renderLanes = null;
				revealOrder = workInProgress.child;
				for (workInProgress.child = null; null !== revealOrder;) {
					current = revealOrder.alternate;
					if (null !== current && null === findFirstSuspended(current)) {
						workInProgress.child = revealOrder;
						break;
					}
					current = revealOrder.sibling;
					revealOrder.sibling = renderLanes;
					renderLanes = revealOrder;
					revealOrder = current;
				}
				initSuspenseListRenderState(workInProgress, !0, renderLanes, null, tailMode, nextProps);
				break;
			case "together":
				initSuspenseListRenderState(workInProgress, !1, null, null, void 0, nextProps);
				break;
			case "independent":
				workInProgress.memoizedState = null;
				break;
			default: renderLanes = findLastContentRow(workInProgress.child), null === renderLanes ? (revealOrder = workInProgress.child, workInProgress.child = null) : (revealOrder = renderLanes.sibling, renderLanes.sibling = null), initSuspenseListRenderState(workInProgress, !1, revealOrder, renderLanes, tailMode, nextProps);
		}
		return workInProgress.child;
	}
	function updateContextProvider(current, workInProgress, renderLanes) {
		var newProps = workInProgress.pendingProps;
		pushProvider(workInProgress, workInProgress.type, newProps.value);
		reconcileChildren(current, workInProgress, newProps.children, renderLanes);
		return workInProgress.child;
	}
	function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
		null !== current && (workInProgress.dependencies = current.dependencies);
		workInProgressRootSkippedLanes |= workInProgress.lanes;
		if (0 === (renderLanes & workInProgress.childLanes)) if (null !== current) {
			if (propagateParentContextChanges(current, workInProgress, renderLanes, !1), 0 === (renderLanes & workInProgress.childLanes)) return null;
		} else return null;
		if (null !== current && workInProgress.child !== current.child) throw Error(formatProdErrorMessage(153));
		if (null !== workInProgress.child) {
			current = workInProgress.child;
			renderLanes = createWorkInProgress(current, current.pendingProps);
			workInProgress.child = renderLanes;
			for (renderLanes.return = workInProgress; null !== current.sibling;) current = current.sibling, renderLanes = renderLanes.sibling = createWorkInProgress(current, current.pendingProps), renderLanes.return = workInProgress;
			renderLanes.sibling = null;
		}
		return workInProgress.child;
	}
	function checkScheduledUpdateOrContext(current, renderLanes) {
		if (0 !== (current.lanes & renderLanes)) return !0;
		current = current.dependencies;
		return null !== current && checkIfContextChanged(current) ? !0 : !1;
	}
	function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes) {
		switch (workInProgress.tag) {
			case 3:
				pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
				pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
				resetHydrationState();
				break;
			case 27:
			case 5:
				pushHostContext(workInProgress);
				break;
			case 4:
				pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
				break;
			case 10:
				pushProvider(workInProgress, workInProgress.type, workInProgress.memoizedProps.value);
				break;
			case 31:
				if (null !== workInProgress.memoizedState) return workInProgress.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress), null;
				break;
			case 13:
				var state$108 = workInProgress.memoizedState;
				if (null !== state$108) {
					if (null !== state$108.dehydrated) return pushPrimaryTreeSuspenseHandler(workInProgress), workInProgress.flags |= 128, null;
					state$108 = propagateParentContextChanges(current, workInProgress, renderLanes, !1);
					var primaryChildLanes = workInProgress.child.childLanes;
					if (state$108 || 0 !== (renderLanes & primaryChildLanes)) return updateSuspenseComponent(current, workInProgress, renderLanes);
					pushPrimaryTreeSuspenseHandler(workInProgress);
					current = bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
					return null !== current ? current.sibling : null;
				}
				pushPrimaryTreeSuspenseHandler(workInProgress);
				break;
			case 19:
				if (workInProgress.flags & 128) return updateSuspenseListComponent(current, workInProgress, renderLanes);
				primaryChildLanes = 0 !== (current.flags & 128);
				state$108 = 0 !== (renderLanes & workInProgress.childLanes);
				state$108 || (propagateParentContextChanges(current, workInProgress, renderLanes, !1), state$108 = 0 !== (renderLanes & workInProgress.childLanes));
				if (primaryChildLanes) {
					if (state$108) return updateSuspenseListComponent(current, workInProgress, renderLanes);
					workInProgress.flags |= 128;
				}
				primaryChildLanes = workInProgress.memoizedState;
				null !== primaryChildLanes && (primaryChildLanes.rendering = null, primaryChildLanes.tail = null, primaryChildLanes.lastEffect = null);
				pushSuspenseListContext(workInProgress, suspenseStackCursor.current);
				if (state$108) break;
				else return null;
			case 22: return workInProgress.lanes = 0, updateOffscreenComponent(current, workInProgress, renderLanes, workInProgress.pendingProps);
			case 24: pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
		}
		return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
	}
	function beginWork(current, workInProgress, renderLanes) {
		if (null !== current) if (current.memoizedProps !== workInProgress.pendingProps) didReceiveUpdate = !0;
		else {
			if (!checkScheduledUpdateOrContext(current, renderLanes) && 0 === (workInProgress.flags & 128)) return didReceiveUpdate = !1, attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes);
			didReceiveUpdate = 0 !== (current.flags & 131072) ? !0 : !1;
		}
		else didReceiveUpdate = !1, isHydrating && 0 !== (workInProgress.flags & 1048576) && pushTreeId(workInProgress, treeForkCount, workInProgress.index);
		workInProgress.lanes = 0;
		switch (workInProgress.tag) {
			case 16:
				a: {
					var props = workInProgress.pendingProps;
					current = resolveLazy(workInProgress.elementType);
					workInProgress.type = current;
					if ("function" === typeof current) shouldConstruct(current) ? (props = resolveClassComponentProps(current, props), workInProgress.tag = 1, workInProgress = updateClassComponent(null, workInProgress, current, props, renderLanes)) : (workInProgress.tag = 0, workInProgress = updateFunctionComponent(null, workInProgress, current, props, renderLanes));
					else {
						if (void 0 !== current && null !== current) {
							var $$typeof = current.$$typeof;
							if ($$typeof === REACT_FORWARD_REF_TYPE) {
								workInProgress.tag = 11;
								workInProgress = updateForwardRef(null, workInProgress, current, props, renderLanes);
								break a;
							} else if ($$typeof === REACT_MEMO_TYPE) {
								workInProgress.tag = 14;
								workInProgress = updateMemoComponent(null, workInProgress, current, props, renderLanes);
								break a;
							} else if ($$typeof === REACT_CONTEXT_TYPE) {
								workInProgress.tag = 10;
								workInProgress.type = current;
								workInProgress = updateContextProvider(null, workInProgress, renderLanes);
								break a;
							}
						}
						workInProgress = getComponentNameFromType(current) || current;
						throw Error(formatProdErrorMessage(306, workInProgress, ""));
					}
				}
				return workInProgress;
			case 0: return updateFunctionComponent(current, workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes);
			case 1: return props = workInProgress.type, $$typeof = resolveClassComponentProps(props, workInProgress.pendingProps), updateClassComponent(current, workInProgress, props, $$typeof, renderLanes);
			case 3:
				a: {
					pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
					if (null === current) throw Error(formatProdErrorMessage(387));
					props = workInProgress.pendingProps;
					var prevState = workInProgress.memoizedState;
					$$typeof = prevState.element;
					cloneUpdateQueue(current, workInProgress);
					processUpdateQueue(workInProgress, props, null, renderLanes);
					var nextState = workInProgress.memoizedState;
					props = nextState.cache;
					pushProvider(workInProgress, CacheContext, props);
					props !== prevState.cache && propagateContextChanges(workInProgress, [CacheContext], renderLanes, !0);
					suspendIfUpdateReadFromEntangledAsyncAction();
					props = nextState.element;
					if (prevState.isDehydrated) if (prevState = {
						element: props,
						isDehydrated: !1,
						cache: nextState.cache
					}, workInProgress.updateQueue.baseState = prevState, workInProgress.memoizedState = prevState, workInProgress.flags & 256) {
						workInProgress = mountHostRootWithoutHydrating(current, workInProgress, props, renderLanes);
						break a;
					} else if (props !== $$typeof) {
						$$typeof = createCapturedValueAtFiber(Error(formatProdErrorMessage(424)), workInProgress);
						queueHydrationError($$typeof);
						workInProgress = mountHostRootWithoutHydrating(current, workInProgress, props, renderLanes);
						break a;
					} else {
						current = workInProgress.stateNode.containerInfo;
						switch (current.nodeType) {
							case 9:
								current = current.body;
								break;
							default: current = "HTML" === current.nodeName ? current.ownerDocument.body : current;
						}
						nextHydratableInstance = getNextHydratable(current.firstChild);
						hydrationParentFiber = workInProgress;
						isHydrating = !0;
						hydrationErrors = null;
						rootOrSingletonContext = !0;
						renderLanes = mountChildFibers(workInProgress, null, props, renderLanes);
						for (workInProgress.child = renderLanes; renderLanes;) renderLanes.flags = renderLanes.flags & -3 | 134221824, renderLanes = renderLanes.sibling;
					}
					else {
						resetHydrationState();
						if (props === $$typeof) {
							workInProgress = bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
							break a;
						}
						reconcileChildren(current, workInProgress, props, renderLanes);
					}
					workInProgress = workInProgress.child;
				}
				return workInProgress;
			case 26: return markRef(current, workInProgress), null === current ? (renderLanes = getResource(workInProgress.type, null, workInProgress.pendingProps, null)) ? workInProgress.memoizedState = renderLanes : isHydrating || (workInProgress.stateNode = createHoistableInstance(workInProgress.type, workInProgress.pendingProps, rootInstanceStackCursor.current, workInProgress)) : workInProgress.memoizedState = getResource(workInProgress.type, current.memoizedProps, workInProgress.pendingProps, current.memoizedState), null;
			case 27: return pushHostContext(workInProgress), null === current && isHydrating && (props = workInProgress.stateNode = resolveSingletonInstance(workInProgress.type, workInProgress.pendingProps, rootInstanceStackCursor.current), hydrationParentFiber = workInProgress, rootOrSingletonContext = !0, $$typeof = nextHydratableInstance, isSingletonScope(workInProgress.type) ? (previousHydratableOnEnteringScopedSingleton = $$typeof, nextHydratableInstance = getNextHydratable(props.firstChild)) : nextHydratableInstance = $$typeof), reconcileChildren(current, workInProgress, workInProgress.pendingProps.children, renderLanes), markRef(current, workInProgress), null === current && (workInProgress.flags |= 4194304), workInProgress.child;
			case 5:
				if (null === current && isHydrating) {
					if ($$typeof = props = nextHydratableInstance) props = canHydrateInstance(props, workInProgress.type, workInProgress.pendingProps, rootOrSingletonContext), null !== props ? (workInProgress.stateNode = props, hydrationParentFiber = workInProgress, nextHydratableInstance = getNextHydratable(props.firstChild), rootOrSingletonContext = !1, $$typeof = !0) : $$typeof = !1;
					$$typeof || throwOnHydrationMismatch(workInProgress);
				}
				pushHostContext(workInProgress);
				$$typeof = workInProgress.type;
				prevState = workInProgress.pendingProps;
				nextState = null !== current ? current.memoizedProps : null;
				props = prevState.children;
				shouldSetTextContent($$typeof, prevState) ? props = null : null !== nextState && shouldSetTextContent($$typeof, nextState) && (workInProgress.flags |= 32);
				null !== workInProgress.memoizedState && ($$typeof = renderWithHooks(current, workInProgress, TransitionAwareHostComponent, null, null, renderLanes), HostTransitionContext._currentValue = $$typeof);
				markRef(current, workInProgress);
				reconcileChildren(current, workInProgress, props, renderLanes);
				return workInProgress.child;
			case 6:
				if (null === current && isHydrating) {
					if (current = renderLanes = nextHydratableInstance) renderLanes = canHydrateTextInstance(renderLanes, workInProgress.pendingProps, rootOrSingletonContext), null !== renderLanes ? (workInProgress.stateNode = renderLanes, hydrationParentFiber = workInProgress, nextHydratableInstance = null, current = !0) : current = !1;
					current || throwOnHydrationMismatch(workInProgress);
				}
				return null;
			case 13: return updateSuspenseComponent(current, workInProgress, renderLanes);
			case 4: return pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo), props = workInProgress.pendingProps, null === current ? workInProgress.child = reconcileChildFibers(workInProgress, null, props, renderLanes) : reconcileChildren(current, workInProgress, props, renderLanes), workInProgress.child;
			case 11: return updateForwardRef(current, workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes);
			case 7: return props = workInProgress.pendingProps, markRef(current, workInProgress), reconcileChildren(current, workInProgress, props, renderLanes), workInProgress.child;
			case 8: return reconcileChildren(current, workInProgress, workInProgress.pendingProps.children, renderLanes), workInProgress.child;
			case 12: return reconcileChildren(current, workInProgress, workInProgress.pendingProps.children, renderLanes), workInProgress.child;
			case 10: return updateContextProvider(current, workInProgress, renderLanes);
			case 9: return $$typeof = workInProgress.type._context, props = workInProgress.pendingProps.children, prepareToReadContext(workInProgress), $$typeof = readContext($$typeof), props = props($$typeof), workInProgress.flags |= 1, reconcileChildren(current, workInProgress, props, renderLanes), workInProgress.child;
			case 14: return updateMemoComponent(current, workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes);
			case 15: return updateSimpleMemoComponent(current, workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes);
			case 19: return updateSuspenseListComponent(current, workInProgress, renderLanes);
			case 31: return updateActivityComponent(current, workInProgress, renderLanes);
			case 22: return updateOffscreenComponent(current, workInProgress, renderLanes, workInProgress.pendingProps);
			case 24: return prepareToReadContext(workInProgress), props = readContext(CacheContext), null === current ? ($$typeof = peekCacheFromPool(), null === $$typeof && ($$typeof = workInProgressRoot, prevState = createCache(), $$typeof.pooledCache = prevState, prevState.refCount++, null !== prevState && ($$typeof.pooledCacheLanes |= renderLanes), $$typeof = prevState), workInProgress.memoizedState = {
				parent: props,
				cache: $$typeof
			}, initializeUpdateQueue(workInProgress), pushProvider(workInProgress, CacheContext, $$typeof)) : (0 !== (current.lanes & renderLanes) && (cloneUpdateQueue(current, workInProgress), processUpdateQueue(workInProgress, null, null, renderLanes), suspendIfUpdateReadFromEntangledAsyncAction()), $$typeof = current.memoizedState, prevState = workInProgress.memoizedState, $$typeof.parent !== props ? ($$typeof = {
				parent: props,
				cache: props
			}, workInProgress.memoizedState = $$typeof, 0 === workInProgress.lanes && (workInProgress.memoizedState = workInProgress.updateQueue.baseState = $$typeof), pushProvider(workInProgress, CacheContext, props)) : (props = prevState.cache, pushProvider(workInProgress, CacheContext, props), props !== $$typeof.cache && propagateContextChanges(workInProgress, [CacheContext], renderLanes, !0))), reconcileChildren(current, workInProgress, workInProgress.pendingProps.children, renderLanes), workInProgress.child;
			case 30: return null === workInProgress.stateNode && (workInProgress.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), props = workInProgress.pendingProps, null != props.name && "auto" !== props.name ? workInProgress.flags |= null === current ? 18882560 : 18874368 : isHydrating && pushMaterializedTreeId(workInProgress), null !== current && current.memoizedProps.name !== props.name ? workInProgress.flags |= 4194816 : markRef(current, workInProgress), reconcileChildren(current, workInProgress, props.children, renderLanes), workInProgress.child;
			case 29: throw workInProgress.pendingProps;
		}
		throw Error(formatProdErrorMessage(156, workInProgress.tag));
	}
	function markUpdate(workInProgress) {
		workInProgress.flags |= 4;
	}
	function preloadInstanceAndSuspendIfNeeded(workInProgress, type, oldProps, newProps, renderLanes) {
		var JSCompiler_temp;
		if (JSCompiler_temp = 0 !== (workInProgress.mode & 32)) JSCompiler_temp = null === oldProps ? maySuspendCommit(type, newProps) : maySuspendCommit(type, newProps) && (newProps.src !== oldProps.src || newProps.srcSet !== oldProps.srcSet);
		if (JSCompiler_temp) {
			if (workInProgress.flags |= 16777216, (renderLanes & 335544128) === renderLanes) if (workInProgress.stateNode.complete) workInProgress.flags |= 8192;
			else if (shouldRemainOnPreviousScreen()) workInProgress.flags |= 8192;
			else throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
		} else workInProgress.flags &= -16777217;
	}
	function preloadResourceAndSuspendIfNeeded(workInProgress, resource) {
		if ("stylesheet" !== resource.type || 0 !== (resource.state.loading & 4)) workInProgress.flags &= -16777217;
		else if (workInProgress.flags |= 16777216, !preloadResource(resource)) if (shouldRemainOnPreviousScreen()) workInProgress.flags |= 8192;
		else throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
	}
	function scheduleRetryEffect(workInProgress, retryQueue) {
		null !== retryQueue && (workInProgress.flags |= 4);
		workInProgress.flags & 16384 && (retryQueue = 22 !== workInProgress.tag ? claimNextRetryLane() : 536870912, workInProgress.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
	}
	function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
		if (!isHydrating) switch (renderState.tailMode) {
			case "visible": break;
			case "collapsed":
				for (var tailNode = renderState.tail, lastTailNode = null; null !== tailNode;) null !== tailNode.alternate && (lastTailNode = tailNode), tailNode = tailNode.sibling;
				null === lastTailNode ? hasRenderedATailFallback || null === renderState.tail ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode.sibling = null;
				break;
			default:
				hasRenderedATailFallback = renderState.tail;
				for (tailNode = null; null !== hasRenderedATailFallback;) null !== hasRenderedATailFallback.alternate && (tailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
				null === tailNode ? renderState.tail = null : tailNode.sibling = null;
		}
	}
	function bubbleProperties(completedWork) {
		var didBailout = null !== completedWork.alternate && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
		if (didBailout) for (var child$113 = completedWork.child; null !== child$113;) newChildLanes |= child$113.lanes | child$113.childLanes, subtreeFlags |= child$113.subtreeFlags & 1206910976, subtreeFlags |= child$113.flags & 1206910976, child$113.return = completedWork, child$113 = child$113.sibling;
		else for (child$113 = completedWork.child; null !== child$113;) newChildLanes |= child$113.lanes | child$113.childLanes, subtreeFlags |= child$113.subtreeFlags, subtreeFlags |= child$113.flags, child$113.return = completedWork, child$113 = child$113.sibling;
		completedWork.subtreeFlags |= subtreeFlags;
		completedWork.childLanes = newChildLanes;
		return didBailout;
	}
	function completeWork(current, workInProgress, renderLanes) {
		var newProps = workInProgress.pendingProps;
		popTreeContext(workInProgress);
		switch (workInProgress.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return bubbleProperties(workInProgress), null;
			case 1: return bubbleProperties(workInProgress), null;
			case 3:
				renderLanes = workInProgress.stateNode;
				newProps = null;
				null !== current && (newProps = current.memoizedState.cache);
				workInProgress.memoizedState.cache !== newProps && (workInProgress.flags |= 2048);
				popProvider(CacheContext);
				popHostContainer();
				renderLanes.pendingContext && (renderLanes.context = renderLanes.pendingContext, renderLanes.pendingContext = null);
				if (null === current || null === current.child) popHydrationState(workInProgress) ? markUpdate(workInProgress) : null === current || current.memoizedState.isDehydrated && 0 === (workInProgress.flags & 256) || (workInProgress.flags |= 1024, upgradeHydrationErrorsToRecoverable());
				bubbleProperties(workInProgress);
				return null;
			case 26:
				var type = workInProgress.type, nextResource = workInProgress.memoizedState;
				null === current ? (markUpdate(workInProgress), null !== nextResource ? (bubbleProperties(workInProgress), preloadResourceAndSuspendIfNeeded(workInProgress, nextResource)) : (bubbleProperties(workInProgress), preloadInstanceAndSuspendIfNeeded(workInProgress, type, null, newProps, renderLanes))) : nextResource ? nextResource !== current.memoizedState ? (markUpdate(workInProgress), bubbleProperties(workInProgress), preloadResourceAndSuspendIfNeeded(workInProgress, nextResource)) : (bubbleProperties(workInProgress), workInProgress.flags &= -16777217) : (current = current.memoizedProps, current !== newProps && markUpdate(workInProgress), bubbleProperties(workInProgress), preloadInstanceAndSuspendIfNeeded(workInProgress, type, current, newProps, renderLanes));
				return null;
			case 27:
				popHostContext(workInProgress);
				renderLanes = rootInstanceStackCursor.current;
				type = workInProgress.type;
				if (null !== current && null != workInProgress.stateNode) current.memoizedProps !== newProps && markUpdate(workInProgress);
				else {
					if (!newProps) {
						if (null === workInProgress.stateNode) throw Error(formatProdErrorMessage(166));
						bubbleProperties(workInProgress);
						workInProgress.subtreeFlags &= -33554433;
						return null;
					}
					current = contextStackCursor.current;
					popHydrationState(workInProgress) ? prepareToHydrateHostInstance(workInProgress, current) : (current = resolveSingletonInstance(type, newProps, renderLanes), workInProgress.stateNode = current, markUpdate(workInProgress));
				}
				bubbleProperties(workInProgress);
				workInProgress.subtreeFlags &= -33554433;
				return null;
			case 5:
				popHostContext(workInProgress);
				type = workInProgress.type;
				if (null !== current && null != workInProgress.stateNode) current.memoizedProps !== newProps && markUpdate(workInProgress);
				else {
					if (!newProps) {
						if (null === workInProgress.stateNode) throw Error(formatProdErrorMessage(166));
						bubbleProperties(workInProgress);
						workInProgress.subtreeFlags &= -33554433;
						return null;
					}
					nextResource = contextStackCursor.current;
					if (popHydrationState(workInProgress)) prepareToHydrateHostInstance(workInProgress, nextResource);
					else {
						var ownerDocument = getOwnerDocumentFromRootContainer(rootInstanceStackCursor.current);
						switch (nextResource) {
							case 1:
								nextResource = ownerDocument.createElementNS("http://www.w3.org/2000/svg", type);
								break;
							case 2:
								nextResource = ownerDocument.createElementNS("http://www.w3.org/1998/Math/MathML", type);
								break;
							default: switch (type) {
								case "svg":
									nextResource = ownerDocument.createElementNS("http://www.w3.org/2000/svg", type);
									break;
								case "math":
									nextResource = ownerDocument.createElementNS("http://www.w3.org/1998/Math/MathML", type);
									break;
								case "script":
									nextResource = ownerDocument.createElement("div");
									nextResource.innerHTML = "<script><\/script>";
									nextResource = nextResource.removeChild(nextResource.firstChild);
									break;
								case "select":
									nextResource = "string" === typeof newProps.is ? ownerDocument.createElement("select", { is: newProps.is }) : ownerDocument.createElement("select");
									newProps.multiple ? nextResource.multiple = !0 : newProps.size && (nextResource.size = newProps.size);
									break;
								default: nextResource = "string" === typeof newProps.is ? ownerDocument.createElement(type, { is: newProps.is }) : ownerDocument.createElement(type);
							}
						}
						nextResource[internalInstanceKey] = workInProgress;
						nextResource[internalPropsKey] = newProps;
						a: for (ownerDocument = workInProgress.child; null !== ownerDocument;) {
							if (5 === ownerDocument.tag || 6 === ownerDocument.tag) nextResource.appendChild(ownerDocument.stateNode);
							else if (4 !== ownerDocument.tag && 27 !== ownerDocument.tag && null !== ownerDocument.child) {
								ownerDocument.child.return = ownerDocument;
								ownerDocument = ownerDocument.child;
								continue;
							}
							if (ownerDocument === workInProgress) break a;
							for (; null === ownerDocument.sibling;) {
								if (null === ownerDocument.return || ownerDocument.return === workInProgress) break a;
								ownerDocument = ownerDocument.return;
							}
							ownerDocument.sibling.return = ownerDocument.return;
							ownerDocument = ownerDocument.sibling;
						}
						workInProgress.stateNode = nextResource;
						a: switch (setInitialProperties(nextResource, type, newProps), type) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								newProps = !!newProps.autoFocus;
								break a;
							case "img":
								newProps = !0;
								break a;
							default: newProps = !1;
						}
						newProps && markUpdate(workInProgress);
					}
				}
				bubbleProperties(workInProgress);
				workInProgress.subtreeFlags &= -33554433;
				preloadInstanceAndSuspendIfNeeded(workInProgress, workInProgress.type, null === current ? null : current.memoizedProps, workInProgress.pendingProps, renderLanes);
				return null;
			case 6:
				if (current && null != workInProgress.stateNode) current.memoizedProps !== newProps && markUpdate(workInProgress);
				else {
					if ("string" !== typeof newProps && null === workInProgress.stateNode) throw Error(formatProdErrorMessage(166));
					current = rootInstanceStackCursor.current;
					if (popHydrationState(workInProgress)) {
						current = workInProgress.stateNode;
						renderLanes = workInProgress.memoizedProps;
						newProps = null;
						type = hydrationParentFiber;
						if (null !== type) switch (type.tag) {
							case 27:
							case 5: newProps = type.memoizedProps;
						}
						current[internalInstanceKey] = workInProgress;
						current = current.nodeValue === renderLanes || null !== newProps && !0 === newProps.suppressHydrationWarning || checkForUnmatchedText(current.nodeValue, renderLanes) ? !0 : !1;
						current || throwOnHydrationMismatch(workInProgress, !0);
					} else current = getOwnerDocumentFromRootContainer(current).createTextNode(newProps), current[internalInstanceKey] = workInProgress, workInProgress.stateNode = current;
				}
				bubbleProperties(workInProgress);
				return null;
			case 31:
				renderLanes = workInProgress.memoizedState;
				if (null === current || null !== current.memoizedState) {
					newProps = popHydrationState(workInProgress);
					if (null !== renderLanes) {
						if (null === current) {
							if (!newProps) throw Error(formatProdErrorMessage(318));
							current = workInProgress.memoizedState;
							current = null !== current ? current.dehydrated : null;
							if (!current) throw Error(formatProdErrorMessage(557));
							current[internalInstanceKey] = workInProgress;
						} else resetHydrationState(), 0 === (workInProgress.flags & 128) && (workInProgress.memoizedState = null), workInProgress.flags |= 4;
						bubbleProperties(workInProgress);
						current = !1;
					} else renderLanes = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = renderLanes), current = !0;
					if (!current) {
						if (workInProgress.flags & 256) return popSuspenseHandler(workInProgress), workInProgress;
						popSuspenseHandler(workInProgress);
						return null;
					}
					if (0 !== (workInProgress.flags & 128)) throw Error(formatProdErrorMessage(558));
				}
				bubbleProperties(workInProgress);
				return null;
			case 13:
				newProps = workInProgress.memoizedState;
				if (null === current || null !== current.memoizedState && null !== current.memoizedState.dehydrated) {
					type = popHydrationState(workInProgress);
					if (null !== newProps && null !== newProps.dehydrated) {
						if (null === current) {
							if (!type) throw Error(formatProdErrorMessage(318));
							type = workInProgress.memoizedState;
							type = null !== type ? type.dehydrated : null;
							if (!type) throw Error(formatProdErrorMessage(317));
							type[internalInstanceKey] = workInProgress;
						} else resetHydrationState(), 0 === (workInProgress.flags & 128) && (workInProgress.memoizedState = null), workInProgress.flags |= 4;
						bubbleProperties(workInProgress);
						type = !1;
					} else type = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = type), type = !0;
					if (!type) {
						if (workInProgress.flags & 256) return popSuspenseHandler(workInProgress), workInProgress;
						popSuspenseHandler(workInProgress);
						return null;
					}
				}
				popSuspenseHandler(workInProgress);
				if (0 !== (workInProgress.flags & 128)) return workInProgress.lanes = renderLanes, workInProgress;
				renderLanes = null !== newProps;
				current = null !== current && null !== current.memoizedState;
				renderLanes && (newProps = workInProgress.child, type = null, null !== newProps.alternate && null !== newProps.alternate.memoizedState && null !== newProps.alternate.memoizedState.cachePool && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, null !== newProps.memoizedState && null !== newProps.memoizedState.cachePool && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048));
				renderLanes !== current && renderLanes && (workInProgress.child.flags |= 8192);
				scheduleRetryEffect(workInProgress, workInProgress.updateQueue);
				bubbleProperties(workInProgress);
				return null;
			case 4: return popHostContainer(), null === current && listenToAllSupportedEvents(workInProgress.stateNode.containerInfo), workInProgress.flags |= 67108864, bubbleProperties(workInProgress), null;
			case 10: return popProvider(workInProgress.type), bubbleProperties(workInProgress), null;
			case 19:
				popSuspenseListContext(workInProgress);
				newProps = workInProgress.memoizedState;
				if (null === newProps) return bubbleProperties(workInProgress), null;
				type = 0 !== (workInProgress.flags & 128);
				nextResource = newProps.rendering;
				if (null === nextResource) if (type) cutOffTailIfNeeded(newProps, !1);
				else {
					if (0 !== workInProgressRootExitStatus || null !== current && 0 !== (current.flags & 128)) for (current = workInProgress.child; null !== current;) {
						nextResource = findFirstSuspended(current);
						if (null !== nextResource) {
							workInProgress.flags |= 128;
							cutOffTailIfNeeded(newProps, !1);
							current = nextResource.updateQueue;
							workInProgress.updateQueue = current;
							scheduleRetryEffect(workInProgress, current);
							workInProgress.subtreeFlags = 0;
							current = renderLanes;
							for (renderLanes = workInProgress.child; null !== renderLanes;) resetWorkInProgress(renderLanes, current), renderLanes = renderLanes.sibling;
							pushSuspenseListContext(workInProgress, suspenseStackCursor.current & 1 | 2);
							isHydrating && pushTreeFork(workInProgress, newProps.treeForkCount);
							return workInProgress.child;
						}
						current = current.sibling;
					}
					null !== newProps.tail && now() > workInProgressRootRenderTargetTime && (workInProgress.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress.lanes = 4194304);
				}
				else {
					if (!type) if (current = findFirstSuspended(nextResource), null !== current) {
						if (workInProgress.flags |= 128, type = !0, current = current.updateQueue, workInProgress.updateQueue = current, scheduleRetryEffect(workInProgress, current), cutOffTailIfNeeded(newProps, !0), null === newProps.tail && "collapsed" !== newProps.tailMode && "visible" !== newProps.tailMode && !nextResource.alternate && !isHydrating) return bubbleProperties(workInProgress), null;
					} else 2 * now() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && 536870912 !== renderLanes && (workInProgress.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress.lanes = 4194304);
					newProps.isBackwards ? (nextResource.sibling = workInProgress.child, workInProgress.child = nextResource) : (current = newProps.last, null !== current ? current.sibling = nextResource : workInProgress.child = nextResource, newProps.last = nextResource);
				}
				if (null !== newProps.tail) {
					current = newProps.tail;
					a: {
						for (renderLanes = current; null !== renderLanes;) {
							if (null !== renderLanes.alternate) {
								renderLanes = !1;
								break a;
							}
							renderLanes = renderLanes.sibling;
						}
						renderLanes = !0;
					}
					newProps.rendering = current;
					newProps.tail = current.sibling;
					newProps.renderingStartTime = now();
					current.sibling = null;
					nextResource = suspenseStackCursor.current;
					nextResource = type ? nextResource & 1 | 2 : nextResource & 1;
					"visible" === newProps.tailMode || "collapsed" === newProps.tailMode || !renderLanes || isHydrating ? pushSuspenseListContext(workInProgress, nextResource) : (renderLanes = nextResource, push(suspenseHandlerStackCursor, workInProgress), push(suspenseStackCursor, renderLanes), null === shellBoundary && (shellBoundary = workInProgress));
					isHydrating && pushTreeFork(workInProgress, newProps.treeForkCount);
					return current;
				}
				bubbleProperties(workInProgress);
				return null;
			case 22:
			case 23: return popSuspenseHandler(workInProgress), popHiddenContext(), newProps = null !== workInProgress.memoizedState, null !== current ? null !== current.memoizedState !== newProps && (workInProgress.flags |= 8192) : newProps && (workInProgress.flags |= 8192), newProps ? 0 !== (renderLanes & 536870912) && 0 === (workInProgress.flags & 128) && (bubbleProperties(workInProgress), workInProgress.subtreeFlags & 6 && (workInProgress.flags |= 8192)) : bubbleProperties(workInProgress), renderLanes = workInProgress.updateQueue, null !== renderLanes && scheduleRetryEffect(workInProgress, renderLanes.retryQueue), renderLanes = null, null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (renderLanes = current.memoizedState.cachePool.pool), newProps = null, null !== workInProgress.memoizedState && null !== workInProgress.memoizedState.cachePool && (newProps = workInProgress.memoizedState.cachePool.pool), newProps !== renderLanes && (workInProgress.flags |= 2048), null !== current && pop(resumedCache), null;
			case 24: return renderLanes = null, null !== current && (renderLanes = current.memoizedState.cache), workInProgress.memoizedState.cache !== renderLanes && (workInProgress.flags |= 2048), popProvider(CacheContext), bubbleProperties(workInProgress), null;
			case 25: return null;
			case 30: return workInProgress.flags |= 33554432, bubbleProperties(workInProgress), null;
		}
		throw Error(formatProdErrorMessage(156, workInProgress.tag));
	}
	function unwindWork(current, workInProgress) {
		popTreeContext(workInProgress);
		switch (workInProgress.tag) {
			case 1: return current = workInProgress.flags, current & 65536 ? (workInProgress.flags = current & -65537 | 128, workInProgress) : null;
			case 3: return popProvider(CacheContext), popHostContainer(), current = workInProgress.flags, 0 !== (current & 65536) && 0 === (current & 128) ? (workInProgress.flags = current & -65537 | 128, workInProgress) : null;
			case 26:
			case 27:
			case 5: return popHostContext(workInProgress), null;
			case 31:
				if (null !== workInProgress.memoizedState) {
					popSuspenseHandler(workInProgress);
					if (null === workInProgress.alternate) throw Error(formatProdErrorMessage(340));
					resetHydrationState();
				}
				current = workInProgress.flags;
				return current & 65536 ? (workInProgress.flags = current & -65537 | 128, workInProgress) : null;
			case 13:
				popSuspenseHandler(workInProgress);
				current = workInProgress.memoizedState;
				if (null !== current && null !== current.dehydrated) {
					if (null === workInProgress.alternate) throw Error(formatProdErrorMessage(340));
					resetHydrationState();
				}
				current = workInProgress.flags;
				return current & 65536 ? (workInProgress.flags = current & -65537 | 128, workInProgress) : null;
			case 19: return popSuspenseListContext(workInProgress), current = workInProgress.flags, current & 65536 ? (workInProgress.flags = current & -65537 | 128, current = workInProgress.memoizedState, null !== current && (current.rendering = null, current.tail = null), workInProgress.flags |= 4, workInProgress) : null;
			case 4: return popHostContainer(), null;
			case 10: return popProvider(workInProgress.type), null;
			case 22:
			case 23: return popSuspenseHandler(workInProgress), popHiddenContext(), null !== current && pop(resumedCache), current = workInProgress.flags, current & 65536 ? (workInProgress.flags = current & -65537 | 128, workInProgress) : null;
			case 24: return popProvider(CacheContext), null;
			case 25: return null;
			default: return null;
		}
	}
	function unwindInterruptedWork(current, interruptedWork) {
		popTreeContext(interruptedWork);
		switch (interruptedWork.tag) {
			case 3:
				popProvider(CacheContext);
				popHostContainer();
				break;
			case 26:
			case 27:
			case 5:
				popHostContext(interruptedWork);
				break;
			case 4:
				popHostContainer();
				break;
			case 31:
				null !== interruptedWork.memoizedState && popSuspenseHandler(interruptedWork);
				break;
			case 13:
				popSuspenseHandler(interruptedWork);
				break;
			case 19:
				popSuspenseListContext(interruptedWork);
				break;
			case 10:
				popProvider(interruptedWork.type);
				break;
			case 22:
			case 23:
				popSuspenseHandler(interruptedWork);
				popHiddenContext();
				null !== current && pop(resumedCache);
				break;
			case 24: popProvider(CacheContext);
		}
	}
	function commitHookEffectListMount(flags, finishedWork) {
		try {
			var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
			if (null !== lastEffect) {
				var firstEffect = lastEffect.next;
				updateQueue = firstEffect;
				do {
					if ((updateQueue.tag & flags) === flags) {
						lastEffect = void 0;
						var create = updateQueue.create, inst = updateQueue.inst;
						lastEffect = create();
						inst.destroy = lastEffect;
					}
					updateQueue = updateQueue.next;
				} while (updateQueue !== firstEffect);
			}
		} catch (error) {
			captureCommitPhaseError(finishedWork, finishedWork.return, error);
		}
	}
	function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor$jscomp$0) {
		try {
			var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
			if (null !== lastEffect) {
				var firstEffect = lastEffect.next;
				updateQueue = firstEffect;
				do {
					if ((updateQueue.tag & flags) === flags) {
						var inst = updateQueue.inst, destroy = inst.destroy;
						if (void 0 !== destroy) {
							inst.destroy = void 0;
							lastEffect = finishedWork;
							var nearestMountedAncestor = nearestMountedAncestor$jscomp$0, destroy_ = destroy;
							try {
								destroy_();
							} catch (error) {
								captureCommitPhaseError(lastEffect, nearestMountedAncestor, error);
							}
						}
					}
					updateQueue = updateQueue.next;
				} while (updateQueue !== firstEffect);
			}
		} catch (error) {
			captureCommitPhaseError(finishedWork, finishedWork.return, error);
		}
	}
	function commitClassCallbacks(finishedWork) {
		var updateQueue = finishedWork.updateQueue;
		if (null !== updateQueue) {
			var instance = finishedWork.stateNode;
			try {
				commitCallbacks(updateQueue, instance);
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
	}
	function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
		instance.props = resolveClassComponentProps(current.type, current.memoizedProps);
		instance.state = current.memoizedState;
		try {
			instance.componentWillUnmount();
		} catch (error) {
			captureCommitPhaseError(current, nearestMountedAncestor, error);
		}
	}
	function safelyAttachRef(current, nearestMountedAncestor) {
		try {
			var ref = current.ref;
			if (null !== ref) {
				switch (current.tag) {
					case 26:
					case 27:
					case 5:
						var instanceToUse = current.stateNode;
						break;
					case 30:
						var instance = current.stateNode, name = getViewTransitionName(current.memoizedProps, instance);
						if (null === instance.ref || instance.ref.name !== name) instance.ref = createViewTransitionInstance(name);
						instanceToUse = instance.ref;
						break;
					case 7:
						if (null === current.stateNode) {
							var fragmentInstance = new FragmentInstance(current);
							traverseVisibleInstancesAndTextInstances(current.child, !1, addFragmentHandleToFiber, fragmentInstance, void 0, void 0);
							current.stateNode = fragmentInstance;
						}
						instanceToUse = current.stateNode;
						break;
					default: instanceToUse = current.stateNode;
				}
				"function" === typeof ref ? current.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
			}
		} catch (error) {
			captureCommitPhaseError(current, nearestMountedAncestor, error);
		}
	}
	function safelyDetachRef(current, nearestMountedAncestor) {
		var ref = current.ref, refCleanup = current.refCleanup;
		if (null !== ref) if ("function" === typeof refCleanup) try {
			refCleanup();
		} catch (error) {
			captureCommitPhaseError(current, nearestMountedAncestor, error);
		} finally {
			current.refCleanup = null, current = current.alternate, null != current && (current.refCleanup = null);
		}
		else if ("function" === typeof ref) try {
			ref(null);
		} catch (error$148) {
			captureCommitPhaseError(current, nearestMountedAncestor, error$148);
		}
		else ref.current = null;
	}
	function commitNewChildToFragmentInstances(fiber, parentFragmentInstances) {
		if ((5 === fiber.tag || 27 === fiber.tag || 6 === fiber.tag) && null === fiber.alternate && null !== parentFragmentInstances) for (var i = 0; i < parentFragmentInstances.length; i++) commitNewChildToFragmentInstance(fiber.stateNode, parentFragmentInstances[i]);
	}
	function commitFragmentInstanceInsertionEffects(fiber) {
		for (var parent = fiber.return; null !== parent;) {
			isFragmentInstanceParent(parent) && commitNewChildToFragmentInstance(fiber.stateNode, parent.stateNode);
			if (isFragmentInstanceHostBoundary(parent)) break;
			parent = parent.return;
		}
	}
	function commitFragmentInstanceDeletionEffects(fiber) {
		for (var parent = fiber.return; null !== parent;) {
			isFragmentInstanceParent(parent) && deleteChildFromFragmentInstance(fiber.stateNode, parent.stateNode);
			if (isFragmentInstanceHostBoundary(parent)) break;
			parent = parent.return;
		}
	}
	function isFragmentInstanceHostBoundary(fiber) {
		return 5 === fiber.tag || 3 === fiber.tag || 27 === fiber.tag;
	}
	function isFragmentInstanceParent(fiber) {
		return fiber && 7 === fiber.tag && null !== fiber.stateNode;
	}
	function commitHostMount(finishedWork) {
		var type = finishedWork.type, props = finishedWork.memoizedProps, instance = finishedWork.stateNode;
		try {
			a: switch (type) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					props.autoFocus && instance.focus();
					break a;
				case "img": props.src ? instance.src = props.src : props.srcSet && (instance.srcset = props.srcSet);
			}
		} catch (error) {
			captureCommitPhaseError(finishedWork, finishedWork.return, error);
		}
	}
	function commitHostUpdate(finishedWork, newProps, oldProps) {
		try {
			var domElement = finishedWork.stateNode;
			updateProperties(domElement, finishedWork.type, oldProps, newProps);
			domElement[internalPropsKey] = newProps;
		} catch (error) {
			captureCommitPhaseError(finishedWork, finishedWork.return, error);
		}
	}
	function isHostParent(fiber) {
		return 5 === fiber.tag || 3 === fiber.tag || 26 === fiber.tag || 27 === fiber.tag && isSingletonScope(fiber.type) || 4 === fiber.tag;
	}
	function getHostSibling(fiber) {
		a: for (;;) {
			for (; null === fiber.sibling;) {
				if (null === fiber.return || isHostParent(fiber.return)) return null;
				fiber = fiber.return;
			}
			fiber.sibling.return = fiber.return;
			for (fiber = fiber.sibling; 5 !== fiber.tag && 6 !== fiber.tag && 18 !== fiber.tag;) {
				if (27 === fiber.tag && isSingletonScope(fiber.type)) continue a;
				if (fiber.flags & 2) continue a;
				if (null === fiber.child || 4 === fiber.tag) continue a;
				else fiber.child.return = fiber, fiber = fiber.child;
			}
			if (!(fiber.flags & 2)) return fiber.stateNode;
		}
	}
	function insertOrAppendPlacementNodeIntoContainer(node, before, parent, parentFragmentInstances) {
		var tag = node.tag;
		if (5 === tag || 6 === tag) tag = node.stateNode, before ? (9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent).insertBefore(tag, before) : (before = 9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent, before.appendChild(tag), parent = parent._reactRootContainer, null !== parent && void 0 !== parent || null !== before.onclick || (before.onclick = noop$1)), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = !0;
		else if (4 !== tag && (27 === tag && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode, before = null)), node = node.child, null !== node)) for (insertOrAppendPlacementNodeIntoContainer(node, before, parent, parentFragmentInstances), node = node.sibling; null !== node;) insertOrAppendPlacementNodeIntoContainer(node, before, parent, parentFragmentInstances), node = node.sibling;
	}
	function insertOrAppendPlacementNode(node, before, parent, parentFragmentInstances) {
		var tag = node.tag;
		if (5 === tag || 6 === tag) tag = node.stateNode, before ? parent.insertBefore(tag, before) : parent.appendChild(tag), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = !0;
		else if (4 !== tag && (27 === tag && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode)), node = node.child, null !== node)) for (insertOrAppendPlacementNode(node, before, parent, parentFragmentInstances), node = node.sibling; null !== node;) insertOrAppendPlacementNode(node, before, parent, parentFragmentInstances), node = node.sibling;
	}
	function commitHostSingletonAcquisition(finishedWork) {
		var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
		try {
			for (var type = finishedWork.type, attributes = singleton.attributes; attributes.length;) singleton.removeAttributeNode(attributes[0]);
			setInitialProperties(singleton, type, props);
			singleton[internalInstanceKey] = finishedWork;
			singleton[internalPropsKey] = props;
		} catch (error) {
			captureCommitPhaseError(finishedWork, finishedWork.return, error);
		}
	}
	var shouldStartViewTransition = !1;
	var appearingViewTransitions = null;
	function trackEnterViewTransitions(placement) {
		if (30 === placement.tag || 0 !== (placement.subtreeFlags & 33554432)) shouldStartViewTransition = !0;
	}
	var viewTransitionCancelableChildren = null;
	function pushViewTransitionCancelableScope() {
		var prevChildren = viewTransitionCancelableChildren;
		viewTransitionCancelableChildren = null;
		return prevChildren;
	}
	var viewTransitionHostInstanceIdx = 0;
	function applyViewTransitionToHostInstances(fiber, name, className, collectMeasurements, stopAtNestedViewTransitions) {
		viewTransitionHostInstanceIdx = 0;
		return applyViewTransitionToHostInstancesRecursive(fiber.child, name, className, collectMeasurements, stopAtNestedViewTransitions);
	}
	function applyViewTransitionToHostInstancesRecursive(child, name, className, collectMeasurements, stopAtNestedViewTransitions) {
		for (var inViewport = !1; null !== child;) {
			if (5 === child.tag) {
				var instance = child.stateNode;
				if (null !== collectMeasurements) {
					var measurement = measureInstance(instance);
					collectMeasurements.push(measurement);
					measurement.view && (inViewport = !0);
				} else inViewport || measureInstance(instance).view && (inViewport = !0);
				shouldStartViewTransition = !0;
				applyViewTransitionName(instance, 0 === viewTransitionHostInstanceIdx ? name : name + "_" + viewTransitionHostInstanceIdx, className);
				viewTransitionHostInstanceIdx++;
			} else if (22 !== child.tag || null === child.memoizedState) 30 === child.tag && stopAtNestedViewTransitions || applyViewTransitionToHostInstancesRecursive(child.child, name, className, collectMeasurements, stopAtNestedViewTransitions) && (inViewport = !0);
			child = child.sibling;
		}
		return inViewport;
	}
	function restoreViewTransitionOnHostInstances(child, stopAtNestedViewTransitions) {
		for (; null !== child;) {
			if (5 === child.tag) restoreViewTransitionName(child.stateNode, child.memoizedProps);
			else if (22 !== child.tag || null === child.memoizedState) 30 === child.tag && stopAtNestedViewTransitions || restoreViewTransitionOnHostInstances(child.child, stopAtNestedViewTransitions);
			child = child.sibling;
		}
	}
	function commitAppearingPairViewTransitions(placement) {
		if (0 !== (placement.subtreeFlags & 18874368)) for (placement = placement.child; null !== placement;) {
			if (22 !== placement.tag || null === placement.memoizedState) {
				if (commitAppearingPairViewTransitions(placement), 30 === placement.tag && 0 !== (placement.flags & 18874368) && placement.stateNode.paired) {
					var props = placement.memoizedProps;
					if (null == props.name || "auto" === props.name) throw Error(formatProdErrorMessage(544));
					var name = props.name;
					props = getViewTransitionClassName(props.default, props.share);
					"none" !== props && (applyViewTransitionToHostInstances(placement, name, props, null, !1) || restoreViewTransitionOnHostInstances(placement.child, !1));
				}
			}
			placement = placement.sibling;
		}
	}
	function commitEnterViewTransitions(placement, gesture) {
		if (30 === placement.tag) {
			var state = placement.stateNode, props = placement.memoizedProps, name = getViewTransitionName(props, state), className = getViewTransitionClassName(props.default, state.paired ? props.share : props.enter);
			"none" !== className ? applyViewTransitionToHostInstances(placement, name, className, null, !1) ? (commitAppearingPairViewTransitions(placement), state.paired || gesture || scheduleViewTransitionEvent(placement, props.onEnter)) : restoreViewTransitionOnHostInstances(placement.child, !1) : commitAppearingPairViewTransitions(placement);
		} else if (0 !== (placement.subtreeFlags & 33554432)) for (placement = placement.child; null !== placement;) commitEnterViewTransitions(placement, gesture), placement = placement.sibling;
		else commitAppearingPairViewTransitions(placement);
	}
	function commitDeletedPairViewTransitions(deletion) {
		if (null !== appearingViewTransitions && 0 !== appearingViewTransitions.size) {
			var pairs = appearingViewTransitions;
			if (0 !== (deletion.subtreeFlags & 18874368)) for (deletion = deletion.child; null !== deletion;) {
				if (22 !== deletion.tag || null === deletion.memoizedState) {
					if (30 === deletion.tag && 0 !== (deletion.flags & 18874368)) {
						var props = deletion.memoizedProps, name = props.name;
						if (null != name && "auto" !== name) {
							var pair = pairs.get(name);
							if (void 0 !== pair) {
								var className = getViewTransitionClassName(props.default, props.share);
								"none" !== className && (applyViewTransitionToHostInstances(deletion, name, className, null, !1) ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, scheduleViewTransitionEvent(deletion, props.onShare)) : restoreViewTransitionOnHostInstances(deletion.child, !1));
								pairs.delete(name);
								if (0 === pairs.size) break;
							}
						}
					}
					commitDeletedPairViewTransitions(deletion);
				}
				deletion = deletion.sibling;
			}
		}
	}
	function commitExitViewTransitions(deletion) {
		if (30 === deletion.tag) {
			var props = deletion.memoizedProps, name = getViewTransitionName(props, deletion.stateNode), pair = null !== appearingViewTransitions ? appearingViewTransitions.get(name) : void 0, className = getViewTransitionClassName(props.default, void 0 !== pair ? props.share : props.exit);
			"none" !== className && (applyViewTransitionToHostInstances(deletion, name, className, null, !1) ? void 0 !== pair ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, appearingViewTransitions.delete(name), scheduleViewTransitionEvent(deletion, props.onShare)) : scheduleViewTransitionEvent(deletion, props.onExit) : restoreViewTransitionOnHostInstances(deletion.child, !1));
			null !== appearingViewTransitions && commitDeletedPairViewTransitions(deletion);
		} else if (0 !== (deletion.subtreeFlags & 33554432)) for (deletion = deletion.child; null !== deletion;) commitExitViewTransitions(deletion), deletion = deletion.sibling;
		else null !== appearingViewTransitions && commitDeletedPairViewTransitions(deletion);
	}
	function commitNestedViewTransitions(changedParent) {
		for (changedParent = changedParent.child; null !== changedParent;) {
			if (30 === changedParent.tag) {
				var props = changedParent.memoizedProps, name = getViewTransitionName(props, changedParent.stateNode);
				props = getViewTransitionClassName(props.default, props.update);
				changedParent.flags &= -5;
				"none" !== props && applyViewTransitionToHostInstances(changedParent, name, props, changedParent.memoizedState = [], !1);
			} else 0 !== (changedParent.subtreeFlags & 33554432) && commitNestedViewTransitions(changedParent);
			changedParent = changedParent.sibling;
		}
	}
	function restorePairedViewTransitions(parent) {
		if (0 !== (parent.subtreeFlags & 18874368)) for (parent = parent.child; null !== parent;) {
			if (22 !== parent.tag || null === parent.memoizedState) {
				if (30 === parent.tag && 0 !== (parent.flags & 18874368)) {
					var instance = parent.stateNode;
					null !== instance.paired && (instance.paired = null, restoreViewTransitionOnHostInstances(parent.child, !1));
				}
				restorePairedViewTransitions(parent);
			}
			parent = parent.sibling;
		}
	}
	function restoreEnterOrExitViewTransitions(fiber) {
		if (30 === fiber.tag) fiber.stateNode.paired = null, restoreViewTransitionOnHostInstances(fiber.child, !1), restorePairedViewTransitions(fiber);
		else if (0 !== (fiber.subtreeFlags & 33554432)) for (fiber = fiber.child; null !== fiber;) restoreEnterOrExitViewTransitions(fiber), fiber = fiber.sibling;
		else restorePairedViewTransitions(fiber);
	}
	function restoreNestedViewTransitions(changedParent) {
		for (changedParent = changedParent.child; null !== changedParent;) 30 === changedParent.tag ? restoreViewTransitionOnHostInstances(changedParent.child, !1) : 0 !== (changedParent.subtreeFlags & 33554432) && restoreNestedViewTransitions(changedParent), changedParent = changedParent.sibling;
	}
	function measureViewTransitionHostInstancesRecursive(parentViewTransition, child, newName, oldName, className, previousMeasurements, stopAtNestedViewTransitions) {
		for (var inViewport = !1; null !== child;) {
			if (5 === child.tag) {
				var instance = child.stateNode;
				if (null !== previousMeasurements && viewTransitionHostInstanceIdx < previousMeasurements.length) {
					var previousMeasurement = previousMeasurements[viewTransitionHostInstanceIdx], nextMeasurement = measureInstance(instance);
					if (previousMeasurement.view || nextMeasurement.view) inViewport = !0;
					var JSCompiler_temp;
					if (JSCompiler_temp = 0 === (parentViewTransition.flags & 4)) if (nextMeasurement.clip) JSCompiler_temp = !0;
					else {
						JSCompiler_temp = previousMeasurement.rect;
						var newRect = nextMeasurement.rect;
						JSCompiler_temp = JSCompiler_temp.y !== newRect.y || JSCompiler_temp.x !== newRect.x || JSCompiler_temp.height !== newRect.height || JSCompiler_temp.width !== newRect.width;
					}
					JSCompiler_temp && (parentViewTransition.flags |= 4);
					nextMeasurement.abs ? nextMeasurement = !previousMeasurement.abs : (previousMeasurement = previousMeasurement.rect, nextMeasurement = nextMeasurement.rect, nextMeasurement = previousMeasurement.height !== nextMeasurement.height || previousMeasurement.width !== nextMeasurement.width);
					nextMeasurement && (parentViewTransition.flags |= 32);
				} else parentViewTransition.flags |= 32;
				0 !== (parentViewTransition.flags & 4) && applyViewTransitionName(instance, 0 === viewTransitionHostInstanceIdx ? newName : newName + "_" + viewTransitionHostInstanceIdx, className);
				inViewport && 0 !== (parentViewTransition.flags & 4) || (null === viewTransitionCancelableChildren && (viewTransitionCancelableChildren = []), viewTransitionCancelableChildren.push(instance, 0 === viewTransitionHostInstanceIdx ? oldName : oldName + "_" + viewTransitionHostInstanceIdx, child.memoizedProps));
				viewTransitionHostInstanceIdx++;
			} else if (22 !== child.tag || null === child.memoizedState) 30 === child.tag && stopAtNestedViewTransitions ? parentViewTransition.flags |= child.flags & 32 : measureViewTransitionHostInstancesRecursive(parentViewTransition, child.child, newName, oldName, className, previousMeasurements, stopAtNestedViewTransitions) && (inViewport = !0);
			child = child.sibling;
		}
		return inViewport;
	}
	function measureNestedViewTransitions(changedParent, gesture) {
		for (changedParent = changedParent.child; null !== changedParent;) {
			if (30 === changedParent.tag) {
				var props = changedParent.memoizedProps, state = changedParent.stateNode, name = getViewTransitionName(props, state), className = getViewTransitionClassName(props.default, props.update);
				if (gesture) {
					state = state.clones;
					var previousMeasurements = null === state ? null : state.map(measureClonedInstance);
				} else previousMeasurements = changedParent.memoizedState, changedParent.memoizedState = null;
				state = changedParent;
				var child = changedParent.child;
				viewTransitionHostInstanceIdx = 0;
				name = measureViewTransitionHostInstancesRecursive(state, child, name, name, className, previousMeasurements, !1);
				0 !== (changedParent.flags & 4) && name && (gesture || scheduleViewTransitionEvent(changedParent, props.onUpdate));
			} else 0 !== (changedParent.subtreeFlags & 33554432) && measureNestedViewTransitions(changedParent, gesture);
			changedParent = changedParent.sibling;
		}
	}
	var offscreenSubtreeIsHidden = !1;
	var offscreenSubtreeWasHidden = !1;
	var offscreenDirectParentIsHidden = !1;
	var needsFormReset = !1;
	var PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set;
	var nextEffect = null;
	var viewTransitionContextChanged = !1;
	var inUpdateViewTransition = !1;
	var rootViewTransitionAffected = !1;
	var rootViewTransitionNameCanceled = !1;
	function commitBeforeMutationEffects(root, firstChild, committedLanes) {
		root = root.containerInfo;
		eventsEnabled = _enabled;
		root = getActiveElementDeep(root);
		if (hasSelectionCapabilities(root)) {
			if ("selectionStart" in root) var JSCompiler_temp = {
				start: root.selectionStart,
				end: root.selectionEnd
			};
			else a: {
				JSCompiler_temp = (JSCompiler_temp = root.ownerDocument) && JSCompiler_temp.defaultView || window;
				var selection = JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
				if (selection && 0 !== selection.rangeCount) {
					JSCompiler_temp = selection.anchorNode;
					var anchorOffset = selection.anchorOffset, focusNode = selection.focusNode;
					selection = selection.focusOffset;
					try {
						JSCompiler_temp.nodeType, focusNode.nodeType;
					} catch (e$21) {
						JSCompiler_temp = null;
						break a;
					}
					var length = 0, start = -1, end = -1, indexWithinAnchor = 0, indexWithinFocus = 0, node = root, parentNode = null;
					b: for (;;) {
						for (var next;;) {
							node !== JSCompiler_temp || 0 !== anchorOffset && 3 !== node.nodeType || (start = length + anchorOffset);
							node !== focusNode || 0 !== selection && 3 !== node.nodeType || (end = length + selection);
							3 === node.nodeType && (length += node.nodeValue.length);
							if (null === (next = node.firstChild)) break;
							parentNode = node;
							node = next;
						}
						for (;;) {
							if (node === root) break b;
							parentNode === JSCompiler_temp && ++indexWithinAnchor === anchorOffset && (start = length);
							parentNode === focusNode && ++indexWithinFocus === selection && (end = length);
							if (null !== (next = node.nextSibling)) break;
							node = parentNode;
							parentNode = node.parentNode;
						}
						node = next;
					}
					JSCompiler_temp = -1 === start || -1 === end ? null : {
						start,
						end
					};
				} else JSCompiler_temp = null;
			}
			JSCompiler_temp = JSCompiler_temp || {
				start: 0,
				end: 0
			};
		} else JSCompiler_temp = null;
		selectionInformation = {
			focusedElem: root,
			selectionRange: JSCompiler_temp
		};
		_enabled = !1;
		committedLanes = (committedLanes & 335544064) === committedLanes;
		nextEffect = firstChild;
		for (firstChild = committedLanes ? 9270 : 1024; null !== nextEffect;) {
			root = nextEffect;
			if (committedLanes && (JSCompiler_temp = root.deletions, null !== JSCompiler_temp)) for (anchorOffset = 0; anchorOffset < JSCompiler_temp.length; anchorOffset++) committedLanes && commitExitViewTransitions(JSCompiler_temp[anchorOffset]);
			if (null === root.alternate && 0 !== (root.flags & 2)) committedLanes && trackEnterViewTransitions(root), commitBeforeMutationEffects_complete(committedLanes);
			else {
				if (22 === root.tag) {
					if (JSCompiler_temp = root.alternate, null !== root.memoizedState) {
						null !== JSCompiler_temp && null === JSCompiler_temp.memoizedState && committedLanes && commitExitViewTransitions(JSCompiler_temp);
						commitBeforeMutationEffects_complete(committedLanes);
						continue;
					} else if (null !== JSCompiler_temp && null !== JSCompiler_temp.memoizedState) {
						committedLanes && trackEnterViewTransitions(root);
						commitBeforeMutationEffects_complete(committedLanes);
						continue;
					}
				}
				JSCompiler_temp = root.child;
				0 !== (root.subtreeFlags & firstChild) && null !== JSCompiler_temp ? (JSCompiler_temp.return = root, nextEffect = JSCompiler_temp) : (committedLanes && commitNestedViewTransitions(root), commitBeforeMutationEffects_complete(committedLanes));
			}
		}
		appearingViewTransitions = null;
	}
	function commitBeforeMutationEffects_complete(isViewTransitionEligible$jscomp$0) {
		for (; null !== nextEffect;) {
			var fiber = nextEffect, isViewTransitionEligible = isViewTransitionEligible$jscomp$0, current = fiber.alternate, flags = fiber.flags;
			switch (fiber.tag) {
				case 0:
				case 11:
				case 15: break;
				case 1:
					if (0 !== (flags & 1024) && null !== current) {
						isViewTransitionEligible = void 0;
						flags = current.memoizedProps;
						current = current.memoizedState;
						var instance = fiber.stateNode;
						try {
							var resolvedPrevProps = resolveClassComponentProps(fiber.type, flags);
							isViewTransitionEligible = instance.getSnapshotBeforeUpdate(resolvedPrevProps, current);
							instance.__reactInternalSnapshotBeforeUpdate = isViewTransitionEligible;
						} catch (error) {
							captureCommitPhaseError(fiber, fiber.return, error);
						}
					}
					break;
				case 3:
					if (0 !== (flags & 1024)) {
						if (current = fiber.stateNode.containerInfo, isViewTransitionEligible = current.nodeType, 9 === isViewTransitionEligible) clearContainerSparingly(current);
						else if (1 === isViewTransitionEligible) switch (current.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								clearContainerSparingly(current);
								break;
							default: current.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				case 30:
					isViewTransitionEligible && null !== current && (isViewTransitionEligible = getViewTransitionName(current.memoizedProps, current.stateNode), flags = fiber.memoizedProps, flags = getViewTransitionClassName(flags.default, flags.update), "none" !== flags && applyViewTransitionToHostInstances(current, isViewTransitionEligible, flags, current.memoizedState = [], !0));
					break;
				default: if (0 !== (flags & 1024)) throw Error(formatProdErrorMessage(163));
			}
			current = fiber.sibling;
			if (null !== current) {
				current.return = fiber.return;
				nextEffect = current;
				break;
			}
			nextEffect = fiber.return;
		}
	}
	function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
		var flags = finishedWork.flags;
		switch (finishedWork.tag) {
			case 0:
			case 11:
			case 15:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				flags & 4 && commitHookEffectListMount(5, finishedWork);
				break;
			case 1:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				if (flags & 4) if (finishedRoot = finishedWork.stateNode, null === current) try {
					finishedRoot.componentDidMount();
				} catch (error) {
					captureCommitPhaseError(finishedWork, finishedWork.return, error);
				}
				else {
					var prevProps = resolveClassComponentProps(finishedWork.type, current.memoizedProps);
					current = current.memoizedState;
					try {
						finishedRoot.componentDidUpdate(prevProps, current, finishedRoot.__reactInternalSnapshotBeforeUpdate);
					} catch (error$146) {
						captureCommitPhaseError(finishedWork, finishedWork.return, error$146);
					}
				}
				flags & 64 && commitClassCallbacks(finishedWork);
				flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
				break;
			case 3:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				if (flags & 64 && (finishedRoot = finishedWork.updateQueue, null !== finishedRoot)) {
					current = null;
					if (null !== finishedWork.child) switch (finishedWork.child.tag) {
						case 27:
						case 5:
							current = finishedWork.child.stateNode;
							break;
						case 1: current = finishedWork.child.stateNode;
					}
					try {
						commitCallbacks(finishedRoot, current);
					} catch (error) {
						captureCommitPhaseError(finishedWork, finishedWork.return, error);
					}
				}
				break;
			case 27: null === current && flags & 4 && commitHostSingletonAcquisition(finishedWork);
			case 26:
			case 5:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				null === current && flags & 4 && commitHostMount(finishedWork);
				flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
				break;
			case 12:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				break;
			case 31:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
				break;
			case 13:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
				flags & 64 && (finishedRoot = finishedWork.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot && (finishedWork = retryDehydratedSuspenseBoundary.bind(null, finishedWork), registerSuspenseInstanceRetry(finishedRoot, finishedWork))));
				break;
			case 22:
				flags = null !== finishedWork.memoizedState || offscreenSubtreeIsHidden;
				if (!flags) {
					var newOffscreenSubtreeWasHidden = null !== current && null !== current.memoizedState || offscreenSubtreeWasHidden;
					current = offscreenSubtreeIsHidden;
					prevProps = offscreenSubtreeWasHidden;
					offscreenSubtreeIsHidden = flags;
					(offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden) && !prevProps ? (flags = 2, 0 !== (finishedWork.subtreeFlags & 8772) && (flags |= 1), recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, flags)) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					offscreenSubtreeIsHidden = current;
					offscreenSubtreeWasHidden = prevProps;
				}
				break;
			case 30:
				recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
				flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
				break;
			case 7: flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
			default: recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
		}
	}
	function hideOrUnhideAllChildren(parentFiber, isHidden) {
		for (parentFiber = parentFiber.child; null !== parentFiber;) hideOrUnhideAllChildrenOnFiber(parentFiber, isHidden), parentFiber = parentFiber.sibling;
	}
	function hideOrUnhideAllChildrenOnFiber(fiber, isHidden) {
		switch (fiber.tag) {
			case 5:
			case 26:
				try {
					var instance = fiber.stateNode;
					if (isHidden) {
						var style = instance.style;
						"function" === typeof style.setProperty ? style.setProperty("display", "none", "important") : style.display = "none";
					} else {
						var instance$jscomp$0 = fiber.stateNode, styleProp = fiber.memoizedProps.style, display = void 0 !== styleProp && null !== styleProp && styleProp.hasOwnProperty("display") ? styleProp.display : null;
						instance$jscomp$0.style.display = null == display || "boolean" === typeof display ? "" : ("" + display).trim();
					}
				} catch (error) {
					captureCommitPhaseError(fiber, fiber.return, error);
				}
				hideOrUnhideNearestPortals(fiber, isHidden);
				break;
			case 6:
				try {
					fiber.stateNode.nodeValue = isHidden ? "" : fiber.memoizedProps, viewTransitionMutationContext = !0;
				} catch (error) {
					captureCommitPhaseError(fiber, fiber.return, error);
				}
				break;
			case 18:
				try {
					var instance$jscomp$1 = fiber.stateNode;
					isHidden ? hideOrUnhideDehydratedBoundary(instance$jscomp$1, !0) : hideOrUnhideDehydratedBoundary(fiber.stateNode, !1);
				} catch (error) {
					captureCommitPhaseError(fiber, fiber.return, error);
				}
				break;
			case 22:
			case 23:
				null === fiber.memoizedState && hideOrUnhideAllChildren(fiber, isHidden);
				break;
			default: hideOrUnhideAllChildren(fiber, isHidden);
		}
	}
	function hideOrUnhideNearestPortals(parentFiber, isHidden$jscomp$0) {
		if (parentFiber.subtreeFlags & 67108864) for (parentFiber = parentFiber.child; null !== parentFiber;) {
			a: {
				var fiber = parentFiber, isHidden = isHidden$jscomp$0;
				switch (fiber.tag) {
					case 4:
						hideOrUnhideAllChildrenOnFiber(fiber, isHidden);
						break a;
					case 22:
						null === fiber.memoizedState && hideOrUnhideNearestPortals(fiber, isHidden);
						break a;
					default: hideOrUnhideNearestPortals(fiber, isHidden);
				}
			}
			parentFiber = parentFiber.sibling;
		}
	}
	function detachFiberAfterEffects(fiber) {
		var alternate = fiber.alternate;
		null !== alternate && (fiber.alternate = null, detachFiberAfterEffects(alternate));
		fiber.child = null;
		fiber.deletions = null;
		fiber.sibling = null;
		5 === fiber.tag && (alternate = fiber.stateNode, null !== alternate && detachDeletedInstance(alternate));
		fiber.stateNode = null;
		fiber.return = null;
		fiber.dependencies = null;
		fiber.memoizedProps = null;
		fiber.memoizedState = null;
		fiber.pendingProps = null;
		fiber.stateNode = null;
		fiber.updateQueue = null;
	}
	var hostParent = null;
	var hostParentIsContainer = !1;
	function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
		for (parent = parent.child; null !== parent;) commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent), parent = parent.sibling;
	}
	function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
		if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount) try {
			injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
		} catch (err) {}
		switch (deletedFiber.tag) {
			case 26:
				offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				deletedFiber.memoizedState ? deletedFiber.memoizedState.count-- : deletedFiber.stateNode && !offscreenSubtreeWasHidden && (deletedFiber = deletedFiber.stateNode, deletedFiber.parentNode.removeChild(deletedFiber));
				break;
			case 27:
				offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
				commitFragmentInstanceDeletionEffects(deletedFiber);
				var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
				isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = !1);
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				releaseSingletonInstance(deletedFiber.stateNode, deletedFiber.type, deletedFiber.memoizedProps);
				hostParent = prevHostParent;
				hostParentIsContainer = prevHostParentIsContainer;
				break;
			case 5: offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), commitFragmentInstanceDeletionEffects(deletedFiber);
			case 6:
				6 === deletedFiber.tag && commitFragmentInstanceDeletionEffects(deletedFiber);
				prevHostParent = hostParent;
				prevHostParentIsContainer = hostParentIsContainer;
				hostParent = null;
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				hostParent = prevHostParent;
				hostParentIsContainer = prevHostParentIsContainer;
				if (null !== hostParent) if (hostParentIsContainer) try {
					(9 === hostParent.nodeType ? hostParent.body : "HTML" === hostParent.nodeName ? hostParent.ownerDocument.body : hostParent).removeChild(deletedFiber.stateNode), viewTransitionMutationContext = !0;
				} catch (error) {
					captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
				}
				else try {
					hostParent.removeChild(deletedFiber.stateNode), viewTransitionMutationContext = !0;
				} catch (error) {
					captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
				}
				break;
			case 18:
				null !== hostParent && (hostParentIsContainer ? (finishedRoot = hostParent, clearHydrationBoundary(9 === finishedRoot.nodeType ? finishedRoot.body : "HTML" === finishedRoot.nodeName ? finishedRoot.ownerDocument.body : finishedRoot, deletedFiber.stateNode), retryIfBlockedOn(finishedRoot)) : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
				break;
			case 4:
				prevHostParent = hostParent;
				prevHostParentIsContainer = hostParentIsContainer;
				hostParent = deletedFiber.stateNode.containerInfo;
				hostParentIsContainer = !0;
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				hostParent = prevHostParent;
				hostParentIsContainer = prevHostParentIsContainer;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor);
				offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor);
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				break;
			case 1:
				offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, "function" === typeof prevHostParent.componentWillUnmount && safelyCallComponentWillUnmount(deletedFiber, nearestMountedAncestor, prevHostParent));
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				break;
			case 21:
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				break;
			case 22:
				offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || null !== deletedFiber.memoizedState;
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				offscreenSubtreeWasHidden = prevHostParent;
				break;
			case 30:
				safelyDetachRef(deletedFiber, nearestMountedAncestor);
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				break;
			case 7:
				offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
				recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
				break;
			default: recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
		}
	}
	function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
		if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot))) {
			finishedRoot = finishedRoot.dehydrated;
			try {
				retryIfBlockedOn(finishedRoot);
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
	}
	function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
		if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot)))) try {
			retryIfBlockedOn(finishedRoot);
		} catch (error) {
			captureCommitPhaseError(finishedWork, finishedWork.return, error);
		}
	}
	function getRetryCache(finishedWork) {
		switch (finishedWork.tag) {
			case 31:
			case 13:
			case 19:
				var retryCache = finishedWork.stateNode;
				null === retryCache && (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
				return retryCache;
			case 22: return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, null === retryCache && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
			default: throw Error(formatProdErrorMessage(435, finishedWork.tag));
		}
	}
	function attachSuspenseRetryListeners(finishedWork, wakeables) {
		var retryCache = getRetryCache(finishedWork);
		wakeables.forEach(function(wakeable) {
			if (!retryCache.has(wakeable)) {
				retryCache.add(wakeable);
				var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
				wakeable.then(retry, retry);
			}
		});
	}
	function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber, lanes) {
		var deletions = parentFiber.deletions;
		if (null !== deletions) for (var i = 0; i < deletions.length; i++) {
			var childToDelete = deletions[i], root = root$jscomp$0, returnFiber = parentFiber, parent = returnFiber;
			a: for (; null !== parent;) {
				switch (parent.tag) {
					case 27:
						if (isSingletonScope(parent.type)) {
							hostParent = parent.stateNode;
							hostParentIsContainer = !1;
							break a;
						}
						break;
					case 5:
						hostParent = parent.stateNode;
						hostParentIsContainer = !1;
						break a;
					case 3:
					case 4:
						hostParent = parent.stateNode.containerInfo;
						hostParentIsContainer = !0;
						break a;
				}
				parent = parent.return;
			}
			if (null === hostParent) throw Error(formatProdErrorMessage(160));
			commitDeletionEffectsOnFiber(root, returnFiber, childToDelete);
			hostParent = null;
			hostParentIsContainer = !1;
			root = childToDelete.alternate;
			null !== root && (root.return = null);
			childToDelete.return = null;
		}
		if (parentFiber.subtreeFlags & 13886) for (parentFiber = parentFiber.child; null !== parentFiber;) commitMutationEffectsOnFiber(parentFiber, root$jscomp$0, lanes), parentFiber = parentFiber.sibling;
	}
	var currentHoistableRoot = null;
	function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
		var current = finishedWork.alternate, flags = finishedWork.flags;
		switch (finishedWork.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (flags & 4 && (current = finishedWork.updateQueue, current = null !== current ? current.events : null, null !== current)) for (var ii = 0; ii < current.length; ii++) {
					var _eventPayloads$ii2 = current[ii];
					_eventPayloads$ii2.ref.impl = _eventPayloads$ii2.nextImpl;
				}
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
				break;
			case 1:
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
				flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, null !== finishedWork && (root = finishedWork.callbacks, null !== root && (lanes = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = null === lanes ? root : lanes.concat(root))));
				break;
			case 26:
				ii = currentHoistableRoot;
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
				if (flags & 4) if (flags = null !== current ? current.memoizedState : null, lanes = finishedWork.memoizedState, null === current) if (null === lanes) if (null === finishedWork.stateNode) if (offscreenSubtreeIsHidden) finishedWork.stateNode = createHoistableInstance(finishedWork.type, finishedWork.memoizedProps, root.containerInfo, finishedWork);
				else {
					a: {
						root = finishedWork.type;
						lanes = finishedWork.memoizedProps;
						flags = ii.ownerDocument || ii;
						b: switch (root) {
							case "title":
								current = flags.getElementsByTagName("title")[0];
								if (!current || current[internalHoistableMarker] || current[internalInstanceKey] || "http://www.w3.org/2000/svg" === current.namespaceURI || current.hasAttribute("itemprop")) current = flags.createElement(root), flags.head.insertBefore(current, flags.querySelector("head > title"));
								setInitialProperties(current, root, lanes);
								current[internalInstanceKey] = finishedWork;
								markNodeAsHoistable(current);
								root = current;
								break a;
							case "link":
								if (ii = getHydratableHoistableCache("link", "href", flags).get(root + (lanes.href || ""))) {
									for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++) if (current = ii[_eventPayloads$ii2], current.getAttribute("href") === (null == lanes.href || "" === lanes.href ? null : lanes.href) && current.getAttribute("rel") === (null == lanes.rel ? null : lanes.rel) && current.getAttribute("title") === (null == lanes.title ? null : lanes.title) && current.getAttribute("crossorigin") === (null == lanes.crossOrigin ? null : lanes.crossOrigin)) {
										ii.splice(_eventPayloads$ii2, 1);
										break b;
									}
								}
								current = flags.createElement(root);
								setInitialProperties(current, root, lanes);
								flags.head.appendChild(current);
								break;
							case "meta":
								if (ii = getHydratableHoistableCache("meta", "content", flags).get(root + (lanes.content || ""))) {
									for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++) if (current = ii[_eventPayloads$ii2], current.getAttribute("content") === (null == lanes.content ? null : "" + lanes.content) && current.getAttribute("name") === (null == lanes.name ? null : lanes.name) && current.getAttribute("property") === (null == lanes.property ? null : lanes.property) && current.getAttribute("http-equiv") === (null == lanes.httpEquiv ? null : lanes.httpEquiv) && current.getAttribute("charset") === (null == lanes.charSet ? null : lanes.charSet)) {
										ii.splice(_eventPayloads$ii2, 1);
										break b;
									}
								}
								current = flags.createElement(root);
								setInitialProperties(current, root, lanes);
								flags.head.appendChild(current);
								break;
							default: throw Error(formatProdErrorMessage(468, root));
						}
						current[internalInstanceKey] = finishedWork;
						markNodeAsHoistable(current);
						root = current;
					}
					finishedWork.stateNode = root;
				}
				else offscreenSubtreeIsHidden || mountHoistable(ii, finishedWork.type, finishedWork.stateNode);
				else finishedWork.stateNode = acquireResource(ii, lanes, finishedWork.memoizedProps);
				else flags !== lanes ? (null === flags ? (root = current.stateNode, null === root || offscreenSubtreeWasHidden || root.parentNode.removeChild(root)) : flags.count--, null === lanes ? offscreenSubtreeIsHidden || mountHoistable(ii, finishedWork.type, finishedWork.stateNode) : acquireResource(ii, lanes, finishedWork.memoizedProps)) : null === lanes && null !== finishedWork.stateNode && commitHostUpdate(finishedWork, finishedWork.memoizedProps, current.memoizedProps);
				break;
			case 27:
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
				null !== current && flags & 4 && commitHostUpdate(finishedWork, finishedWork.memoizedProps, current.memoizedProps);
				break;
			case 5:
				ii = offscreenDirectParentIsHidden;
				offscreenDirectParentIsHidden = !1;
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				offscreenDirectParentIsHidden = ii;
				commitReconciliationEffects(finishedWork);
				flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
				if (finishedWork.flags & 32) {
					root = finishedWork.stateNode;
					try {
						setTextContent(root, ""), viewTransitionMutationContext = !0;
					} catch (error) {
						captureCommitPhaseError(finishedWork, finishedWork.return, error);
					}
				}
				flags & 4 && null != finishedWork.stateNode && (root = finishedWork.memoizedProps, commitHostUpdate(finishedWork, root, null !== current ? current.memoizedProps : root));
				flags & 1024 && (needsFormReset = !0);
				break;
			case 6:
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				if (flags & 4) {
					if (null === finishedWork.stateNode) throw Error(formatProdErrorMessage(162));
					root = finishedWork.memoizedProps;
					lanes = finishedWork.stateNode;
					try {
						lanes.nodeValue = root, viewTransitionMutationContext = !0;
					} catch (error) {
						captureCommitPhaseError(finishedWork, finishedWork.return, error);
					}
				}
				break;
			case 3:
				viewTransitionMutationContext = !1;
				tagCaches = null;
				ii = currentHoistableRoot;
				currentHoistableRoot = getHoistableRoot(root.containerInfo);
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				currentHoistableRoot = ii;
				commitReconciliationEffects(finishedWork);
				if (flags & 4 && null !== current && current.memoizedState.isDehydrated) try {
					retryIfBlockedOn(root.containerInfo);
				} catch (error) {
					captureCommitPhaseError(finishedWork, finishedWork.return, error);
				}
				needsFormReset && (needsFormReset = !1, recursivelyResetForms(finishedWork));
				viewTransitionMutationContext = !1;
				break;
			case 4:
				flags = offscreenDirectParentIsHidden;
				offscreenDirectParentIsHidden = offscreenSubtreeIsHidden;
				current = pushMutationContext();
				ii = currentHoistableRoot;
				currentHoistableRoot = getHoistableRoot(finishedWork.stateNode.containerInfo);
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				currentHoistableRoot = ii;
				viewTransitionMutationContext && inUpdateViewTransition && (rootViewTransitionAffected = !0);
				viewTransitionMutationContext = current;
				offscreenDirectParentIsHidden = flags;
				break;
			case 12:
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				break;
			case 31:
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				flags & 4 && (root = finishedWork.updateQueue, null !== root && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root)));
				break;
			case 13:
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				finishedWork.child.flags & 8192 && null !== finishedWork.memoizedState !== (null !== current && null !== current.memoizedState) && (globalMostRecentFallbackTime = now());
				flags & 4 && (root = finishedWork.updateQueue, null !== root && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root)));
				break;
			case 22:
				ii = null !== finishedWork.memoizedState;
				_eventPayloads$ii2 = null !== current && null !== current.memoizedState;
				var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden, prevOffscreenDirectParentIsHidden$166 = offscreenDirectParentIsHidden;
				offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || ii;
				offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166 || ii;
				offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || _eventPayloads$ii2;
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
				offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166;
				offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
				commitReconciliationEffects(finishedWork);
				flags & 8192 && (root = finishedWork.stateNode, root._visibility = ii ? root._visibility & -2 : root._visibility | 1, !ii || null === current || _eventPayloads$ii2 || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || (root = _eventPayloads$ii2 || offscreenSubtreeWasHidden, lanes = offscreenSubtreeIsHidden, current = offscreenSubtreeWasHidden, offscreenSubtreeIsHidden = ii || offscreenSubtreeIsHidden, offscreenSubtreeWasHidden = root, recursivelyTraverseDisappearLayoutEffects(finishedWork, 2), offscreenSubtreeIsHidden = lanes, offscreenSubtreeWasHidden = current), !ii && offscreenDirectParentIsHidden || hideOrUnhideAllChildren(finishedWork, ii));
				flags & 4 && (root = finishedWork.updateQueue, null !== root && (lanes = root.retryQueue, null !== lanes && (root.retryQueue = null, attachSuspenseRetryListeners(finishedWork, lanes))));
				break;
			case 19:
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				flags & 4 && (root = finishedWork.updateQueue, null !== root && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root)));
				break;
			case 30:
				flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
				flags = pushMutationContext();
				ii = inUpdateViewTransition;
				_eventPayloads$ii2 = (lanes & 335544064) === lanes;
				prevOffscreenSubtreeIsHidden = finishedWork.memoizedProps;
				inUpdateViewTransition = _eventPayloads$ii2 && "none" !== getViewTransitionClassName(prevOffscreenSubtreeIsHidden.default, prevOffscreenSubtreeIsHidden.update);
				recursivelyTraverseMutationEffects(root, finishedWork, lanes);
				commitReconciliationEffects(finishedWork);
				_eventPayloads$ii2 && null !== current && viewTransitionMutationContext && (finishedWork.flags |= 4);
				inUpdateViewTransition = ii;
				viewTransitionMutationContext = flags;
				break;
			case 21: break;
			case 7: flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return)), current && null !== current.stateNode && (current.stateNode._fragmentFiber = finishedWork);
			default: recursivelyTraverseMutationEffects(root, finishedWork, lanes), commitReconciliationEffects(finishedWork);
		}
	}
	function commitReconciliationEffects(finishedWork) {
		var flags = finishedWork.flags;
		if (flags & 2) {
			try {
				for (var hostParentFiber, parentFiber = finishedWork.return; null !== parentFiber;) {
					if (isHostParent(parentFiber)) {
						hostParentFiber = parentFiber;
						break;
					}
					parentFiber = parentFiber.return;
				}
				parentFiber = null;
				for (var parent = finishedWork.return; null !== parent;) {
					if (isFragmentInstanceParent(parent)) {
						var fragmentInstance = parent.stateNode;
						null === parentFiber ? parentFiber = [fragmentInstance] : parentFiber.push(fragmentInstance);
					}
					if (isFragmentInstanceHostBoundary(parent)) break;
					parent = parent.return;
				}
				var JSCompiler_inline_result = parentFiber;
				if (null == hostParentFiber) throw Error(formatProdErrorMessage(160));
				switch (hostParentFiber.tag) {
					case 27:
						var parent$jscomp$0 = hostParentFiber.stateNode;
						insertOrAppendPlacementNode(finishedWork, getHostSibling(finishedWork), parent$jscomp$0, JSCompiler_inline_result);
						break;
					case 5:
						var parent$149 = hostParentFiber.stateNode;
						hostParentFiber.flags & 32 && (setTextContent(parent$149, ""), hostParentFiber.flags &= -33);
						insertOrAppendPlacementNode(finishedWork, getHostSibling(finishedWork), parent$149, JSCompiler_inline_result);
						break;
					case 3:
					case 4:
						var parent$151 = hostParentFiber.stateNode.containerInfo;
						insertOrAppendPlacementNodeIntoContainer(finishedWork, getHostSibling(finishedWork), parent$151, JSCompiler_inline_result);
						break;
					default: throw Error(formatProdErrorMessage(161));
				}
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
			finishedWork.flags &= -3;
		}
		flags & 4096 && (finishedWork.flags &= -4097);
	}
	function recursivelyResetForms(parentFiber) {
		if (parentFiber.subtreeFlags & 1024) for (parentFiber = parentFiber.child; null !== parentFiber;) {
			var fiber = parentFiber;
			recursivelyResetForms(fiber);
			5 === fiber.tag && fiber.flags & 1024 && (fiber = fiber.stateNode, _enabled = !0, fiber.reset(), _enabled = !1);
			parentFiber = parentFiber.sibling;
		}
	}
	function recursivelyTraverseAfterMutationEffects(root, parentFiber) {
		if (parentFiber.subtreeFlags & 9270) for (parentFiber = parentFiber.child; null !== parentFiber;) commitAfterMutationEffectsOnFiber(parentFiber, root), parentFiber = parentFiber.sibling;
		else measureNestedViewTransitions(parentFiber, !1);
	}
	function commitAfterMutationEffectsOnFiber(finishedWork, root) {
		var current = finishedWork.alternate;
		if (null === current) commitEnterViewTransitions(finishedWork, !1);
		else switch (finishedWork.tag) {
			case 3:
				rootViewTransitionNameCanceled = viewTransitionContextChanged = !1;
				pushViewTransitionCancelableScope();
				recursivelyTraverseAfterMutationEffects(root, finishedWork);
				if (!viewTransitionContextChanged && !rootViewTransitionAffected) {
					finishedWork = viewTransitionCancelableChildren;
					if (null !== finishedWork) for (var i = 0; i < finishedWork.length; i += 3) {
						current = finishedWork[i];
						var oldName = finishedWork[i + 1];
						restoreViewTransitionName(current, finishedWork[i + 2]);
						current = current.ownerDocument.documentElement;
						null !== current && current.animate({
							opacity: [0, 0],
							pointerEvents: ["none", "none"]
						}, {
							duration: 0,
							fill: "forwards",
							pseudoElement: "::view-transition-group(" + oldName + ")"
						});
					}
					finishedWork = root.containerInfo;
					finishedWork = 9 === finishedWork.nodeType ? finishedWork.documentElement : finishedWork.ownerDocument.documentElement;
					null !== finishedWork && "" === finishedWork.style.viewTransitionName && (finishedWork.style.viewTransitionName = "none", finishedWork.animate({
						opacity: [0, 0],
						pointerEvents: ["none", "none"]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition-group(root)"
					}), finishedWork.animate({
						width: [0, 0],
						height: [0, 0]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition"
					}));
					rootViewTransitionNameCanceled = !0;
				}
				viewTransitionCancelableChildren = null;
				break;
			case 5:
				recursivelyTraverseAfterMutationEffects(root, finishedWork);
				break;
			case 4:
				i = viewTransitionContextChanged;
				viewTransitionContextChanged = !1;
				recursivelyTraverseAfterMutationEffects(root, finishedWork);
				viewTransitionContextChanged && (rootViewTransitionAffected = !0);
				viewTransitionContextChanged = i;
				break;
			case 22:
				null === finishedWork.memoizedState && (null !== current.memoizedState ? commitEnterViewTransitions(finishedWork, !1) : recursivelyTraverseAfterMutationEffects(root, finishedWork));
				break;
			case 30:
				i = viewTransitionContextChanged;
				oldName = pushViewTransitionCancelableScope();
				viewTransitionContextChanged = !1;
				recursivelyTraverseAfterMutationEffects(root, finishedWork);
				viewTransitionContextChanged && (finishedWork.flags |= 4);
				var props = finishedWork.memoizedProps, state = finishedWork.stateNode;
				root = getViewTransitionName(props, state);
				state = getViewTransitionName(current.memoizedProps, state);
				var className = getViewTransitionClassName(props.default, props.update);
				"none" === className ? root = !1 : (props = current.memoizedState, current.memoizedState = null, current = finishedWork.child, viewTransitionHostInstanceIdx = 0, root = measureViewTransitionHostInstancesRecursive(finishedWork, current, root, state, className, props, !0), viewTransitionHostInstanceIdx !== (null === props ? 0 : props.length) && (finishedWork.flags |= 32));
				0 !== (finishedWork.flags & 4) && root ? (scheduleViewTransitionEvent(finishedWork, finishedWork.memoizedProps.onUpdate), viewTransitionCancelableChildren = oldName) : null !== oldName && (oldName.push.apply(oldName, viewTransitionCancelableChildren), viewTransitionCancelableChildren = oldName);
				viewTransitionContextChanged = 0 !== (finishedWork.flags & 32) ? !0 : i;
				break;
			default: recursivelyTraverseAfterMutationEffects(root, finishedWork);
		}
	}
	function recursivelyTraverseLayoutEffects(root, parentFiber) {
		if (parentFiber.subtreeFlags & 8772) for (parentFiber = parentFiber.child; null !== parentFiber;) commitLayoutEffectOnFiber(root, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
	}
	function recursivelyTraverseDisappearLayoutEffects(parentFiber, layoutEffectTraversalFlags$jscomp$0) {
		for (parentFiber = parentFiber.child; null !== parentFiber;) {
			var finishedWork = parentFiber, layoutEffectTraversalFlags = layoutEffectTraversalFlags$jscomp$0;
			switch (finishedWork.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
					recursivelyTraverseDisappearLayoutEffects(finishedWork, layoutEffectTraversalFlags);
					break;
				case 1:
					safelyDetachRef(finishedWork, finishedWork.return);
					var instance = finishedWork.stateNode;
					"function" === typeof instance.componentWillUnmount && safelyCallComponentWillUnmount(finishedWork, finishedWork.return, instance);
					recursivelyTraverseDisappearLayoutEffects(finishedWork, layoutEffectTraversalFlags);
					break;
				case 27: 0 !== (layoutEffectTraversalFlags & 2) && releaseSingletonInstance(finishedWork.stateNode, finishedWork.type, finishedWork.memoizedProps);
				case 5:
					safelyDetachRef(finishedWork, finishedWork.return);
					5 !== finishedWork.tag && 27 !== finishedWork.tag || commitFragmentInstanceDeletionEffects(finishedWork);
					recursivelyTraverseDisappearLayoutEffects(finishedWork, layoutEffectTraversalFlags);
					break;
				case 6:
					commitFragmentInstanceDeletionEffects(finishedWork);
					break;
				case 26:
					safelyDetachRef(finishedWork, finishedWork.return);
					instance = finishedWork.stateNode;
					null !== finishedWork.memoizedState || null === instance || offscreenSubtreeWasHidden || instance.parentNode.removeChild(instance);
					recursivelyTraverseDisappearLayoutEffects(finishedWork, layoutEffectTraversalFlags);
					break;
				case 22:
					null === finishedWork.memoizedState && recursivelyTraverseDisappearLayoutEffects(finishedWork, layoutEffectTraversalFlags);
					break;
				case 30:
					safelyDetachRef(finishedWork, finishedWork.return);
					recursivelyTraverseDisappearLayoutEffects(finishedWork, layoutEffectTraversalFlags);
					break;
				case 7: safelyDetachRef(finishedWork, finishedWork.return);
				default: recursivelyTraverseDisappearLayoutEffects(finishedWork, layoutEffectTraversalFlags);
			}
			parentFiber = parentFiber.sibling;
		}
	}
	function recursivelyTraverseReappearLayoutEffects(finishedRoot$jscomp$0, parentFiber, layoutEffectTraversalFlags) {
		layoutEffectTraversalFlags = 0 !== (parentFiber.subtreeFlags & 8772) ? layoutEffectTraversalFlags : layoutEffectTraversalFlags & -2;
		for (parentFiber = parentFiber.child; null !== parentFiber;) {
			var current = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags, includeWorkInProgressEffects = 0 !== (layoutEffectTraversalFlags & 1);
			switch (finishedWork.tag) {
				case 0:
				case 11:
				case 15:
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					commitHookEffectListMount(4, finishedWork);
					break;
				case 1:
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					current = finishedWork;
					finishedRoot = current.stateNode;
					if ("function" === typeof finishedRoot.componentDidMount) try {
						finishedRoot.componentDidMount();
					} catch (error) {
						captureCommitPhaseError(current, current.return, error);
					}
					current = finishedWork;
					finishedRoot = current.updateQueue;
					if (null !== finishedRoot) {
						var instance = current.stateNode;
						try {
							var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
							if (null !== hiddenCallbacks) for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0; finishedRoot < hiddenCallbacks.length; finishedRoot++) callCallback(hiddenCallbacks[finishedRoot], instance);
						} catch (error) {
							captureCommitPhaseError(current, current.return, error);
						}
					}
					includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork);
					safelyAttachRef(finishedWork, finishedWork.return);
					break;
				case 27: 0 !== (layoutEffectTraversalFlags & 2) && commitHostSingletonAcquisition(finishedWork);
				case 5:
					5 !== finishedWork.tag && 27 !== finishedWork.tag || commitFragmentInstanceInsertionEffects(finishedWork);
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					includeWorkInProgressEffects && null === current && flags & 4 && commitHostMount(finishedWork);
					safelyAttachRef(finishedWork, finishedWork.return);
					break;
				case 6:
					commitFragmentInstanceInsertionEffects(finishedWork);
					break;
				case 26:
					instance = finishedWork.stateNode;
					null !== finishedWork.memoizedState || null === instance || offscreenSubtreeIsHidden || mountHoistable(getHoistableRoot(instance.ownerDocument), finishedWork.type, instance);
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					includeWorkInProgressEffects && null === current && flags & 4 && commitHostMount(finishedWork);
					safelyAttachRef(finishedWork, finishedWork.return);
					break;
				case 12:
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					break;
				case 31:
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
					break;
				case 13:
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
					break;
				case 22:
					null === finishedWork.memoizedState && recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					safelyAttachRef(finishedWork, finishedWork.return);
					break;
				case 30:
					recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
					safelyAttachRef(finishedWork, finishedWork.return);
					break;
				case 7: safelyAttachRef(finishedWork, finishedWork.return);
				default: recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, layoutEffectTraversalFlags);
			}
			parentFiber = parentFiber.sibling;
		}
	}
	function commitOffscreenPassiveMountEffects(current, finishedWork) {
		var previousCache = null;
		null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (previousCache = current.memoizedState.cachePool.pool);
		current = null;
		null !== finishedWork.memoizedState && null !== finishedWork.memoizedState.cachePool && (current = finishedWork.memoizedState.cachePool.pool);
		current !== previousCache && (null != current && current.refCount++, null != previousCache && releaseCache(previousCache));
	}
	function commitCachePassiveMountEffect(current, finishedWork) {
		current = null;
		null !== finishedWork.alternate && (current = finishedWork.alternate.memoizedState.cache);
		finishedWork = finishedWork.memoizedState.cache;
		finishedWork !== current && (finishedWork.refCount++, null != current && releaseCache(current));
	}
	function recursivelyTraversePassiveMountEffects(root, parentFiber, committedLanes, committedTransitions) {
		var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
		if (parentFiber.subtreeFlags & (isViewTransitionEligible ? 10262 : 10256)) for (parentFiber = parentFiber.child; null !== parentFiber;) commitPassiveMountOnFiber(root, parentFiber, committedLanes, committedTransitions), parentFiber = parentFiber.sibling;
		else isViewTransitionEligible && restoreNestedViewTransitions(parentFiber);
	}
	function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
		var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
		isViewTransitionEligible && null === finishedWork.alternate && null !== finishedWork.return && null !== finishedWork.return.alternate && restoreEnterOrExitViewTransitions(finishedWork);
		var flags = finishedWork.flags;
		switch (finishedWork.tag) {
			case 0:
			case 11:
			case 15:
				recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				flags & 2048 && commitHookEffectListMount(9, finishedWork);
				break;
			case 1:
				recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				break;
			case 3:
				recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				isViewTransitionEligible && rootViewTransitionNameCanceled && (finishedRoot = finishedRoot.containerInfo, finishedRoot = 9 === finishedRoot.nodeType ? finishedRoot.body : "HTML" === finishedRoot.nodeName ? finishedRoot.ownerDocument.body : finishedRoot, "root" === finishedRoot.style.viewTransitionName && (finishedRoot.style.viewTransitionName = ""), finishedRoot = finishedRoot.ownerDocument.documentElement, null !== finishedRoot && "none" === finishedRoot.style.viewTransitionName && (finishedRoot.style.viewTransitionName = ""));
				flags & 2048 && (flags = null, null !== finishedWork.alternate && (flags = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== flags && (finishedWork.refCount++, null != flags && releaseCache(flags)));
				break;
			case 12:
				if (flags & 2048) {
					recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					flags = finishedWork.stateNode;
					try {
						var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
						"function" === typeof onPostCommit && onPostCommit(id, null === finishedWork.alternate ? "mount" : "update", flags.passiveEffectDuration, -0);
					} catch (error) {
						captureCommitPhaseError(finishedWork, finishedWork.return, error);
					}
				} else recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				break;
			case 31:
				recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				break;
			case 13:
				recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				break;
			case 23: break;
			case 22:
				_finishedWork$memoize2 = finishedWork.stateNode;
				id = finishedWork.alternate;
				null !== finishedWork.memoizedState ? (isViewTransitionEligible && null !== id && null === id.memoizedState && restoreEnterOrExitViewTransitions(id), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork)) : (isViewTransitionEligible && null !== id && null !== id.memoizedState && restoreEnterOrExitViewTransitions(finishedWork), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, 0 !== (finishedWork.subtreeFlags & 10256) || !1)));
				flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
				break;
			case 24:
				recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
				break;
			case 30:
				isViewTransitionEligible && (flags = finishedWork.alternate, null !== flags && (restoreViewTransitionOnHostInstances(flags.child, !0), restoreViewTransitionOnHostInstances(finishedWork.child, !0)));
				recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
				break;
			default: recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
		}
	}
	function recursivelyTraverseReconnectPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, includeWorkInProgressEffects) {
		includeWorkInProgressEffects = includeWorkInProgressEffects && (0 !== (parentFiber.subtreeFlags & 10256) || !1);
		for (parentFiber = parentFiber.child; null !== parentFiber;) {
			var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, flags = finishedWork.flags;
			switch (finishedWork.tag) {
				case 0:
				case 11:
				case 15:
					recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
					commitHookEffectListMount(8, finishedWork);
					break;
				case 23: break;
				case 22:
					var instance = finishedWork.stateNode;
					null !== finishedWork.memoizedState ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork) : (instance._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects));
					includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(finishedWork.alternate, finishedWork);
					break;
				case 24:
					recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
					includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
					break;
				default: recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
			}
			parentFiber = parentFiber.sibling;
		}
	}
	function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber) {
		if (parentFiber.subtreeFlags & 10256) for (parentFiber = parentFiber.child; null !== parentFiber;) {
			var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
			switch (finishedWork.tag) {
				case 22:
					recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
					flags & 2048 && commitOffscreenPassiveMountEffects(finishedWork.alternate, finishedWork);
					break;
				case 24:
					recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
					flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
					break;
				default: recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
			}
			parentFiber = parentFiber.sibling;
		}
	}
	var suspenseyCommitFlag = 8192;
	function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
		if (parentFiber.subtreeFlags & suspenseyCommitFlag) for (parentFiber = parentFiber.child; null !== parentFiber;) accumulateSuspenseyCommitOnFiber(parentFiber, committedLanes, suspendedState), parentFiber = parentFiber.sibling;
	}
	function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
		switch (fiber.tag) {
			case 26:
				recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
				fiber.flags & suspenseyCommitFlag && (null !== fiber.memoizedState ? suspendResource(suspendedState, currentHoistableRoot, fiber.memoizedState, fiber.memoizedProps) : (fiber = fiber.stateNode, (committedLanes & 335544128) === committedLanes && suspendInstance(suspendedState, fiber)));
				break;
			case 5:
				recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
				fiber.flags & suspenseyCommitFlag && (fiber = fiber.stateNode, (committedLanes & 335544128) === committedLanes && suspendInstance(suspendedState, fiber));
				break;
			case 3:
			case 4:
				var previousHoistableRoot = currentHoistableRoot;
				currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo);
				recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
				currentHoistableRoot = previousHoistableRoot;
				break;
			case 22:
				null === fiber.memoizedState && (previousHoistableRoot = fiber.alternate, null !== previousHoistableRoot && null !== previousHoistableRoot.memoizedState ? (previousHoistableRoot = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState), suspenseyCommitFlag = previousHoistableRoot) : recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState));
				break;
			case 30:
				if (0 !== (fiber.flags & suspenseyCommitFlag) && (previousHoistableRoot = fiber.memoizedProps.name, null != previousHoistableRoot && "auto" !== previousHoistableRoot)) {
					var state = fiber.stateNode;
					state.paired = null;
					null === appearingViewTransitions && (appearingViewTransitions = /* @__PURE__ */ new Map());
					appearingViewTransitions.set(previousHoistableRoot, state);
				}
				recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
				break;
			default: recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
		}
	}
	function detachAlternateSiblings(parentFiber) {
		var previousFiber = parentFiber.alternate;
		if (null !== previousFiber && (parentFiber = previousFiber.child, null !== parentFiber)) {
			previousFiber.child = null;
			do
				previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
			while (null !== parentFiber);
		}
	}
	function recursivelyTraversePassiveUnmountEffects(parentFiber) {
		var deletions = parentFiber.deletions;
		if (0 !== (parentFiber.flags & 16)) {
			if (null !== deletions) for (var i = 0; i < deletions.length; i++) {
				var childToDelete = deletions[i];
				nextEffect = childToDelete;
				commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
			}
			detachAlternateSiblings(parentFiber);
		}
		if (parentFiber.subtreeFlags & 10256) for (parentFiber = parentFiber.child; null !== parentFiber;) commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
	}
	function commitPassiveUnmountOnFiber(finishedWork) {
		switch (finishedWork.tag) {
			case 0:
			case 11:
			case 15:
				recursivelyTraversePassiveUnmountEffects(finishedWork);
				finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
				break;
			case 3:
				recursivelyTraversePassiveUnmountEffects(finishedWork);
				break;
			case 12:
				recursivelyTraversePassiveUnmountEffects(finishedWork);
				break;
			case 22:
				var instance = finishedWork.stateNode;
				null !== finishedWork.memoizedState && instance._visibility & 2 && (null === finishedWork.return || 13 !== finishedWork.return.tag) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
				break;
			default: recursivelyTraversePassiveUnmountEffects(finishedWork);
		}
	}
	function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
		var deletions = parentFiber.deletions;
		if (0 !== (parentFiber.flags & 16)) {
			if (null !== deletions) for (var i = 0; i < deletions.length; i++) {
				var childToDelete = deletions[i];
				nextEffect = childToDelete;
				commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
			}
			detachAlternateSiblings(parentFiber);
		}
		for (parentFiber = parentFiber.child; null !== parentFiber;) {
			deletions = parentFiber;
			switch (deletions.tag) {
				case 0:
				case 11:
				case 15:
					commitHookEffectListUnmount(8, deletions, deletions.return);
					recursivelyTraverseDisconnectPassiveEffects(deletions);
					break;
				case 22:
					i = deletions.stateNode;
					i._visibility & 2 && (i._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
					break;
				default: recursivelyTraverseDisconnectPassiveEffects(deletions);
			}
			parentFiber = parentFiber.sibling;
		}
	}
	function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
		for (; null !== nextEffect;) {
			var fiber = nextEffect;
			switch (fiber.tag) {
				case 0:
				case 11:
				case 15:
					commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
					break;
				case 23:
				case 22:
					if (null !== fiber.memoizedState && null !== fiber.memoizedState.cachePool) {
						var cache = fiber.memoizedState.cachePool.pool;
						null != cache && cache.refCount++;
					}
					break;
				case 24: releaseCache(fiber.memoizedState.cache);
			}
			cache = fiber.child;
			if (null !== cache) cache.return = fiber, nextEffect = cache;
			else a: for (fiber = deletedSubtreeRoot; null !== nextEffect;) {
				cache = nextEffect;
				var sibling = cache.sibling, returnFiber = cache.return;
				detachFiberAfterEffects(cache);
				if (cache === fiber) {
					nextEffect = null;
					break a;
				}
				if (null !== sibling) {
					sibling.return = returnFiber;
					nextEffect = sibling;
					break a;
				}
				nextEffect = returnFiber;
			}
		}
	}
	var DefaultAsyncDispatcher = {
		getCacheForType: function(resourceType) {
			var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
			void 0 === cacheForType && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType));
			return cacheForType;
		},
		cacheSignal: function() {
			return readContext(CacheContext).controller.signal;
		}
	};
	var PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map;
	var executionContext = 0;
	var workInProgressRoot = null;
	var workInProgress = null;
	var workInProgressRootRenderLanes = 0;
	var workInProgressSuspendedReason = 0;
	var workInProgressThrownValue = null;
	var workInProgressRootDidSkipSuspendedSiblings = !1;
	var workInProgressRootIsPrerendering = !1;
	var workInProgressRootDidAttachPingListener = !1;
	var entangledRenderLanes = 0;
	var workInProgressRootExitStatus = 0;
	var workInProgressRootSkippedLanes = 0;
	var workInProgressRootInterleavedUpdatedLanes = 0;
	var workInProgressRootPingedLanes = 0;
	var workInProgressDeferredLane = 0;
	var workInProgressSuspendedRetryLanes = 0;
	var workInProgressRootConcurrentErrors = null;
	var workInProgressRootRecoverableErrors = null;
	var workInProgressRootDidIncludeRecursiveRenderUpdate = !1;
	var globalMostRecentFallbackTime = 0;
	var globalMostRecentTransitionTime = 0;
	var workInProgressRootRenderTargetTime = Infinity;
	var workInProgressTransitions = null;
	var legacyErrorBoundariesThatAlreadyFailed = null;
	var pendingEffectsStatus = 0;
	var pendingEffectsRoot = null;
	var pendingFinishedWork = null;
	var pendingEffectsLanes = 0;
	var pendingEffectsRemainingLanes = 0;
	var pendingPassiveTransitions = null;
	var pendingRecoverableErrors = null;
	var pendingViewTransition = null;
	var pendingViewTransitionEvents = null;
	var pendingTransitionTypes = null;
	var nestedUpdateCount = 0;
	var rootWithNestedUpdates = null;
	function requestUpdateLane() {
		return 0 !== (executionContext & 2) && 0 !== workInProgressRootRenderLanes ? workInProgressRootRenderLanes & -workInProgressRootRenderLanes : null !== ReactSharedInternals.T ? requestTransitionLane() : resolveUpdatePriority();
	}
	function requestDeferredLane() {
		if (0 === workInProgressDeferredLane) if (0 === (workInProgressRootRenderLanes & 536870912) || isHydrating) {
			var lane = nextTransitionDeferredLane;
			nextTransitionDeferredLane <<= 1;
			0 === (nextTransitionDeferredLane & 3932160) && (nextTransitionDeferredLane = 262144);
			workInProgressDeferredLane = lane;
		} else workInProgressDeferredLane = 536870912;
		lane = suspenseHandlerStackCursor.current;
		null !== lane && (lane.flags |= 32);
		return workInProgressDeferredLane;
	}
	function scheduleViewTransitionEvent(fiber, callback) {
		if (null != callback) {
			var state = fiber.stateNode, instance = state.ref;
			null === instance && (instance = state.ref = createViewTransitionInstance(getViewTransitionName(fiber.memoizedProps, state)));
			null === pendingViewTransitionEvents && (pendingViewTransitionEvents = []);
			pendingViewTransitionEvents.push(callback.bind(null, instance));
		}
	}
	function scheduleUpdateOnFiber(root, fiber, lane) {
		if (root === workInProgressRoot && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root.cancelPendingCommit) prepareFreshStack(root, 0), markRootSuspended(root, workInProgressRootRenderLanes, workInProgressDeferredLane, !1);
		markRootUpdated$1(root, lane);
		if (0 === (executionContext & 2) || root !== workInProgressRoot) root === workInProgressRoot && (0 === (executionContext & 2) && (workInProgressRootInterleavedUpdatedLanes |= lane), 4 === workInProgressRootExitStatus && markRootSuspended(root, workInProgressRootRenderLanes, workInProgressDeferredLane, !1)), ensureRootIsScheduled(root);
	}
	function performWorkOnRoot(root$jscomp$0, lanes, forceSync) {
		if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
		var shouldTimeSlice = !forceSync && 0 === (lanes & 127) && 0 === (lanes & root$jscomp$0.expiredLanes) || checkIfRootIsPrerendering(root$jscomp$0, lanes), exitStatus = shouldTimeSlice ? renderRootConcurrent(root$jscomp$0, lanes) : renderRootSync(root$jscomp$0, lanes, !0), renderWasConcurrent = shouldTimeSlice;
		do {
			if (0 === exitStatus) {
				workInProgressRootIsPrerendering && !shouldTimeSlice && markRootSuspended(root$jscomp$0, lanes, 0, !1);
				break;
			} else {
				forceSync = root$jscomp$0.current.alternate;
				if (renderWasConcurrent && !isRenderConsistentWithExternalStores(forceSync)) {
					exitStatus = renderRootSync(root$jscomp$0, lanes, !1);
					renderWasConcurrent = !1;
					continue;
				}
				if (2 === exitStatus) {
					renderWasConcurrent = lanes;
					if (root$jscomp$0.errorRecoveryDisabledLanes & renderWasConcurrent) var JSCompiler_inline_result = 0;
					else JSCompiler_inline_result = root$jscomp$0.pendingLanes & -536870913, JSCompiler_inline_result = 0 !== JSCompiler_inline_result ? JSCompiler_inline_result : JSCompiler_inline_result & 536870912 ? 536870912 : 0;
					if (0 !== JSCompiler_inline_result) {
						lanes = JSCompiler_inline_result;
						a: {
							var root = root$jscomp$0;
							exitStatus = workInProgressRootConcurrentErrors;
							var wasRootDehydrated = root.current.memoizedState.isDehydrated;
							wasRootDehydrated && (prepareFreshStack(root, JSCompiler_inline_result).flags |= 256);
							JSCompiler_inline_result = renderRootSync(root, JSCompiler_inline_result, !1);
							if (2 !== JSCompiler_inline_result && 6 !== JSCompiler_inline_result) {
								if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
									root.errorRecoveryDisabledLanes |= renderWasConcurrent;
									workInProgressRootInterleavedUpdatedLanes |= renderWasConcurrent;
									exitStatus = 4;
									break a;
								}
								renderWasConcurrent = workInProgressRootRecoverableErrors;
								workInProgressRootRecoverableErrors = exitStatus;
								null !== renderWasConcurrent && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = renderWasConcurrent : workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, renderWasConcurrent));
							}
							exitStatus = JSCompiler_inline_result;
						}
						renderWasConcurrent = !1;
						if (2 !== exitStatus) continue;
					}
				}
				if (1 === exitStatus) {
					prepareFreshStack(root$jscomp$0, 0);
					markRootSuspended(root$jscomp$0, lanes, 0, !0);
					break;
				}
				a: {
					shouldTimeSlice = root$jscomp$0;
					renderWasConcurrent = exitStatus;
					switch (renderWasConcurrent) {
						case 0:
						case 1: throw Error(formatProdErrorMessage(345));
						case 4: if ((lanes & 4194048) !== lanes && (lanes & 62914560) !== lanes) break;
						case 6:
							markRootSuspended(shouldTimeSlice, lanes, workInProgressDeferredLane, !workInProgressRootDidSkipSuspendedSiblings);
							break a;
						case 2:
							workInProgressRootRecoverableErrors = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(formatProdErrorMessage(329));
					}
					if ((lanes & 62914560) === lanes && (exitStatus = globalMostRecentFallbackTime + 300 - now(), 10 < exitStatus)) {
						markRootSuspended(shouldTimeSlice, lanes, workInProgressDeferredLane, !workInProgressRootDidSkipSuspendedSiblings);
						if (0 !== getNextLanes(shouldTimeSlice, 0, !0)) break a;
						pendingEffectsLanes = lanes;
						shouldTimeSlice.timeoutHandle = scheduleTimeout(completeRootWhenReady.bind(null, shouldTimeSlice, forceSync, workInProgressRootRecoverableErrors, workInProgressTransitions, workInProgressRootDidIncludeRecursiveRenderUpdate, lanes, workInProgressDeferredLane, workInProgressRootInterleavedUpdatedLanes, workInProgressSuspendedRetryLanes, workInProgressRootDidSkipSuspendedSiblings, renderWasConcurrent, "Throttled", -0, 0), exitStatus);
						break a;
					}
					completeRootWhenReady(shouldTimeSlice, forceSync, workInProgressRootRecoverableErrors, workInProgressTransitions, workInProgressRootDidIncludeRecursiveRenderUpdate, lanes, workInProgressDeferredLane, workInProgressRootInterleavedUpdatedLanes, workInProgressSuspendedRetryLanes, workInProgressRootDidSkipSuspendedSiblings, renderWasConcurrent, null, -0, 0);
				}
			}
			break;
		} while (1);
		ensureRootIsScheduled(root$jscomp$0);
	}
	function completeRootWhenReady(root, finishedWork, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
		root.timeoutHandle = -1;
		var subtreeFlags = finishedWork.subtreeFlags, isViewTransitionEligible = (lanes & 335544064) === lanes;
		suspendedCommitReason = null;
		if (isViewTransitionEligible || subtreeFlags & 8192 || 16785408 === (subtreeFlags & 16785408)) {
			if (suspendedCommitReason = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: noop$1
			}, appearingViewTransitions = null, accumulateSuspenseyCommitOnFiber(finishedWork, lanes, suspendedCommitReason), isViewTransitionEligible && (subtreeFlags = suspendedCommitReason, isViewTransitionEligible = root.containerInfo, isViewTransitionEligible = (9 === isViewTransitionEligible.nodeType ? isViewTransitionEligible : isViewTransitionEligible.ownerDocument).__reactViewTransition, null != isViewTransitionEligible && (subtreeFlags.count++, subtreeFlags.waitingForViewTransition = !0, subtreeFlags = onUnsuspend.bind(subtreeFlags), isViewTransitionEligible.finished.then(subtreeFlags, subtreeFlags))), subtreeFlags = (lanes & 62914560) === lanes ? globalMostRecentFallbackTime - now() : (lanes & 4194048) === lanes ? globalMostRecentTransitionTime - now() : 0, subtreeFlags = waitForCommitToBeReady(suspendedCommitReason, subtreeFlags), null !== subtreeFlags) {
				pendingEffectsLanes = lanes;
				root.cancelPendingCommit = subtreeFlags(completeRoot.bind(null, root, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, null, completedRenderStartTime, completedRenderEndTime));
				markRootSuspended(root, lanes, spawnedLane, !didSkipSuspendedSiblings);
				return;
			}
		}
		completeRoot(root, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason);
	}
	function isRenderConsistentWithExternalStores(finishedWork) {
		for (var node = finishedWork;;) {
			var tag = node.tag;
			if ((0 === tag || 11 === tag || 15 === tag) && node.flags & 16384 && (tag = node.updateQueue, null !== tag && (tag = tag.stores, null !== tag))) for (var i = 0; i < tag.length; i++) {
				var check = tag[i], getSnapshot = check.getSnapshot;
				check = check.value;
				try {
					if (!objectIs(getSnapshot(), check)) return !1;
				} catch (error) {
					return !1;
				}
			}
			tag = node.child;
			if (node.subtreeFlags & 16384 && null !== tag) tag.return = node, node = tag;
			else {
				if (node === finishedWork) break;
				for (; null === node.sibling;) {
					if (null === node.return || node.return === finishedWork) return !0;
					node = node.return;
				}
				node.sibling.return = node.return;
				node = node.sibling;
			}
		}
		return !0;
	}
	function markRootSuspended(root, suspendedLanes, spawnedLane, didAttemptEntireTree) {
		suspendedLanes = getEntangledLanes(root, suspendedLanes);
		suspendedLanes &= ~workInProgressRootPingedLanes;
		suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
		root.suspendedLanes |= suspendedLanes;
		root.pingedLanes &= ~suspendedLanes;
		didAttemptEntireTree && (root.warmLanes |= suspendedLanes);
		didAttemptEntireTree = root.expirationTimes;
		for (var lanes = suspendedLanes; 0 < lanes;) {
			var index$6 = 31 - clz32(lanes), lane = 1 << index$6;
			didAttemptEntireTree[index$6] = -1;
			lanes &= ~lane;
		}
		0 !== spawnedLane && markSpawnedDeferredLane(root, spawnedLane, suspendedLanes);
	}
	function flushSyncWork$1() {
		return 0 === (executionContext & 6) ? (flushSyncWorkAcrossRoots_impl(0, !1), !1) : !0;
	}
	function resetWorkInProgressStack() {
		if (null !== workInProgress) {
			if (0 === workInProgressSuspendedReason) var interruptedWork = workInProgress.return;
			else interruptedWork = workInProgress, lastContextDependency = currentlyRenderingFiber$1 = null, resetHooksOnUnwind(interruptedWork), thenableState$1 = null, thenableIndexCounter$1 = 0, interruptedWork = workInProgress;
			for (; null !== interruptedWork;) unwindInterruptedWork(interruptedWork.alternate, interruptedWork), interruptedWork = interruptedWork.return;
			workInProgress = null;
		}
	}
	function prepareFreshStack(root, lanes) {
		var timeoutHandle = root.timeoutHandle;
		-1 !== timeoutHandle && (root.timeoutHandle = -1, cancelTimeout(timeoutHandle));
		timeoutHandle = root.cancelPendingCommit;
		null !== timeoutHandle && (root.cancelPendingCommit = null, timeoutHandle());
		pendingEffectsLanes = 0;
		resetWorkInProgressStack();
		workInProgressRoot = root;
		workInProgress = timeoutHandle = createWorkInProgress(root.current, null);
		workInProgressRootRenderLanes = lanes;
		workInProgressSuspendedReason = 0;
		workInProgressThrownValue = null;
		workInProgressRootDidSkipSuspendedSiblings = !1;
		workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
		workInProgressRootDidAttachPingListener = !1;
		workInProgressSuspendedRetryLanes = workInProgressDeferredLane = workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = workInProgressRootExitStatus = 0;
		workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null;
		workInProgressRootDidIncludeRecursiveRenderUpdate = !1;
		entangledRenderLanes = getEntangledLanes(root, lanes);
		finishQueueingConcurrentUpdates();
		return timeoutHandle;
	}
	function handleThrow(root, thrownValue) {
		currentlyRenderingFiber = null;
		ReactSharedInternals.H = ContextOnlyDispatcher;
		thrownValue === SuspenseException || thrownValue === SuspenseActionException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 3) : thrownValue === SuspenseyCommitException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 4) : workInProgressSuspendedReason = thrownValue === SelectiveHydrationException ? 8 : null !== thrownValue && "object" === typeof thrownValue && "function" === typeof thrownValue.then ? 6 : 1;
		workInProgressThrownValue = thrownValue;
		null === workInProgress && (workInProgressRootExitStatus = 1, logUncaughtError(root, createCapturedValueAtFiber(thrownValue, root.current)));
	}
	function shouldRemainOnPreviousScreen() {
		var handler = suspenseHandlerStackCursor.current;
		return null === handler ? !0 : (workInProgressRootRenderLanes & 4194048) === workInProgressRootRenderLanes ? null === shellBoundary ? !0 : !1 : (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes || 0 !== (workInProgressRootRenderLanes & 536870912) ? handler === shellBoundary : !1;
	}
	function pushDispatcher() {
		var prevDispatcher = ReactSharedInternals.H;
		ReactSharedInternals.H = ContextOnlyDispatcher;
		return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
	}
	function pushAsyncDispatcher() {
		var prevAsyncDispatcher = ReactSharedInternals.A;
		ReactSharedInternals.A = DefaultAsyncDispatcher;
		return prevAsyncDispatcher;
	}
	function renderDidSuspendDelayIfPossible() {
		workInProgressRootExitStatus = 4;
		workInProgressRootDidSkipSuspendedSiblings || (workInProgressRootRenderLanes & 4194048) !== workInProgressRootRenderLanes && null !== suspenseHandlerStackCursor.current || (workInProgressRootIsPrerendering = !0);
		0 === (workInProgressRootSkippedLanes & 134217727) && 0 === (workInProgressRootInterleavedUpdatedLanes & 134217727) || null === workInProgressRoot || markRootSuspended(workInProgressRoot, workInProgressRootRenderLanes, workInProgressDeferredLane, !1);
	}
	function renderRootSync(root, lanes, shouldYieldForPrerendering) {
		var prevExecutionContext = executionContext;
		executionContext |= 2;
		var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
		if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) workInProgressTransitions = null, prepareFreshStack(root, lanes);
		lanes = !1;
		var exitStatus = workInProgressRootExitStatus;
		a: do
			try {
				if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
					var unitOfWork = workInProgress, thrownValue = workInProgressThrownValue;
					switch (workInProgressSuspendedReason) {
						case 8:
							resetWorkInProgressStack();
							exitStatus = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							null === suspenseHandlerStackCursor.current && (lanes = !0);
							var reason = workInProgressSuspendedReason;
							workInProgressSuspendedReason = 0;
							workInProgressThrownValue = null;
							throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
							if (shouldYieldForPrerendering && workInProgressRootIsPrerendering) {
								exitStatus = 0;
								break a;
							}
							break;
						default: reason = workInProgressSuspendedReason, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
					}
				}
				workLoopSync();
				exitStatus = workInProgressRootExitStatus;
				break;
			} catch (thrownValue$184) {
				handleThrow(root, thrownValue$184);
			}
		while (1);
		lanes && root.shellSuspendCounter++;
		lastContextDependency = currentlyRenderingFiber$1 = null;
		executionContext = prevExecutionContext;
		ReactSharedInternals.H = prevDispatcher;
		ReactSharedInternals.A = prevAsyncDispatcher;
		null === workInProgress && (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates());
		return exitStatus;
	}
	function workLoopSync() {
		for (; null !== workInProgress;) performUnitOfWork(workInProgress);
	}
	function renderRootConcurrent(root, lanes) {
		var prevExecutionContext = executionContext;
		executionContext |= 2;
		var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
		workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes ? (workInProgressTransitions = null, workInProgressRootRenderTargetTime = now() + 500, prepareFreshStack(root, lanes)) : workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
		a: do
			try {
				if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
					lanes = workInProgress;
					var thrownValue = workInProgressThrownValue;
					b: switch (workInProgressSuspendedReason) {
						case 1:
							workInProgressSuspendedReason = 0;
							workInProgressThrownValue = null;
							throwAndUnwindWorkLoop(root, lanes, thrownValue, 1);
							break;
						case 2:
						case 9:
							if (isThenableResolved(thrownValue)) {
								workInProgressSuspendedReason = 0;
								workInProgressThrownValue = null;
								replaySuspendedUnitOfWork(lanes);
								break;
							}
							lanes = function() {
								2 !== workInProgressSuspendedReason && 9 !== workInProgressSuspendedReason || workInProgressRoot !== root || (workInProgressSuspendedReason = 7);
								ensureRootIsScheduled(root);
							};
							thrownValue.then(lanes, lanes);
							break a;
						case 3:
							workInProgressSuspendedReason = 7;
							break a;
						case 4:
							workInProgressSuspendedReason = 5;
							break a;
						case 7:
							isThenableResolved(thrownValue) ? (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes)) : (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root, lanes, thrownValue, 7));
							break;
						case 5:
							var resource = null;
							switch (workInProgress.tag) {
								case 26: resource = workInProgress.memoizedState;
								case 5:
								case 27:
									var hostFiber = workInProgress;
									if (resource ? preloadResource(resource) : hostFiber.stateNode.complete) {
										workInProgressSuspendedReason = 0;
										workInProgressThrownValue = null;
										var sibling = hostFiber.sibling;
										if (null !== sibling) workInProgress = sibling;
										else {
											var returnFiber = hostFiber.return;
											null !== returnFiber ? (workInProgress = returnFiber, completeUnitOfWork(returnFiber)) : workInProgress = null;
										}
										break b;
									}
							}
							workInProgressSuspendedReason = 0;
							workInProgressThrownValue = null;
							throwAndUnwindWorkLoop(root, lanes, thrownValue, 5);
							break;
						case 6:
							workInProgressSuspendedReason = 0;
							workInProgressThrownValue = null;
							throwAndUnwindWorkLoop(root, lanes, thrownValue, 6);
							break;
						case 8:
							resetWorkInProgressStack();
							workInProgressRootExitStatus = 6;
							break a;
						default: throw Error(formatProdErrorMessage(462));
					}
				}
				workLoopConcurrentByScheduler();
				break;
			} catch (thrownValue$186) {
				handleThrow(root, thrownValue$186);
			}
		while (1);
		lastContextDependency = currentlyRenderingFiber$1 = null;
		ReactSharedInternals.H = prevDispatcher;
		ReactSharedInternals.A = prevAsyncDispatcher;
		executionContext = prevExecutionContext;
		if (null !== workInProgress) return 0;
		workInProgressRoot = null;
		workInProgressRootRenderLanes = 0;
		finishQueueingConcurrentUpdates();
		return workInProgressRootExitStatus;
	}
	function workLoopConcurrentByScheduler() {
		for (; null !== workInProgress && !shouldYield();) performUnitOfWork(workInProgress);
	}
	function performUnitOfWork(unitOfWork) {
		var next = beginWork(unitOfWork.alternate, unitOfWork, entangledRenderLanes);
		unitOfWork.memoizedProps = unitOfWork.pendingProps;
		null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
	}
	function replaySuspendedUnitOfWork(unitOfWork) {
		var next = unitOfWork;
		var current = next.alternate;
		switch (next.tag) {
			case 15:
			case 0:
				next = replayFunctionComponent(current, next, next.pendingProps, next.type, void 0, workInProgressRootRenderLanes);
				break;
			case 11:
				next = replayFunctionComponent(current, next, next.pendingProps, next.type.render, next.ref, workInProgressRootRenderLanes);
				break;
			case 5:
				resetHooksOnUnwind(next);
				var fiber = next;
				fiber === hydrationParentFiber && (isHydrating ? (popToNextHostParent(fiber), 5 === fiber.tag && null != fiber.stateNode && (nextHydratableInstance = fiber.stateNode)) : (popToNextHostParent(fiber), isHydrating = !0));
			default: unwindInterruptedWork(current, next), next = workInProgress = resetWorkInProgress(next, entangledRenderLanes), next = beginWork(current, next, entangledRenderLanes);
		}
		unitOfWork.memoizedProps = unitOfWork.pendingProps;
		null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
	}
	function throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, suspendedReason) {
		lastContextDependency = currentlyRenderingFiber$1 = null;
		resetHooksOnUnwind(unitOfWork);
		thenableState$1 = null;
		thenableIndexCounter$1 = 0;
		var returnFiber = unitOfWork.return;
		try {
			if (throwException(root, returnFiber, unitOfWork, thrownValue, workInProgressRootRenderLanes)) {
				workInProgressRootExitStatus = 1;
				logUncaughtError(root, createCapturedValueAtFiber(thrownValue, root.current));
				workInProgress = null;
				return;
			}
		} catch (error) {
			if (null !== returnFiber) throw workInProgress = returnFiber, error;
			workInProgressRootExitStatus = 1;
			logUncaughtError(root, createCapturedValueAtFiber(thrownValue, root.current));
			workInProgress = null;
			return;
		}
		if (unitOfWork.flags & 32768) {
			if (isHydrating || 1 === suspendedReason) root = !0;
			else if (workInProgressRootIsPrerendering || 0 !== (workInProgressRootRenderLanes & 536870912)) root = !1;
			else if (workInProgressRootDidSkipSuspendedSiblings = root = !0, 2 === suspendedReason || 9 === suspendedReason || 3 === suspendedReason || 6 === suspendedReason) suspendedReason = suspenseHandlerStackCursor.current, null !== suspendedReason && 13 === suspendedReason.tag && (suspendedReason.flags |= 16384);
			unwindUnitOfWork(unitOfWork, root);
		} else completeUnitOfWork(unitOfWork);
	}
	function completeUnitOfWork(unitOfWork) {
		var completedWork = unitOfWork;
		do {
			if (0 !== (completedWork.flags & 32768)) {
				unwindUnitOfWork(completedWork, workInProgressRootDidSkipSuspendedSiblings);
				return;
			}
			unitOfWork = completedWork.return;
			var next = completeWork(completedWork.alternate, completedWork, entangledRenderLanes);
			if (null !== next) {
				workInProgress = next;
				return;
			}
			completedWork = completedWork.sibling;
			if (null !== completedWork) {
				workInProgress = completedWork;
				return;
			}
			workInProgress = completedWork = unitOfWork;
		} while (null !== completedWork);
		0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
	}
	function unwindUnitOfWork(unitOfWork, skipSiblings) {
		do {
			var next = unwindWork(unitOfWork.alternate, unitOfWork);
			if (null !== next) {
				next.flags &= 32767;
				workInProgress = next;
				return;
			}
			next = unitOfWork.return;
			null !== next && (next.flags |= 32768, next.subtreeFlags = 0, next.deletions = null);
			if (!skipSiblings && (unitOfWork = unitOfWork.sibling, null !== unitOfWork)) {
				workInProgress = unitOfWork;
				return;
			}
			workInProgress = unitOfWork = next;
		} while (null !== unitOfWork);
		workInProgressRootExitStatus = 6;
		workInProgress = null;
	}
	function completeRoot(root, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedState) {
		root.cancelPendingCommit = null;
		do
			flushPendingEffects();
		while (0 !== pendingEffectsStatus);
		if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
		if (null !== finishedWork) {
			if (finishedWork === root.current) throw Error(formatProdErrorMessage(177));
			root === workInProgressRoot && (workInProgress = workInProgressRoot = null, workInProgressRootRenderLanes = 0);
			pendingFinishedWork = finishedWork;
			pendingEffectsRoot = root;
			pendingEffectsLanes = lanes;
			pendingPassiveTransitions = transitions;
			pendingRecoverableErrors = recoverableErrors;
			commitRoot(root, finishedWork, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, suspendedState);
		}
	}
	function commitRoot(root, finishedWork, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, suspendedState) {
		var remainingLanes = finishedWork.lanes | finishedWork.childLanes;
		pendingEffectsRemainingLanes = remainingLanes;
		remainingLanes |= concurrentlyUpdatedLanes;
		markRootFinished(root, lanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes);
		pendingViewTransitionEvents = null;
		(lanes & 335544064) === lanes ? (pendingTransitionTypes = claimQueuedTransitionTypes(root), spawnedLane = 10262) : (pendingTransitionTypes = null, spawnedLane = 10256);
		0 !== (finishedWork.subtreeFlags & spawnedLane) || 0 !== (finishedWork.flags & spawnedLane) ? (root.callbackNode = null, root.callbackPriority = 0, scheduleCallback$1(NormalPriority$1, function() {
			flushPassiveEffects();
			return null;
		})) : (root.callbackNode = null, root.callbackPriority = 0);
		shouldStartViewTransition = !1;
		spawnedLane = 0 !== (finishedWork.flags & 13878);
		if (0 !== (finishedWork.subtreeFlags & 13878) || spawnedLane) {
			spawnedLane = ReactSharedInternals.T;
			ReactSharedInternals.T = null;
			updatedLanes = ReactDOMSharedInternals.p;
			ReactDOMSharedInternals.p = 2;
			suspendedRetryLanes = executionContext;
			executionContext |= 4;
			try {
				commitBeforeMutationEffects(root, finishedWork, lanes);
			} finally {
				executionContext = suspendedRetryLanes, ReactDOMSharedInternals.p = updatedLanes, ReactSharedInternals.T = spawnedLane;
			}
		}
		pendingEffectsStatus = 1;
		shouldStartViewTransition ? pendingViewTransition = startViewTransition(suspendedState, root.containerInfo, pendingTransitionTypes, flushMutationEffects, flushLayoutEffects, flushAfterMutationEffects, flushSpawnedWork, flushPassiveEffects, reportViewTransitionError, null, null) : (flushMutationEffects(), flushLayoutEffects(), flushSpawnedWork());
	}
	function reportViewTransitionError(error) {
		if (0 !== pendingEffectsStatus) {
			var onRecoverableError = pendingEffectsRoot.onRecoverableError;
			onRecoverableError(error, { componentStack: null });
		}
	}
	function flushAfterMutationEffects() {
		3 === pendingEffectsStatus && (pendingEffectsStatus = 0, commitAfterMutationEffectsOnFiber(pendingFinishedWork, pendingEffectsRoot), pendingEffectsStatus = 4);
	}
	function flushMutationEffects() {
		if (1 === pendingEffectsStatus) {
			pendingEffectsStatus = 0;
			var root = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
			if (0 !== (finishedWork.subtreeFlags & 13878) || rootMutationHasEffect) {
				rootMutationHasEffect = ReactSharedInternals.T;
				ReactSharedInternals.T = null;
				var previousPriority = ReactDOMSharedInternals.p;
				ReactDOMSharedInternals.p = 2;
				var prevExecutionContext = executionContext;
				executionContext |= 4;
				try {
					inUpdateViewTransition = rootViewTransitionAffected = !1;
					commitMutationEffectsOnFiber(finishedWork, root, lanes);
					lanes = selectionInformation;
					var curFocusedElem = getActiveElementDeep(root.containerInfo), priorFocusedElem = lanes.focusedElem, priorSelectionRange = lanes.selectionRange;
					if (curFocusedElem !== priorFocusedElem && priorFocusedElem && priorFocusedElem.ownerDocument && containsNode(priorFocusedElem.ownerDocument.documentElement, priorFocusedElem)) {
						if (null !== priorSelectionRange && hasSelectionCapabilities(priorFocusedElem)) {
							var start = priorSelectionRange.start, end = priorSelectionRange.end;
							void 0 === end && (end = start);
							if ("selectionStart" in priorFocusedElem) priorFocusedElem.selectionStart = start, priorFocusedElem.selectionEnd = Math.min(end, priorFocusedElem.value.length);
							else {
								var doc = priorFocusedElem.ownerDocument || document, win = doc && doc.defaultView || window;
								if (win.getSelection) {
									var selection = win.getSelection(), length = priorFocusedElem.textContent.length, start$jscomp$0 = Math.min(priorSelectionRange.start, length), end$jscomp$0 = void 0 === priorSelectionRange.end ? start$jscomp$0 : Math.min(priorSelectionRange.end, length);
									!selection.extend && start$jscomp$0 > end$jscomp$0 && (curFocusedElem = end$jscomp$0, end$jscomp$0 = start$jscomp$0, start$jscomp$0 = curFocusedElem);
									var startMarker = getNodeForCharacterOffset(priorFocusedElem, start$jscomp$0), endMarker = getNodeForCharacterOffset(priorFocusedElem, end$jscomp$0);
									if (startMarker && endMarker && (1 !== selection.rangeCount || selection.anchorNode !== startMarker.node || selection.anchorOffset !== startMarker.offset || selection.focusNode !== endMarker.node || selection.focusOffset !== endMarker.offset)) {
										var range = doc.createRange();
										range.setStart(startMarker.node, startMarker.offset);
										selection.removeAllRanges();
										start$jscomp$0 > end$jscomp$0 ? (selection.addRange(range), selection.extend(endMarker.node, endMarker.offset)) : (range.setEnd(endMarker.node, endMarker.offset), selection.addRange(range));
									}
								}
							}
						}
						doc = [];
						for (selection = priorFocusedElem; selection = selection.parentNode;) 1 === selection.nodeType && doc.push({
							element: selection,
							left: selection.scrollLeft,
							top: selection.scrollTop
						});
						"function" === typeof priorFocusedElem.focus && priorFocusedElem.focus();
						for (priorFocusedElem = 0; priorFocusedElem < doc.length; priorFocusedElem++) {
							var info = doc[priorFocusedElem];
							info.element.scrollLeft = info.left;
							info.element.scrollTop = info.top;
						}
					}
					_enabled = !!eventsEnabled;
					selectionInformation = eventsEnabled = null;
				} finally {
					executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootMutationHasEffect;
				}
			}
			root.current = finishedWork;
			pendingEffectsStatus = 2;
		}
	}
	function flushLayoutEffects() {
		if (2 === pendingEffectsStatus) {
			pendingEffectsStatus = 0;
			var root = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootHasLayoutEffect = 0 !== (finishedWork.flags & 8772);
			if (0 !== (finishedWork.subtreeFlags & 8772) || rootHasLayoutEffect) {
				rootHasLayoutEffect = ReactSharedInternals.T;
				ReactSharedInternals.T = null;
				var previousPriority = ReactDOMSharedInternals.p;
				ReactDOMSharedInternals.p = 2;
				var prevExecutionContext = executionContext;
				executionContext |= 4;
				try {
					commitLayoutEffectOnFiber(root, finishedWork.alternate, finishedWork);
				} finally {
					executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootHasLayoutEffect;
				}
			}
			pendingEffectsStatus = 3;
		}
	}
	function flushSpawnedWork() {
		if (4 === pendingEffectsStatus || 3 === pendingEffectsStatus) {
			pendingEffectsStatus = 0;
			var committedViewTransition = pendingViewTransition;
			pendingViewTransition = null;
			requestPaint();
			var root = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, recoverableErrors = pendingRecoverableErrors, passiveSubtreeMask = (lanes & 335544064) === lanes ? 10262 : 10256;
			0 !== (finishedWork.subtreeFlags & passiveSubtreeMask) || 0 !== (finishedWork.flags & passiveSubtreeMask) ? pendingEffectsStatus = 5 : (pendingEffectsStatus = 0, pendingFinishedWork = pendingEffectsRoot = null, releaseRootPooledCache(root, root.pendingLanes));
			passiveSubtreeMask = root.pendingLanes;
			0 === passiveSubtreeMask && (legacyErrorBoundariesThatAlreadyFailed = null);
			lanesToEventPriority(lanes);
			finishedWork = finishedWork.stateNode;
			if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot) try {
				injectedHook.onCommitFiberRoot(rendererID, finishedWork, void 0, 128 === (finishedWork.current.flags & 128));
			} catch (err) {}
			if (null !== recoverableErrors) {
				finishedWork = ReactSharedInternals.T;
				passiveSubtreeMask = ReactDOMSharedInternals.p;
				ReactDOMSharedInternals.p = 2;
				ReactSharedInternals.T = null;
				try {
					for (var onRecoverableError = root.onRecoverableError, i = 0; i < recoverableErrors.length; i++) {
						var recoverableError = recoverableErrors[i];
						onRecoverableError(recoverableError.value, { componentStack: recoverableError.stack });
					}
				} finally {
					ReactSharedInternals.T = finishedWork, ReactDOMSharedInternals.p = passiveSubtreeMask;
				}
			}
			recoverableErrors = pendingViewTransitionEvents;
			onRecoverableError = pendingTransitionTypes;
			pendingTransitionTypes = null;
			if (null !== recoverableErrors && (pendingViewTransitionEvents = null, null === onRecoverableError && (onRecoverableError = []), null !== committedViewTransition)) for (recoverableError = 0; recoverableError < recoverableErrors.length; recoverableError++) finishedWork = (0, recoverableErrors[recoverableError])(onRecoverableError), void 0 !== finishedWork && committedViewTransition.finished.finally(finishedWork);
			0 !== (pendingEffectsLanes & 3) && flushPendingEffects();
			ensureRootIsScheduled(root);
			passiveSubtreeMask = root.pendingLanes;
			0 !== (lanes & 261930) && 0 !== (passiveSubtreeMask & 42) ? root === rootWithNestedUpdates ? nestedUpdateCount++ : (nestedUpdateCount = 0, rootWithNestedUpdates = root) : (nestedUpdateCount = 0, rootWithNestedUpdates = null);
			flushSyncWorkAcrossRoots_impl(0, !1);
		}
	}
	function releaseRootPooledCache(root, remainingLanes) {
		0 === (root.pooledCacheLanes &= remainingLanes) && (remainingLanes = root.pooledCache, null != remainingLanes && (root.pooledCache = null, releaseCache(remainingLanes)));
	}
	function flushPendingEffects() {
		null !== pendingViewTransition && (pendingViewTransition.skipTransition(), pendingViewTransition = null);
		flushMutationEffects();
		flushLayoutEffects();
		flushSpawnedWork();
		return flushPassiveEffects();
	}
	function flushPassiveEffects() {
		if (5 !== pendingEffectsStatus) return !1;
		var root = pendingEffectsRoot, remainingLanes = pendingEffectsRemainingLanes;
		pendingEffectsRemainingLanes = 0;
		var renderPriority = lanesToEventPriority(pendingEffectsLanes), prevTransition = ReactSharedInternals.T, previousPriority = ReactDOMSharedInternals.p;
		try {
			ReactDOMSharedInternals.p = 32 > renderPriority ? 32 : renderPriority;
			ReactSharedInternals.T = null;
			renderPriority = pendingPassiveTransitions;
			pendingPassiveTransitions = null;
			var root$jscomp$0 = pendingEffectsRoot, lanes = pendingEffectsLanes;
			pendingEffectsStatus = 0;
			pendingFinishedWork = pendingEffectsRoot = null;
			pendingEffectsLanes = 0;
			if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(331));
			var prevExecutionContext = executionContext;
			executionContext |= 4;
			commitPassiveUnmountOnFiber(root$jscomp$0.current);
			commitPassiveMountOnFiber(root$jscomp$0, root$jscomp$0.current, lanes, renderPriority);
			executionContext = prevExecutionContext;
			flushSyncWorkAcrossRoots_impl(0, !1);
			if (injectedHook && "function" === typeof injectedHook.onPostCommitFiberRoot) try {
				injectedHook.onPostCommitFiberRoot(rendererID, root$jscomp$0);
			} catch (err) {}
			return !0;
		} finally {
			ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition, releaseRootPooledCache(root, remainingLanes);
		}
	}
	function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
		sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
		sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
		rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
		null !== rootFiber && (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
	}
	function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
		if (3 === sourceFiber.tag) captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
		else for (; null !== nearestMountedAncestor;) {
			if (3 === nearestMountedAncestor.tag) {
				captureCommitPhaseErrorOnRoot(nearestMountedAncestor, sourceFiber, error);
				break;
			} else if (1 === nearestMountedAncestor.tag) {
				var instance = nearestMountedAncestor.stateNode;
				if ("function" === typeof nearestMountedAncestor.type.getDerivedStateFromError || "function" === typeof instance.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(instance))) {
					sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
					error = createClassErrorUpdate(2);
					instance = enqueueUpdate(nearestMountedAncestor, error, 2);
					null !== instance && (initializeClassErrorUpdate(error, instance, nearestMountedAncestor, sourceFiber), markRootUpdated$1(instance, 2), ensureRootIsScheduled(instance));
					break;
				}
			}
			nearestMountedAncestor = nearestMountedAncestor.return;
		}
	}
	function attachPingListener(root, wakeable, lanes) {
		var pingCache = root.pingCache;
		if (null === pingCache) {
			pingCache = root.pingCache = new PossiblyWeakMap();
			var threadIDs = /* @__PURE__ */ new Set();
			pingCache.set(wakeable, threadIDs);
		} else threadIDs = pingCache.get(wakeable), void 0 === threadIDs && (threadIDs = /* @__PURE__ */ new Set(), pingCache.set(wakeable, threadIDs));
		threadIDs.has(lanes) || (workInProgressRootDidAttachPingListener = !0, threadIDs.add(lanes), root = pingSuspendedRoot.bind(null, root, wakeable, lanes), wakeable.then(root, root));
	}
	function pingSuspendedRoot(root, wakeable, pingedLanes) {
		var pingCache = root.pingCache;
		null !== pingCache && pingCache.delete(wakeable);
		root.pingedLanes |= root.suspendedLanes & pingedLanes;
		root.warmLanes &= ~pingedLanes;
		workInProgressRoot === root && (workInProgressRootRenderLanes & pingedLanes) === pingedLanes && (4 === workInProgressRootExitStatus || 3 === workInProgressRootExitStatus && (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes && 300 > now() - globalMostRecentFallbackTime ? 0 === (executionContext & 2) ? prepareFreshStack(root, 0) : workInProgressRootPingedLanes |= pingedLanes : workInProgressRootPingedLanes |= pingedLanes, workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes && (workInProgressSuspendedRetryLanes = 0));
		ensureRootIsScheduled(root);
	}
	function retryTimedOutBoundary(boundaryFiber, retryLane) {
		0 === retryLane && (retryLane = claimNextRetryLane());
		boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
		null !== boundaryFiber && (markRootUpdated$1(boundaryFiber, retryLane), ensureRootIsScheduled(boundaryFiber));
	}
	function retryDehydratedSuspenseBoundary(boundaryFiber) {
		var suspenseState = boundaryFiber.memoizedState, retryLane = 0;
		null !== suspenseState && (retryLane = suspenseState.retryLane);
		retryTimedOutBoundary(boundaryFiber, retryLane);
	}
	function resolveRetryWakeable(boundaryFiber, wakeable) {
		var retryLane = 0;
		switch (boundaryFiber.tag) {
			case 31:
			case 13:
				var retryCache = boundaryFiber.stateNode;
				var suspenseState = boundaryFiber.memoizedState;
				null !== suspenseState && (retryLane = suspenseState.retryLane);
				break;
			case 19:
				retryCache = boundaryFiber.stateNode;
				break;
			case 22:
				retryCache = boundaryFiber.stateNode._retryCache;
				break;
			default: throw Error(formatProdErrorMessage(314));
		}
		null !== retryCache && retryCache.delete(wakeable);
		retryTimedOutBoundary(boundaryFiber, retryLane);
	}
	function scheduleCallback$1(priorityLevel, callback) {
		return scheduleCallback$3(priorityLevel, callback);
	}
	var firstScheduledRoot = null;
	var lastScheduledRoot = null;
	var didScheduleMicrotask = !1;
	var mightHavePendingSyncWork = !1;
	var isFlushingWork = !1;
	var currentEventTransitionLane = 0;
	function ensureRootIsScheduled(root) {
		root !== lastScheduledRoot && null === root.next && (null === lastScheduledRoot ? firstScheduledRoot = lastScheduledRoot = root : lastScheduledRoot = lastScheduledRoot.next = root);
		mightHavePendingSyncWork = !0;
		didScheduleMicrotask || (didScheduleMicrotask = !0, scheduleImmediateRootScheduleTask());
	}
	function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
		if (!isFlushingWork && mightHavePendingSyncWork) {
			isFlushingWork = !0;
			do {
				var didPerformSomeWork = !1;
				for (var root$190 = firstScheduledRoot; null !== root$190;) {
					if (!onlyLegacy) if (0 !== syncTransitionLanes) {
						var pendingLanes = root$190.pendingLanes;
						if (0 === pendingLanes) var JSCompiler_inline_result = 0;
						else {
							var suspendedLanes = root$190.suspendedLanes, pingedLanes = root$190.pingedLanes;
							JSCompiler_inline_result = (1 << 31 - clz32(42 | syncTransitionLanes) + 1) - 1;
							JSCompiler_inline_result &= pendingLanes & ~(suspendedLanes & ~pingedLanes);
							JSCompiler_inline_result = JSCompiler_inline_result & 201326741 ? JSCompiler_inline_result & 201326741 | 1 : JSCompiler_inline_result ? JSCompiler_inline_result | 2 : 0;
						}
						0 !== JSCompiler_inline_result && (didPerformSomeWork = !0, performSyncWorkOnRoot(root$190, JSCompiler_inline_result));
					} else JSCompiler_inline_result = workInProgressRootRenderLanes, JSCompiler_inline_result = getNextLanes(root$190, root$190 === workInProgressRoot ? JSCompiler_inline_result : 0, null !== root$190.cancelPendingCommit || -1 !== root$190.timeoutHandle), 0 === (JSCompiler_inline_result & 3) || checkIfRootIsPrerendering(root$190, JSCompiler_inline_result) || (didPerformSomeWork = !0, performSyncWorkOnRoot(root$190, JSCompiler_inline_result));
					root$190 = root$190.next;
				}
			} while (didPerformSomeWork);
			isFlushingWork = !1;
		}
	}
	function processRootScheduleInImmediateTask() {
		processRootScheduleInMicrotask();
	}
	function processRootScheduleInMicrotask() {
		mightHavePendingSyncWork = didScheduleMicrotask = !1;
		var syncTransitionLanes = 0;
		0 !== currentEventTransitionLane && shouldAttemptEagerTransition() && (syncTransitionLanes = currentEventTransitionLane);
		for (var currentTime = now(), prev = null, root = firstScheduledRoot; null !== root;) {
			var next = root.next, nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
			if (0 === nextLanes) root.next = null, null === prev ? firstScheduledRoot = next : prev.next = next, null === next && (lastScheduledRoot = prev);
			else if (prev = root, 0 !== syncTransitionLanes || 0 !== (nextLanes & 3)) mightHavePendingSyncWork = !0;
			root = next;
		}
		0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus || flushSyncWorkAcrossRoots_impl(syncTransitionLanes, !1);
		0 !== currentEventTransitionLane && (currentEventTransitionLane = 0);
	}
	function scheduleTaskForRootDuringMicrotask(root, currentTime) {
		for (var suspendedLanes = root.suspendedLanes, pingedLanes = root.pingedLanes, expirationTimes = root.expirationTimes, lanes = root.pendingLanes & -62914561; 0 < lanes;) {
			var index$5 = 31 - clz32(lanes), lane = 1 << index$5, expirationTime = expirationTimes[index$5];
			if (-1 === expirationTime) {
				if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes)) expirationTimes[index$5] = computeExpirationTime(lane, currentTime);
			} else expirationTime <= currentTime && (root.expiredLanes |= lane);
			lanes &= ~lane;
		}
		currentTime = workInProgressRoot;
		suspendedLanes = workInProgressRootRenderLanes;
		suspendedLanes = getNextLanes(root, root === currentTime ? suspendedLanes : 0, null !== root.cancelPendingCommit || -1 !== root.timeoutHandle);
		pingedLanes = root.callbackNode;
		if (0 === suspendedLanes || root === currentTime && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root.cancelPendingCommit) return null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes), root.callbackNode = null, root.callbackPriority = 0;
		if (0 === (suspendedLanes & 3) || checkIfRootIsPrerendering(root, suspendedLanes)) {
			currentTime = suspendedLanes & -suspendedLanes;
			if (currentTime === root.callbackPriority) return currentTime;
			null !== pingedLanes && cancelCallback$1(pingedLanes);
			switch (lanesToEventPriority(suspendedLanes)) {
				case 2:
				case 8:
					suspendedLanes = UserBlockingPriority;
					break;
				case 32:
					suspendedLanes = NormalPriority$1;
					break;
				case 268435456:
					suspendedLanes = IdlePriority;
					break;
				default: suspendedLanes = NormalPriority$1;
			}
			pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root);
			suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes);
			root.callbackPriority = currentTime;
			root.callbackNode = suspendedLanes;
			return currentTime;
		}
		null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes);
		root.callbackPriority = 2;
		root.callbackNode = null;
		return 2;
	}
	function performWorkOnRootViaSchedulerTask(root, didTimeout) {
		if (0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus) return root.callbackNode = null, root.callbackPriority = 0, null;
		var originalCallbackNode = root.callbackNode;
		if (flushPendingEffects() && root.callbackNode !== originalCallbackNode) return null;
		var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
		workInProgressRootRenderLanes$jscomp$0 = getNextLanes(root, root === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0, null !== root.cancelPendingCommit || -1 !== root.timeoutHandle);
		if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
		performWorkOnRoot(root, workInProgressRootRenderLanes$jscomp$0, didTimeout);
		scheduleTaskForRootDuringMicrotask(root, now());
		return null != root.callbackNode && root.callbackNode === originalCallbackNode ? performWorkOnRootViaSchedulerTask.bind(null, root) : null;
	}
	function performSyncWorkOnRoot(root, lanes) {
		if (flushPendingEffects()) return null;
		performWorkOnRoot(root, lanes, !0);
	}
	function scheduleImmediateRootScheduleTask() {
		scheduleMicrotask(function() {
			0 !== (executionContext & 6) ? scheduleCallback$3(ImmediatePriority, processRootScheduleInImmediateTask) : processRootScheduleInMicrotask();
		});
	}
	function requestTransitionLane() {
		if (0 === currentEventTransitionLane) {
			var actionScopeLane = currentEntangledLane;
			0 === actionScopeLane && (actionScopeLane = nextTransitionUpdateLane, nextTransitionUpdateLane <<= 1, 0 === (nextTransitionUpdateLane & 261888) && (nextTransitionUpdateLane = 256));
			currentEventTransitionLane = actionScopeLane;
		}
		return currentEventTransitionLane;
	}
	function coerceFormActionProp(actionProp) {
		return null == actionProp || "symbol" === typeof actionProp || "boolean" === typeof actionProp ? null : "function" === typeof actionProp ? actionProp : sanitizeURL(actionProp);
	}
	function extractEvents$1(dispatchQueue, domEventName, maybeTargetInst, nativeEvent, nativeEventTarget) {
		if ("submit" === domEventName && maybeTargetInst && maybeTargetInst.stateNode === nativeEventTarget) {
			var action = coerceFormActionProp((nativeEventTarget[internalPropsKey] || null).action), submitter = nativeEvent.submitter;
			submitter && (domEventName = (domEventName = submitter[internalPropsKey] || null) ? coerceFormActionProp(domEventName.formAction) : submitter.getAttribute("formAction"), null !== domEventName && (action = domEventName, submitter = null));
			var event = new SyntheticEvent("action", "action", null, nativeEvent, nativeEventTarget);
			dispatchQueue.push({
				event,
				listeners: [{
					instance: null,
					listener: function() {
						if (nativeEvent.defaultPrevented) {
							if (0 !== currentEventTransitionLane) {
								var formData = new FormData(nativeEventTarget, submitter);
								startHostTransition(maybeTargetInst, {
									pending: !0,
									data: formData,
									method: nativeEventTarget.method,
									action
								}, null, formData);
							}
						} else "function" === typeof action && (event.preventDefault(), formData = new FormData(nativeEventTarget, submitter), startHostTransition(maybeTargetInst, {
							pending: !0,
							data: formData,
							method: nativeEventTarget.method,
							action
						}, action, formData));
					},
					currentTarget: nativeEventTarget
				}]
			});
		}
	}
	for (var i$jscomp$inline_1667 = 0; i$jscomp$inline_1667 < simpleEventPluginEvents.length; i$jscomp$inline_1667++) {
		var eventName$jscomp$inline_1668 = simpleEventPluginEvents[i$jscomp$inline_1667];
		registerSimpleEvent(eventName$jscomp$inline_1668.toLowerCase(), "on" + (eventName$jscomp$inline_1668[0].toUpperCase() + eventName$jscomp$inline_1668.slice(1)));
	}
	registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
	registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
	registerSimpleEvent(ANIMATION_START, "onAnimationStart");
	registerSimpleEvent("dblclick", "onDoubleClick");
	registerSimpleEvent("focusin", "onFocus");
	registerSimpleEvent("focusout", "onBlur");
	registerSimpleEvent(TRANSITION_RUN, "onTransitionRun");
	registerSimpleEvent(TRANSITION_START, "onTransitionStart");
	registerSimpleEvent(TRANSITION_CANCEL, "onTransitionCancel");
	registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
	registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
	registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
	registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
	registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
	registerTwoPhaseEvent("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
	registerTwoPhaseEvent("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
	registerTwoPhaseEvent("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]);
	registerTwoPhaseEvent("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
	registerTwoPhaseEvent("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
	registerTwoPhaseEvent("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var mediaEventTypes = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
	var nonDelegatedEvents = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(mediaEventTypes));
	function processDispatchQueue(dispatchQueue, eventSystemFlags) {
		eventSystemFlags = 0 !== (eventSystemFlags & 4);
		for (var i = 0; i < dispatchQueue.length; i++) {
			var _dispatchQueue$i = dispatchQueue[i], event = _dispatchQueue$i.event;
			_dispatchQueue$i = _dispatchQueue$i.listeners;
			a: {
				var previousInstance = void 0;
				if (eventSystemFlags) for (var i$jscomp$0 = _dispatchQueue$i.length - 1; 0 <= i$jscomp$0; i$jscomp$0--) {
					var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget;
					_dispatchListeners$i = _dispatchListeners$i.listener;
					if (instance !== previousInstance && event.isPropagationStopped()) break a;
					previousInstance = _dispatchListeners$i;
					event.currentTarget = currentTarget;
					try {
						previousInstance(event);
					} catch (error) {
						reportGlobalError(error);
					}
					event.currentTarget = null;
					previousInstance = instance;
				}
				else for (i$jscomp$0 = 0; i$jscomp$0 < _dispatchQueue$i.length; i$jscomp$0++) {
					_dispatchListeners$i = _dispatchQueue$i[i$jscomp$0];
					instance = _dispatchListeners$i.instance;
					currentTarget = _dispatchListeners$i.currentTarget;
					_dispatchListeners$i = _dispatchListeners$i.listener;
					if (instance !== previousInstance && event.isPropagationStopped()) break a;
					previousInstance = _dispatchListeners$i;
					event.currentTarget = currentTarget;
					try {
						previousInstance(event);
					} catch (error) {
						reportGlobalError(error);
					}
					event.currentTarget = null;
					previousInstance = instance;
				}
			}
		}
	}
	function listenToNonDelegatedEvent(domEventName, targetElement) {
		var JSCompiler_inline_result = targetElement[internalEventHandlersKey];
		void 0 === JSCompiler_inline_result && (JSCompiler_inline_result = targetElement[internalEventHandlersKey] = /* @__PURE__ */ new Set());
		var listenerSetKey = domEventName + "__bubble";
		JSCompiler_inline_result.has(listenerSetKey) || (addTrappedEventListener(targetElement, domEventName, 2, !1), JSCompiler_inline_result.add(listenerSetKey));
	}
	function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
		var eventSystemFlags = 0;
		isCapturePhaseListener && (eventSystemFlags |= 4);
		addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
	}
	var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
	function listenToAllSupportedEvents(rootContainerElement) {
		if (!rootContainerElement[listeningMarker]) {
			rootContainerElement[listeningMarker] = !0;
			allNativeEvents.forEach(function(domEventName) {
				"selectionchange" !== domEventName && (nonDelegatedEvents.has(domEventName) || listenToNativeEvent(domEventName, !1, rootContainerElement), listenToNativeEvent(domEventName, !0, rootContainerElement));
			});
			var ownerDocument = 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
			null === ownerDocument || ownerDocument[listeningMarker] || (ownerDocument[listeningMarker] = !0, listenToNativeEvent("selectionchange", !1, ownerDocument));
		}
	}
	function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
		switch (getEventPriority(domEventName)) {
			case 2:
				var listenerWrapper = dispatchDiscreteEvent;
				break;
			case 8:
				listenerWrapper = dispatchContinuousEvent;
				break;
			default: listenerWrapper = dispatchEvent;
		}
		eventSystemFlags = listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
		listenerWrapper = void 0;
		!passiveBrowserEventsSupported || "touchstart" !== domEventName && "touchmove" !== domEventName && "wheel" !== domEventName || (listenerWrapper = !0);
		isCapturePhaseListener ? void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
			capture: !0,
			passive: listenerWrapper
		}) : targetContainer.addEventListener(domEventName, eventSystemFlags, !0) : void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, { passive: listenerWrapper }) : targetContainer.addEventListener(domEventName, eventSystemFlags, !1);
	}
	function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst$jscomp$0, targetContainer) {
		var ancestorInst = targetInst$jscomp$0;
		if (0 === (eventSystemFlags & 1) && 0 === (eventSystemFlags & 2) && null !== targetInst$jscomp$0) a: for (;;) {
			if (null === targetInst$jscomp$0) return;
			var nodeTag = targetInst$jscomp$0.tag;
			if (3 === nodeTag || 4 === nodeTag) {
				var container = targetInst$jscomp$0.stateNode.containerInfo;
				if (container === targetContainer) break;
				if (4 === nodeTag) for (nodeTag = targetInst$jscomp$0.return; null !== nodeTag;) {
					var grandTag = nodeTag.tag;
					if ((3 === grandTag || 4 === grandTag) && nodeTag.stateNode.containerInfo === targetContainer) return;
					nodeTag = nodeTag.return;
				}
				for (; null !== container;) {
					nodeTag = getClosestInstanceFromNode(container);
					if (null === nodeTag) return;
					grandTag = nodeTag.tag;
					if (5 === grandTag || 6 === grandTag || 26 === grandTag || 27 === grandTag) {
						targetInst$jscomp$0 = ancestorInst = nodeTag;
						continue a;
					}
					container = container.parentNode;
				}
			}
			targetInst$jscomp$0 = targetInst$jscomp$0.return;
		}
		batchedUpdates$1(function() {
			var targetInst = ancestorInst, nativeEventTarget = getEventTarget(nativeEvent), dispatchQueue = [];
			a: {
				var reactName = topLevelEventsToReactNames.get(domEventName);
				if (void 0 !== reactName) {
					var SyntheticEventCtor = SyntheticEvent, reactEventType = domEventName;
					switch (domEventName) {
						case "keypress": if (0 === getEventCharCode(nativeEvent)) break a;
						case "keydown":
						case "keyup":
							SyntheticEventCtor = SyntheticKeyboardEvent;
							break;
						case "focusin":
							reactEventType = "focus";
							SyntheticEventCtor = SyntheticFocusEvent;
							break;
						case "focusout":
							reactEventType = "blur";
							SyntheticEventCtor = SyntheticFocusEvent;
							break;
						case "beforeblur":
						case "afterblur":
							SyntheticEventCtor = SyntheticFocusEvent;
							break;
						case "click": if (2 === nativeEvent.button) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							SyntheticEventCtor = SyntheticMouseEvent;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							SyntheticEventCtor = SyntheticDragEvent;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							SyntheticEventCtor = SyntheticTouchEvent;
							break;
						case ANIMATION_END:
						case ANIMATION_ITERATION:
						case ANIMATION_START:
							SyntheticEventCtor = SyntheticAnimationEvent;
							break;
						case TRANSITION_END:
							SyntheticEventCtor = SyntheticTransitionEvent;
							break;
						case "scroll":
						case "scrollend":
							SyntheticEventCtor = SyntheticUIEvent;
							break;
						case "wheel":
							SyntheticEventCtor = SyntheticWheelEvent;
							break;
						case "copy":
						case "cut":
						case "paste":
							SyntheticEventCtor = SyntheticClipboardEvent;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							SyntheticEventCtor = SyntheticPointerEvent;
							break;
						case "submit":
							SyntheticEventCtor = SyntheticSubmitEvent;
							break;
						case "toggle":
						case "beforetoggle": SyntheticEventCtor = SyntheticToggleEvent;
					}
					var inCapturePhase = 0 !== (eventSystemFlags & 4), accumulateTargetOnly = !inCapturePhase && ("scroll" === domEventName || "scrollend" === domEventName), reactEventName = inCapturePhase ? null !== reactName ? reactName + "Capture" : null : reactName;
					inCapturePhase = [];
					for (var instance = targetInst, lastHostComponent; null !== instance;) {
						var _instance = instance;
						lastHostComponent = _instance.stateNode;
						_instance = _instance.tag;
						5 !== _instance && 26 !== _instance && 27 !== _instance || null === lastHostComponent || null === reactEventName || (_instance = getListener(instance, reactEventName), null != _instance && inCapturePhase.push(createDispatchListener(instance, _instance, lastHostComponent)));
						if (accumulateTargetOnly) break;
						instance = instance.return;
					}
					0 < inCapturePhase.length && (reactName = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget), dispatchQueue.push({
						event: reactName,
						listeners: inCapturePhase
					}));
				}
			}
			if (0 === (eventSystemFlags & 7)) {
				a: {
					SyntheticEventCtor = "mouseover" === domEventName || "pointerover" === domEventName;
					reactName = "mouseout" === domEventName || "pointerout" === domEventName;
					if (SyntheticEventCtor && nativeEvent !== currentReplayingEvent && (reactEventType = nativeEvent.relatedTarget || nativeEvent.fromElement) && (getClosestInstanceFromNode(reactEventType) || reactEventType[internalContainerInstanceKey])) break a;
					if (reactName || SyntheticEventCtor) {
						reactEventType = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget : (SyntheticEventCtor = nativeEventTarget.ownerDocument) ? SyntheticEventCtor.defaultView || SyntheticEventCtor.parentWindow : window;
						if (reactName) {
							if (SyntheticEventCtor = nativeEvent.relatedTarget || nativeEvent.toElement, reactName = targetInst, SyntheticEventCtor = SyntheticEventCtor ? getClosestInstanceFromNode(SyntheticEventCtor) : null, null !== SyntheticEventCtor && (accumulateTargetOnly = getNearestMountedFiber(SyntheticEventCtor), inCapturePhase = SyntheticEventCtor.tag, SyntheticEventCtor !== accumulateTargetOnly || 5 !== inCapturePhase && 27 !== inCapturePhase && 6 !== inCapturePhase)) SyntheticEventCtor = null;
						} else reactName = null, SyntheticEventCtor = targetInst;
						if (reactName !== SyntheticEventCtor) {
							inCapturePhase = SyntheticMouseEvent;
							_instance = "onMouseLeave";
							reactEventName = "onMouseEnter";
							instance = "mouse";
							if ("pointerout" === domEventName || "pointerover" === domEventName) inCapturePhase = SyntheticPointerEvent, _instance = "onPointerLeave", reactEventName = "onPointerEnter", instance = "pointer";
							accumulateTargetOnly = null == reactName ? reactEventType : getNodeFromInstance(reactName);
							lastHostComponent = null == SyntheticEventCtor ? reactEventType : getNodeFromInstance(SyntheticEventCtor);
							reactEventType = new inCapturePhase(_instance, instance + "leave", reactName, nativeEvent, nativeEventTarget);
							reactEventType.target = accumulateTargetOnly;
							reactEventType.relatedTarget = lastHostComponent;
							_instance = null;
							getClosestInstanceFromNode(nativeEventTarget) === targetInst && (inCapturePhase = new inCapturePhase(reactEventName, instance + "enter", SyntheticEventCtor, nativeEvent, nativeEventTarget), inCapturePhase.target = lastHostComponent, inCapturePhase.relatedTarget = accumulateTargetOnly, _instance = inCapturePhase);
							accumulateTargetOnly = _instance;
							inCapturePhase = reactName && SyntheticEventCtor ? getLowestCommonAncestor(reactName, SyntheticEventCtor, getParent) : null;
							null !== reactName && accumulateEnterLeaveListenersForEvent(dispatchQueue, reactEventType, reactName, inCapturePhase, !1);
							null !== SyntheticEventCtor && null !== accumulateTargetOnly && accumulateEnterLeaveListenersForEvent(dispatchQueue, accumulateTargetOnly, SyntheticEventCtor, inCapturePhase, !0);
						}
					}
				}
				a: {
					reactName = targetInst ? getNodeFromInstance(targetInst) : window;
					SyntheticEventCtor = reactName.nodeName && reactName.nodeName.toLowerCase();
					if ("select" === SyntheticEventCtor || "input" === SyntheticEventCtor && "file" === reactName.type) var getTargetInstFunc = getTargetInstForChangeEvent;
					else if (isTextInputElement(reactName)) if (isInputEventSupported) getTargetInstFunc = getTargetInstForInputOrChangeEvent;
					else {
						getTargetInstFunc = getTargetInstForInputEventPolyfill;
						var handleEventFunc = handleEventsForInputEventPolyfill;
					}
					else SyntheticEventCtor = reactName.nodeName, !SyntheticEventCtor || "input" !== SyntheticEventCtor.toLowerCase() || "checkbox" !== reactName.type && "radio" !== reactName.type ? targetInst && isCustomElement(targetInst.elementType) && (getTargetInstFunc = getTargetInstForChangeEvent) : getTargetInstFunc = getTargetInstForClickEvent;
					if (getTargetInstFunc && (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))) {
						createAndAccumulateChangeEvent(dispatchQueue, getTargetInstFunc, nativeEvent, nativeEventTarget);
						break a;
					}
					handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
				}
				handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window;
				switch (domEventName) {
					case "focusin":
						if (isTextInputElement(handleEventFunc) || "true" === handleEventFunc.contentEditable) activeElement = handleEventFunc, activeElementInst = targetInst, lastSelection = null;
						break;
					case "focusout":
						lastSelection = activeElementInst = activeElement = null;
						break;
					case "mousedown":
						mouseDown = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						mouseDown = !1;
						constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
						break;
					case "selectionchange": if (skipSelectionChangeEvent) break;
					case "keydown":
					case "keyup": constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
				}
				var fallbackData;
				if (canUseCompositionEvent) b: {
					switch (domEventName) {
						case "compositionstart":
							var eventType = "onCompositionStart";
							break b;
						case "compositionend":
							eventType = "onCompositionEnd";
							break b;
						case "compositionupdate":
							eventType = "onCompositionUpdate";
							break b;
					}
					eventType = void 0;
				}
				else isComposing ? isFallbackCompositionEnd(domEventName, nativeEvent) && (eventType = "onCompositionEnd") : "keydown" === domEventName && 229 === nativeEvent.keyCode && (eventType = "onCompositionStart");
				eventType && (useFallbackCompositionData && "ko" !== nativeEvent.locale && (isComposing || "onCompositionStart" !== eventType ? "onCompositionEnd" === eventType && isComposing && (fallbackData = getData()) : (root = nativeEventTarget, startText = "value" in root ? root.value : root.textContent, isComposing = !0)), handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType), 0 < handleEventFunc.length && (eventType = new SyntheticCompositionEvent(eventType, domEventName, null, nativeEvent, nativeEventTarget), dispatchQueue.push({
					event: eventType,
					listeners: handleEventFunc
				}), fallbackData ? eventType.data = fallbackData : (fallbackData = getDataFromCustomEvent(nativeEvent), null !== fallbackData && (eventType.data = fallbackData))));
				if (fallbackData = canUseTextInputEvent ? getNativeBeforeInputChars(domEventName, nativeEvent) : getFallbackBeforeInputChars(domEventName, nativeEvent)) eventType = accumulateTwoPhaseListeners(targetInst, "onBeforeInput"), 0 < eventType.length && (handleEventFunc = new SyntheticCompositionEvent("onBeforeInput", "beforeinput", null, nativeEvent, nativeEventTarget), dispatchQueue.push({
					event: handleEventFunc,
					listeners: eventType
				}), handleEventFunc.data = fallbackData);
				extractEvents$1(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
			}
			processDispatchQueue(dispatchQueue, eventSystemFlags);
		});
	}
	function createDispatchListener(instance, listener, currentTarget) {
		return {
			instance,
			listener,
			currentTarget
		};
	}
	function accumulateTwoPhaseListeners(targetFiber, reactName) {
		for (var captureName = reactName + "Capture", listeners = []; null !== targetFiber;) {
			var _instance2 = targetFiber, stateNode = _instance2.stateNode;
			_instance2 = _instance2.tag;
			5 !== _instance2 && 26 !== _instance2 && 27 !== _instance2 || null === stateNode || (_instance2 = getListener(targetFiber, captureName), null != _instance2 && listeners.unshift(createDispatchListener(targetFiber, _instance2, stateNode)), _instance2 = getListener(targetFiber, reactName), null != _instance2 && listeners.push(createDispatchListener(targetFiber, _instance2, stateNode)));
			if (3 === targetFiber.tag) return listeners;
			targetFiber = targetFiber.return;
		}
		return [];
	}
	function getParent(inst) {
		if (null === inst) return null;
		do
			inst = inst.return;
		while (inst && 5 !== inst.tag && 27 !== inst.tag);
		return inst ? inst : null;
	}
	function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
		for (var registrationName = event._reactName, listeners = []; null !== target && target !== common;) {
			var _instance3 = target, alternate = _instance3.alternate, stateNode = _instance3.stateNode;
			_instance3 = _instance3.tag;
			if (null !== alternate && alternate === common) break;
			5 !== _instance3 && 26 !== _instance3 && 27 !== _instance3 || null === stateNode || (alternate = stateNode, inCapturePhase ? (stateNode = getListener(target, registrationName), null != stateNode && listeners.unshift(createDispatchListener(target, stateNode, alternate))) : inCapturePhase || (stateNode = getListener(target, registrationName), null != stateNode && listeners.push(createDispatchListener(target, stateNode, alternate))));
			target = target.return;
		}
		0 !== listeners.length && dispatchQueue.push({
			event,
			listeners
		});
	}
	var NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
	var NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
	function normalizeMarkupForTextOrAttribute(markup) {
		return ("string" === typeof markup ? markup : "" + markup).replace(NORMALIZE_NEWLINES_REGEX, "\n").replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
	}
	function checkForUnmatchedText(serverText, clientText) {
		clientText = normalizeMarkupForTextOrAttribute(clientText);
		return normalizeMarkupForTextOrAttribute(serverText) === clientText ? !0 : !1;
	}
	function setProp(domElement, tag, key, value, props, prevValue) {
		switch (key) {
			case "children":
				if ("string" === typeof value) "body" === tag || "textarea" === tag && "" === value || setTextContent(domElement, value);
				else if ("number" === typeof value || "bigint" === typeof value) "body" !== tag && setTextContent(domElement, "" + value);
				else return;
				break;
			case "className":
				setValueForKnownAttribute(domElement, "class", value);
				break;
			case "tabIndex":
				setValueForKnownAttribute(domElement, "tabindex", value);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				setValueForKnownAttribute(domElement, key, value);
				break;
			case "style":
				setValueForStyles(domElement, value, prevValue);
				return;
			case "data": if ("object" !== tag) {
				setValueForKnownAttribute(domElement, "data", value);
				break;
			}
			case "src":
			case "href":
				if ("" === value && ("a" !== tag || "href" !== key)) {
					domElement.removeAttribute(key);
					break;
				}
				if (null == value || "function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) {
					domElement.removeAttribute(key);
					break;
				}
				value = sanitizeURL(value);
				domElement.setAttribute(key, value);
				break;
			case "action":
			case "formAction":
				if ("function" === typeof value) {
					domElement.setAttribute(key, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				} else "function" === typeof prevValue && ("formAction" === key ? ("input" !== tag && setProp(domElement, tag, "name", props.name, props, null), setProp(domElement, tag, "formEncType", props.formEncType, props, null), setProp(domElement, tag, "formMethod", props.formMethod, props, null), setProp(domElement, tag, "formTarget", props.formTarget, props, null)) : (setProp(domElement, tag, "encType", props.encType, props, null), setProp(domElement, tag, "method", props.method, props, null), setProp(domElement, tag, "target", props.target, props, null)));
				if (null == value || "symbol" === typeof value || "boolean" === typeof value) {
					domElement.removeAttribute(key);
					break;
				}
				value = sanitizeURL(value);
				domElement.setAttribute(key, value);
				break;
			case "onClick":
				null != value && (domElement.onclick = noop$1);
				return;
			case "onScroll":
				null != value && listenToNonDelegatedEvent("scroll", domElement);
				return;
			case "onScrollEnd":
				null != value && listenToNonDelegatedEvent("scrollend", domElement);
				return;
			case "dangerouslySetInnerHTML":
				if (null != value) {
					if ("object" !== typeof value || !("__html" in value)) throw Error(formatProdErrorMessage(61));
					key = value.__html;
					if (null != key) {
						if (null != props.children) throw Error(formatProdErrorMessage(60));
						(null != prevValue ? prevValue.__html : void 0) !== key && (domElement.innerHTML = key);
					}
				}
				break;
			case "multiple":
				domElement.multiple = value && "function" !== typeof value && "symbol" !== typeof value;
				break;
			case "muted":
				domElement.muted = value && "function" !== typeof value && "symbol" !== typeof value;
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (null == value || "function" === typeof value || "boolean" === typeof value || "symbol" === typeof value) {
					domElement.removeAttribute("xlink:href");
					break;
				}
				key = sanitizeURL(value);
				domElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", key);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "credentialless":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, "") : domElement.removeAttribute(key);
				break;
			case "capture":
			case "download":
				!0 === value ? domElement.setAttribute(key, "") : !1 !== value && null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				null != value && "function" !== typeof value && "symbol" !== typeof value && !isNaN(value) && 1 <= value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
				break;
			case "rowSpan":
			case "start":
				null == value || "function" === typeof value || "symbol" === typeof value || isNaN(value) ? domElement.removeAttribute(key) : domElement.setAttribute(key, value);
				break;
			case "popover":
				listenToNonDelegatedEvent("beforetoggle", domElement);
				listenToNonDelegatedEvent("toggle", domElement);
				setValueForAttribute(domElement, "popover", value);
				break;
			case "xlinkActuate":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:actuate", value);
				break;
			case "xlinkArcrole":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:arcrole", value);
				break;
			case "xlinkRole":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:role", value);
				break;
			case "xlinkShow":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:show", value);
				break;
			case "xlinkTitle":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:title", value);
				break;
			case "xlinkType":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:type", value);
				break;
			case "xmlBase":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/XML/1998/namespace", "xml:base", value);
				break;
			case "xmlLang":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/XML/1998/namespace", "xml:lang", value);
				break;
			case "xmlSpace":
				setValueForNamespacedAttribute(domElement, "http://www.w3.org/XML/1998/namespace", "xml:space", value);
				break;
			case "is":
				setValueForAttribute(domElement, "is", value);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < key.length) || "o" !== key[0] && "O" !== key[0] || "n" !== key[1] && "N" !== key[1]) key = aliases.get(key) || key, setValueForAttribute(domElement, key, value);
			else return;
		}
		viewTransitionMutationContext = !0;
	}
	function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
		switch (key) {
			case "style":
				setValueForStyles(domElement, value, prevValue);
				return;
			case "dangerouslySetInnerHTML":
				if (null != value) {
					if ("object" !== typeof value || !("__html" in value)) throw Error(formatProdErrorMessage(61));
					key = value.__html;
					if (null != key) {
						if (null != props.children) throw Error(formatProdErrorMessage(60));
						(null != prevValue ? prevValue.__html : void 0) !== key && (domElement.innerHTML = key);
					}
				}
				break;
			case "children":
				if ("string" === typeof value) setTextContent(domElement, value);
				else if ("number" === typeof value || "bigint" === typeof value) setTextContent(domElement, "" + value);
				else return;
				break;
			case "onScroll":
				null != value && listenToNonDelegatedEvent("scroll", domElement);
				return;
			case "onScrollEnd":
				null != value && listenToNonDelegatedEvent("scrollend", domElement);
				return;
			case "onClick":
				null != value && (domElement.onclick = noop$1);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!registrationNameDependencies.hasOwnProperty(key)) a: {
					if ("o" === key[0] && "n" === key[1] && (props = key.endsWith("Capture"), prevValue = key.slice(2, props ? key.length - 7 : void 0), tag = domElement[internalPropsKey] || null, tag = null != tag ? tag[key] : null, "function" === typeof tag && domElement.removeEventListener(prevValue, tag, props), "function" === typeof value)) {
						"function" !== typeof tag && null !== tag && (key in domElement ? domElement[key] = null : domElement.hasAttribute(key) && domElement.removeAttribute(key));
						domElement.addEventListener(prevValue, value, props);
						break a;
					}
					viewTransitionMutationContext = !0;
					key in domElement ? domElement[key] = value : !0 === value ? domElement.setAttribute(key, "") : setValueForAttribute(domElement, key, value);
				}
				return;
		}
		viewTransitionMutationContext = !0;
	}
	function setInitialProperties(domElement, tag, props) {
		switch (tag) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				listenToNonDelegatedEvent("error", domElement);
				listenToNonDelegatedEvent("load", domElement);
				var hasSrc = !1, hasSrcSet = !1, propKey;
				for (propKey in props) if (props.hasOwnProperty(propKey)) {
					var propValue = props[propKey];
					if (null != propValue) switch (propKey) {
						case "src":
							hasSrc = !0;
							break;
						case "srcSet":
							hasSrcSet = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(formatProdErrorMessage(137, tag));
						default: setProp(domElement, tag, propKey, propValue, props, null);
					}
				}
				hasSrcSet && setProp(domElement, tag, "srcSet", props.srcSet, props, null);
				hasSrc && setProp(domElement, tag, "src", props.src, props, null);
				return;
			case "input":
				listenToNonDelegatedEvent("invalid", domElement);
				var defaultValue = propKey = propValue = hasSrcSet = null, checked = null, defaultChecked = null;
				for (hasSrc in props) if (props.hasOwnProperty(hasSrc)) {
					var propValue$204 = props[hasSrc];
					if (null != propValue$204) switch (hasSrc) {
						case "name":
							hasSrcSet = propValue$204;
							break;
						case "type":
							propValue = propValue$204;
							break;
						case "checked":
							checked = propValue$204;
							break;
						case "defaultChecked":
							defaultChecked = propValue$204;
							break;
						case "value":
							propKey = propValue$204;
							break;
						case "defaultValue":
							defaultValue = propValue$204;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (null != propValue$204) throw Error(formatProdErrorMessage(137, tag));
							break;
						default: setProp(domElement, tag, hasSrc, propValue$204, props, null);
					}
				}
				initInput(domElement, propKey, defaultValue, checked, defaultChecked, propValue, hasSrcSet, !1);
				return;
			case "select":
				listenToNonDelegatedEvent("invalid", domElement);
				hasSrc = propValue = propKey = null;
				for (hasSrcSet in props) if (props.hasOwnProperty(hasSrcSet) && (defaultValue = props[hasSrcSet], null != defaultValue)) switch (hasSrcSet) {
					case "value":
						propKey = defaultValue;
						break;
					case "defaultValue":
						propValue = defaultValue;
						break;
					case "multiple": hasSrc = defaultValue;
					default: setProp(domElement, tag, hasSrcSet, defaultValue, props, null);
				}
				tag = propKey;
				props = propValue;
				domElement.multiple = !!hasSrc;
				null != tag ? updateOptions(domElement, !!hasSrc, tag, !1) : null != props && updateOptions(domElement, !!hasSrc, props, !0);
				return;
			case "textarea":
				listenToNonDelegatedEvent("invalid", domElement);
				propKey = hasSrcSet = hasSrc = null;
				for (propValue in props) if (props.hasOwnProperty(propValue) && (defaultValue = props[propValue], null != defaultValue)) switch (propValue) {
					case "value":
						hasSrc = defaultValue;
						break;
					case "defaultValue":
						hasSrcSet = defaultValue;
						break;
					case "children":
						propKey = defaultValue;
						break;
					case "dangerouslySetInnerHTML":
						if (null != defaultValue) throw Error(formatProdErrorMessage(91));
						break;
					default: setProp(domElement, tag, propValue, defaultValue, props, null);
				}
				initTextarea(domElement, hasSrc, hasSrcSet, propKey);
				return;
			case "option":
				for (checked in props) if (props.hasOwnProperty(checked) && (hasSrc = props[checked], null != hasSrc)) switch (checked) {
					case "selected":
						domElement.selected = hasSrc && "function" !== typeof hasSrc && "symbol" !== typeof hasSrc;
						break;
					default: setProp(domElement, tag, checked, hasSrc, props, null);
				}
				return;
			case "dialog":
				listenToNonDelegatedEvent("beforetoggle", domElement);
				listenToNonDelegatedEvent("toggle", domElement);
				listenToNonDelegatedEvent("cancel", domElement);
				listenToNonDelegatedEvent("close", domElement);
				break;
			case "iframe":
			case "object":
				listenToNonDelegatedEvent("load", domElement);
				break;
			case "video":
			case "audio":
				for (hasSrc = 0; hasSrc < mediaEventTypes.length; hasSrc++) listenToNonDelegatedEvent(mediaEventTypes[hasSrc], domElement);
				break;
			case "image":
				listenToNonDelegatedEvent("error", domElement);
				listenToNonDelegatedEvent("load", domElement);
				break;
			case "details":
				listenToNonDelegatedEvent("toggle", domElement);
				break;
			case "embed":
			case "source":
			case "link": listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (defaultChecked in props) if (props.hasOwnProperty(defaultChecked) && (hasSrc = props[defaultChecked], null != hasSrc)) switch (defaultChecked) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(formatProdErrorMessage(137, tag));
					default: setProp(domElement, tag, defaultChecked, hasSrc, props, null);
				}
				return;
			default: if (isCustomElement(tag)) {
				for (propValue$204 in props) props.hasOwnProperty(propValue$204) && (hasSrc = props[propValue$204], void 0 !== hasSrc && setPropOnCustomElement(domElement, tag, propValue$204, hasSrc, props, void 0));
				return;
			}
		}
		for (defaultValue in props) props.hasOwnProperty(defaultValue) && (hasSrc = props[defaultValue], null != hasSrc && setProp(domElement, tag, defaultValue, hasSrc, props, null));
	}
	var emptyProps = {};
	function updateProperties(domElement, tag, lastProps, nextProps) {
		switch (tag) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var name = null, type = null, value = null, defaultValue = null, lastDefaultValue = null, checked = null, defaultChecked = null;
				for (propKey in lastProps) {
					var lastProp = lastProps[propKey];
					if (lastProps.hasOwnProperty(propKey) && null != lastProp) switch (propKey) {
						case "checked": break;
						case "value": break;
						case "defaultValue": lastDefaultValue = lastProp;
						default: nextProps.hasOwnProperty(propKey) || setProp(domElement, tag, propKey, null, nextProps, lastProp);
					}
				}
				for (var propKey$221 in nextProps) {
					var propKey = nextProps[propKey$221];
					lastProp = lastProps[propKey$221];
					if (nextProps.hasOwnProperty(propKey$221) && (null != propKey || null != lastProp)) switch (propKey$221) {
						case "type":
							propKey !== lastProp && (viewTransitionMutationContext = !0);
							type = propKey;
							break;
						case "name":
							propKey !== lastProp && (viewTransitionMutationContext = !0);
							name = propKey;
							break;
						case "checked":
							propKey !== lastProp && (viewTransitionMutationContext = !0);
							checked = propKey;
							break;
						case "defaultChecked":
							propKey !== lastProp && (viewTransitionMutationContext = !0);
							defaultChecked = propKey;
							break;
						case "value":
							propKey !== lastProp && (viewTransitionMutationContext = !0);
							value = propKey;
							break;
						case "defaultValue":
							propKey !== lastProp && (viewTransitionMutationContext = !0);
							defaultValue = propKey;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (null != propKey) throw Error(formatProdErrorMessage(137, tag));
							break;
						default: propKey !== lastProp && setProp(domElement, tag, propKey$221, propKey, nextProps, lastProp);
					}
				}
				updateInput(domElement, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name);
				return;
			case "select":
				propKey = value = defaultValue = propKey$221 = null;
				for (type in lastProps) if (lastDefaultValue = lastProps[type], lastProps.hasOwnProperty(type) && null != lastDefaultValue) switch (type) {
					case "value": break;
					case "multiple": propKey = lastDefaultValue;
					default: nextProps.hasOwnProperty(type) || setProp(domElement, tag, type, null, nextProps, lastDefaultValue);
				}
				for (name in nextProps) if (type = nextProps[name], lastDefaultValue = lastProps[name], nextProps.hasOwnProperty(name) && (null != type || null != lastDefaultValue)) switch (name) {
					case "value":
						type !== lastDefaultValue && (viewTransitionMutationContext = !0);
						propKey$221 = type;
						break;
					case "defaultValue":
						type !== lastDefaultValue && (viewTransitionMutationContext = !0);
						defaultValue = type;
						break;
					case "multiple": type !== lastDefaultValue && (viewTransitionMutationContext = !0), value = type;
					default: type !== lastDefaultValue && setProp(domElement, tag, name, type, nextProps, lastDefaultValue);
				}
				tag = defaultValue;
				lastProps = value;
				nextProps = propKey;
				null != propKey$221 ? updateOptions(domElement, !!lastProps, propKey$221, !1) : !!nextProps !== !!lastProps && (null != tag ? updateOptions(domElement, !!lastProps, tag, !0) : updateOptions(domElement, !!lastProps, lastProps ? [] : "", !1));
				return;
			case "textarea":
				propKey = propKey$221 = null;
				for (defaultValue in lastProps) if (name = lastProps[defaultValue], lastProps.hasOwnProperty(defaultValue) && null != name && !nextProps.hasOwnProperty(defaultValue)) switch (defaultValue) {
					case "value": break;
					case "children": break;
					default: setProp(domElement, tag, defaultValue, null, nextProps, name);
				}
				for (value in nextProps) if (name = nextProps[value], type = lastProps[value], nextProps.hasOwnProperty(value) && (null != name || null != type)) switch (value) {
					case "value":
						name !== type && (viewTransitionMutationContext = !0);
						propKey$221 = name;
						break;
					case "defaultValue":
						name !== type && (viewTransitionMutationContext = !0);
						propKey = name;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (null != name) throw Error(formatProdErrorMessage(91));
						break;
					default: name !== type && setProp(domElement, tag, value, name, nextProps, type);
				}
				updateTextarea(domElement, propKey$221, propKey);
				return;
			case "option":
				for (var propKey$237 in lastProps) if (propKey$221 = lastProps[propKey$237], lastProps.hasOwnProperty(propKey$237) && null != propKey$221 && !nextProps.hasOwnProperty(propKey$237)) switch (propKey$237) {
					case "selected":
						domElement.selected = !1;
						break;
					default: setProp(domElement, tag, propKey$237, null, nextProps, propKey$221);
				}
				for (lastDefaultValue in nextProps) if (propKey$221 = nextProps[lastDefaultValue], propKey = lastProps[lastDefaultValue], nextProps.hasOwnProperty(lastDefaultValue) && propKey$221 !== propKey && (null != propKey$221 || null != propKey)) switch (lastDefaultValue) {
					case "selected":
						propKey$221 !== propKey && (viewTransitionMutationContext = !0);
						domElement.selected = propKey$221 && "function" !== typeof propKey$221 && "symbol" !== typeof propKey$221;
						break;
					default: setProp(domElement, tag, lastDefaultValue, propKey$221, nextProps, propKey);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var propKey$242 in lastProps) propKey$221 = lastProps[propKey$242], lastProps.hasOwnProperty(propKey$242) && null != propKey$221 && !nextProps.hasOwnProperty(propKey$242) && setProp(domElement, tag, propKey$242, null, nextProps, propKey$221);
				for (checked in nextProps) if (propKey$221 = nextProps[checked], propKey = lastProps[checked], nextProps.hasOwnProperty(checked) && propKey$221 !== propKey && (null != propKey$221 || null != propKey)) switch (checked) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (null != propKey$221) throw Error(formatProdErrorMessage(137, tag));
						break;
					default: setProp(domElement, tag, checked, propKey$221, nextProps, propKey);
				}
				return;
			default: if (isCustomElement(tag)) {
				for (var propKey$247 in lastProps) propKey$221 = lastProps[propKey$247], lastProps.hasOwnProperty(propKey$247) && void 0 !== propKey$221 && !nextProps.hasOwnProperty(propKey$247) && setPropOnCustomElement(domElement, tag, propKey$247, void 0, nextProps, propKey$221);
				for (defaultChecked in nextProps) propKey$221 = nextProps[defaultChecked], propKey = lastProps[defaultChecked], !nextProps.hasOwnProperty(defaultChecked) || propKey$221 === propKey || void 0 === propKey$221 && void 0 === propKey || setPropOnCustomElement(domElement, tag, defaultChecked, propKey$221, nextProps, propKey);
				return;
			}
		}
		for (var propKey$252 in lastProps) propKey$221 = lastProps[propKey$252], lastProps.hasOwnProperty(propKey$252) && null != propKey$221 && !nextProps.hasOwnProperty(propKey$252) && setProp(domElement, tag, propKey$252, null, nextProps, propKey$221);
		for (lastProp in nextProps) propKey$221 = nextProps[lastProp], propKey = lastProps[lastProp], !nextProps.hasOwnProperty(lastProp) || propKey$221 === propKey || null == propKey$221 && null == propKey || setProp(domElement, tag, lastProp, propKey$221, nextProps, propKey);
	}
	function isLikelyStaticResource(initiatorType) {
		switch (initiatorType) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function estimateBandwidth() {
		if ("function" === typeof performance.getEntriesByType) {
			for (var count = 0, bits = 0, resourceEntries = performance.getEntriesByType("resource"), i = 0; i < resourceEntries.length; i++) {
				var entry = resourceEntries[i], transferSize = entry.transferSize, initiatorType = entry.initiatorType, duration = entry.duration;
				if (transferSize && duration && isLikelyStaticResource(initiatorType)) {
					initiatorType = 0;
					duration = entry.responseEnd;
					for (i += 1; i < resourceEntries.length; i++) {
						var overlapEntry = resourceEntries[i], overlapStartTime = overlapEntry.startTime;
						if (overlapStartTime > duration) break;
						var overlapTransferSize = overlapEntry.transferSize, overlapInitiatorType = overlapEntry.initiatorType;
						overlapTransferSize && isLikelyStaticResource(overlapInitiatorType) && (overlapEntry = overlapEntry.responseEnd, initiatorType += overlapTransferSize * (overlapEntry < duration ? 1 : (duration - overlapStartTime) / (overlapEntry - overlapStartTime)));
					}
					--i;
					bits += 8 * (transferSize + initiatorType) / (entry.duration / 1e3);
					count++;
					if (10 < count) break;
				}
			}
			if (0 < count) return bits / count / 1e6;
		}
		return navigator.connection && (count = navigator.connection.downlink, "number" === typeof count) ? count : 5;
	}
	var eventsEnabled = null;
	var selectionInformation = null;
	function getOwnerDocumentFromRootContainer(rootContainerElement) {
		return 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
	}
	function getOwnHostContext(namespaceURI) {
		switch (namespaceURI) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function getChildHostContextProd(parentNamespace, type) {
		if (0 === parentNamespace) switch (type) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return 1 === parentNamespace && "foreignObject" === type ? 0 : parentNamespace;
	}
	function createHoistableInstance(type, props, rootContainerInstance, internalInstanceHandle) {
		rootContainerInstance = getOwnerDocumentFromRootContainer(rootContainerInstance).createElement(type);
		rootContainerInstance[internalInstanceKey] = internalInstanceHandle;
		rootContainerInstance[internalPropsKey] = props;
		setInitialProperties(rootContainerInstance, type, props);
		markNodeAsHoistable(rootContainerInstance);
		return rootContainerInstance;
	}
	function shouldSetTextContent(type, props) {
		return "textarea" === type || "noscript" === type || "string" === typeof props.children || "number" === typeof props.children || "bigint" === typeof props.children || "object" === typeof props.dangerouslySetInnerHTML && null !== props.dangerouslySetInnerHTML && null != props.dangerouslySetInnerHTML.__html;
	}
	var currentPopstateTransitionEvent = null;
	function shouldAttemptEagerTransition() {
		var event = window.event;
		if (event && "popstate" === event.type) {
			if (event === currentPopstateTransitionEvent) return !1;
			currentPopstateTransitionEvent = event;
			return !0;
		}
		currentPopstateTransitionEvent = null;
		return !1;
	}
	var scheduleTimeout = "function" === typeof setTimeout ? setTimeout : void 0;
	var cancelTimeout = "function" === typeof clearTimeout ? clearTimeout : void 0;
	var localPromise = "function" === typeof Promise ? Promise : void 0;
	var localRequestAnimationFrame = "function" === typeof requestAnimationFrame ? requestAnimationFrame : scheduleTimeout;
	var scheduleMicrotask = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof localPromise ? function(callback) {
		return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
	} : scheduleTimeout;
	function handleErrorInNextTick(error) {
		setTimeout(function() {
			throw error;
		});
	}
	function isSingletonScope(type) {
		return "head" === type;
	}
	function clearHydrationBoundary(parentInstance, hydrationInstance) {
		var node = hydrationInstance, depth = 0;
		do {
			var nextNode = node.nextSibling;
			parentInstance.removeChild(node);
			if (nextNode && 8 === nextNode.nodeType) if (node = nextNode.data, "/$" === node || "/&" === node) {
				if (0 === depth) {
					parentInstance.removeChild(nextNode);
					retryIfBlockedOn(hydrationInstance);
					return;
				}
				depth--;
			} else if ("$" === node || "$?" === node || "$~" === node || "$!" === node || "&" === node) depth++;
			else if ("html" === node) clearSingletonPreambleContribution(parentInstance.ownerDocument.documentElement);
			else if ("head" === node) {
				node = parentInstance.ownerDocument.head;
				clearSingletonPreambleContribution(node);
				for (var node$jscomp$0 = node.firstChild; node$jscomp$0;) {
					var nextNode$jscomp$0 = node$jscomp$0.nextSibling, nodeName = node$jscomp$0.nodeName;
					node$jscomp$0[internalHoistableMarker] || "SCRIPT" === nodeName || "STYLE" === nodeName || "LINK" === nodeName && "stylesheet" === node$jscomp$0.rel.toLowerCase() || node.removeChild(node$jscomp$0);
					node$jscomp$0 = nextNode$jscomp$0;
				}
			} else "body" === node && clearSingletonPreambleContribution(parentInstance.ownerDocument.body);
			node = nextNode;
		} while (node);
		retryIfBlockedOn(hydrationInstance);
	}
	function hideOrUnhideDehydratedBoundary(suspenseInstance, isHidden) {
		var node = suspenseInstance;
		suspenseInstance = 0;
		do {
			var nextNode = node.nextSibling;
			1 === node.nodeType ? isHidden ? (node._stashedDisplay = node.style.display, node.style.display = "none") : (node.style.display = node._stashedDisplay || "", "" === node.getAttribute("style") && node.removeAttribute("style")) : 3 === node.nodeType && (isHidden ? (node._stashedText = node.nodeValue, node.nodeValue = "") : node.nodeValue = node._stashedText || "");
			if (nextNode && 8 === nextNode.nodeType) if (node = nextNode.data, "/$" === node) if (0 === suspenseInstance) break;
			else suspenseInstance--;
			else "$" !== node && "$?" !== node && "$~" !== node && "$!" !== node || suspenseInstance++;
			node = nextNode;
		} while (node);
	}
	function applyViewTransitionName(instance, name, className) {
		name = CSS.escape(name) !== name ? "r-" + btoa(name).replace(/=/g, "") : name;
		instance.style.viewTransitionName = name;
		null != className && (instance.style.viewTransitionClass = className);
		className = getComputedStyle(instance);
		if ("inline" === className.display) {
			name = instance.getClientRects();
			if (1 === name.length) var JSCompiler_inline_result = 1;
			else for (var i = JSCompiler_inline_result = 0; i < name.length; i++) {
				var rect = name[i];
				0 < rect.width && 0 < rect.height && JSCompiler_inline_result++;
			}
			1 === JSCompiler_inline_result && (instance = instance.style, instance.display = 1 === name.length ? "inline-block" : "block", instance.marginTop = "-" + className.paddingTop, instance.marginBottom = "-" + className.paddingBottom);
		}
	}
	function restoreViewTransitionName(instance, props) {
		instance = instance.style;
		props = props.style;
		var viewTransitionName = null != props ? props.hasOwnProperty("viewTransitionName") ? props.viewTransitionName : props.hasOwnProperty("view-transition-name") ? props["view-transition-name"] : null : null;
		instance.viewTransitionName = null == viewTransitionName || "boolean" === typeof viewTransitionName ? "" : ("" + viewTransitionName).trim();
		viewTransitionName = null != props ? props.hasOwnProperty("viewTransitionClass") ? props.viewTransitionClass : props.hasOwnProperty("view-transition-class") ? props["view-transition-class"] : null : null;
		instance.viewTransitionClass = null == viewTransitionName || "boolean" === typeof viewTransitionName ? "" : ("" + viewTransitionName).trim();
		"inline-block" === instance.display && (null == props ? instance.display = instance.margin = "" : (viewTransitionName = props.display, instance.display = null == viewTransitionName || "boolean" === typeof viewTransitionName ? "" : viewTransitionName, viewTransitionName = props.margin, null != viewTransitionName ? instance.margin = viewTransitionName : (viewTransitionName = props.hasOwnProperty("marginTop") ? props.marginTop : props["margin-top"], instance.marginTop = null == viewTransitionName || "boolean" === typeof viewTransitionName ? "" : viewTransitionName, props = props.hasOwnProperty("marginBottom") ? props.marginBottom : props["margin-bottom"], instance.marginBottom = null == props || "boolean" === typeof props ? "" : props)));
	}
	function createMeasurement(rect, computedStyle, element) {
		element = element.ownerDocument.defaultView;
		return {
			rect,
			abs: "absolute" === computedStyle.position || "fixed" === computedStyle.position,
			clip: "none" !== computedStyle.clipPath || "visible" !== computedStyle.overflow || "none" !== computedStyle.filter || "none" !== computedStyle.mask || "none" !== computedStyle.mask || "0px" !== computedStyle.borderRadius,
			view: 0 <= rect.bottom && 0 <= rect.right && rect.top <= element.innerHeight && rect.left <= element.innerWidth
		};
	}
	function measureInstance(instance) {
		return createMeasurement(instance.getBoundingClientRect(), getComputedStyle(instance), instance);
	}
	function measureClonedInstance(instance) {
		var measuredRect = instance.getBoundingClientRect();
		measuredRect = new DOMRect(measuredRect.x + 2e4, measuredRect.y + 2e4, measuredRect.width, measuredRect.height);
		var computedStyle = getComputedStyle(instance);
		return createMeasurement(measuredRect, computedStyle, instance);
	}
	function forceLayout(ownerDocument) {
		return ownerDocument.documentElement.clientHeight;
	}
	function waitForImageToLoad(resolve) {
		this.addEventListener("load", resolve);
		this.addEventListener("error", resolve);
	}
	function startViewTransition(suspendedState, rootContainer, transitionTypes, mutationCallback, layoutCallback, afterMutationCallback, spawnedWorkCallback, passiveCallback, errorCallback) {
		var ownerDocument = 9 === rootContainer.nodeType ? rootContainer : rootContainer.ownerDocument;
		try {
			var transition = ownerDocument.startViewTransition({
				update: function() {
					var ownerWindow = ownerDocument.defaultView, pendingNavigation = ownerWindow.navigation && ownerWindow.navigation.transition, previousFontLoadingStatus = ownerDocument.fonts.status;
					mutationCallback();
					var blockingPromises = [];
					"loaded" === previousFontLoadingStatus && (forceLayout(ownerDocument), "loading" === ownerDocument.fonts.status && blockingPromises.push(ownerDocument.fonts.ready));
					previousFontLoadingStatus = blockingPromises.length;
					if (null !== suspendedState) for (var suspenseyImages = suspendedState.suspenseyImages, imgBytes = 0, i = 0; i < suspenseyImages.length; i++) {
						var suspenseyImage = suspenseyImages[i];
						if (!suspenseyImage.complete) {
							var rect = suspenseyImage.getBoundingClientRect();
							if (0 < rect.bottom && 0 < rect.right && rect.top < ownerWindow.innerHeight && rect.left < ownerWindow.innerWidth) {
								imgBytes += estimateImageBytes(suspenseyImage);
								if (imgBytes > estimatedBytesWithinLimit) {
									blockingPromises.length = previousFontLoadingStatus;
									break;
								}
								suspenseyImage = new Promise(waitForImageToLoad.bind(suspenseyImage));
								blockingPromises.push(suspenseyImage);
							}
						}
					}
					if (0 < blockingPromises.length) return ownerWindow = Promise.race([Promise.all(blockingPromises), new Promise(function(resolve) {
						return setTimeout(resolve, 500);
					})]).then(layoutCallback, layoutCallback), (pendingNavigation ? Promise.allSettled([pendingNavigation.finished, ownerWindow]) : ownerWindow).then(afterMutationCallback, afterMutationCallback);
					layoutCallback();
					if (pendingNavigation) return pendingNavigation.finished.then(afterMutationCallback, afterMutationCallback);
					afterMutationCallback();
				},
				types: transitionTypes
			});
			ownerDocument.__reactViewTransition = transition;
			var viewTransitionAnimations = [];
			transition.ready.then(function() {
				for (var animations = ownerDocument.documentElement.getAnimations({ subtree: !0 }), i = 0; i < animations.length; i++) {
					var animation = animations[i], effect = animation.effect, pseudoElement = effect.pseudoElement;
					if (null != pseudoElement && pseudoElement.startsWith("::view-transition")) {
						viewTransitionAnimations.push(animation);
						animation = effect.getKeyframes();
						for (var height = pseudoElement = void 0, unchangedDimensions = !0, j = 0; j < animation.length; j++) {
							var keyframe = animation[j], w = keyframe.width;
							if (void 0 === pseudoElement) pseudoElement = w;
							else if (pseudoElement !== w) {
								unchangedDimensions = !1;
								break;
							}
							w = keyframe.height;
							if (void 0 === height) height = w;
							else if (height !== w) {
								unchangedDimensions = !1;
								break;
							}
							delete keyframe.width;
							delete keyframe.height;
							"none" === keyframe.transform && delete keyframe.transform;
						}
						unchangedDimensions && void 0 !== pseudoElement && void 0 !== height && (effect.setKeyframes(animation), unchangedDimensions = getComputedStyle(effect.target, effect.pseudoElement), unchangedDimensions.width !== pseudoElement || unchangedDimensions.height !== height) && (unchangedDimensions = animation[0], unchangedDimensions.width = pseudoElement, unchangedDimensions.height = height, unchangedDimensions = animation[animation.length - 1], unchangedDimensions.width = pseudoElement, unchangedDimensions.height = height, effect.setKeyframes(animation));
					}
				}
				spawnedWorkCallback();
			}, function(error) {
				ownerDocument.__reactViewTransition === transition && (ownerDocument.__reactViewTransition = null);
				try {
					if ("object" === typeof error && null !== error) switch (error.name) {
						case "InvalidStateError": if ("View transition was skipped because document visibility state is hidden." === error.message || "Skipping view transition because document visibility state has become hidden." === error.message || "Skipping view transition because viewport size changed." === error.message || "Transition was aborted because of invalid state" === error.message) error = null;
					}
					null !== error && errorCallback(error);
				} finally {
					mutationCallback(), layoutCallback(), spawnedWorkCallback();
				}
			});
			transition.finished.finally(function() {
				for (var i = 0; i < viewTransitionAnimations.length; i++) viewTransitionAnimations[i].cancel();
				ownerDocument.__reactViewTransition === transition && (ownerDocument.__reactViewTransition = null);
				passiveCallback();
			});
			return transition;
		} catch (x) {
			return mutationCallback(), layoutCallback(), spawnedWorkCallback(), null;
		}
	}
	function ViewTransitionPseudoElement(pseudo, name) {
		this._scope = document.documentElement;
		this._selector = "::view-transition-" + pseudo + "(" + name + ")";
	}
	ViewTransitionPseudoElement.prototype.animate = function(keyframes, options) {
		options = "number" === typeof options ? { duration: options } : assign({}, options);
		options.pseudoElement = this._selector;
		return this._scope.animate(keyframes, options);
	};
	ViewTransitionPseudoElement.prototype.getAnimations = function() {
		for (var scope = this._scope, selector = this._selector, animations = scope.getAnimations({ subtree: !0 }), result = [], i = 0; i < animations.length; i++) {
			var effect = animations[i].effect;
			null !== effect && effect.target === scope && effect.pseudoElement === selector && result.push(animations[i]);
		}
		return result;
	};
	ViewTransitionPseudoElement.prototype.getComputedStyle = function() {
		return getComputedStyle(this._scope, this._selector);
	};
	function createViewTransitionInstance(name) {
		return {
			name,
			group: new ViewTransitionPseudoElement("group", name),
			imagePair: new ViewTransitionPseudoElement("image-pair", name),
			old: new ViewTransitionPseudoElement("old", name),
			new: new ViewTransitionPseudoElement("new", name)
		};
	}
	function FragmentInstance(fragmentFiber) {
		this._fragmentFiber = fragmentFiber;
		this._observers = this._eventListeners = null;
	}
	FragmentInstance.prototype.addEventListener = function(type, listener, optionsOrUseCapture) {
		var signal = null, cleanup = null;
		if (null != optionsOrUseCapture && "boolean" !== typeof optionsOrUseCapture && (signal = optionsOrUseCapture.signal || null, null !== signal && signal.aborted)) return;
		null === this._eventListeners && (this._eventListeners = []);
		var listeners = this._eventListeners;
		if (-1 === indexOfEventListener(listeners, type, listener, optionsOrUseCapture)) {
			var fragmentInstance = this, attachedListener = listener;
			null != optionsOrUseCapture && "boolean" !== typeof optionsOrUseCapture && !0 === optionsOrUseCapture.once && (attachedListener = function(event) {
				fragmentInstance.removeEventListener(type, listener, optionsOrUseCapture);
				"function" === typeof listener ? listener.call(this, event) : listener.handleEvent(event);
			});
			null !== signal && (cleanup = fragmentInstance.removeEventListener.bind(fragmentInstance, type, listener, optionsOrUseCapture), signal.addEventListener("abort", cleanup, { once: !0 }), cleanup = signal.removeEventListener.bind(signal, "abort", cleanup));
			signal = getAttachOptions(optionsOrUseCapture);
			listeners.push({
				type,
				listener,
				optionsOrUseCapture,
				attachedListener,
				cleanup
			});
			traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, addEventListenerToChild, type, attachedListener, signal);
		}
		this._eventListeners = listeners;
	};
	function addEventListenerToChild(child, type, listener, optionsOrUseCapture) {
		getInstanceFromHostFiber(child).addEventListener(type, listener, optionsOrUseCapture);
		return !1;
	}
	FragmentInstance.prototype.removeEventListener = function(type, listener, optionsOrUseCapture) {
		var listeners = this._eventListeners;
		if (null !== listeners && (listener = indexOfEventListener(listeners, type, listener, optionsOrUseCapture), -1 !== listener)) {
			var _listeners$index = listeners[listener];
			optionsOrUseCapture = _listeners$index.attachedListener;
			var cleanup = _listeners$index.cleanup;
			_listeners$index = getAttachOptions(_listeners$index.optionsOrUseCapture);
			traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, removeEventListenerFromChild, type, optionsOrUseCapture, _listeners$index);
			listeners.splice(listener, 1);
			null !== cleanup && cleanup();
		}
	};
	function removeEventListenerFromChild(child, type, listener, optionsOrUseCapture) {
		getInstanceFromHostFiber(child).removeEventListener(type, listener, optionsOrUseCapture);
		return !1;
	}
	function getAttachOptions(opts) {
		return null != opts && "boolean" !== typeof opts && (!0 === opts.once || opts.signal instanceof AbortSignal) ? {
			capture: opts.capture,
			passive: opts.passive
		} : opts;
	}
	function normalizeListenerOptions(opts) {
		return null == opts ? "c=0" : "boolean" === typeof opts ? "c=" + (opts ? "1" : "0") : "c=" + (opts.capture ? "1" : "0");
	}
	function indexOfEventListener(eventListeners, type, listener, optionsOrUseCapture) {
		if (0 === eventListeners.length) return -1;
		optionsOrUseCapture = normalizeListenerOptions(optionsOrUseCapture);
		for (var i = 0; i < eventListeners.length; i++) {
			var item = eventListeners[i];
			if (item.type === type && item.listener === listener && normalizeListenerOptions(item.optionsOrUseCapture) === optionsOrUseCapture) return i;
		}
		return -1;
	}
	FragmentInstance.prototype.dispatchEvent = function(event) {
		var parentHostFiber = getFragmentParentInstanceOrContainerFiber(this._fragmentFiber);
		if (null === parentHostFiber) return !0;
		parentHostFiber = getInstanceFromHostFiber(parentHostFiber);
		var eventListeners = this._eventListeners;
		if (null !== eventListeners && 0 < eventListeners.length || !event.bubbles) {
			var temp = 9 === parentHostFiber.nodeType ? parentHostFiber.createComment("") : document.createTextNode("");
			if (eventListeners) for (var i = 0; i < eventListeners.length; i++) {
				var _eventListeners$i = eventListeners[i];
				temp.addEventListener(_eventListeners$i.type, _eventListeners$i.attachedListener, getAttachOptions(_eventListeners$i.optionsOrUseCapture));
			}
			parentHostFiber.appendChild(temp);
			event = temp.dispatchEvent(event);
			if (eventListeners) for (i = 0; i < eventListeners.length; i++) _eventListeners$i = eventListeners[i], temp.removeEventListener(_eventListeners$i.type, _eventListeners$i.attachedListener, getAttachOptions(_eventListeners$i.optionsOrUseCapture));
			parentHostFiber.removeChild(temp);
			return event;
		}
		return parentHostFiber.dispatchEvent(event);
	};
	FragmentInstance.prototype.focus = function(focusOptions) {
		traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !0, setFocusOnFiberIfFocusable, focusOptions, void 0, void 0);
	};
	function setFocusOnFiberIfFocusable(fiber, focusOptions) {
		if (6 === fiber.tag) return !1;
		fiber = getInstanceFromHostFiber(fiber);
		return setFocusIfFocusable(fiber, focusOptions);
	}
	FragmentInstance.prototype.focusLast = function(focusOptions) {
		var children = [];
		traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !0, collectChildren, children, void 0, void 0);
		for (var i = children.length - 1; 0 <= i && !setFocusOnFiberIfFocusable(children[i], focusOptions); i--);
	};
	function collectChildren(child, collection) {
		collection.push(child);
		return !1;
	}
	FragmentInstance.prototype.blur = function() {
		var parentHostFiber = getFragmentParentInstanceOrContainerFiber(this._fragmentFiber);
		null !== parentHostFiber && (parentHostFiber = getInstanceFromHostFiber(parentHostFiber), parentHostFiber = getOwnerDocumentFromRootContainer(parentHostFiber).activeElement, null !== parentHostFiber && traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, blurActiveElementWithinFragment, parentHostFiber, void 0, void 0));
	};
	function blurActiveElementWithinFragment(child, activeElement) {
		if (6 === child.tag) return !1;
		child = getInstanceFromHostFiber(child);
		return child === activeElement || child.contains(activeElement) ? (activeElement.blur(), !0) : !1;
	}
	FragmentInstance.prototype.observeUsing = function(observer) {
		null === this._observers && (this._observers = /* @__PURE__ */ new Set());
		this._observers.add(observer);
		traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, observeChild, observer, void 0, void 0);
	};
	function observeChild(child, observer) {
		if (6 === child.tag) return !1;
		child = getInstanceFromHostFiber(child);
		observer.observe(child);
		return !1;
	}
	FragmentInstance.prototype.unobserveUsing = function(observer) {
		var observers = this._observers;
		if (null !== observers && observers.has(observer)) {
			observers.delete(observer);
			traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, unobserveChild, observer, void 0, void 0);
			for (var i = observers = 0; i < pendingIntersectionUnobserves.length; i++) {
				var pending = pendingIntersectionUnobserves[i];
				pending.fragmentInstance === this && pending.observer === observer ? observer.unobserve(pending.instance) : pendingIntersectionUnobserves[observers++] = pending;
			}
			pendingIntersectionUnobserves.length = observers;
		}
	};
	function unobserveChild(child, observer) {
		if (6 === child.tag) return !1;
		child = getInstanceFromHostFiber(child);
		observer.unobserve(child);
		return !1;
	}
	var pendingIntersectionUnobserves = [];
	var intersectionUnobserveScheduled = !1;
	function schedulePendingIntersectionUnobserve(fragmentInstance, observer, instance) {
		pendingIntersectionUnobserves.push({
			fragmentInstance,
			observer,
			instance
		});
		intersectionUnobserveScheduled || (intersectionUnobserveScheduled = !0, requestPostPaintCallback(function() {
			intersectionUnobserveScheduled = !1;
			var pending = pendingIntersectionUnobserves;
			pendingIntersectionUnobserves = [];
			for (var i = 0; i < pending.length; i++) {
				var item = pending[i];
				item.observer.unobserve(item.instance);
			}
		}));
	}
	FragmentInstance.prototype.getClientRects = function() {
		var rects = [];
		traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, collectClientRects, rects, void 0, void 0);
		return rects;
	};
	function collectClientRects(child, rects) {
		if (6 === child.tag) {
			child = child.stateNode;
			var range = child.ownerDocument.createRange();
			range.selectNodeContents(child);
			rects.push.apply(rects, range.getClientRects());
		} else child = getInstanceFromHostFiber(child), rects.push.apply(rects, child.getClientRects());
		return !1;
	}
	FragmentInstance.prototype.getRootNode = function(getRootNodeOptions) {
		var parentHostFiber = getFragmentParentInstanceOrContainerFiber(this._fragmentFiber);
		return null === parentHostFiber ? this : getInstanceFromHostFiber(parentHostFiber).getRootNode(getRootNodeOptions);
	};
	FragmentInstance.prototype.compareDocumentPosition = function(otherNode) {
		var parentHostFiber = getFragmentParentInstanceOrContainerFiber(this._fragmentFiber);
		if (null === parentHostFiber) return Node.DOCUMENT_POSITION_DISCONNECTED;
		var children = [];
		traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, collectChildren, children, void 0, void 0);
		var parentHostInstance = getInstanceFromHostFiber(parentHostFiber);
		if (0 === children.length) {
			children = parentHostInstance;
			if (fiberIsPortaledIntoHost(this._fragmentFiber)) {
				a: {
					for (parentHostFiber = this._fragmentFiber.return; null !== parentHostFiber;) {
						if (4 === parentHostFiber.tag) {
							parentHostFiber = parentHostFiber.stateNode.containerInfo;
							break a;
						}
						if (3 === parentHostFiber.tag || 5 === parentHostFiber.tag || 27 === parentHostFiber.tag) break;
						parentHostFiber = parentHostFiber.return;
					}
					parentHostFiber = null;
				}
				null != parentHostFiber && (children = parentHostFiber);
			}
			parentHostFiber = this._fragmentFiber;
			var result = parentHostInstance = children.compareDocumentPosition(otherNode);
			children === otherNode ? result = Node.DOCUMENT_POSITION_CONTAINS : parentHostInstance & Node.DOCUMENT_POSITION_CONTAINED_BY && (children = getFragmentInstanceOrTextInstanceSiblings(parentHostFiber)[1], null === children ? result = Node.DOCUMENT_POSITION_PRECEDING : (otherNode = getInstanceFromHostFiber(children).compareDocumentPosition(otherNode), result = 0 === otherNode || otherNode & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING));
			return result |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
		}
		parentHostFiber = getInstanceFromHostFiber(children[0]);
		result = getInstanceFromHostFiber(children[children.length - 1]);
		var parentHostInstanceFromDOM = fiberIsPortaledIntoHost(this._fragmentFiber) ? parentHostFiber.parentElement : parentHostInstance;
		if (null == parentHostInstanceFromDOM) return Node.DOCUMENT_POSITION_DISCONNECTED;
		parentHostInstance = parentHostInstanceFromDOM.compareDocumentPosition(parentHostFiber) & Node.DOCUMENT_POSITION_CONTAINED_BY;
		parentHostInstanceFromDOM = parentHostInstanceFromDOM.compareDocumentPosition(result) & Node.DOCUMENT_POSITION_CONTAINED_BY;
		var firstResult = parentHostFiber.compareDocumentPosition(otherNode), lastResult = result.compareDocumentPosition(otherNode), otherNodeIsWithinFirstOrLastChild = firstResult & Node.DOCUMENT_POSITION_CONTAINED_BY || lastResult & Node.DOCUMENT_POSITION_CONTAINED_BY;
		lastResult = parentHostInstance && parentHostInstanceFromDOM && firstResult & Node.DOCUMENT_POSITION_FOLLOWING && lastResult & Node.DOCUMENT_POSITION_PRECEDING;
		parentHostFiber = parentHostInstance && parentHostFiber === otherNode || parentHostInstanceFromDOM && result === otherNode || otherNodeIsWithinFirstOrLastChild || lastResult ? Node.DOCUMENT_POSITION_CONTAINED_BY : !parentHostInstance && parentHostFiber === otherNode || !parentHostInstanceFromDOM && result === otherNode ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : firstResult;
		return parentHostFiber & Node.DOCUMENT_POSITION_DISCONNECTED || parentHostFiber & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || validateDocumentPositionWithFiberTree(parentHostFiber, this._fragmentFiber, children[0], children[children.length - 1], otherNode) ? parentHostFiber : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
	};
	function validateDocumentPositionWithFiberTree(documentPosition, fragmentFiber, precedingBoundaryFiber, followingBoundaryFiber, otherNode) {
		var otherFiber = getClosestInstanceFromNode(otherNode);
		if (documentPosition & Node.DOCUMENT_POSITION_CONTAINED_BY) {
			if (precedingBoundaryFiber = !!otherFiber) a: {
				for (; null !== otherFiber;) {
					if (7 === otherFiber.tag && (otherFiber === fragmentFiber || otherFiber.alternate === fragmentFiber)) {
						precedingBoundaryFiber = !0;
						break a;
					}
					otherFiber = otherFiber.return;
				}
				precedingBoundaryFiber = !1;
			}
			return precedingBoundaryFiber;
		}
		if (documentPosition & Node.DOCUMENT_POSITION_CONTAINS) {
			if (null === otherFiber) return otherFiber = otherNode.ownerDocument, otherNode === otherFiber || otherNode === otherFiber.documentElement || otherNode === otherFiber.body;
			a: {
				otherFiber = fragmentFiber;
				for (fragmentFiber = getFragmentParentInstanceOrContainerFiber(fragmentFiber); null !== otherFiber;) {
					if (!(5 !== otherFiber.tag && 3 !== otherFiber.tag && 27 !== otherFiber.tag || otherFiber !== fragmentFiber && otherFiber.alternate !== fragmentFiber)) {
						otherFiber = !0;
						break a;
					}
					otherFiber = otherFiber.return;
				}
				otherFiber = !1;
			}
			return otherFiber;
		}
		return documentPosition & Node.DOCUMENT_POSITION_PRECEDING ? ((fragmentFiber = !!otherFiber) && !(fragmentFiber = otherFiber === precedingBoundaryFiber) && (fragmentFiber = getLowestCommonAncestor(precedingBoundaryFiber, otherFiber, getParentForFragmentAncestors), null === fragmentFiber ? fragmentFiber = !1 : (traverseVisibleInstancesAndTextInstances(fragmentFiber, !0, isFiberPrecedingCheck, otherFiber, precedingBoundaryFiber), otherFiber = searchTarget, searchTarget = null, fragmentFiber = null !== otherFiber)), fragmentFiber) : documentPosition & Node.DOCUMENT_POSITION_FOLLOWING ? ((fragmentFiber = !!otherFiber) && !(fragmentFiber = otherFiber === followingBoundaryFiber) && (fragmentFiber = getLowestCommonAncestor(followingBoundaryFiber, otherFiber, getParentForFragmentAncestors), null === fragmentFiber ? fragmentFiber = !1 : (traverseVisibleInstancesAndTextInstances(fragmentFiber, !0, isFiberFollowingCheck, otherFiber, followingBoundaryFiber), otherFiber = searchTarget, searchBoundary = searchTarget = null, fragmentFiber = null !== otherFiber)), fragmentFiber) : !1;
	}
	function scrollTextNodeIntoView(textNode, resolvedAlignToTop) {
		var range = textNode.ownerDocument.createRange();
		range.selectNodeContents(textNode);
		textNode = range.getBoundingClientRect();
		window.scrollTo(window.scrollX + textNode.left, resolvedAlignToTop ? window.scrollY + textNode.top : window.scrollY + textNode.bottom - window.innerHeight);
	}
	FragmentInstance.prototype.scrollIntoView = function(alignToTop) {
		if ("object" === typeof alignToTop) throw Error(formatProdErrorMessage(566));
		var children = [];
		traverseVisibleInstancesAndTextInstances(this._fragmentFiber.child, !1, collectChildren, children, void 0, void 0);
		var resolvedAlignToTop = !1 !== alignToTop;
		if (0 === children.length) {
			var hostSiblings = getFragmentInstanceOrTextInstanceSiblings(this._fragmentFiber);
			hostSiblings = resolvedAlignToTop ? hostSiblings[1] || hostSiblings[0] || getFragmentParentInstanceOrContainerFiber(this._fragmentFiber) : hostSiblings[0] || hostSiblings[1];
			if (null === hostSiblings) return;
			if (6 === hostSiblings.tag) {
				alignToTop = getInstanceFromHostFiber(hostSiblings);
				scrollTextNodeIntoView(alignToTop, resolvedAlignToTop);
				return;
			}
			hostSiblings = getInstanceFromHostFiber(hostSiblings);
			if (9 !== hostSiblings.nodeType) {
				if (11 === hostSiblings.nodeType) {
					resolvedAlignToTop = "host" in hostSiblings ? hostSiblings.host : null;
					null !== resolvedAlignToTop && resolvedAlignToTop.scrollIntoView(alignToTop);
					return;
				}
				hostSiblings.scrollIntoView(alignToTop);
			}
		}
		for (hostSiblings = resolvedAlignToTop ? children.length - 1 : 0; hostSiblings !== (resolvedAlignToTop ? -1 : children.length);) {
			var child = children[hostSiblings];
			6 === child.tag ? (child = getInstanceFromHostFiber(child), scrollTextNodeIntoView(child, resolvedAlignToTop)) : getInstanceFromHostFiber(child).scrollIntoView(alignToTop);
			hostSiblings += resolvedAlignToTop ? -1 : 1;
		}
	};
	function addFragmentHandleToFiber(child, fragmentInstance) {
		child = getInstanceFromHostFiber(child);
		addFragmentHandleToInstance(child, fragmentInstance);
		return !1;
	}
	function addFragmentHandleToInstance(instance, fragmentInstance) {
		instance.reactFragments ??= /* @__PURE__ */ new Set();
		instance.reactFragments.add(fragmentInstance);
	}
	function commitNewChildToFragmentInstance(childInstance, fragmentInstance) {
		var eventListeners = fragmentInstance._eventListeners;
		if (null !== eventListeners) for (var i$jscomp$0 = 0; i$jscomp$0 < eventListeners.length; i$jscomp$0++) {
			var _eventListeners$i3 = eventListeners[i$jscomp$0];
			childInstance.addEventListener(_eventListeners$i3.type, _eventListeners$i3.attachedListener, getAttachOptions(_eventListeners$i3.optionsOrUseCapture));
		}
		3 !== childInstance.nodeType && (eventListeners = fragmentInstance._observers, null !== eventListeners && eventListeners.forEach(function(observer) {
			for (var writeIdx = 0, i = 0; i < pendingIntersectionUnobserves.length; i++) {
				var pending = pendingIntersectionUnobserves[i];
				if (pending.fragmentInstance !== fragmentInstance || pending.observer !== observer || pending.instance !== childInstance) pendingIntersectionUnobserves[writeIdx++] = pending;
			}
			pendingIntersectionUnobserves.length = writeIdx;
			observer.observe(childInstance);
		}), addFragmentHandleToInstance(childInstance, fragmentInstance));
	}
	function deleteChildFromFragmentInstance(childInstance, fragmentInstance) {
		var eventListeners = fragmentInstance._eventListeners;
		if (null !== eventListeners) for (var i = 0; i < eventListeners.length; i++) {
			var _eventListeners$i4 = eventListeners[i];
			childInstance.removeEventListener(_eventListeners$i4.type, _eventListeners$i4.attachedListener, getAttachOptions(_eventListeners$i4.optionsOrUseCapture));
		}
		3 !== childInstance.nodeType && (eventListeners = fragmentInstance._observers, null !== eventListeners && eventListeners.forEach(function(observer) {
			"string" === typeof observer.rootMargin ? schedulePendingIntersectionUnobserve(fragmentInstance, observer, childInstance) : observer.unobserve(childInstance);
		}), null != childInstance.reactFragments && childInstance.reactFragments.delete(fragmentInstance));
	}
	function clearContainerSparingly(container) {
		var nextNode = container.firstChild;
		nextNode && 10 === nextNode.nodeType && (nextNode = nextNode.nextSibling);
		for (; nextNode;) {
			var node = nextNode;
			nextNode = nextNode.nextSibling;
			switch (node.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					clearContainerSparingly(node);
					detachDeletedInstance(node);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if ("stylesheet" === node.rel.toLowerCase()) continue;
			}
			container.removeChild(node);
		}
	}
	function canHydrateInstance(instance, type, props, inRootOrSingleton) {
		for (; 1 === instance.nodeType;) {
			var anyProps = props;
			if (instance.nodeName.toLowerCase() !== type.toLowerCase()) {
				if (!inRootOrSingleton && ("INPUT" !== instance.nodeName || "hidden" !== instance.type)) break;
			} else if (!inRootOrSingleton) if ("input" === type && "hidden" === instance.type) {
				var name = null == anyProps.name ? null : "" + anyProps.name;
				if ("hidden" === anyProps.type && instance.getAttribute("name") === name) return instance;
			} else return instance;
			else if (!instance[internalHoistableMarker]) switch (type) {
				case "meta":
					if (!instance.hasAttribute("itemprop")) break;
					return instance;
				case "link":
					name = instance.getAttribute("rel");
					if ("stylesheet" === name && instance.hasAttribute("data-precedence")) break;
					else if (name !== anyProps.rel || instance.getAttribute("href") !== (null == anyProps.href || "" === anyProps.href ? null : anyProps.href) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin) || instance.getAttribute("title") !== (null == anyProps.title ? null : anyProps.title)) break;
					return instance;
				case "style":
					if (instance.hasAttribute("data-precedence")) break;
					return instance;
				case "script":
					name = instance.getAttribute("src");
					if ((name !== (null == anyProps.src ? null : anyProps.src) || instance.getAttribute("type") !== (null == anyProps.type ? null : anyProps.type) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin)) && name && instance.hasAttribute("async") && !instance.hasAttribute("itemprop")) break;
					return instance;
				default: return instance;
			}
			instance = getNextHydratable(instance.nextSibling);
			if (null === instance) break;
		}
		return null;
	}
	function canHydrateTextInstance(instance, text, inRootOrSingleton) {
		if ("" === text) return null;
		for (; 3 !== instance.nodeType;) {
			if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton) return null;
			instance = getNextHydratable(instance.nextSibling);
			if (null === instance) return null;
		}
		return instance;
	}
	function canHydrateHydrationBoundary(instance, inRootOrSingleton) {
		for (; 8 !== instance.nodeType;) {
			if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton) return null;
			instance = getNextHydratable(instance.nextSibling);
			if (null === instance) return null;
		}
		return instance;
	}
	function isSuspenseInstancePending(instance) {
		return "$?" === instance.data || "$~" === instance.data;
	}
	function isSuspenseInstanceFallback(instance) {
		return "$!" === instance.data || "$?" === instance.data && "loading" !== instance.ownerDocument.readyState;
	}
	function registerSuspenseInstanceRetry(instance, callback) {
		var ownerDocument = instance.ownerDocument;
		if ("$~" === instance.data) instance._reactRetry = callback;
		else if ("$?" !== instance.data || "loading" !== ownerDocument.readyState) callback();
		else {
			var listener = function() {
				callback();
				ownerDocument.removeEventListener("DOMContentLoaded", listener);
			};
			ownerDocument.addEventListener("DOMContentLoaded", listener);
			instance._reactRetry = listener;
		}
	}
	function getNextHydratable(node) {
		for (; null != node; node = node.nextSibling) {
			var nodeType = node.nodeType;
			if (1 === nodeType || 3 === nodeType) break;
			if (8 === nodeType) {
				nodeType = node.data;
				if ("$" === nodeType || "$!" === nodeType || "$?" === nodeType || "$~" === nodeType || "&" === nodeType || "F!" === nodeType || "F" === nodeType) break;
				if ("/$" === nodeType || "/&" === nodeType) return null;
			}
		}
		return node;
	}
	var previousHydratableOnEnteringScopedSingleton = null;
	function getNextHydratableInstanceAfterHydrationBoundary(hydrationInstance) {
		hydrationInstance = hydrationInstance.nextSibling;
		for (var depth = 0; hydrationInstance;) {
			if (8 === hydrationInstance.nodeType) {
				var data = hydrationInstance.data;
				if ("/$" === data || "/&" === data) {
					if (0 === depth) return getNextHydratable(hydrationInstance.nextSibling);
					depth--;
				} else "$" !== data && "$!" !== data && "$?" !== data && "$~" !== data && "&" !== data || depth++;
			}
			hydrationInstance = hydrationInstance.nextSibling;
		}
		return null;
	}
	function getParentHydrationBoundary(targetInstance) {
		targetInstance = targetInstance.previousSibling;
		for (var depth = 0; targetInstance;) {
			if (8 === targetInstance.nodeType) {
				var data = targetInstance.data;
				if ("$" === data || "$!" === data || "$?" === data || "$~" === data || "&" === data) {
					if (0 === depth) return targetInstance;
					depth--;
				} else "/$" !== data && "/&" !== data || depth++;
			}
			targetInstance = targetInstance.previousSibling;
		}
		return null;
	}
	function setFocusIfFocusable(node, focusOptions) {
		function handleFocus() {
			didFocus = !0;
		}
		if (node.ownerDocument.activeElement === node) return !0;
		var didFocus = !1;
		try {
			node.ownerDocument.addEventListener("focus", handleFocus, !0), (node.focus || HTMLElement.prototype.focus).call(node, focusOptions);
		} finally {
			node.ownerDocument.removeEventListener("focus", handleFocus, !0);
		}
		return didFocus;
	}
	function requestPostPaintCallback(callback) {
		localRequestAnimationFrame(function() {
			localRequestAnimationFrame(function(time) {
				return callback(time);
			});
		});
	}
	function resolveSingletonInstance(type, props, rootContainerInstance) {
		props = getOwnerDocumentFromRootContainer(rootContainerInstance);
		switch (type) {
			case "html":
				type = props.documentElement;
				if (!type) throw Error(formatProdErrorMessage(452));
				return type;
			case "head":
				type = props.head;
				if (!type) throw Error(formatProdErrorMessage(453));
				return type;
			case "body":
				type = props.body;
				if (!type) throw Error(formatProdErrorMessage(454));
				return type;
			default: throw Error(formatProdErrorMessage(451));
		}
	}
	function releaseSingletonInstance(instance, type, props) {
		for (var propKey in props) {
			var propValue = props[propKey];
			props.hasOwnProperty(propKey) && null != propValue && setProp(instance, type, propKey, null, emptyProps, propValue);
		}
		null != props.dangerouslySetInnerHTML && (instance.textContent = "");
		instance.onclick === noop$1 && (instance.onclick = null);
		detachDeletedInstance(instance);
	}
	function clearSingletonPreambleContribution(instance) {
		for (var attributes = instance.attributes; attributes.length;) instance.removeAttributeNode(attributes[0]);
		detachDeletedInstance(instance);
	}
	var preloadPropsMap = /* @__PURE__ */ new Map();
	var preconnectsSet = /* @__PURE__ */ new Set();
	function getHoistableRoot(container) {
		if ("function" === typeof container.getRootNode) {
			var rootNode = container.getRootNode();
			if (9 === rootNode.nodeType || 11 === rootNode.nodeType) return rootNode;
		}
		return 9 === container.nodeType ? container : container.ownerDocument;
	}
	var previousDispatcher = ReactDOMSharedInternals.d;
	ReactDOMSharedInternals.d = {
		f: flushSyncWork,
		r: requestFormReset,
		D: prefetchDNS,
		C: preconnect,
		L: preload,
		m: preloadModule,
		X: preinitScript,
		S: preinitStyle,
		M: preinitModuleScript
	};
	function flushSyncWork() {
		var previousWasRendering = previousDispatcher.f(), wasRendering = flushSyncWork$1();
		return previousWasRendering || wasRendering;
	}
	function requestFormReset(form) {
		var formInst = getInstanceFromNode(form);
		null !== formInst && 5 === formInst.tag && "form" === formInst.type ? requestFormReset$1(formInst) : previousDispatcher.r(form);
	}
	var globalDocument = "undefined" === typeof document ? null : document;
	function preconnectAs(rel, href, crossOrigin) {
		var ownerDocument = globalDocument;
		if (ownerDocument && "string" === typeof href && href) {
			var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
			limitedEscapedHref = "link[rel=\"" + rel + "\"][href=\"" + limitedEscapedHref + "\"]";
			"string" === typeof crossOrigin && (limitedEscapedHref += "[crossorigin=\"" + crossOrigin + "\"]");
			preconnectsSet.has(limitedEscapedHref) || (preconnectsSet.add(limitedEscapedHref), rel = {
				rel,
				crossOrigin,
				href
			}, null === ownerDocument.querySelector(limitedEscapedHref) && (href = ownerDocument.createElement("link"), setInitialProperties(href, "link", rel), markNodeAsHoistable(href), ownerDocument.head.appendChild(href)));
		}
	}
	function prefetchDNS(href) {
		previousDispatcher.D(href);
		preconnectAs("dns-prefetch", href, null);
	}
	function preconnect(href, crossOrigin) {
		previousDispatcher.C(href, crossOrigin);
		preconnectAs("preconnect", href, crossOrigin);
	}
	function preload(href, as, options) {
		previousDispatcher.L(href, as, options);
		var ownerDocument = globalDocument;
		if (ownerDocument && href && as) {
			var preloadSelector = "link[rel=\"preload\"][as=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(as) + "\"]";
			"image" === as ? options && options.imageSrcSet ? (preloadSelector += "[imagesrcset=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(options.imageSrcSet) + "\"]", "string" === typeof options.imageSizes && (preloadSelector += "[imagesizes=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(options.imageSizes) + "\"]")) : preloadSelector += "[href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"]" : preloadSelector += "[href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"]";
			var key = preloadSelector;
			switch (as) {
				case "style":
					key = getStyleKey(href);
					break;
				case "script": key = getScriptKey(href);
			}
			if (!(preloadPropsMap.has(key) || (href = assign({
				rel: "preload",
				href: "image" === as && options && options.imageSrcSet ? void 0 : href,
				as
			}, options), preloadPropsMap.set(key, href), null !== ownerDocument.querySelector(preloadSelector) || "style" === as && ownerDocument.querySelector(getStylesheetSelectorFromKey(key)) || "script" === as && ownerDocument.querySelector(getScriptSelectorFromKey(key))))) {
				var instance = ownerDocument.createElement("link");
				setInitialProperties(instance, "link", href);
				"style" === as && (instance[internalLoadPendingKey] = !0, instance.onload = instance.onerror = function() {
					clearPendingLoadOnNode(instance);
				});
				markNodeAsHoistable(instance);
				ownerDocument.head.appendChild(instance);
			}
		}
	}
	function preloadModule(href, options) {
		previousDispatcher.m(href, options);
		var ownerDocument = globalDocument;
		if (ownerDocument && href) {
			var as = options && "string" === typeof options.as ? options.as : "script", preloadSelector = "link[rel=\"modulepreload\"][as=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(as) + "\"][href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"]", key = preloadSelector;
			switch (as) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": key = getScriptKey(href);
			}
			if (!preloadPropsMap.has(key) && (href = assign({
				rel: "modulepreload",
				href
			}, options), preloadPropsMap.set(key, href), null === ownerDocument.querySelector(preloadSelector))) {
				switch (as) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (ownerDocument.querySelector(getScriptSelectorFromKey(key))) return;
				}
				as = ownerDocument.createElement("link");
				setInitialProperties(as, "link", href);
				markNodeAsHoistable(as);
				ownerDocument.head.appendChild(as);
			}
		}
	}
	function preinitStyle(href, precedence, options) {
		previousDispatcher.S(href, precedence, options);
		var ownerDocument = globalDocument;
		if (ownerDocument && href) {
			var styles = getResourcesFromRoot(ownerDocument).hoistableStyles, key = getStyleKey(href);
			precedence = precedence || "default";
			var resource = styles.get(key);
			if (!resource) {
				var state = {
					loading: 0,
					preload: null
				};
				if (resource = ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) state.loading = 5;
				else {
					href = assign({
						rel: "stylesheet",
						href,
						"data-precedence": precedence
					}, options);
					(options = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(href, options);
					var link = resource = ownerDocument.createElement("link");
					markNodeAsHoistable(link);
					setInitialProperties(link, "link", href);
					link._p = new Promise(function(resolve, reject) {
						link.onload = resolve;
						link.onerror = reject;
					});
					link.addEventListener("load", function() {
						state.loading |= 1;
					});
					link.addEventListener("error", function() {
						state.loading |= 2;
					});
					state.loading |= 4;
					insertStylesheet(resource, precedence, ownerDocument);
				}
				resource = {
					type: "stylesheet",
					instance: resource,
					count: 1,
					state
				};
				styles.set(key, resource);
			}
		}
	}
	function preinitScript(src, options) {
		previousDispatcher.X(src, options);
		var ownerDocument = globalDocument;
		if (ownerDocument && src) {
			var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
			resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({
				src,
				async: !0
			}, options), (options = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
				type: "script",
				instance: resource,
				count: 1,
				state: null
			}, scripts.set(key, resource));
		}
	}
	function preinitModuleScript(src, options) {
		previousDispatcher.M(src, options);
		var ownerDocument = globalDocument;
		if (ownerDocument && src) {
			var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
			resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({
				src,
				async: !0,
				type: "module"
			}, options), (options = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
				type: "script",
				instance: resource,
				count: 1,
				state: null
			}, scripts.set(key, resource));
		}
	}
	function getResource(type, currentProps, pendingProps, currentResource) {
		var JSCompiler_inline_result = (JSCompiler_inline_result = rootInstanceStackCursor.current) ? getHoistableRoot(JSCompiler_inline_result) : null;
		if (!JSCompiler_inline_result) throw Error(formatProdErrorMessage(446));
		switch (type) {
			case "meta":
			case "title": return null;
			case "style": return "string" === typeof pendingProps.precedence && "string" === typeof pendingProps.href ? (pendingProps = getStyleKey(pendingProps.href), currentProps = getResourcesFromRoot(JSCompiler_inline_result).hoistableStyles, currentResource = currentProps.get(pendingProps), currentResource || (currentResource = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, currentProps.set(pendingProps, currentResource)), currentResource) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if ("stylesheet" === pendingProps.rel && "string" === typeof pendingProps.href && "string" === typeof pendingProps.precedence) {
					type = getStyleKey(pendingProps.href);
					var styles$268 = getResourcesFromRoot(JSCompiler_inline_result).hoistableStyles, resource$269 = styles$268.get(type);
					resource$269 || (JSCompiler_inline_result = JSCompiler_inline_result.ownerDocument || JSCompiler_inline_result, resource$269 = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, styles$268.set(type, resource$269), (styles$268 = JSCompiler_inline_result.querySelector(getStylesheetSelectorFromKey(type))) ? styles$268._p || (resource$269.instance = styles$268, resource$269.state.loading = 5) : (styles$268 = preloadPropsMap.get(type), styles$268 || (styles$268 = {
						rel: "preload",
						as: "style",
						href: pendingProps.href,
						crossOrigin: pendingProps.crossOrigin,
						integrity: pendingProps.integrity,
						media: pendingProps.media,
						hrefLang: pendingProps.hrefLang,
						referrerPolicy: pendingProps.referrerPolicy
					}, preloadPropsMap.set(type, styles$268)), preloadStylesheet(JSCompiler_inline_result, type, styles$268, resource$269.state)));
					if (currentProps && null === currentResource) throw Error(formatProdErrorMessage(528, ""));
					return resource$269;
				}
				if (currentProps && null !== currentResource) throw Error(formatProdErrorMessage(529, ""));
				return null;
			case "script": return currentProps = pendingProps.async, pendingProps = pendingProps.src, "string" === typeof pendingProps && currentProps && "function" !== typeof currentProps && "symbol" !== typeof currentProps ? (pendingProps = getScriptKey(pendingProps), currentProps = getResourcesFromRoot(JSCompiler_inline_result).hoistableScripts, currentResource = currentProps.get(pendingProps), currentResource || (currentResource = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, currentProps.set(pendingProps, currentResource)), currentResource) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(formatProdErrorMessage(444, type));
		}
	}
	function getStyleKey(href) {
		return "href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"";
	}
	function getStylesheetSelectorFromKey(key) {
		return "link[rel=\"stylesheet\"][" + key + "]";
	}
	function stylesheetPropsFromRawProps(rawProps) {
		return assign({}, rawProps, {
			"data-precedence": rawProps.precedence,
			precedence: null
		});
	}
	function preloadStylesheet(ownerDocument, key, preloadProps, state) {
		if (key = ownerDocument.querySelector("link[rel=\"preload\"][as=\"style\"][" + key + "]")) {
			if (!0 !== key[internalLoadPendingKey]) {
				state.loading = 1;
				return;
			}
		} else key = ownerDocument.createElement("link"), key[internalLoadPendingKey] = !0, key.onload = key.onerror = clearPendingLoadOnNode.bind(null, key), setInitialProperties(key, "link", preloadProps), markNodeAsHoistable(key), ownerDocument.head.appendChild(key);
		state.preload = key;
		key.addEventListener("load", function() {
			return state.loading |= 1;
		});
		key.addEventListener("error", function() {
			return state.loading |= 2;
		});
	}
	function getScriptKey(src) {
		return "[src=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(src) + "\"]";
	}
	function getScriptSelectorFromKey(key) {
		return "script[async]" + key;
	}
	function acquireResource(hoistableRoot, resource, props) {
		resource.count++;
		if (null === resource.instance) switch (resource.type) {
			case "style":
				var instance = hoistableRoot.querySelector("style[data-href~=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(props.href) + "\"]");
				if (instance) return resource.instance = instance, markNodeAsHoistable(instance), instance;
				var styleProps = assign({}, props, {
					"data-href": props.href,
					"data-precedence": props.precedence,
					href: null,
					precedence: null
				});
				instance = (hoistableRoot.ownerDocument || hoistableRoot).createElement("style");
				markNodeAsHoistable(instance);
				setInitialProperties(instance, "style", styleProps);
				insertStylesheet(instance, props.precedence, hoistableRoot);
				return resource.instance = instance;
			case "stylesheet":
				styleProps = getStyleKey(props.href);
				var instance$274 = hoistableRoot.querySelector(getStylesheetSelectorFromKey(styleProps));
				if (instance$274) return resource.state.loading |= 4, resource.instance = instance$274, markNodeAsHoistable(instance$274), instance$274;
				instance = stylesheetPropsFromRawProps(props);
				(styleProps = preloadPropsMap.get(styleProps)) && adoptPreloadPropsForStylesheet(instance, styleProps);
				instance$274 = (hoistableRoot.ownerDocument || hoistableRoot).createElement("link");
				markNodeAsHoistable(instance$274);
				var linkInstance = instance$274;
				linkInstance._p = new Promise(function(resolve, reject) {
					linkInstance.onload = resolve;
					linkInstance.onerror = reject;
				});
				setInitialProperties(instance$274, "link", instance);
				resource.state.loading |= 4;
				insertStylesheet(instance$274, props.precedence, hoistableRoot);
				return resource.instance = instance$274;
			case "script":
				instance$274 = getScriptKey(props.src);
				if (styleProps = hoistableRoot.querySelector(getScriptSelectorFromKey(instance$274))) return resource.instance = styleProps, markNodeAsHoistable(styleProps), styleProps;
				instance = props;
				if (styleProps = preloadPropsMap.get(instance$274)) instance = assign({}, props), adoptPreloadPropsForScript(instance, styleProps);
				hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
				styleProps = hoistableRoot.createElement("script");
				markNodeAsHoistable(styleProps);
				setInitialProperties(styleProps, "link", instance);
				hoistableRoot.head.appendChild(styleProps);
				return resource.instance = styleProps;
			case "void": return null;
			default: throw Error(formatProdErrorMessage(443, resource.type));
		}
		else "stylesheet" === resource.type && 0 === (resource.state.loading & 4) && (instance = resource.instance, resource.state.loading |= 4, insertStylesheet(instance, props.precedence, hoistableRoot));
		return resource.instance;
	}
	function insertStylesheet(instance, precedence, root) {
		for (var nodes = root.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), last = nodes.length ? nodes[nodes.length - 1] : null, prior = last, i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (node.dataset.precedence === precedence) prior = node;
			else if (prior !== last) break;
		}
		prior ? prior.parentNode.insertBefore(instance, prior.nextSibling) : (precedence = 9 === root.nodeType ? root.head : root, precedence.insertBefore(instance, precedence.firstChild));
	}
	function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
		stylesheetProps.crossOrigin ??= preloadProps.crossOrigin;
		stylesheetProps.referrerPolicy ??= preloadProps.referrerPolicy;
		stylesheetProps.title ??= preloadProps.title;
	}
	function adoptPreloadPropsForScript(scriptProps, preloadProps) {
		scriptProps.crossOrigin ??= preloadProps.crossOrigin;
		scriptProps.referrerPolicy ??= preloadProps.referrerPolicy;
		scriptProps.integrity ??= preloadProps.integrity;
	}
	var tagCaches = null;
	function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
		if (null === tagCaches) {
			var cache = /* @__PURE__ */ new Map();
			var caches = tagCaches = /* @__PURE__ */ new Map();
			caches.set(ownerDocument, cache);
		} else caches = tagCaches, cache = caches.get(ownerDocument), cache || (cache = /* @__PURE__ */ new Map(), caches.set(ownerDocument, cache));
		if (cache.has(type)) return cache;
		cache.set(type, null);
		ownerDocument = ownerDocument.getElementsByTagName(type);
		for (caches = 0; caches < ownerDocument.length; caches++) {
			var node = ownerDocument[caches];
			if (!(node[internalHoistableMarker] || node[internalInstanceKey] || "link" === type && "stylesheet" === node.getAttribute("rel")) && "http://www.w3.org/2000/svg" !== node.namespaceURI) {
				var nodeKey = node.getAttribute(keyAttribute) || "";
				nodeKey = type + nodeKey;
				var existing = cache.get(nodeKey);
				existing ? existing.push(node) : cache.set(nodeKey, [node]);
			}
		}
		return cache;
	}
	function mountHoistable(hoistableRoot, type, instance) {
		hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
		hoistableRoot.head.insertBefore(instance, "title" === type ? hoistableRoot.querySelector("head > title") : null);
	}
	function isHostHoistableType(type, props, hostContext) {
		if (1 === hostContext || null != props.itemProp) return !1;
		switch (type) {
			case "meta":
			case "title": return !0;
			case "style":
				if ("string" !== typeof props.precedence || "string" !== typeof props.href || "" === props.href) break;
				return !0;
			case "link":
				if ("string" !== typeof props.rel || "string" !== typeof props.href || "" === props.href || props.onLoad || props.onError) break;
				switch (props.rel) {
					case "stylesheet": return type = props.disabled, "string" === typeof props.precedence && null == type;
					default: return !0;
				}
			case "script": if (props.async && "function" !== typeof props.async && "symbol" !== typeof props.async && !props.onLoad && !props.onError && props.src && "string" === typeof props.src) return !0;
		}
		return !1;
	}
	function maySuspendCommit(type, props) {
		return "img" === type && null != props.src && "" !== props.src && null == props.onLoad && "lazy" !== props.loading;
	}
	function preloadResource(resource) {
		return "stylesheet" === resource.type && 0 === (resource.state.loading & 3) ? !1 : !0;
	}
	function estimateImageBytes(instance) {
		return (instance.width || 100) * (instance.height || 100) * ("number" === typeof devicePixelRatio ? devicePixelRatio : 1) * .25;
	}
	function suspendInstance(state, instance) {
		"function" === typeof instance.decode && (state.imgCount++, instance.complete || (state.imgBytes += estimateImageBytes(instance), state.suspenseyImages.push(instance)), state = onUnsuspendImg.bind(state), instance.decode().then(state, state));
	}
	function suspendResource(state, hoistableRoot, resource, props) {
		if ("stylesheet" === resource.type && ("string" !== typeof props.media || !1 !== matchMedia(props.media).matches) && 0 === (resource.state.loading & 4)) {
			if (null === resource.instance) {
				var key = getStyleKey(props.href), instance = hoistableRoot.querySelector(getStylesheetSelectorFromKey(key));
				if (instance) {
					hoistableRoot = instance._p;
					null !== hoistableRoot && "object" === typeof hoistableRoot && "function" === typeof hoistableRoot.then && (state.count++, state = onUnsuspend.bind(state), hoistableRoot.then(state, state));
					resource.state.loading |= 4;
					resource.instance = instance;
					markNodeAsHoistable(instance);
					return;
				}
				instance = hoistableRoot.ownerDocument || hoistableRoot;
				props = stylesheetPropsFromRawProps(props);
				(key = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(props, key);
				instance = instance.createElement("link");
				markNodeAsHoistable(instance);
				var linkInstance = instance;
				linkInstance._p = new Promise(function(resolve, reject) {
					linkInstance.onload = resolve;
					linkInstance.onerror = reject;
				});
				setInitialProperties(instance, "link", props);
				resource.instance = instance;
			}
			null === state.stylesheets && (state.stylesheets = /* @__PURE__ */ new Map());
			state.stylesheets.set(resource, hoistableRoot);
			(hoistableRoot = resource.state.preload) && 0 === (resource.state.loading & 3) && (state.count++, resource = onUnsuspend.bind(state), hoistableRoot.addEventListener("load", resource), hoistableRoot.addEventListener("error", resource));
		}
	}
	var estimatedBytesWithinLimit = 0;
	function waitForCommitToBeReady(state, timeoutOffset) {
		state.stylesheets && 0 === state.count && insertSuspendedStylesheets(state, state.stylesheets);
		return 0 < state.count || 0 < state.imgCount ? function(commit) {
			var stylesheetTimer = setTimeout(function() {
				state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets);
				if (state.unsuspend) {
					var unsuspend = state.unsuspend;
					state.unsuspend = null;
					unsuspend();
				}
			}, 6e4 + timeoutOffset);
			0 < state.imgBytes && 0 === estimatedBytesWithinLimit && (estimatedBytesWithinLimit = 62500 * estimateBandwidth());
			var imgTimer = setTimeout(function() {
				state.waitingForImages = !1;
				if (0 === state.count && (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend)) {
					var unsuspend = state.unsuspend;
					state.unsuspend = null;
					unsuspend();
				}
			}, (state.imgBytes > estimatedBytesWithinLimit ? 50 : 800) + timeoutOffset);
			state.unsuspend = commit;
			return function() {
				state.unsuspend = null;
				clearTimeout(stylesheetTimer);
				clearTimeout(imgTimer);
			};
		} : null;
	}
	function checkIfFullyUnsuspended(state) {
		if (0 === state.count && (0 === state.imgCount || !state.waitingForImages)) {
			if (state.stylesheets) insertSuspendedStylesheets(state, state.stylesheets);
			else if (state.unsuspend) {
				var unsuspend = state.unsuspend;
				state.unsuspend = null;
				unsuspend();
			}
		}
	}
	function onUnsuspend() {
		this.count--;
		checkIfFullyUnsuspended(this);
	}
	function onUnsuspendImg() {
		this.imgCount--;
		checkIfFullyUnsuspended(this);
	}
	var precedencesByRoot = null;
	function insertSuspendedStylesheets(state, resources) {
		state.stylesheets = null;
		null !== state.unsuspend && (state.count++, precedencesByRoot = /* @__PURE__ */ new Map(), resources.forEach(insertStylesheetIntoRoot, state), precedencesByRoot = null, onUnsuspend.call(state));
	}
	function insertStylesheetIntoRoot(root, resource) {
		if (!(resource.state.loading & 4)) {
			var precedences = precedencesByRoot.get(root);
			if (precedences) var last = precedences.get(null);
			else {
				precedences = /* @__PURE__ */ new Map();
				precedencesByRoot.set(root, precedences);
				for (var nodes = root.querySelectorAll("link[data-precedence],style[data-precedence]"), i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					if ("LINK" === node.nodeName || "not all" !== node.getAttribute("media")) precedences.set(node.dataset.precedence, node), last = node;
				}
				last && precedences.set(null, last);
			}
			nodes = resource.instance;
			node = nodes.getAttribute("data-precedence");
			i = precedences.get(node) || last;
			i === last && precedences.set(null, nodes);
			precedences.set(node, nodes);
			this.count++;
			last = onUnsuspend.bind(this);
			nodes.addEventListener("load", last);
			nodes.addEventListener("error", last);
			i ? i.parentNode.insertBefore(nodes, i.nextSibling) : (root = 9 === root.nodeType ? root.head : root, root.insertBefore(nodes, root.firstChild));
			resource.state.loading |= 4;
		}
	}
	var HostTransitionContext = {
		$$typeof: REACT_CONTEXT_TYPE,
		Provider: null,
		Consumer: null,
		_currentValue: sharedNotPendingObject,
		_currentValue2: sharedNotPendingObject,
		_threadCount: 0
	};
	function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
		this.tag = 1;
		this.containerInfo = containerInfo;
		this.pingCache = this.current = this.pendingChildren = null;
		this.timeoutHandle = -1;
		this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null;
		this.callbackPriority = 0;
		this.expirationTimes = createLaneMap(-1);
		this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
		this.entanglements = createLaneMap(0);
		this.hiddenUpdates = createLaneMap(null);
		this.identifierPrefix = identifierPrefix;
		this.onUncaughtError = onUncaughtError;
		this.onCaughtError = onCaughtError;
		this.onRecoverableError = onRecoverableError;
		this.pooledCache = null;
		this.pooledCacheLanes = 0;
		this.formState = formState;
		this.transitionTypes = null;
		this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
		containerInfo = new FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState);
		tag = 1;
		!0 === isStrictMode && (tag |= 24);
		isStrictMode = createFiberImplClass(3, null, null, tag);
		containerInfo.current = isStrictMode;
		isStrictMode.stateNode = containerInfo;
		tag = createCache();
		tag.refCount++;
		containerInfo.pooledCache = tag;
		tag.refCount++;
		isStrictMode.memoizedState = {
			element: initialChildren,
			isDehydrated: hydrate,
			cache: tag
		};
		initializeUpdateQueue(isStrictMode);
		return containerInfo;
	}
	function getContextForSubtree(parentComponent) {
		if (!parentComponent) return emptyContextObject;
		parentComponent = emptyContextObject;
		return parentComponent;
	}
	function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
		parentComponent = getContextForSubtree(parentComponent);
		null === container.context ? container.context = parentComponent : container.pendingContext = parentComponent;
		container = createUpdate(lane);
		container.payload = { element };
		callback = void 0 === callback ? null : callback;
		null !== callback && (container.callback = callback);
		element = enqueueUpdate(rootFiber, container, lane);
		null !== element && (scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
	}
	function markRetryLaneImpl(fiber, retryLane) {
		fiber = fiber.memoizedState;
		if (null !== fiber && null !== fiber.dehydrated) {
			var a = fiber.retryLane;
			fiber.retryLane = 0 !== a && a < retryLane ? a : retryLane;
		}
	}
	function markRetryLaneIfNotHydrated(fiber, retryLane) {
		markRetryLaneImpl(fiber, retryLane);
		(fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
	}
	function attemptContinuousHydration(fiber) {
		if (13 === fiber.tag || 31 === fiber.tag) {
			var root = enqueueConcurrentRenderForLane(fiber, 67108864);
			null !== root && scheduleUpdateOnFiber(root, fiber, 67108864);
			markRetryLaneIfNotHydrated(fiber, 67108864);
		}
	}
	function attemptHydrationAtCurrentPriority(fiber) {
		if (13 === fiber.tag || 31 === fiber.tag) {
			var lane = requestUpdateLane();
			lane = getBumpedLaneForHydrationByLane(lane);
			var root = enqueueConcurrentRenderForLane(fiber, lane);
			null !== root && scheduleUpdateOnFiber(root, fiber, lane);
			markRetryLaneIfNotHydrated(fiber, lane);
		}
	}
	var _enabled = !0;
	function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
		var prevTransition = ReactSharedInternals.T;
		ReactSharedInternals.T = null;
		var previousPriority = ReactDOMSharedInternals.p;
		try {
			ReactDOMSharedInternals.p = 2, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
		} finally {
			ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
		}
	}
	function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
		var prevTransition = ReactSharedInternals.T;
		ReactSharedInternals.T = null;
		var previousPriority = ReactDOMSharedInternals.p;
		try {
			ReactDOMSharedInternals.p = 8, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
		} finally {
			ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
		}
	}
	function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
		if (_enabled) {
			var blockedOn = findInstanceBlockingEvent(nativeEvent);
			if (null === blockedOn) dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer), clearIfContinuousEvent(domEventName, nativeEvent);
			else if (queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent)) nativeEvent.stopPropagation();
			else if (clearIfContinuousEvent(domEventName, nativeEvent), eventSystemFlags & 4 && -1 < discreteReplayableEvents.indexOf(domEventName)) {
				for (; null !== blockedOn;) {
					var fiber = getInstanceFromNode(blockedOn);
					if (null !== fiber) switch (fiber.tag) {
						case 3:
							fiber = fiber.stateNode;
							if (fiber.current.memoizedState.isDehydrated) {
								var lanes = getHighestPriorityLanes(fiber.pendingLanes);
								if (0 !== lanes) {
									var root = fiber;
									root.pendingLanes |= 2;
									for (root.entangledLanes |= 2; lanes;) {
										var lane = 1 << 31 - clz32(lanes);
										root.entanglements[1] |= lane;
										lanes &= ~lane;
									}
									ensureRootIsScheduled(fiber);
									0 === (executionContext & 6) && (workInProgressRootRenderTargetTime = now() + 500, flushSyncWorkAcrossRoots_impl(0, !1));
								}
							}
							break;
						case 31:
						case 13: root = enqueueConcurrentRenderForLane(fiber, 2), null !== root && scheduleUpdateOnFiber(root, fiber, 2), flushSyncWork$1(), markRetryLaneIfNotHydrated(fiber, 2);
					}
					fiber = findInstanceBlockingEvent(nativeEvent);
					null === fiber && dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer);
					if (fiber === blockedOn) break;
					blockedOn = fiber;
				}
				null !== blockedOn && nativeEvent.stopPropagation();
			} else dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, null, targetContainer);
		}
	}
	function findInstanceBlockingEvent(nativeEvent) {
		nativeEvent = getEventTarget(nativeEvent);
		return findInstanceBlockingTarget(nativeEvent);
	}
	var return_targetInst = null;
	function findInstanceBlockingTarget(targetNode) {
		return_targetInst = null;
		targetNode = getClosestInstanceFromNode(targetNode);
		if (null !== targetNode) {
			var nearestMounted = getNearestMountedFiber(targetNode);
			if (null === nearestMounted) targetNode = null;
			else {
				var tag = nearestMounted.tag;
				if (13 === tag) {
					targetNode = getSuspenseInstanceFromFiber(nearestMounted);
					if (null !== targetNode) return targetNode;
					targetNode = null;
				} else if (31 === tag) {
					targetNode = getActivityInstanceFromFiber(nearestMounted);
					if (null !== targetNode) return targetNode;
					targetNode = null;
				} else if (3 === tag) {
					if (nearestMounted.stateNode.current.memoizedState.isDehydrated) return 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
					targetNode = null;
				} else nearestMounted !== targetNode && (targetNode = null);
			}
		}
		return_targetInst = targetNode;
		return null;
	}
	function getEventPriority(domEventName) {
		switch (domEventName) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "fullscreenerror":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "resize":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (getCurrentPriorityLevel()) {
				case ImmediatePriority: return 2;
				case UserBlockingPriority: return 8;
				case NormalPriority$1:
				case LowPriority: return 32;
				case IdlePriority: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var hasScheduledReplayAttempt = !1;
	var queuedFocus = null;
	var queuedDrag = null;
	var queuedMouse = null;
	var queuedPointers = /* @__PURE__ */ new Map();
	var queuedPointerCaptures = /* @__PURE__ */ new Map();
	var queuedExplicitHydrationTargets = [];
	var discreteReplayableEvents = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function clearIfContinuousEvent(domEventName, nativeEvent) {
		switch (domEventName) {
			case "focusin":
			case "focusout":
				queuedFocus = null;
				break;
			case "dragenter":
			case "dragleave":
				queuedDrag = null;
				break;
			case "mouseover":
			case "mouseout":
				queuedMouse = null;
				break;
			case "pointerover":
			case "pointerout":
				queuedPointers.delete(nativeEvent.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": queuedPointerCaptures.delete(nativeEvent.pointerId);
		}
	}
	function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
		if (null === existingQueuedEvent || existingQueuedEvent.nativeEvent !== nativeEvent) return existingQueuedEvent = {
			blockedOn,
			domEventName,
			eventSystemFlags,
			nativeEvent,
			targetContainers: [targetContainer]
		}, null !== blockedOn && (blockedOn = getInstanceFromNode(blockedOn), null !== blockedOn && attemptContinuousHydration(blockedOn)), existingQueuedEvent;
		existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
		blockedOn = existingQueuedEvent.targetContainers;
		null !== targetContainer && -1 === blockedOn.indexOf(targetContainer) && blockedOn.push(targetContainer);
		return existingQueuedEvent;
	}
	function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
		switch (domEventName) {
			case "focusin": return queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(queuedFocus, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent), !0;
			case "dragenter": return queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(queuedDrag, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent), !0;
			case "mouseover": return queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(queuedMouse, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent), !0;
			case "pointerover":
				var pointerId = nativeEvent.pointerId;
				queuedPointers.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointers.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent));
				return !0;
			case "gotpointercapture": return pointerId = nativeEvent.pointerId, queuedPointerCaptures.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointerCaptures.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent)), !0;
		}
		return !1;
	}
	function attemptExplicitHydrationTarget(queuedTarget) {
		var targetInst = getClosestInstanceFromNode(queuedTarget.target);
		if (null !== targetInst) {
			var nearestMounted = getNearestMountedFiber(targetInst);
			if (null !== nearestMounted) {
				if (targetInst = nearestMounted.tag, 13 === targetInst) {
					if (targetInst = getSuspenseInstanceFromFiber(nearestMounted), null !== targetInst) {
						queuedTarget.blockedOn = targetInst;
						runWithPriority(queuedTarget.priority, function() {
							attemptHydrationAtCurrentPriority(nearestMounted);
						});
						return;
					}
				} else if (31 === targetInst) {
					if (targetInst = getActivityInstanceFromFiber(nearestMounted), null !== targetInst) {
						queuedTarget.blockedOn = targetInst;
						runWithPriority(queuedTarget.priority, function() {
							attemptHydrationAtCurrentPriority(nearestMounted);
						});
						return;
					}
				} else if (3 === targetInst && nearestMounted.stateNode.current.memoizedState.isDehydrated) {
					queuedTarget.blockedOn = 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
					return;
				}
			}
		}
		queuedTarget.blockedOn = null;
	}
	function attemptReplayContinuousQueuedEvent(queuedEvent) {
		if (null !== queuedEvent.blockedOn) return !1;
		for (var targetContainers = queuedEvent.targetContainers; 0 < targetContainers.length;) {
			var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.nativeEvent);
			if (null === nextBlockedOn) {
				nextBlockedOn = queuedEvent.nativeEvent;
				var nativeEventClone = new nextBlockedOn.constructor(nextBlockedOn.type, nextBlockedOn);
				currentReplayingEvent = nativeEventClone;
				nextBlockedOn.target.dispatchEvent(nativeEventClone);
				currentReplayingEvent = null;
			} else return targetContainers = getInstanceFromNode(nextBlockedOn), null !== targetContainers && attemptContinuousHydration(targetContainers), queuedEvent.blockedOn = nextBlockedOn, !1;
			targetContainers.shift();
		}
		return !0;
	}
	function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
		attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
	}
	function replayUnblockedEvents() {
		hasScheduledReplayAttempt = !1;
		null !== queuedFocus && attemptReplayContinuousQueuedEvent(queuedFocus) && (queuedFocus = null);
		null !== queuedDrag && attemptReplayContinuousQueuedEvent(queuedDrag) && (queuedDrag = null);
		null !== queuedMouse && attemptReplayContinuousQueuedEvent(queuedMouse) && (queuedMouse = null);
		queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
		queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
	}
	function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
		queuedEvent.blockedOn === unblocked && (queuedEvent.blockedOn = null, hasScheduledReplayAttempt || (hasScheduledReplayAttempt = !0, Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, replayUnblockedEvents)));
	}
	var lastScheduledReplayQueue = null;
	function scheduleReplayQueueIfNeeded(formReplayingQueue) {
		lastScheduledReplayQueue !== formReplayingQueue && (lastScheduledReplayQueue = formReplayingQueue, Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, function() {
			lastScheduledReplayQueue === formReplayingQueue && (lastScheduledReplayQueue = null);
			for (var i = 0; i < formReplayingQueue.length; i += 3) {
				var form = formReplayingQueue[i], submitterOrAction = formReplayingQueue[i + 1], formData = formReplayingQueue[i + 2];
				if ("function" !== typeof submitterOrAction) if (null === findInstanceBlockingTarget(submitterOrAction || form)) continue;
				else break;
				var formInst = getInstanceFromNode(form);
				null !== formInst && (formReplayingQueue.splice(i, 3), i -= 3, startHostTransition(formInst, {
					pending: !0,
					data: formData,
					method: form.method,
					action: submitterOrAction
				}, submitterOrAction, formData));
			}
		}));
	}
	function retryIfBlockedOn(unblocked) {
		function unblock(queuedEvent) {
			return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
		}
		null !== queuedFocus && scheduleCallbackIfUnblocked(queuedFocus, unblocked);
		null !== queuedDrag && scheduleCallbackIfUnblocked(queuedDrag, unblocked);
		null !== queuedMouse && scheduleCallbackIfUnblocked(queuedMouse, unblocked);
		queuedPointers.forEach(unblock);
		queuedPointerCaptures.forEach(unblock);
		for (var i = 0; i < queuedExplicitHydrationTargets.length; i++) {
			var queuedTarget = queuedExplicitHydrationTargets[i];
			queuedTarget.blockedOn === unblocked && (queuedTarget.blockedOn = null);
		}
		for (; 0 < queuedExplicitHydrationTargets.length && (i = queuedExplicitHydrationTargets[0], null === i.blockedOn);) attemptExplicitHydrationTarget(i), null === i.blockedOn && queuedExplicitHydrationTargets.shift();
		i = (unblocked.ownerDocument || unblocked).$$reactFormReplay;
		if (null != i) for (queuedTarget = 0; queuedTarget < i.length; queuedTarget += 3) {
			var form = i[queuedTarget], submitterOrAction = i[queuedTarget + 1], formProps = form[internalPropsKey] || null;
			if ("function" === typeof submitterOrAction) formProps || scheduleReplayQueueIfNeeded(i);
			else if (formProps) {
				var action = null;
				if (submitterOrAction && submitterOrAction.hasAttribute("formAction")) {
					if (form = submitterOrAction, formProps = submitterOrAction[internalPropsKey] || null) action = formProps.formAction;
					else if (null !== findInstanceBlockingTarget(form)) continue;
				} else action = formProps.action;
				"function" === typeof action ? i[queuedTarget + 1] = action : (i.splice(queuedTarget, 3), queuedTarget -= 3);
				scheduleReplayQueueIfNeeded(i);
			}
		}
	}
	function defaultOnDefaultTransitionIndicator() {
		function handleNavigate(event) {
			event.canIntercept && "react-transition" === event.info && event.intercept({
				handler: function() {
					return new Promise(function(resolve) {
						return pendingResolve = resolve;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function handleNavigateComplete() {
			null !== pendingResolve && (pendingResolve(), pendingResolve = null);
			isCancelled || setTimeout(startFakeNavigation, 20);
		}
		function startFakeNavigation() {
			if (!isCancelled && !navigation.transition) {
				var currentEntry = navigation.currentEntry;
				currentEntry && null != currentEntry.url && navigation.navigate(currentEntry.url, {
					state: currentEntry.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if ("object" === typeof navigation) {
			var isCancelled = !1, pendingResolve = null;
			navigation.addEventListener("navigate", handleNavigate);
			navigation.addEventListener("navigatesuccess", handleNavigateComplete);
			navigation.addEventListener("navigateerror", handleNavigateComplete);
			setTimeout(startFakeNavigation, 100);
			return function() {
				isCancelled = !0;
				navigation.removeEventListener("navigate", handleNavigate);
				navigation.removeEventListener("navigatesuccess", handleNavigateComplete);
				navigation.removeEventListener("navigateerror", handleNavigateComplete);
				null !== pendingResolve && (pendingResolve(), pendingResolve = null);
			};
		}
	}
	function ReactDOMRoot(internalRoot) {
		this._internalRoot = internalRoot;
	}
	ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function(children) {
		var root = this._internalRoot;
		if (null === root) throw Error(formatProdErrorMessage(409));
		var current = root.current;
		updateContainerImpl(current, requestUpdateLane(), children, root, null, null);
	};
	ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function() {
		var root = this._internalRoot;
		if (null !== root) {
			this._internalRoot = null;
			var container = root.containerInfo;
			updateContainerImpl(root.current, 2, null, root, null, null);
			flushSyncWork$1();
			container[internalContainerInstanceKey] = null;
		}
	};
	function ReactDOMHydrationRoot(internalRoot) {
		this._internalRoot = internalRoot;
	}
	ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function(target) {
		if (target) {
			var updatePriority = resolveUpdatePriority();
			target = {
				blockedOn: null,
				target,
				priority: updatePriority
			};
			for (var i = 0; i < queuedExplicitHydrationTargets.length && 0 !== updatePriority && updatePriority < queuedExplicitHydrationTargets[i].priority; i++);
			queuedExplicitHydrationTargets.splice(i, 0, target);
			0 === i && attemptExplicitHydrationTarget(target);
		}
	};
	var isomorphicReactPackageVersion$jscomp$inline_2043 = React.version;
	if ("19.3.1" !== isomorphicReactPackageVersion$jscomp$inline_2043) throw Error(formatProdErrorMessage(527, isomorphicReactPackageVersion$jscomp$inline_2043, "19.3.1"));
	ReactDOMSharedInternals.findDOMNode = function(componentOrElement) {
		var fiber = componentOrElement._reactInternals;
		if (void 0 === fiber) {
			if ("function" === typeof componentOrElement.render) throw Error(formatProdErrorMessage(188));
			componentOrElement = Object.keys(componentOrElement).join(",");
			throw Error(formatProdErrorMessage(268, componentOrElement));
		}
		componentOrElement = findCurrentFiberUsingSlowPath(fiber);
		componentOrElement = null !== componentOrElement ? findCurrentHostFiberImpl(componentOrElement) : null;
		componentOrElement = null === componentOrElement ? null : componentOrElement.stateNode;
		return componentOrElement;
	};
	var internals$jscomp$inline_2586 = {
		bundleType: 0,
		version: "19.3.1",
		rendererPackageName: "react-dom",
		currentDispatcherRef: ReactSharedInternals,
		reconcilerVersion: "19.3.1"
	};
	if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
		var hook$jscomp$inline_2587 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!hook$jscomp$inline_2587.isDisabled && hook$jscomp$inline_2587.supportsFiber) try {
			rendererID = hook$jscomp$inline_2587.inject(internals$jscomp$inline_2586), injectedHook = hook$jscomp$inline_2587;
		} catch (err) {}
	}
	exports.createRoot = function(container, options) {
		if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
		var isStrictMode = !1, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError;
		null !== options && void 0 !== options && (!0 === options.unstable_strictMode && (isStrictMode = !0), void 0 !== options.identifierPrefix && (identifierPrefix = options.identifierPrefix), void 0 !== options.onUncaughtError && (onUncaughtError = options.onUncaughtError), void 0 !== options.onCaughtError && (onCaughtError = options.onCaughtError), void 0 !== options.onRecoverableError && (onRecoverableError = options.onRecoverableError));
		options = createFiberRoot(container, 1, !1, null, null, isStrictMode, identifierPrefix, null, onUncaughtError, onCaughtError, onRecoverableError, defaultOnDefaultTransitionIndicator);
		container[internalContainerInstanceKey] = options.current;
		listenToAllSupportedEvents(container);
		return new ReactDOMRoot(options);
	};
}));
// \0vite/preload-helper.js
var import_client = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	function checkDCE() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") return;
		try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
		} catch (err) {
			console.error(err);
		}
	}
	checkDCE();
	module.exports = require_react_dom_client_production();
})))();
var scriptRel = "modulepreload";
var assetsURL = function(dep) {
	return "/" + dep;
};
var seen = {};
var isCssPreloadUrl = function isCssPreloadUrl(url) {
	return url.pathname.endsWith(".css");
};
var preloadOnce = function preloadOnce(seen, href, preload) {
	if (href in seen) return seen[href];
	const promise = preload();
	if (!promise) {
		seen[href] = void 0;
		return;
	}
	const preloadPromise = promise.then(() => {
		seen[href] = void 0;
	}, (err) => {
		seen[href] = void 0;
		throw err;
	});
	seen[href] = preloadPromise;
	return preloadPromise;
};
var __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (deps && deps.length > 0) {
		let preloadedHrefs;
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
		function allSettled(promises) {
			return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
				status: "fulfilled",
				value
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		function importMetaResolve(specifier) {
			if (import.meta.resolve) return new URL(import.meta.resolve(specifier));
			return new URL(
				specifier,
				/** #__KEEP__ */
				import.meta.url
			);
		}
		promise = allSettled(deps.map((depString) => {
			depString = assetsURL(depString, importerUrl);
			const dep = importMetaResolve(depString);
			const isCss = isCssPreloadUrl(dep);
			return preloadOnce(seen, dep.href, () => {
				if (preloadedHrefs === void 0) {
					preloadedHrefs = {
						all: /* @__PURE__ */ new Set(),
						styles: /* @__PURE__ */ new Set()
					};
					const links = document.getElementsByTagName("link");
					for (let i = links.length - 1; i >= 0; i--) {
						const link = links[i];
						preloadedHrefs.all.add(link.href);
						if (link.rel === "stylesheet") preloadedHrefs.styles.add(link.href);
					}
				}
				if ((isCss ? preloadedHrefs.styles : preloadedHrefs.all).has(dep.href)) return;
				const link = document.createElement("link");
				link.rel = isCss ? "stylesheet" : scriptRel;
				if (!isCss) link.as = "script";
				link.crossOrigin = "";
				link.href = dep.href;
				if (cspNonce) link.setAttribute("nonce", cspNonce);
				document.head.appendChild(link);
				if (isCss) return new Promise((res, rej) => {
					const handleSettle = (e) => {
						link.removeEventListener("load", handleSettle);
						link.removeEventListener("error", handleSettle);
						if (e.type === "error") rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`));
						else res(e);
					};
					link.addEventListener("load", handleSettle);
					link.addEventListener("error", handleSettle);
				});
			});
		}).filter((p) => p !== void 0));
	}
	function handlePreloadError(err) {
		const e = new Event("vite:preloadError", { cancelable: true });
		e.payload = err;
		window.dispatchEvent(e);
		if (!e.defaultPrevented) throw err;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};
// ../../@vite-plugin-pwa/virtual:pwa-register
var autoUpdateMode = "true";
var selfDestroying = "false";
var auto = autoUpdateMode === "true";
var autoDestroy = selfDestroying === "true";
function registerSW(options = {}) {
	const { immediate = false, onNeedReload, onNeedRefresh, onOfflineReady, onRegistered, onRegisteredSW, onRegisterError } = options;
	let wb;
	let registerPromise;
	let sendSkipWaitingMessage;
	const updateServiceWorker = async (_reloadPage = true) => {
		await registerPromise;
		if (!auto) sendSkipWaitingMessage?.();
	};
	async function register() {
		if ("serviceWorker" in navigator) {
			wb = await __vitePreload(async () => {
				const { Workbox } = await import("./workbox-window.prod.es5-CzJxx9q2.js");
				return { Workbox };
			}, []).then(({ Workbox }) => {
				return new Workbox("/sw.js", {
					scope: "/",
					type: "classic"
				});
			}).catch((e) => {
				onRegisterError?.(e);
			});
			if (!wb) return;
			sendSkipWaitingMessage = () => {
				wb?.messageSkipWaiting();
			};
			if (!autoDestroy) {
				if (auto) {
					wb.addEventListener("activated", (event) => {
						if (event.isUpdate || event.isExternal) {
							if (onNeedReload) onNeedReload();
							else window.location.reload();
						}
					});
					wb.addEventListener("installed", (event) => {
						if (!event.isUpdate) onOfflineReady?.();
					});
				} else {
					let onNeedRefreshCalled = false;
					const showSkipWaitingPrompt = () => {
						onNeedRefreshCalled = true;
						wb?.addEventListener("controlling", (event) => {
							if (event.isUpdate) {
								if (onNeedReload) onNeedReload();
								else window.location.reload();
							}
						});
						onNeedRefresh?.();
					};
					wb.addEventListener("installed", (event) => {
						if (typeof event.isUpdate === "undefined") {
							if (typeof event.isExternal !== "undefined") {
								if (event.isExternal) showSkipWaitingPrompt();
								else !onNeedRefreshCalled && onOfflineReady?.();
							} else !onNeedRefreshCalled && onOfflineReady?.();
						} else if (!event.isUpdate) onOfflineReady?.();
					});
					wb.addEventListener("waiting", showSkipWaitingPrompt);
				}
			}
			wb.register({ immediate }).then((r) => {
				if (onRegisteredSW) onRegisteredSW("/sw.js", r);
				else onRegistered?.(r);
			}).catch((e) => {
				onRegisterError?.(e);
			});
		}
	}
	registerPromise = register();
	return updateServiceWorker;
}
// node_modules/lucide-react/dist/esm/shared/src/utils.js
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase());
var toPascalCase = (string) => {
	const camelCase = toCamelCase(string);
	return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
	return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
var hasA11yProp = (props) => {
	for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
};
// node_modules/lucide-react/dist/esm/defaultAttributes.js
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
};
// node_modules/lucide-react/dist/esm/Icon.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Icon = (0, import_react.forwardRef)(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => (0, import_react.createElement)("svg", {
	ref,
	...defaultAttributes,
	width: size,
	height: size,
	stroke: color,
	strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
	className: mergeClasses("lucide", className),
	...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
	...rest
}, [...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]));
// node_modules/lucide-react/dist/esm/createLucideIcon.js
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var createLucideIcon = (iconName, iconNode) => {
	const Component = (0, import_react.forwardRef)(({ className, ...props }, ref) => (0, import_react.createElement)(Icon, {
		ref,
		iconNode,
		className: mergeClasses(`lucide-${toKebabCase(toPascalCase(iconName))}`, `lucide-${iconName}`, className),
		...props
	}));
	Component.displayName = toPascalCase(iconName);
	return Component;
};
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Check = createLucideIcon("check", [["path", {
	d: "M20 6 9 17l-5-5",
	key: "1gmf2c"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Copy = createLucideIcon("copy", [["rect", {
	width: "14",
	height: "14",
	x: "8",
	y: "8",
	rx: "2",
	ry: "2",
	key: "17jyea"
}], ["path", {
	d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
	key: "zix9uf"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Download = createLucideIcon("download", [
	["path", {
		d: "M12 15V3",
		key: "m9g1x1"
	}],
	["path", {
		d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
		key: "ih7n3h"
	}],
	["path", {
		d: "m7 10 5 5 5-5",
		key: "brsn70"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileText = createLucideIcon("file-text", [
	["path", {
		d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
		key: "1rqfz7"
	}],
	["path", {
		d: "M14 2v4a2 2 0 0 0 2 2h4",
		key: "tnqrlb"
	}],
	["path", {
		d: "M10 9H8",
		key: "b1mrlr"
	}],
	["path", {
		d: "M16 13H8",
		key: "t4e002"
	}],
	["path", {
		d: "M16 17H8",
		key: "z1uh3a"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FolderArchive = createLucideIcon("folder-archive", [
	["circle", {
		cx: "15",
		cy: "19",
		r: "2",
		key: "u2pros"
	}],
	["path", {
		d: "M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1",
		key: "1jj40k"
	}],
	["path", {
		d: "M15 11v-1",
		key: "cntcp"
	}],
	["path", {
		d: "M15 17v-2",
		key: "1279jj"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Smartphone = createLucideIcon("smartphone", [["rect", {
	width: "14",
	height: "20",
	x: "5",
	y: "2",
	rx: "2",
	ry: "2",
	key: "1yt0o3"
}], ["path", {
	d: "M12 18h.01",
	key: "mhygvu"
}]]);
// src/standalone/partituras-editor-v11.html?raw
var partituras_editor_v11_default = "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>Editor PDF de partituras · v11.0</title>\n<style>\n  :root {\n    --bg: #f3f5f4; --panel: #ffffff; --panel-2: #f7f9f8; --border: #dce4e0;\n    --text: #1e2d28; --muted: #62716b; --accent: #147d68; --accent-dark: #0c6654;\n    --accent-soft: #e3f2ed; --danger: #a33b35; --warn: #a85d12;\n    --shadow: 0 12px 34px rgba(25, 55, 45, .12);\n  }\n  * { box-sizing: border-box; }\n  body {\n    margin: 0;\n    font-family: \"Plus Jakarta Sans\", \"Segoe UI\", system-ui, -apple-system, sans-serif;\n    background: var(--bg);\n    color: var(--text);\n    font-size: 13px;\n  }\n  #menusHost { display: contents; }\n  #mobileQuickBar {\n    display: none;\n    position: sticky; top: 0; z-index: 24;\n    align-items: center; gap: 6px; padding: 7px 10px;\n    background: rgba(255,255,255,.97); border-bottom: 1px solid var(--border);\n    box-shadow: 0 3px 14px rgba(25,55,45,.07); backdrop-filter: blur(12px);\n  }\n  #mobileQuickBar button {\n    font-family: inherit; font-size: 12px; font-weight: 600; color: var(--text);\n    background: #fff; border: 1px solid var(--border); border-radius: 8px;\n    padding: 6px 10px; min-height: 36px; cursor: pointer; white-space: nowrap;\n    display: inline-flex; align-items: center; justify-content: center; gap: 4px;\n  }\n  #mobileQuickBar button:hover { background: #eef5f2; }\n  #mobileQuickBar button:disabled { opacity: .42; cursor: not-allowed; }\n  #mobileQuickBar button.primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 700; }\n  #mobileQuickBar button.active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent-dark); }\n  #mobileQuickBar button.btn-play-active { background: #1e2d28; border-color: #1e2d28; color: #fff; }\n  #mobileQuickBar .mob-spacer { flex: 1 1 auto; }\n  #mobPageLabel { font-size: 12px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; padding: 0 2px; white-space: nowrap; }\n  #mobileQuickBar .practice-only { display: none; }\n  body.practice-mode #mobileQuickBar .practice-only { display: inline-flex; }\n  body.practice-mode #mobileQuickBar .edit-only { display: none; }\n\n  #toolbar {\n    position: sticky; top: 0; z-index: 20;\n    display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px;\n    padding: 9px 14px; background: rgba(255,255,255,.97); border-bottom: 1px solid var(--border);\n    box-shadow: 0 3px 14px rgba(25,55,45,.06); backdrop-filter: blur(12px);\n  }\n  #practiceBar {\n    display: none;\n    position: sticky; top: 54px; z-index: 18;\n    flex-wrap: wrap; align-items: center; gap: 8px;\n    padding: 8px 14px; background: #edf4f1; border-bottom: 1px solid #c9dcd5;\n  }\n  body.practice-mode #practiceBar { display: flex; }\n  body.practice-mode .edit-only { display: none !important; }\n  body.practice-mode #overlay { pointer-events: none; }\n  body.practice-mode.has-loop-url #overlay { pointer-events: auto; }\n\n  /* Pantalla completa en reproducción */\n  body.practice-fullscreen { background: #141d1a; }\n  body.practice-fullscreen #mobileQuickBar,\n  body.practice-fullscreen #menusHost,\n  body.practice-fullscreen #toolbar,\n  body.practice-fullscreen #practiceBar,\n  body.practice-fullscreen #hint { display: none !important; }\n  body.practice-fullscreen #stageFrame { margin: 10px auto 64px; }\n  #fullscreenHud {\n    display: none; position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%);\n    z-index: 45; align-items: center; gap: 8px; flex-wrap: wrap;\n    padding: 7px 12px; border-radius: 12px;\n    background: rgba(255,255,255,.94); border: 1px solid var(--border);\n    box-shadow: 0 12px 32px rgba(0,0,0,.35); backdrop-filter: blur(10px);\n  }\n  body.practice-fullscreen #fullscreenHud { display: flex; }\n  #fullscreenHud button {\n    font-family: inherit; font-size: 12px; font-weight: 600;\n    padding: 6px 10px; border-radius: 7px; border: 1px solid var(--border);\n    background: #fff; color: var(--text); cursor: pointer; white-space: nowrap;\n  }\n  #fullscreenHud button:hover { background: #eef5f2; }\n  #fullscreenHud button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }\n  #fullscreenHud button.primary:hover { background: var(--accent-dark); }\n  #fsReadout { font-size: 12px; font-weight: 700; color: var(--accent-dark); font-variant-numeric: tabular-nums; padding: 0 4px; white-space: nowrap; }\n\n  .group {\n    display: flex; align-items: center; gap: 5px; flex-wrap: wrap;\n    padding: 5px 8px; background: var(--panel-2);\n    border: 1px solid var(--border); border-radius: 10px;\n  }\n  .group-label {\n    font-size: 10px; text-transform: uppercase; letter-spacing: .08em;\n    color: var(--muted); margin-right: 4px; font-weight: 700; white-space: nowrap;\n  }\n  #toolbar button, #toolbar select, #toolbar input[type=\"color\"],\n  #practiceBar button, #practiceBar select, #practiceBar input[type=\"number\"] {\n    font-family: inherit; font-size: 12px; font-weight: 600; color: var(--text);\n    background: #fff; border: 1px solid var(--border);\n    border-radius: 7px; padding: 6px 9px; cursor: pointer; white-space: nowrap;\n    transition: background .14s, border-color .14s, box-shadow .14s, transform .05s;\n  }\n  #toolbar button:hover, #toolbar select:hover,\n  #practiceBar button:hover, #practiceBar select:hover { background: #eef5f2; border-color: #9ab9ae; }\n  #toolbar button:focus-visible, #toolbar select:focus-visible, #toolbar input:focus-visible,\n  #practiceBar button:focus-visible, #practiceBar select:focus-visible, #practiceBar input:focus-visible,\n  .modal-card button:focus-visible, .modal-card input:focus-visible, .modal-card select:focus-visible {\n    outline: 3px solid rgba(20,125,104,.24); outline-offset: 1px;\n  }\n  #toolbar button:active, #practiceBar button:active { transform: translateY(1px); }\n  #toolbar button:disabled, #practiceBar button:disabled { opacity: .42; cursor: not-allowed; }\n  #toolbar button.active, #practiceBar button.active {\n    background: var(--accent-soft); border-color: var(--accent);\n    color: var(--accent-dark); box-shadow: inset 0 0 0 1px var(--accent);\n  }\n  #toolbar button.finger-btn {\n    width: 31px; height: 31px; padding: 0; font-size: 14px;\n    display: inline-flex; align-items: center; justify-content: center; font-weight: 700;\n  }\n  #toolbar input[type=\"number\"], #toolbar input[type=\"text\"], #practiceBar input[type=\"number\"] {\n    width: 56px; padding: 5px 6px; background: #fff; color: var(--text);\n    border: 1px solid var(--border); border-radius: 7px; font-size: 12px;\n    font-variant-numeric: tabular-nums; cursor: text;\n  }\n  #toolbar input[type=\"color\"] { width: 30px; height: 29px; padding: 2px; border-radius: 7px; }\n  #toolbar label, #practiceBar label {\n    display: inline-flex; align-items: center; gap: 5px; font-size: 11px;\n    color: var(--muted); font-weight: 600; white-space: nowrap;\n  }\n  #toolbar .btn-danger, #practiceBar .btn-danger { color: var(--danger); }\n  #toolbar .btn-danger:hover, #practiceBar .btn-danger:hover { background: #fff1ef; border-color: #e3b6b1; }\n  #toolbar .btn-primary, #practiceBar .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 700; }\n  #toolbar .btn-primary:hover, #practiceBar .btn-primary:hover { background: var(--accent-dark); }\n  #toolbar .btn-play-active { background: #1e2d28; border-color: #1e2d28; color: #fff; }\n  #toolbar .btn-play-active:hover { background: #2c4039; }\n\n  #pageNav { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); padding: 0 2px; white-space: nowrap; font-variant-numeric: tabular-nums; }\n  #pageNav button { min-width: 28px; padding: 5px 8px; }\n  .meta-inline { color: var(--muted); font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }\n  .dirty-flag { color: var(--warn); font-weight: 700; }\n  .pedal-wait { color: var(--accent-dark); font-weight: 700; }\n  .countin-flag { color: #8c3f19; font-weight: 700; }\n  #pdfFile, #projectFile { display: none; }\n\n  #hint {\n    padding: 8px 14px; font-size: 12px; line-height: 1.5; color: var(--muted);\n    border-bottom: 1px solid var(--border); background: #f8faf9;\n    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;\n  }\n  #hint b, #hint strong { color: var(--text); }\n  #loopStatusBadge { font-size: 11px; color: var(--muted); }\n  #loopStatusBadge a { color: var(--accent-dark); font-weight: 600; text-decoration: none; }\n  #loopStatusBadge a:hover { text-decoration: underline; }\n\n  #stageFrame { position: relative; width: 1px; height: 1px; margin: 18px auto 48px; }\n  #stage {\n    position: relative; transform: scale(var(--view-zoom, 1)); transform-origin: top left;\n    margin: 0; width: fit-content; max-width: calc(100vw - 32px);\n    background: #fff; box-shadow: var(--shadow); border: 1px solid #d9dfdc;\n  }\n  #bgCanvas { display: block; height: auto; }\n  #overlay, #practiceOverlay {\n    position: absolute; top: 0; left: 0; width: 100%; height: 100%; touch-action: none;\n  }\n  body.practice-mode #overlay,\n  body:not(.calibrating) #practiceOverlay { touch-action: pan-x pan-y; }\n  #overlay.tool-select { touch-action: pan-x pan-y; cursor: default; }\n  #overlay.tool-select > * { touch-action: none; }\n  #practiceOverlay { pointer-events: none; z-index: 3; }\n  body.calibrating #practiceOverlay { pointer-events: auto; cursor: crosshair; touch-action: none; }\n  #overlay { z-index: 2; }\n  #overlay.tool-block, #overlay.placing-pending { cursor: crosshair !important; touch-action: none; }\n  #overlay.tool-addspace { cursor: ns-resize !important; touch-action: none; }\n  .space-cut-line { stroke: #0c6654; stroke-width: 2.5; stroke-dasharray: 8 5; pointer-events: none; }\n  .space-cut-band { fill: rgba(20, 125, 104, 0.14); stroke: #147d68; stroke-width: 1.5; stroke-dasharray: 5 4; pointer-events: none; }\n  .space-cut-label-bg { fill: #0c6654; rx: 5; pointer-events: none; }\n  .space-cut-label-text { fill: #ffffff; font-family: sans-serif; font-size: 13px; font-weight: 700; pointer-events: none; }\n\n  #emptyState {\n    margin: 48px auto; max-width: 540px; padding: 28px 24px;\n    background: var(--panel); border: 1px solid var(--border); border-radius: 14px;\n    text-align: center; box-shadow: 0 8px 28px rgba(25,55,45,.07);\n  }\n  #emptyState h2 { margin: 0 0 8px; font-size: 18px; }\n  #emptyState p { margin: 0 0 18px; color: var(--muted); line-height: 1.55; }\n  #emptyState .empty-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }\n  #emptyState button {\n    padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;\n    border: 1px solid var(--border); background: #fff; color: var(--text);\n  }\n  #emptyState button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }\n  #emptyState button.primary:hover { background: var(--accent-dark); }\n  #emptyState button:hover { background: #eef5f2; }\n\n  .block-selection { fill: rgba(20,125,104,.12); stroke: var(--accent); stroke-width: 2; stroke-dasharray: 7 4; pointer-events: none; }\n  .inline-text-editor {\n    width: 100%; height: 100%; padding: 1px 4px; border: 1.5px solid var(--accent);\n    border-radius: 4px; background: rgba(255,255,255,.97); color: #17231f;\n    font-family: inherit; outline: none; box-shadow: 0 2px 8px rgba(0,0,0,.14);\n  }\n  .sel-rect { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 5 4; pointer-events: none; }\n  .sel-handle { fill: var(--accent); stroke: #fff; stroke-width: 1.5; cursor: nwse-resize; }\n  .loop-label[data-has-link=\"1\"] { cursor: pointer; }\n  .loop-label[data-has-link=\"1\"]:hover rect { fill: #eef8f4; }\n\n  /* Panel flotante de sistema y signos musicales en calibración */\n  #systemPopover {\n    display: none; position: fixed; bottom: 16px; left: 16px; z-index: 32;\n    background: var(--panel); border: 1px solid var(--border); border-radius: 12px;\n    padding: 12px 14px; box-shadow: 0 14px 36px rgba(25,55,45,.24);\n    max-width: min(640px, calc(100vw - 32px));\n    max-height: 46vh; overflow: auto;\n  }\n  #systemPopover.open { display: block; }\n  #systemPopover .pop-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }\n  #systemPopover .pop-row:last-child { margin-bottom: 0; }\n  #systemPopover .pop-subtitle { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; margin-right: 4px; }\n  #systemPopover button {\n    padding: 5px 9px; border-radius: 7px; border: 1px solid var(--border);\n    background: #fff; color: var(--text); font-size: 12px; font-weight: 600; cursor: pointer;\n  }\n  #systemPopover button:hover { background: #eef5f2; }\n  #systemPopover button.active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent-dark); }\n  #systemPopover button.danger { color: var(--danger); }\n  #systemPopover input[type=\"number\"] {\n    width: 52px; padding: 4px 6px; border: 1px solid var(--border); border-radius: 6px; font-size: 12px;\n  }\n\n  @media (max-width: 860px) {\n    #mobileQuickBar { display: flex; }\n    #menusHost { display: none; }\n    body.mobile-menu-open #menusHost {\n      display: block;\n      position: fixed; top: 51px; left: 0; right: 0; z-index: 23;\n      max-height: calc(100dvh - 51px); overflow-y: auto;\n      background: rgba(243,245,244,.98); backdrop-filter: blur(12px);\n      border-bottom: 1px solid var(--border);\n      box-shadow: 0 18px 42px rgba(25,55,45,.22);\n      padding-bottom: 14px;\n    }\n    #toolbar, #practiceBar {\n      position: static;\n      padding: 8px 10px; gap: 6px;\n      box-shadow: none; backdrop-filter: none;\n    }\n    #toolbar button, #toolbar select, #practiceBar button, #practiceBar select, #practiceBar input[type=\"number\"] {\n      min-height: 36px; font-size: 12px;\n    }\n    .group { flex: 1 1 100%; }\n    #hint { display: none; }\n    #stageFrame { margin: 8px auto 72px; }\n    #stage { max-width: calc(100vw - 14px); }\n    #fullscreenHud { max-width: calc(100vw - 16px); bottom: 10px; justify-content: center; padding: 6px 8px; gap: 5px; }\n    #fullscreenHud button { min-height: 36px; padding: 6px 8px; font-size: 12px; }\n    #systemPopover { left: 8px; right: 8px; bottom: 8px; max-width: none; }\n    #emptyState { margin: 20px 12px; padding: 20px 16px; }\n  }\n  @media (max-width: 480px) {\n    #chordList { grid-template-columns: repeat(3, 1fr) !important; }\n    #mobMenuToggle { padding: 6px 8px; }\n  }\n\n  /* Panel de acordes */\n  #chordPanel {\n    display: none; position: fixed; top: 72px; left: 18px;\n    background: var(--panel); border: 1px solid var(--border);\n    padding: 14px; z-index: 25; border-radius: 12px; width: min(360px, calc(100vw - 36px));\n    max-height: 78vh; overflow: auto; box-shadow: 0 16px 42px rgba(25,55,45,.2);\n  }\n  .chord-item {\n    position: relative; cursor: pointer; background: #fff; border: 1px solid var(--border);\n    border-radius: 8px; padding: 6px 4px; transition: border-color .12s, background .12s;\n    display: flex; flex-direction: column; align-items: center;\n  }\n  .chord-item:hover { border-color: var(--accent); background: #f6fbf9; }\n  .chord-item .name { font: bold 12px monospace; text-align: center; color: #000; margin-top: 2px; }\n  .chord-item .del-chord {\n    position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 999px;\n    border: none; background: rgba(163,59,53,.1); color: var(--danger); font-size: 11px;\n    line-height: 1; cursor: pointer; display: none; align-items: center; justify-content: center; padding: 0;\n  }\n  .chord-item:hover .del-chord { display: flex; }\n\n  /* Editor de acordes */\n  #chordEditor {\n    display: none; position: fixed; top: 18px; left: 18px;\n    background: var(--panel); color: var(--text); border: 1px solid var(--border);\n    padding: 16px; z-index: 30; border-radius: 14px; width: min(420px, calc(100vw - 36px));\n    max-height: calc(100vh - 36px); overflow: auto;\n    box-shadow: 0 18px 48px rgba(25,55,45,.22);\n  }\n  #chordEditor h3 { margin: 0 0 12px 0; font-size: 16px; }\n  #chordEditor .row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }\n  #chordEditor .row label { font-size: 12px; color: var(--muted); font-weight: 600; display: inline-flex; align-items: center; gap: 5px; }\n  #chordEditor input[type=text], #chordEditor input[type=number] {\n    padding: 6px 8px; font-size: 13px; background: #fff; color: var(--text);\n    border: 1px solid var(--border); border-radius: 7px; font-variant-numeric: tabular-nums;\n  }\n  #chordEditorSvg {\n    background: #fff; border: 1px solid #e6ece9; border-radius: 8px;\n    display: block; margin: 0 auto 10px auto; cursor: pointer; touch-action: none;\n  }\n  #chordEditor .actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 8px; }\n  #chordEditor button {\n    padding: 7px 12px; font-size: 13px; font-weight: 600; cursor: pointer;\n    background: #fff; color: var(--text); border: 1px solid var(--border); border-radius: 7px;\n  }\n  #chordEditor button:hover { background: #eef5f2; }\n  #chordEditor button.primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 700; }\n  #chordEditor button.primary:hover { background: var(--accent-dark); }\n  #chordEditor button.mode-active { background: var(--accent-soft); color: var(--accent-dark); border-color: var(--accent); font-weight: 700; }\n\n  /* Modales */\n  .modal-backdrop {\n    display: none; position: fixed; inset: 0; z-index: 40;\n    background: rgba(18, 30, 26, .42); backdrop-filter: blur(2px);\n    align-items: center; justify-content: center; padding: 16px;\n  }\n  .modal-backdrop.open { display: flex; }\n  .modal-card {\n    background: var(--panel); color: var(--text); border: 1px solid var(--border);\n    border-radius: 14px; width: min(780px, 100%); max-height: min(88vh, 780px);\n    display: flex; flex-direction: column; overflow: hidden;\n    box-shadow: 0 22px 60px rgba(15, 35, 28, .28);\n  }\n  .modal-card.compact { width: min(420px, 100%); }\n  .modal-header {\n    display: flex; align-items: center; justify-content: space-between; gap: 12px;\n    padding: 14px 18px; border-bottom: 1px solid var(--border); background: var(--panel-2);\n  }\n  .modal-header h3 { margin: 0; font-size: 16px; }\n  .modal-close {\n    border: 1px solid var(--border); background: #fff; color: var(--text);\n    border-radius: 7px; padding: 5px 10px; font-weight: 600; cursor: pointer; font-size: 12px;\n  }\n  .modal-close:hover { background: #eef5f2; }\n  .modal-tabs {\n    display: flex; gap: 6px; padding: 10px 18px 0; border-bottom: 1px solid var(--border);\n    background: #fafcfb; flex-wrap: wrap;\n  }\n  .modal-tab {\n    border: 1px solid transparent; border-bottom: none; background: transparent;\n    padding: 8px 14px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 600;\n    color: var(--muted); cursor: pointer; margin-bottom: -1px;\n  }\n  .modal-tab:hover { color: var(--text); }\n  .modal-tab.active {\n    background: #fff; color: var(--accent-dark);\n    border-color: var(--border); border-bottom-color: #fff;\n  }\n  .modal-body { padding: 18px; overflow: auto; line-height: 1.55; }\n  .modal-footer {\n    padding: 12px 18px; border-top: 1px solid var(--border); background: var(--panel-2);\n    display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap;\n  }\n  .modal-footer button, .btn-ui {\n    padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer;\n    border: 1px solid var(--border); background: #fff; color: var(--text);\n  }\n  .modal-footer button:hover, .btn-ui:hover { background: #eef5f2; }\n  .modal-footer button.primary, .btn-ui.primary { background: var(--accent); border-color: var(--accent); color: #fff; }\n  .modal-footer button.primary:hover, .btn-ui.primary:hover { background: var(--accent-dark); }\n\n  .settings-section { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #edf1ef; }\n  .settings-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }\n  .settings-section h4 { margin: 0 0 6px; font-size: 14px; color: var(--text); }\n  .settings-desc { margin: 0 0 12px; font-size: 12px; color: var(--muted); }\n  .field-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }\n  .field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }\n  .field-box { display: flex; flex-direction: column; gap: 5px; }\n  .field-box label { font-size: 12px; font-weight: 600; color: var(--muted); }\n  .modal-card input[type=\"text\"], .modal-card input[type=\"url\"],\n  .modal-card input[type=\"number\"], .modal-card select {\n    padding: 7px 10px; border: 1px solid var(--border); border-radius: 7px;\n    font-size: 13px; font-family: inherit; color: var(--text); background: #fff;\n    font-variant-numeric: tabular-nums;\n  }\n  .full-input { flex: 1 1 260px; min-width: 0; }\n  .custom-chord-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }\n  .custom-chord-item {\n    display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px;\n    border: 1px solid var(--border); border-radius: 7px; background: var(--panel-2); font-size: 12px; font-weight: 600;\n  }\n  .custom-chord-item button {\n    border: none; background: transparent; color: var(--danger); cursor: pointer; font-weight: 700; padding: 0 3px;\n  }\n\n  .help-block { margin-bottom: 18px; }\n  .help-block h4 { margin: 0 0 6px; font-size: 14px; color: var(--accent-dark); }\n  .help-block ul { margin: 0; padding-left: 18px; }\n  .help-block li { margin-bottom: 5px; }\n  .kbd {\n    display: inline-block; padding: 1px 6px; border: 1px solid var(--border);\n    border-radius: 5px; background: var(--panel-2); font-family: ui-monospace, monospace; font-size: 11px;\n  }\n  #toast {\n    position: fixed; bottom: 18px; right: 18px; z-index: 50;\n    background: #1e2d28; color: #fff; padding: 9px 14px; border-radius: 9px;\n    font-size: 12px; font-weight: 600; opacity: 0; pointer-events: none;\n    transform: translateY(6px); transition: opacity .18s, transform .18s;\n    box-shadow: 0 10px 26px rgba(0,0,0,.22);\n  }\n  #toast.show { opacity: 1; transform: translateY(0); }\n\n  /* Biblioteca local (IndexedDB) */\n  .lib-toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }\n  .lib-list { display: flex; flex-direction: column; gap: 8px; }\n  .lib-item {\n    display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;\n    padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--panel-2);\n  }\n  .lib-item.current { border-color: var(--accent); background: #eff8f5; }\n  .lib-item-main { flex: 1 1 260px; min-width: 0; }\n  .lib-item-title-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }\n  .lib-star-btn {\n    border: none; background: transparent; cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 4px; color: #99a8a2;\n  }\n  .lib-star-btn.fav { color: #d48806; }\n  .lib-title { font-weight: 700; font-size: 13px; color: var(--text); word-break: break-word; }\n  .lib-meta { font-size: 11px; color: var(--muted); margin-top: 3px; }\n  .lib-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }\n  .lib-tag {\n    display: inline-block; padding: 1px 7px; border-radius: 6px; font-size: 11px; font-weight: 600;\n    background: #fff; border: 1px solid var(--border); color: var(--accent-dark);\n  }\n  .lib-actions { display: flex; gap: 5px; flex-wrap: wrap; }\n  .lib-actions button { padding: 5px 9px; font-size: 12px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; font-weight: 600; }\n  .lib-actions button:hover { background: #eef5f2; }\n  .lib-actions button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }\n  .lib-actions button.danger { color: var(--danger); }\n</style>\n</head>\n<body>\n\n<div id=\"mobileQuickBar\" aria-label=\"Barra rápida móvil\">\n  <button id=\"mobMenuToggle\" type=\"button\" aria-expanded=\"false\" aria-controls=\"menusHost\">☰ Menú</button>\n  <button id=\"mobPrevPage\" type=\"button\" aria-label=\"Página anterior\">‹</button>\n  <span id=\"mobPageLabel\">—/—</span>\n  <button id=\"mobNextPage\" type=\"button\" aria-label=\"Página siguiente\">›</button>\n  <div class=\"mob-spacer\"></div>\n  <button id=\"mobUndoBtn\" class=\"edit-only\" type=\"button\" title=\"Deshacer\">↶</button>\n  <button id=\"mobPlayBtn\" class=\"practice-only primary\" type=\"button\" title=\"Practicar / Pausar\">▶</button>\n  <button id=\"mobLoopBtn\" class=\"practice-only\" type=\"button\" title=\"Activar o desactivar bucle\">🔁</button>\n  <button id=\"mobFullscreenBtn\" class=\"practice-only\" type=\"button\" title=\"Pantalla completa\">⛶</button>\n  <button id=\"mobModeToggle\" type=\"button\" title=\"Cambiar entre Editar y Practicar\">Practicar</button>\n</div>\n\n<div id=\"menusHost\">\n<div id=\"toolbar\">\n  <div class=\"group\">\n    <span class=\"group-label\">Partitura · v11.0</span>\n    <button id=\"openLibraryBtn\" title=\"Abrir biblioteca local guardada en este navegador\">Biblioteca</button>\n    <button id=\"quickSaveLibraryBtn\" title=\"Guardar o actualizar esta partitura en tu biblioteca local\">+ Guardar en bibl.</button>\n    <button id=\"openPdfBtn\">Abrir PDF</button>\n    <input type=\"file\" id=\"pdfFile\" accept=\"application/pdf\">\n    <button id=\"openProject\">Abrir editable</button>\n    <input type=\"file\" id=\"projectFile\" accept=\".scoreproj,application/json\">\n    <button id=\"saveProject\">Guardar editable</button>\n    <span id=\"projectStatus\" class=\"meta-inline\" role=\"status\" aria-live=\"polite\"></span>\n  </div>\n\n  <div class=\"group\">\n    <span id=\"pageNav\">\n      <button id=\"prevPage\" title=\"Página anterior (RePág / ←)\" aria-label=\"Página anterior\">‹</button>\n      <span id=\"pageLabel\">— / —</span>\n      <button id=\"nextPage\" title=\"Página siguiente (AvPág / →)\" aria-label=\"Página siguiente\">›</button>\n    </span>\n    <button id=\"zoomOut\" aria-label=\"Reducir zoom\">−</button>\n    <span id=\"zoomLabel\" aria-live=\"polite\" style=\"font-variant-numeric:tabular-nums;\">100%</span>\n    <button id=\"zoomIn\" aria-label=\"Ampliar zoom\">+</button>\n    <button id=\"zoomReset\">Encajar</button>\n    <button id=\"toggleMode\" title=\"Cambiar entre Editar y Practicar\">Modo: Editar</button>\n  </div>\n\n  <div class=\"group edit-only\">\n    <span class=\"group-label\">Dibujo</span>\n    <button data-tool=\"patch\" class=\"active\">Parche</button>\n    <button data-tool=\"line\">Línea</button>\n    <button data-tool=\"text\">Texto</button>\n    <button data-tool=\"block\" title=\"Dibuja un rectángulo; el contenido se corta y puedes moverlo\">Cortar y mover</button>\n    <button data-tool=\"addspace\" title=\"Traza una línea horizontal y arrastra hacia abajo para abrir espacio limpio entre sistemas\">Añadir espacio</button>\n    <button data-tool=\"select\">Seleccionar</button>\n    <button id=\"editSelected\" disabled title=\"Editar seleccionado (Enter)\">Editar</button>\n    <button id=\"duplicateSelected\" disabled title=\"Duplicar seleccionado (Ctrl/Cmd+D)\">Duplicar</button>\n    <button id=\"deleteSelected\" disabled class=\"btn-danger\" title=\"Eliminar seleccionado (Supr)\">Eliminar</button>\n    <button id=\"openLoopLinkBtn\" style=\"display:none;\" title=\"Abrir enlace web configurado para los bucles\">Abrir enlace ↗</button>\n    <button data-tool=\"erase\" class=\"btn-danger\">Borrar</button>\n  </div>\n\n  <div class=\"group edit-only\">\n    <span class=\"group-label\">Insertar</span>\n    <button id=\"insertChord\">Acordes</button>\n    <button id=\"createChord\">Nuevo acorde</button>\n    <span class=\"group-label\" style=\"margin-left:4px;\">Dedo</span>\n    <button class=\"finger-btn\" data-finger=\"1\">1</button>\n    <button class=\"finger-btn\" data-finger=\"2\">2</button>\n    <button class=\"finger-btn\" data-finger=\"3\">3</button>\n    <button class=\"finger-btn\" data-finger=\"4\">4</button>\n    <button id=\"insertLoop\">Bucle</button>\n    <select id=\"techSymbolSelect\" title=\"Insertar símbolo o marca de técnica guitarrística\">\n      <option value=\"\">Técnica ▾</option>\n      <option value=\"H\">H (Hammer-on)</option>\n      <option value=\"P\">P (Pull-off)</option>\n      <option value=\"sl.\">sl. (Slide)</option>\n      <option value=\"~~~\">~~~ (Vibrato)</option>\n      <option value=\"Arm. ◇\">Arm. ◇ (Armónico)</option>\n      <option value=\"↓\">↓ (Rasgueo abajo)</option>\n      <option value=\"↑\">↑ (Rasgueo arriba)</option>\n      <option value=\"C.II\">C.II (Cejilla traste 2)</option>\n      <option value=\"C.V\">C.V (Cejilla traste 5)</option>\n      <option value=\"Intro\">Intro</option>\n      <option value=\"Estribillo\">Estribillo</option>\n      <option value=\"Solo\">Solo</option>\n    </select>\n  </div>\n\n  <div class=\"group edit-only\">\n    <span class=\"group-label\">Trazos</span>\n    <label>Texto <input type=\"number\" id=\"fontSize\" value=\"18\" min=\"8\" max=\"120\"></label>\n    <label>Grosor <input type=\"number\" id=\"lineWidth\" value=\"2\" min=\"1\" max=\"20\"></label>\n    <label>Color <input type=\"color\" id=\"lineColor\" value=\"#000000\"></label>\n    <label>Parche <input type=\"color\" id=\"patchColor\" value=\"#ffffff\"></label>\n  </div>\n\n  <div class=\"group edit-only\">\n    <button id=\"undo\" title=\"Deshacer (Ctrl/Cmd+Z)\">↶</button>\n    <button id=\"redo\" title=\"Rehacer (Ctrl/Cmd+Y)\">↷</button>\n  </div>\n\n  <div class=\"group\">\n    <button id=\"openSettings\">Ajustes y ayuda</button>\n    <button id=\"exportPng\">PNG (pág.)</button>\n    <button id=\"exportPdf\" class=\"btn-primary\">PDF completo</button>\n  </div>\n</div>\n\n<!-- Barra exclusiva del Modo Practicar (v11.0) -->\n<div id=\"practiceBar\">\n  <div class=\"group\">\n    <span class=\"group-label\">Práctica</span>\n    <button id=\"practicePlayBtn\" class=\"btn-primary\">▶ Practicar</button>\n    <button id=\"practiceStopBtn\">⏹ Reiniciar</button>\n    <span id=\"practiceBeatReadout\" class=\"meta-inline\">Listo</span>\n  </div>\n\n  <div class=\"group\">\n    <span class=\"group-label\">Bucle estudio</span>\n    <button id=\"practiceLoopBtn\" title=\"Activar/desactivar bucle de aprendizaje sobre los compases elegidos (clic en cualquier compás para elegir inicio)\">🔁 Bucle: No</button>\n    <label title=\"Número de compases que componen el bucle de estudio\">Comp.\n      <input type=\"number\" id=\"practiceLoopCount\" value=\"1\" min=\"1\" max=\"32\">\n    </label>\n    <label title=\"Subida automática de BPM tras completar cada vuelta del bucle (+0 = tempo fijo)\">+BPM\n      <select id=\"practiceProgBpm\">\n        <option value=\"0\" selected>+0</option>\n        <option value=\"2\">+2</option>\n        <option value=\"4\">+4</option>\n        <option value=\"6\">+6</option>\n      </select>\n    </label>\n  </div>\n\n  <div class=\"group\">\n    <label>Compás\n      <select id=\"practiceTimeSig\">\n        <option value=\"4/4\">4/4</option>\n        <option value=\"3/4\">3/4</option>\n        <option value=\"2/4\">2/4</option>\n        <option value=\"6/8\">6/8</option>\n      </select>\n    </label>\n    <label>BPM\n      <input type=\"number\" id=\"practiceBpm\" value=\"90\" min=\"35\" max=\"240\">\n    </label>\n    <label>Cuenta\n      <select id=\"practiceCountIn\" title=\"Compases previos de metrónomo antes de mover el cursor\">\n        <option value=\"2\" selected>2 comp.</option>\n        <option value=\"1\">1 comp.</option>\n        <option value=\"0\">0 comp.</option>\n      </select>\n    </label>\n    <button id=\"practiceMetronomeBtn\" class=\"active\" title=\"Activar o silenciar sonido del metrónomo\">Metrónomo: Sí</button>\n  </div>\n\n  <div class=\"group\">\n    <span class=\"group-label\">Navegación</span>\n    <label>Vista\n      <select id=\"practiceViewMode\">\n        <option value=\"full\">Página completa</option>\n        <option value=\"chunks\">Por tramos (media pág.)</option>\n      </select>\n    </label>\n    <label>Paso pág.\n      <select id=\"practiceAdvanceMode\">\n        <option value=\"auto\">Automático</option>\n        <option value=\"manual\">Manual / Pedal</option>\n      </select>\n    </label>\n    <button id=\"pedalPrevBtn\" title=\"Tramo / página anterior\">‹ Pedal</button>\n    <button id=\"pedalNextBtn\" title=\"Siguiente tramo / página\">Pedal ›</button>\n    <button id=\"practiceFullscreenBtn\" title=\"Ocultar barras y ampliar partitura a pantalla completa\">⛶ Pantalla completa</button>\n  </div>\n\n  <div class=\"group\">\n    <span class=\"group-label\">Sistemas</span>\n    <button id=\"toggleCalibrateBtn\">Calibrar sistemas</button>\n    <button id=\"autoDetectSystemsBtn\" title=\"Detectar automáticamente los pentagramas/tablaturas de esta página\">Detectar sistemas</button>\n    <button id=\"duplicateLastSysBtn\" title=\"Duplicar el último sistema debajo\">Duplicar abajo</button>\n    <button id=\"autoOrderSystemsBtn\" title=\"Reordenar las cajas de esta página de izquierda a derecha y de arriba a abajo\">Auto-ordenar pág.</button>\n    <button id=\"clearPageSystemsBtn\" class=\"btn-danger\" title=\"Borrar sistemas calibrados de esta página\">Limpiar pág.</button>\n  </div>\n</div>\n</div>\n\n<!-- Barra flotante en Pantalla Completa -->\n<div id=\"fullscreenHud\">\n  <button id=\"fsPlayBtn\" class=\"primary\">▶ Practicar</button>\n  <button id=\"fsStopBtn\">⏹</button>\n  <button id=\"fsLoopBtn\">🔁 Bucle: No</button>\n  <span id=\"fsReadout\">Listo</span>\n  <button id=\"fsPedalPrev\">‹ Pedal</button>\n  <button id=\"fsPedalNext\">Pedal ›</button>\n  <button id=\"fsExitBtn\">✕ Salir pantalla completa</button>\n</div>\n\n<div id=\"hint\">\n  <span id=\"hintText\">\n    <strong>Editar</strong>: clic en Texto y escribe (Enter guarda). Doble clic o <b>Editar</b>/Enter cambia texto, acorde o bucle.\n    <b>Supr</b> borra el seleccionado. <b>Ajustes y ayuda</b> guarda la URL de bucle y preferencias.\n  </span>\n  <span id=\"loopStatusBadge\"></span>\n</div>\n\n<!-- Popover para calibrar sistema, compases y signos musicales -->\n<div id=\"systemPopover\">\n  <div class=\"pop-row\">\n    <strong id=\"sysPopTitle\">Sistema 1</strong>\n    <label style=\"font-size:12px; color:var(--muted); font-weight:600;\" title=\"Posición de esta caja en el orden de lectura de la página\">Orden pág.:\n      <input type=\"number\" id=\"sysOrderInput\" min=\"1\" max=\"200\" value=\"1\">\n    </label>\n    <label style=\"font-size:12px; color:var(--muted); font-weight:600;\">Compases:\n      <input type=\"number\" id=\"sysMeasuresInput\" min=\"1\" max=\"16\" value=\"4\">\n    </label>\n    <label style=\"font-size:12px; color:var(--muted); font-weight:600;\">Vueltas (:|):\n      <input type=\"number\" id=\"sysRepeatCount\" min=\"2\" max=\"12\" value=\"2\">\n    </label>\n    <button id=\"sysDeleteBtn\" class=\"danger\">Eliminar sistema</button>\n    <button id=\"sysCloseBtn\">Cerrar</button>\n  </div>\n  <div class=\"pop-row\" id=\"sysMeasureButtons\"></div>\n  <div class=\"pop-row\" id=\"sysMarksRow\"></div>\n  <div class=\"pop-row\" id=\"sysJumpsRow\"></div>\n</div>\n\n<div id=\"chordPanel\">\n  <div style=\"display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;\">\n    <strong>Elige acorde</strong>\n    <button id=\"closeChordPanel\" class=\"modal-close\">Cerrar</button>\n  </div>\n  <div id=\"chordList\" style=\"display:grid; grid-template-columns:repeat(4,1fr); gap:6px;\"></div>\n  <div style=\"margin-top:10px; font-size:12px; color:var(--muted);\">Clic en un acorde → luego clic en la partitura.</div>\n</div>\n\n<div id=\"chordEditor\">\n  <h3>Crear / editar acorde</h3>\n  <div class=\"row\">\n    <label>Nombre\n      <input type=\"text\" id=\"chordName\" placeholder=\"Opcional (ej: Am7)\" maxlength=\"10\" style=\"width:118px\">\n    </label>\n    <label>Traste ini.\n      <input type=\"number\" id=\"chordStartFret\" value=\"1\" min=\"1\" max=\"24\" style=\"width:58px\">\n    </label>\n    <label>Trastes\n      <input type=\"number\" id=\"chordFretCount\" value=\"5\" min=\"1\" max=\"15\" style=\"width:54px\">\n    </label>\n  </div>\n  <div class=\"row\">\n    <span style=\"font-size:12px; color:var(--muted); font-weight:600;\">Modo:</span>\n    <button id=\"modeDots\" class=\"mode-active\">• Puntos</button>\n    <button id=\"modeCejilla\">═ Cejilla</button>\n  </div>\n  <svg id=\"chordEditorSvg\" width=\"270\" height=\"324\" viewBox=\"0 0 100 120\"></svg>\n  <div class=\"row\" style=\"justify-content:center; font-size:12px; color:var(--muted); text-align:center;\">\n    Puntos: clic en celda (negro → hueco → vacío); arriba de cuerda (O / X / nada).<br>\n    Cejilla: arrastra horizontalmente en el mismo traste; clic sobre una cejilla para quitarla.\n  </div>\n  <div class=\"actions\">\n    <button id=\"chordEditorCancel\">Cancelar</button>\n    <button id=\"chordEditorSave\">Guardar</button>\n    <button id=\"chordEditorInsertNow\" class=\"primary\">Colocar en partitura</button>\n  </div>\n</div>\n\n<!-- Modal Bucle -->\n<div id=\"loopModal\" class=\"modal-backdrop\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"loopModalTitle\">\n  <div class=\"modal-card compact\">\n    <div class=\"modal-header\">\n      <h3 id=\"loopModalTitle\">Etiqueta de bucle</h3>\n      <button id=\"loopModalClose\" class=\"modal-close\">Cerrar</button>\n    </div>\n    <div class=\"modal-body\">\n      <p class=\"settings-desc\">Escribe el número (ej. <code>23</code> → <strong>L23</strong>) o la etiqueta completa.</p>\n      <div class=\"field-row\">\n        <input type=\"text\" id=\"loopInput\" class=\"full-input\" placeholder=\"Ej: 23 o L23\" maxlength=\"12\">\n      </div>\n      <p id=\"loopModalHint\" class=\"settings-desc\" style=\"margin-bottom:0;\"></p>\n    </div>\n    <div class=\"modal-footer\">\n      <button id=\"loopModalCancel\">Cancelar</button>\n      <button id=\"loopModalConfirm\" class=\"primary\">Aceptar</button>\n    </div>\n  </div>\n</div>\n\n<!-- Modal Biblioteca Local (IndexedDB) -->\n<div id=\"libraryModal\" class=\"modal-backdrop\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"libraryModalTitle\">\n  <div class=\"modal-card\">\n    <div class=\"modal-header\">\n      <h3 id=\"libraryModalTitle\">Biblioteca personal local (IndexedDB)</h3>\n      <button id=\"libraryClose\" class=\"modal-close\">Cerrar</button>\n    </div>\n    <div class=\"modal-body\">\n      <div class=\"lib-toolbar\">\n        <button id=\"libSaveCurrentBtn\" class=\"btn-ui primary\" type=\"button\">+ Guardar partitura actual</button>\n        <button id=\"libSaveNewCopyBtn\" class=\"btn-ui\" type=\"button\">Guardar como nueva</button>\n        <button id=\"libExportBackupBtn\" class=\"btn-ui\" type=\"button\">Exportar copia (.json)</button>\n        <button id=\"libImportBackupBtn\" class=\"btn-ui\" type=\"button\">Importar copia (.json)</button>\n        <input type=\"file\" id=\"libBackupFile\" accept=\"application/json,.json\" style=\"display:none;\">\n      </div>\n      <div class=\"lib-toolbar\">\n        <input type=\"text\" id=\"libSearchInput\" class=\"full-input\" placeholder=\"Buscar por título, PDF o etiqueta...\">\n        <label style=\"font-size:12px; font-weight:600; color:var(--muted); display:inline-flex; align-items:center; gap:5px; cursor:pointer;\">\n          <input type=\"checkbox\" id=\"libFavOnly\"> Solo favoritas ★\n        </label>\n      </div>\n      <div id=\"libList\" class=\"lib-list\"></div>\n    </div>\n    <div class=\"modal-footer\">\n      <span id=\"libStats\" class=\"meta-inline\" style=\"margin-right:auto;\"></span>\n      <button id=\"libraryDone\" class=\"primary\">Cerrar</button>\n    </div>\n  </div>\n</div>\n\n<!-- Modal Ajustes y Ayuda -->\n<div id=\"settingsModal\" class=\"modal-backdrop\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"settingsModalTitle\">\n  <div class=\"modal-card\">\n    <div class=\"modal-header\">\n      <h3 id=\"settingsModalTitle\">Ajustes y ayuda</h3>\n      <button id=\"settingsClose\" class=\"modal-close\">Cerrar</button>\n    </div>\n    <div class=\"modal-tabs\" role=\"tablist\">\n      <button class=\"modal-tab active\" data-settings-tab=\"score\" role=\"tab\" aria-selected=\"true\">Partitura actual</button>\n      <button class=\"modal-tab\" data-settings-tab=\"practice\" role=\"tab\" aria-selected=\"false\">Práctica y pedal</button>\n      <button class=\"modal-tab\" data-settings-tab=\"prefs\" role=\"tab\" aria-selected=\"false\">Estilos y calidad</button>\n      <button class=\"modal-tab\" data-settings-tab=\"help\" role=\"tab\" aria-selected=\"false\">Ayuda (v11.0)</button>\n    </div>\n\n    <div class=\"modal-body\">\n      <!-- Tab 1: Partitura actual -->\n      <div id=\"tab-score\" class=\"settings-tab-panel\">\n        <div class=\"settings-section\">\n          <h4>Enlace de destino para etiquetas de bucle</h4>\n          <p class=\"settings-desc\">\n            Indica la URL de tu aplicación de bucles para <strong>esta partitura concreta</strong>.\n            Todas las etiquetas de bucle (L1, L23...) enlazarán a esta dirección tanto en el editor como en el PDF exportado.\n            Si lo dejas vacío, las etiquetas serán texto plano sin enlace.\n          </p>\n          <div class=\"field-row\">\n            <input type=\"url\" id=\"settingLoopUrl\" class=\"full-input\" placeholder=\"https://tu-app-bucles.com/cancion/...\" aria-label=\"URL de destino para etiquetas de bucle\">\n            <button id=\"testLoopUrlBtn\" class=\"btn-ui\" type=\"button\">Probar ↗</button>\n            <button id=\"clearLoopUrlBtn\" class=\"btn-ui\" type=\"button\">Limpiar</button>\n          </div>\n          <p id=\"loopUrlValidation\" class=\"settings-desc\" style=\"margin:4px 0 0;\"></p>\n        </div>\n\n        <div class=\"settings-section\">\n          <h4>Resumen y maquetación de esta partitura</h4>\n          <div id=\"scoreSummary\" class=\"settings-desc\" style=\"margin:0 0 10px;\">No hay ningún PDF cargado todavía.</div>\n          <button id=\"resetPageCutsBtn\" class=\"btn-ui\" type=\"button\">Quitar espacios añadidos de esta página</button>\n        </div>\n      </div>\n\n      <!-- Tab 2: Práctica y pedal -->\n      <div id=\"tab-practice\" class=\"settings-tab-panel\" style=\"display:none;\">\n        <div class=\"settings-section\">\n          <h4>Pedal de paso de página (Bluetooth / USB)</h4>\n          <p class=\"settings-desc\">\n            Configura qué tecla envía tu pedal físico cuando estés en <strong>Modo: Practicar</strong>.\n            <code>RePág / Flechas</code> funciona con la mayoría de pedales estándar.\n          </p>\n          <div class=\"field-row\">\n            <label for=\"settingPedalMode\" style=\"font-size:12px; font-weight:600; color:var(--muted);\">Atajo principal del pedal:</label>\n            <select id=\"settingPedalMode\">\n              <option value=\"arrows_pagedown\">RePág / AvPág y Flechas ← / → (Espacio = Play/Pausa)</option>\n              <option value=\"space_next\">Espacio = Avanzar tramo/página</option>\n              <option value=\"enter_next\">Enter = Avanzar tramo/página (Espacio = Play/Pausa)</option>\n            </select>\n          </div>\n        </div>\n\n        <div class=\"settings-section\">\n          <h4>Opciones guardadas en el proyecto (.scoreproj)</h4>\n          <p class=\"settings-desc\">\n            El compás, BPM, cuenta atrás, modo de vista, avance automático/manual y todos los sistemas y signos musicales calibrados se guardan dentro del archivo <code>.scoreproj</code>.\n          </p>\n        </div>\n      </div>\n\n      <!-- Tab 3: Estilos y calidad -->\n      <div id=\"tab-prefs\" class=\"settings-tab-panel\" style=\"display:none;\">\n        <div class=\"settings-section\">\n          <h4>Calidad y modo de exportación PDF</h4>\n          <p class=\"settings-desc\">El modo vectorial híbrido conserva las líneas y texto originales del PDF nítidos y genera archivos muy ligeros (recurre a imagen solo en páginas con cortes o bloques).</p>\n          <div class=\"field-row\">\n            <label for=\"quality\" style=\"font-size:12px; font-weight:600; color:var(--muted);\">Resolución del lienzo:</label>\n            <select id=\"quality\">\n              <option value=\"2\">2x (ligera)</option>\n              <option value=\"3\" selected>3x (recomendada)</option>\n              <option value=\"4\">4x (alta nitidez)</option>\n            </select>\n            <label for=\"pdfExportMode\" style=\"font-size:12px; font-weight:600; color:var(--muted); margin-left:8px;\">Exportación PDF:</label>\n            <select id=\"pdfExportMode\">\n              <option value=\"vector\" selected>Vectorial híbrida (nítida y ligera)</option>\n              <option value=\"raster\">Imagen rasterizada (píxel exacto)</option>\n            </select>\n          </div>\n        </div>\n\n        <div class=\"settings-section\">\n          <h4>Tamaños iniciales al insertar</h4>\n          <p class=\"settings-desc\">Se guardan en este navegador. También puedes redimensionar cualquier elemento ya colocado desde su esquina inferior derecha.</p>\n          <div class=\"field-grid\">\n            <div class=\"field-box\">\n              <label for=\"chordSize\">Diagrama de acorde</label>\n              <input type=\"number\" id=\"chordSize\" value=\"120\" min=\"40\" max=\"400\">\n            </div>\n            <div class=\"field-box\">\n              <label for=\"fingerSize\">Círculo de dedo (1-4)</label>\n              <input type=\"number\" id=\"fingerSize\" value=\"40\" min=\"16\" max=\"160\">\n            </div>\n            <div class=\"field-box\">\n              <label for=\"loopSize\">Etiqueta de bucle (L)</label>\n              <input type=\"number\" id=\"loopSize\" value=\"60\" min=\"30\" max=\"200\">\n            </div>\n          </div>\n        </div>\n\n        <div class=\"settings-section\">\n          <h4>Acordes personalizados guardados</h4>\n          <p class=\"settings-desc\">Acordes que has creado o sobrescrito en este navegador.</p>\n          <div id=\"customChordsManager\" class=\"custom-chord-list\"></div>\n          <div style=\"margin-top:12px;\">\n            <button id=\"resetPrefsBtn\" class=\"btn-ui\" type=\"button\">Restablecer tamaños por defecto</button>\n          </div>\n        </div>\n      </div>\n\n      <!-- Tab 4: Ayuda -->\n      <div id=\"tab-help\" class=\"settings-tab-panel\" style=\"display:none;\">\n        <div class=\"help-block\">\n          <h4>Novedades de la versión v11.0</h4>\n          <ul>\n            <li><strong>Interfaz adaptativa para móvil y Android:</strong> en pantallas estrechas los menús completos se recogen en un cajón desplegable (<strong>☰ Menú</strong>) dejando una barra rápida fija para cambiar de página, alternar <em>Editar / Practicar</em>, lanzar <strong>▶</strong>, <strong>🔁 Bucle</strong> y <strong>⛶ Pantalla completa</strong>. El desplazamiento táctil con un dedo funciona con naturalidad en la partitura.</li>\n            <li><strong>PWA instalable offline (versión web HTTPS):</strong> desde Chrome en Android puedes instalar el editor en tu pantalla de inicio (<em>Instalar app</em>) para estudiar sin conexión tus partituras guardadas en la <strong>Biblioteca local</strong>. El archivo <code>.html</code> sigue siendo 100% autocontenido para PC.</li>\n            <li><strong>Cursor del último pulso y reinicio de bucle corregidos:</strong> en <em>🔁 Bucle</em> el último pulso del último compás permanece iluminado en verde todo su tiempo antes de saltar al inicio; al apagar <em>🔁 Bucle</em> o pulsar <strong>⏹ Reiniciar</strong>, se limpia la marca del compás y se vuelve al principio de la página 1.</li>\n            <li><strong>Apertura siempre en la página 1:</strong> al abrir un PDF, un <code>.scoreproj</code> o una partitura de la Biblioteca, el visor arranca siempre en la parte superior de la página 1.</li>\n          </ul>\n        </div>\n\n        <div class=\"help-block\">\n          <h4>Novedades de la versión v10.0</h4>\n          <ul>\n            <li><strong>Bucle de estudio (1 o varios compases):</strong> en <em>Modo Practicar</em> (sin calibrar), haz <strong>clic sobre cualquier compás</strong> para fijarlo como inicio y activa <strong>🔁 Bucle</strong> indicando el número de compases del ciclo (por defecto <code>1</code>). Al terminar el último compás del ciclo repite automáticamente desde el seleccionado.</li>\n            <li><strong>Metrónomo progresivo opcional y control en vivo del tempo:</strong> puedes cambiar el <strong>BPM</strong> sobre la marcha durante el bucle o elegir <strong>+BPM</strong> (<code>+2</code>, <code>+4</code>, <code>+6</code>) para ir subiendo la velocidad en cada vuelta.</li>\n            <li><strong>Detección asistida de sistemas:</strong> pulsa <strong>Detectar sistemas</strong> en la barra de práctica para proponer automáticamente las cajas sobre los pentagramas/tablaturas de la página actual y luego afinar compases y signos.</li>\n            <li><strong>Símbolos rápidos de técnica guitarrística:</strong> el selector <strong>Técnica ▾</strong> (en <em>Insertar</em>) permite colocar con un clic marcas como <code>H</code>, <code>P</code>, <code>sl.</code>, <code>~~~</code>, <code>Arm. ◇</code>, <code>↑/↓</code>, <code>C.II</code>, <code>Intro</code> o <code>Solo</code>.</li>\n            <li><strong>Zoom centrado al reducir o ampliar:</strong> al pulsar <code>−</code> o <code>+</code> el documento permanece siempre centrado en pantalla.</li>\n          </ul>\n        </div>\n\n        <div class=\"help-block\">\n          <h4>Funciones clave (v5 – v9)</h4>\n          <ul>\n            <li><strong>Biblioteca personal local (IndexedDB):</strong> guarda y organiza tus partituras completas en el navegador con <em>Biblioteca</em> o <em>+ Guardar en bibl.</em>, con búsqueda, favoritas ★ y copias JSON.</li>\n            <li><strong>Añadir espacio y Exportación PDF vectorial híbrida:</strong> abre huecos blancos entre líneas desplazando anotaciones y sistemas (herramienta <em>Añadir espacio</em>) y exporta PDFs nítidos y ligeros conservando vectores originales.</li>\n            <li><strong>Signos musicales completos y orden continuo:</strong> repeticiones <code>|: :|</code>, casillas <code>1./2./3.</code>, <code>𝄋 Segno</code>, <code>Al ⊕</code>, <code>⊕ Coda</code>, <code>D.C.</code>, <code>D.S.</code>, <code>Fine</code>, numeración continua entre páginas, cuenta atrás <code>0–2</code> compases, pedal y <strong>⛶ Pantalla completa</strong>.</li>\n            <li><strong>Acordes y bucles web/PDF:</strong> puntos negro → hueco → vacío, cejillas por arrastre, traste inicial sin pérdida de puntos, <code>1–15</code> trastes y etiquetas de bucle con URL clicable en el PDF exportado.</li>\n          </ul>\n        </div>\n\n        <div class=\"help-block\" style=\"margin-bottom:0;\">\n          <h4>Atajos de teclado</h4>\n          <ul>\n            <li><span class=\"kbd\">Ctrl/Cmd + Z</span> / <span class=\"kbd\">Ctrl/Cmd + Y</span>: Deshacer / Rehacer por página. · <span class=\"kbd\">Ctrl/Cmd + D</span>: Duplicar selección.</li>\n            <li><span class=\"kbd\">Enter</span>: Editar texto, acorde o bucle seleccionado. · <span class=\"kbd\">Supr</span> / <span class=\"kbd\">Backspace</span>: Eliminar selección.</li>\n            <li><span class=\"kbd\">Flechas</span>: Mover selección 2 px (<span class=\"kbd\">Shift</span>: 10 px); sin selección o en Practicar cambian de tramo/página.</li>\n            <li><span class=\"kbd\">Espacio</span> (en Practicar): Play / Pausa (o pedal si se configura en Ajustes). · <span class=\"kbd\">Esc</span>: Salir de pantalla completa, cerrar ventanas o cancelar.</li>\n          </ul>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"modal-footer\">\n      <button id=\"settingsDone\" class=\"primary\">Listo</button>\n    </div>\n  </div>\n</div>\n\n<div id=\"emptyState\">\n  <h2>Editor y estudio de partituras en PDF</h2>\n  <p>Abre una partitura PDF, recupérala desde tu <strong>Biblioteca local</strong> o retoma un <code>.scoreproj</code> para editar (parches, añadir espacio, recortes móviles, acordes y bucles) y estudiar con el <strong>Modo Practicar</strong>.</p>\n  <div class=\"empty-actions\">\n    <button id=\"emptyOpenLibrary\" class=\"primary\">Abrir de mi biblioteca</button>\n    <button id=\"emptyOpenPdf\">Abrir PDF</button>\n    <button id=\"emptyOpenProject\">Abrir editable (.scoreproj)</button>\n    <button id=\"emptyOpenHelp\">Ver ayuda v11.0</button>\n  </div>\n</div>\n\n<div id=\"stageFrame\" style=\"display:none;\">\n  <div id=\"stage\">\n    <canvas id=\"bgCanvas\"></canvas>\n    <svg id=\"overlay\" xmlns=\"http://www.w3.org/2000/svg\"></svg>\n    <svg id=\"practiceOverlay\" xmlns=\"http://www.w3.org/2000/svg\"></svg>\n  </div>\n</div>\n\n<div id=\"toast\" role=\"status\" aria-live=\"polite\"></div>\n\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js\"><\/script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js\"><\/script>\n<script>\npdfjsLib.GlobalWorkerOptions.workerSrc =\n  \"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js\";\n\n/* ============ ESTADO GLOBAL ============ */\nconst state = {\n  tool: \"patch\",\n  mode: \"edit\", // \"edit\" | \"practice\"\n  page: 1,\n  pageCount: 0,\n  pdfDoc: null,\n  sourcePdfBytes: null,\n  sourcePdfName: \"partitura.pdf\",\n  scale: 3,\n  viewZoom: 1,\n  pageSvgCache: {},\n  pageSpaceCuts: {}, // { pageNum: [{ id, y, delta }] }\n  loopTargetUrl: \"\",\n  dirty: false,\n  lastCalibratedMeasures: 4,\n  libraryId: null,\n  libraryTitle: \"\",\n  libraryTags: [],\n  libraryFav: false,\n  pdfExportMode: \"vector\",\n  practice: {\n    timeSig: \"4/4\",\n    bpm: 90,\n    countInBars: 2,\n    metronome: true,\n    viewMode: \"full\",\n    advanceMode: \"auto\",\n    pedalKey: \"arrows_pagedown\",\n    studyLoopEnabled: false,\n    loopCount: 1,\n    progBpmStep: 0,\n    anchorSysId: null,\n    anchorMeasureIdx: 0,\n    pages: {}, // { pageNum: { systems: [...] } }\n  }\n};\n\nconst bgCanvas = document.getElementById(\"bgCanvas\");\nconst bgCtx = bgCanvas.getContext(\"2d\");\nconst overlay = document.getElementById(\"overlay\");\nconst practiceOverlay = document.getElementById(\"practiceOverlay\");\nconst stage = document.getElementById(\"stage\");\nconst stageFrame = document.getElementById(\"stageFrame\");\nconst emptyState = document.getElementById(\"emptyState\");\nlet activeInlineEditor = null;\n\nfunction showToast(msg) {\n  const el = document.getElementById(\"toast\");\n  el.textContent = msg;\n  el.classList.add(\"show\");\n  clearTimeout(showToast._timer);\n  showToast._timer = setTimeout(() => el.classList.remove(\"show\"), 2600);\n}\n\nfunction setDirty(flag) {\n  state.dirty = !!flag;\n  const status = document.getElementById(\"projectStatus\");\n  if (!state.pdfDoc) { status.textContent = \"\"; status.classList.remove(\"dirty-flag\"); return; }\n  if (state.dirty) {\n    status.textContent = \"Cambios sin guardar\";\n    status.classList.add(\"dirty-flag\");\n  } else {\n    status.classList.remove(\"dirty-flag\");\n  }\n}\n\nwindow.addEventListener(\"beforeunload\", (e) => {\n  if (state.dirty && state.pdfDoc) {\n    e.preventDefault();\n    e.returnValue = \"\";\n  }\n});\n\n/* ============ ORDEN DE CAPAS EN OVERLAY ============ */\nfunction getOverlayLayerRank(node) {\n  if (!node || node.nodeType !== 1) return 2;\n  const cl = node.classList;\n  if (cl.contains(\"block-hole\")) return 0;\n  if (cl.contains(\"block-rect\") || (node.tagName === \"rect\" && node.dataset.resizable === \"1\")) return 1;\n  if (cl.contains(\"sel-rect\") || cl.contains(\"sel-handle\") || cl.contains(\"block-selection\") || cl.contains(\"inline-editor-host\")) return 3;\n  return 2;\n}\n\nfunction ensureOverlayLayers() {\n  const children = Array.from(overlay.children);\n  if (children.length < 2) return;\n  const sorted = [...children].sort((a, b) => getOverlayLayerRank(a) - getOverlayLayerRank(b));\n  let changed = false;\n  for (let i = 0; i < children.length; i++) {\n    if (children[i] !== sorted[i]) { changed = true; break; }\n  }\n  if (!changed) return;\n  sorted.forEach(node => overlay.appendChild(node));\n}\n\n/* ============ PREFERENCIAS ============ */\nconst PREF_KEY = \"tab_editor_prefs_v1\";\nconst prefIds = [\"chordSize\",\"fingerSize\",\"loopSize\",\"fontSize\",\"lineWidth\",\"lineColor\",\"patchColor\",\"quality\",\"pdfExportMode\"];\nconst DEFAULT_PREFS = {\n  chordSize: \"120\", fingerSize: \"40\", loopSize: \"60\",\n  fontSize: \"18\", lineWidth: \"2\", lineColor: \"#000000\", patchColor: \"#ffffff\", quality: \"3\", pdfExportMode: \"vector\"\n};\n\nfunction loadPrefs() {\n  let prefs = {};\n  try { prefs = JSON.parse(localStorage.getItem(PREF_KEY) || \"{}\"); } catch (e) {}\n  prefIds.forEach(id => {\n    const el = document.getElementById(id);\n    if (!el) return;\n    el.value = prefs[id] !== undefined ? prefs[id] : DEFAULT_PREFS[id];\n  });\n  state.scale = parseInt(document.getElementById(\"quality\").value) || 3;\n  state.pdfExportMode = document.getElementById(\"pdfExportMode\")?.value || \"vector\";\n}\nfunction savePrefs() {\n  const prefs = {};\n  prefIds.forEach(id => { const el = document.getElementById(id); if (el) prefs[id] = el.value; });\n  state.pdfExportMode = prefs.pdfExportMode || \"vector\";\n  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));\n}\nprefIds.forEach(id => {\n  const el = document.getElementById(id);\n  if (!el) return;\n  el.addEventListener(\"change\", () => { if (id === \"quality\") onQualityChange(); savePrefs(); });\n  el.addEventListener(\"input\", () => savePrefs());\n});\nloadPrefs();\n\nfunction onQualityChange() {\n  const q = parseInt(document.getElementById(\"quality\").value) || 3;\n  if (q === state.scale) return;\n  state.scale = q;\n  if (state.pdfDoc) renderPage(state.page);\n}\n\n/* ============ ZOOM Y LIENZO ============ */\nfunction syncCanvasDisplaySize() {\n  if (!bgCanvas.width || !bgCanvas.height) return;\n  const availableWidth = Math.max(1, window.innerWidth - (window.innerWidth <= 860 ? 14 : 32));\n  const displayWidth = Math.min(bgCanvas.width, availableWidth);\n  const ratio = displayWidth / bgCanvas.width;\n  bgCanvas.style.width = `${displayWidth}px`;\n  bgCanvas.style.height = `${bgCanvas.height * ratio}px`;\n}\nfunction syncZoomFrame() {\n  stage.style.setProperty(\"--view-zoom\", state.viewZoom);\n  stageFrame.style.width = `${Math.max(1, stage.offsetWidth * state.viewZoom)}px`;\n  stageFrame.style.height = `${Math.max(1, stage.offsetHeight * state.viewZoom)}px`;\n}\nfunction setViewZoom(value) {\n  state.viewZoom = Math.max(0.5, Math.min(2.5, Math.round(value * 10) / 10));\n  document.getElementById(\"zoomLabel\").textContent = `${Math.round(state.viewZoom * 100)}%`;\n  syncZoomFrame();\n}\nwindow.addEventListener(\"resize\", () => { syncCanvasDisplaySize(); syncZoomFrame(); });\ndocument.getElementById(\"zoomOut\").addEventListener(\"click\", () => setViewZoom(state.viewZoom - 0.1));\ndocument.getElementById(\"zoomIn\").addEventListener(\"click\", () => setViewZoom(state.viewZoom + 0.1));\ndocument.getElementById(\"zoomReset\").addEventListener(\"click\", () => setViewZoom(1));\n\n/* ============ HISTORIAL POR PÁGINA ============ */\nconst history = {\n  byPage: {},\n  _current() {\n    const p = state.page || 1;\n    if (!this.byPage[p]) this.byPage[p] = { undoStack: [], redoStack: [] };\n    return this.byPage[p];\n  },\n  push(a) {\n    const st = this._current();\n    st.undoStack.push(a);\n    st.redoStack.length = 0;\n    setDirty(true);\n    updateHistoryButtons();\n  },\n  undo() {\n    const st = this._current();\n    const a = st.undoStack.pop();\n    if (!a) return;\n    applyAction(a, \"undo\");\n    st.redoStack.push(a);\n    setDirty(true);\n    updateHistoryButtons();\n  },\n  redo() {\n    const st = this._current();\n    const a = st.redoStack.pop();\n    if (!a) return;\n    applyAction(a, \"redo\");\n    st.undoStack.push(a);\n    setDirty(true);\n    updateHistoryButtons();\n  },\n  clearAll() {\n    this.byPage = {};\n    updateHistoryButtons();\n  }\n};\nfunction updateHistoryButtons() {\n  const st = history._current();\n  document.getElementById(\"undo\").disabled = st.undoStack.length === 0;\n  document.getElementById(\"redo\").disabled = st.redoStack.length === 0;\n  const mobUndo = document.getElementById(\"mobUndoBtn\");\n  if (mobUndo) mobUndo.disabled = st.undoStack.length === 0;\n}\nfunction applyAction(a, dir) {\n  if (a.type === \"add\" || a.type === \"remove\") {\n    const elements = a.elements || [a.el];\n    const shouldAdd = (a.type === \"add\" && dir === \"redo\") || (a.type === \"remove\" && dir === \"undo\");\n    if (selectedEl && elements.includes(selectedEl) && !shouldAdd) clearSelection();\n    if (shouldAdd) {\n      elements.forEach(el => {\n        if (a.next && a.next.parentNode === overlay) overlay.insertBefore(el, a.next);\n        else overlay.appendChild(el);\n      });\n      ensureOverlayLayers();\n    } else {\n      elements.forEach(el => el.remove());\n    }\n  } else if (a.type === \"move\" || a.type === \"resize\") {\n    applySnapshot(a.el, dir === \"undo\" ? a.from : a.to);\n    if (selectedEl === a.el) refreshSelectionBox();\n  } else if (a.type === \"text-edit\") {\n    a.el.textContent = dir === \"undo\" ? a.from : a.to;\n    if (selectedEl === a.el) refreshSelectionBox();\n  } else if (a.type === \"replace\") {\n    const current = dir === \"undo\" ? a.to : a.from;\n    const replacement = dir === \"undo\" ? a.from : a.to;\n    const wasSelected = selectedEl === current;\n    if (wasSelected) clearSelection();\n    current.replaceWith(replacement);\n    ensureOverlayLayers();\n    if (wasSelected) selectElement(replacement);\n  } else if (a.type === \"space-cut\") {\n    const pageNum = a.page;\n    if (!state.pageSpaceCuts[pageNum]) state.pageSpaceCuts[pageNum] = [];\n    const list = state.pageSpaceCuts[pageNum];\n    if (dir === \"undo\") {\n      const idx = list.findIndex(c => c.id === a.cut.id);\n      if (idx >= 0) list.splice(idx, 1);\n      (a.shiftedEls || []).forEach(item => applySnapshot(item.el, item.from));\n      (a.shiftedSystems || []).forEach(item => { item.sys.y = item.fromY; });\n    } else {\n      list.push(a.cut);\n      (a.shiftedEls || []).forEach(item => applySnapshot(item.el, item.to));\n      (a.shiftedSystems || []).forEach(item => { item.sys.y = item.toY; });\n    }\n    if (selectedEl) refreshSelectionBox();\n    renderPage(state.page, { preserveOverlay: true });\n  }\n}\nfunction applySnapshot(el, snap) {\n  if (!snap) return;\n  if (snap.kind === \"chord\" || snap.kind === \"finger\" || snap.kind === \"loop\") {\n    el.dataset.x = snap.x; el.dataset.y = snap.y; el.dataset.size = snap.size;\n    el.setAttribute(\"transform\", `translate(${snap.x},${snap.y}) scale(${snap.size/100})`);\n  } else if (snap.kind === \"text\") {\n    el.setAttribute(\"x\", snap.x); el.setAttribute(\"y\", snap.y);\n    el.setAttribute(\"font-size\", snap.size);\n    el.dataset.size = snap.size;\n  } else if (snap.kind === \"line\") {\n    el.setAttribute(\"x1\", snap.x1); el.setAttribute(\"y1\", snap.y1);\n    el.setAttribute(\"x2\", snap.x2); el.setAttribute(\"y2\", snap.y2);\n  } else if (snap.kind === \"rect\") {\n    el.setAttribute(\"x\", snap.x); el.setAttribute(\"y\", snap.y);\n    el.setAttribute(\"width\", snap.w); el.setAttribute(\"height\", snap.h);\n  } else if (snap.kind === \"block\" || snap.kind === \"hole\") {\n    if (snap.kind === \"hole\") {\n      el.setAttribute(\"x\", snap.x); el.setAttribute(\"y\", snap.y);\n      el.setAttribute(\"width\", snap.w); el.setAttribute(\"height\", snap.h);\n    } else {\n      el.dataset.x = snap.x; el.dataset.y = snap.y;\n      el.setAttribute(\"transform\", `translate(${snap.x},${snap.y})`);\n    }\n  }\n}\n\n/* ============ URL DE BUCLE Y ENLACES ============ */\nfunction normalizeLoopUrl(raw) {\n  const trimmed = (raw || \"\").trim();\n  if (!trimmed) return \"\";\n  if (/^https?:\\/\\//i.test(trimmed)) return trimmed;\n  return `https://${trimmed}`;\n}\nfunction isValidHttpUrl(url) {\n  if (!url) return true;\n  try {\n    const parsed = new URL(url);\n    return parsed.protocol === \"http:\" || parsed.protocol === \"https:\";\n  } catch (e) {\n    return false;\n  }\n}\nfunction openExternalUrl(url) {\n  if (!url) return;\n  const normalized = normalizeLoopUrl(url);\n  if (!isValidHttpUrl(normalized)) { showToast(\"La URL de bucle no es válida.\"); return; }\n  const link = document.createElement(\"a\");\n  link.href = normalized;\n  link.target = \"_blank\";\n  link.rel = \"noopener noreferrer\";\n  document.body.appendChild(link);\n  link.click();\n  link.remove();\n}\n\nfunction updateLoopStatusBadge() {\n  const badge = document.getElementById(\"loopStatusBadge\");\n  document.body.classList.toggle(\"has-loop-url\", Boolean(state.loopTargetUrl));\n  if (!state.pdfDoc) { badge.textContent = \"\"; return; }\n  if (state.loopTargetUrl) {\n    badge.innerHTML = \"\";\n    const label = document.createElement(\"span\");\n    label.textContent = \"Enlace bucles: \";\n    const a = document.createElement(\"a\");\n    a.href = state.loopTargetUrl;\n    a.target = \"_blank\";\n    a.rel = \"noopener noreferrer\";\n    a.textContent = state.loopTargetUrl.length > 44 ? state.loopTargetUrl.slice(0, 44) + \"…\" : state.loopTargetUrl;\n    a.title = state.loopTargetUrl;\n    badge.append(label, a);\n  } else {\n    badge.textContent = \"Bucles sin enlace web (texto plano)\";\n  }\n}\n\nfunction applyLoopVisualState(g, hasLink) {\n  const NS = \"http://www.w3.org/2000/svg\";\n  const rect = g.querySelector(\"rect\");\n  const textEl = g.querySelector(\"text\");\n  let underline = g.querySelector(\".loop-underline\");\n  if (hasLink) {\n    g.dataset.hasLink = \"1\";\n    if (rect) rect.setAttribute(\"stroke\", \"#0c6654\");\n    if (textEl) textEl.setAttribute(\"fill\", \"#0c6654\");\n    if (!underline) {\n      underline = document.createElementNS(NS, \"line\");\n      underline.setAttribute(\"class\", \"loop-underline\");\n      underline.setAttribute(\"x1\", \"16\"); underline.setAttribute(\"y1\", \"46\");\n      underline.setAttribute(\"x2\", \"84\"); underline.setAttribute(\"y2\", \"46\");\n      underline.setAttribute(\"stroke\", \"#147d68\");\n      underline.setAttribute(\"stroke-width\", \"2.4\");\n      underline.setAttribute(\"stroke-linecap\", \"round\");\n      g.appendChild(underline);\n    }\n    let title = g.querySelector(\"title\");\n    if (!title) {\n      title = document.createElementNS(NS, \"title\");\n      g.insertBefore(title, g.firstChild);\n    }\n    title.textContent = `Abrir bucle en: ${state.loopTargetUrl}`;\n  } else {\n    g.dataset.hasLink = \"0\";\n    if (rect) rect.setAttribute(\"stroke\", \"#000\");\n    if (textEl) textEl.setAttribute(\"fill\", \"#000\");\n    if (underline) underline.remove();\n    const title = g.querySelector(\"title\");\n    if (title) title.remove();\n  }\n}\n\nfunction refreshAllLoopLabelsAppearance() {\n  const hasLink = Boolean(state.loopTargetUrl);\n  overlay.querySelectorAll(\".loop-label\").forEach(g => applyLoopVisualState(g, hasLink));\n  updateLoopStatusBadge();\n  updateSelectionActions();\n}\n\n/* ============ GUARDAR / RESTAURAR ANOTACIONES POR PÁGINA ============ */\nfunction saveCurrentPageAnnotations() {\n  if (activeInlineEditor) finishInlineTextEdit(true);\n  const selRect = selectedInfo && selectedInfo.rect;\n  const selHandle = selectedInfo && selectedInfo.handle;\n  if (selRect) selRect.remove();\n  if (selHandle) selHandle.remove();\n\n  ensureOverlayLayers();\n  state.pageSvgCache[state.page] = overlay.innerHTML;\n\n  if (selRect) overlay.appendChild(selRect);\n  if (selHandle) overlay.appendChild(selHandle);\n}\n\nfunction restorePageAnnotations(pageNum) {\n  const saved = state.pageSvgCache[pageNum] || \"\";\n  overlay.innerHTML = saved;\n  ensureOverlayLayers();\n  refreshAllLoopLabelsAppearance();\n}\n\n/* ============ CARGA PDF Y PROYECTO ============ */\ndocument.getElementById(\"openPdfBtn\").addEventListener(\"click\", () => document.getElementById(\"pdfFile\").click());\ndocument.getElementById(\"emptyOpenPdf\").addEventListener(\"click\", () => document.getElementById(\"pdfFile\").click());\ndocument.getElementById(\"emptyOpenProject\").addEventListener(\"click\", () => document.getElementById(\"projectFile\").click());\ndocument.getElementById(\"emptyOpenHelp\").addEventListener(\"click\", () => openSettingsModal(\"help\"));\ndocument.getElementById(\"emptyOpenLibrary\").addEventListener(\"click\", () => openLibraryModal());\ndocument.getElementById(\"openLibraryBtn\").addEventListener(\"click\", () => openLibraryModal());\n\nfunction resetPracticeStateToDefaults() {\n  stopPracticePlayback();\n  state.lastCalibratedMeasures = 4;\n  state.practice = {\n    timeSig: \"4/4\",\n    bpm: 90,\n    countInBars: 2,\n    metronome: true,\n    viewMode: \"full\",\n    advanceMode: \"auto\",\n    pedalKey: \"arrows_pagedown\",\n    studyLoopEnabled: false,\n    loopCount: 1,\n    progBpmStep: 0,\n    anchorSysId: null,\n    anchorMeasureIdx: 0,\n    pages: {},\n  };\n  syncPracticeControlsFromState();\n}\n\ndocument.getElementById(\"pdfFile\").addEventListener(\"change\", async (e) => {\n  const file = e.target.files[0];\n  if (!file) return;\n  try {\n    const buf = await file.arrayBuffer();\n    const sourceBytes = new Uint8Array(buf);\n    const pdfDoc = await pdfjsLib.getDocument({ data: sourceBytes.slice() }).promise;\n    state.sourcePdfBytes = sourceBytes;\n    state.sourcePdfName = file.name || \"partitura.pdf\";\n    state.pdfDoc = pdfDoc;\n    state.pageCount = pdfDoc.numPages;\n    state.page = 1;\n    state.pageSvgCache = {};\n    state.pageSpaceCuts = {};\n    state.loopTargetUrl = \"\";\n    state.libraryId = null;\n    state.libraryTitle = (state.sourcePdfName || \"partitura\").replace(/\\.pdf$/i, \"\");\n    state.libraryTags = [];\n    state.libraryFav = false;\n    document.getElementById(\"settingLoopUrl\").value = \"\";\n    resetPracticeStateToDefaults();\n    history.clearAll();\n    clearSelection();\n    overlay.innerHTML = \"\";\n    emptyState.style.display = \"none\";\n    stageFrame.style.display = \"block\";\n    await renderPage(state.page, { skipSave: true });\n    window.scrollTo(0, 0);\n    setDirty(false);\n    document.getElementById(\"projectStatus\").textContent = state.sourcePdfName;\n    updatePageNav();\n    updateLoopStatusBadge();\n  } catch (error) {\n    console.error(\"No se pudo abrir el PDF:\", error);\n    showToast(\"No se pudo abrir este PDF. Comprueba que sea válido.\");\n  } finally {\n    e.target.value = \"\";\n  }\n});\n\nfunction bytesToBase64(bytes) {\n  let binary = \"\";\n  const chunkSize = 0x8000;\n  for (let offset = 0; offset < bytes.length; offset += chunkSize) {\n    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));\n  }\n  return btoa(binary);\n}\n\nfunction base64ToBytes(value) {\n  const binary = atob(value);\n  const bytes = new Uint8Array(binary.length);\n  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);\n  return bytes;\n}\n\nfunction sanitizeProjectSvg(markup) {\n  if (typeof markup !== \"string\" || markup.length > 50_000_000) throw new Error(\"Anotaciones no válidas.\");\n  const documentSvg = new DOMParser().parseFromString(\n    `<svg xmlns=\"http://www.w3.org/2000/svg\">${markup}</svg>`,\n    \"image/svg+xml\"\n  );\n  if (documentSvg.querySelector(\"parsererror\")) throw new Error(\"El proyecto contiene anotaciones SVG no válidas.\");\n  const root = documentSvg.documentElement;\n  const tags = new Set([\"g\", \"rect\", \"image\", \"text\", \"line\", \"circle\", \"tspan\", \"title\"]);\n  const attributes = new Set([\n    \"class\", \"x\", \"y\", \"width\", \"height\", \"x1\", \"y1\", \"x2\", \"y2\", \"cx\", \"cy\", \"r\", \"rx\", \"ry\",\n    \"fill\", \"stroke\", \"stroke-width\", \"stroke-linecap\", \"stroke-dasharray\", \"transform\",\n    \"preserveAspectRatio\", \"font-family\", \"font-weight\", \"font-size\", \"text-anchor\", \"dominant-baseline\", \"href\"\n  ]);\n  const clean = (parent) => {\n    for (const node of Array.from(parent.children)) {\n      if (!tags.has(node.localName)) { node.remove(); continue; }\n      for (const attr of Array.from(node.attributes)) {\n        const name = attr.name;\n        if (!attributes.has(name) && !name.startsWith(\"data-\")) node.removeAttribute(name);\n        else if (name.toLowerCase().startsWith(\"on\")) node.removeAttribute(name);\n        else if (name === \"href\" && !/^data:image\\/(png|jpeg);base64,/i.test(attr.value)) node.removeAttribute(name);\n      }\n      clean(node);\n    }\n  };\n  clean(root);\n  return root.innerHTML;\n}\n\nfunction buildCurrentProjectObject() {\n  saveCurrentPageAnnotations();\n  return {\n    format: \"partituras-editor-project\",\n    version: 5,\n    sourcePdfName: state.sourcePdfName,\n    sourcePdfBase64: bytesToBase64(state.sourcePdfBytes),\n    page: state.page,\n    scale: state.scale,\n    settings: {\n      loopTargetUrl: state.loopTargetUrl || \"\",\n      practice: {\n        timeSig: state.practice.timeSig,\n        bpm: state.practice.bpm,\n        countInBars: state.practice.countInBars,\n        metronome: state.practice.metronome,\n        viewMode: state.practice.viewMode,\n        advanceMode: state.practice.advanceMode,\n        pedalKey: state.practice.pedalKey,\n        loopCount: state.practice.loopCount,\n        progBpmStep: state.practice.progBpmStep,\n      },\n    },\n    practicePages: state.practice.pages,\n    pageSpaceCuts: state.pageSpaceCuts,\n    pages: state.pageSvgCache,\n  };\n}\n\nasync function saveEditableProject() {\n  if (!state.pdfDoc || !state.sourcePdfBytes) {\n    showToast(\"Carga un PDF antes de guardar el proyecto editable.\");\n    return;\n  }\n  const project = buildCurrentProjectObject();\n  const blob = new Blob([JSON.stringify(project)], { type: \"application/json;charset=utf-8\" });\n  const url = URL.createObjectURL(blob);\n  const name = (state.sourcePdfName || \"partitura.pdf\").replace(/\\.pdf$/i, \"\") || \"partitura\";\n  const link = document.createElement(\"a\");\n  link.href = url;\n  link.download = `${name}.scoreproj`;\n  link.click();\n  setTimeout(() => URL.revokeObjectURL(url), 3000);\n  setDirty(false);\n  document.getElementById(\"projectStatus\").textContent = \"Proyecto editable guardado\";\n  showToast(\"Proyecto editable guardado\");\n}\n\nasync function loadProjectObject(project, libMeta = null) {\n  if (!project || project.format !== \"partituras-editor-project\" || ![1, 2, 3, 4, 5].includes(project.version) || typeof project.sourcePdfBase64 !== \"string\") {\n    throw new Error(\"El formato del proyecto no es compatible.\");\n  }\n  const sourceBytes = base64ToBytes(project.sourcePdfBase64);\n  const pdfDoc = await pdfjsLib.getDocument({ data: sourceBytes.slice() }).promise;\n  const pages = {};\n  if (project.pages && typeof project.pages === \"object\") {\n    for (const [pageNum, markup] of Object.entries(project.pages)) {\n      const n = Number(pageNum);\n      if (Number.isInteger(n) && n >= 1 && n <= pdfDoc.numPages) pages[n] = sanitizeProjectSvg(markup);\n    }\n  }\n  const spaceCuts = {};\n  if (project.pageSpaceCuts && typeof project.pageSpaceCuts === \"object\") {\n    for (const [pageNum, cuts] of Object.entries(project.pageSpaceCuts)) {\n      const n = Number(pageNum);\n      if (Number.isInteger(n) && n >= 1 && n <= pdfDoc.numPages && Array.isArray(cuts)) {\n        spaceCuts[n] = cuts\n          .filter(c => c && Number.isFinite(Number(c.y)) && Number.isFinite(Number(c.delta)) && Number(c.delta) > 0)\n          .map(c => ({ id: String(c.id || `cut-${Math.random()}`), y: Number(c.y), delta: Number(c.delta) }));\n      }\n    }\n  }\n  stopPracticePlayback();\n  state.sourcePdfBytes = sourceBytes;\n  state.sourcePdfName = typeof project.sourcePdfName === \"string\" ? project.sourcePdfName : \"partitura.pdf\";\n  state.pdfDoc = pdfDoc;\n  state.pageCount = pdfDoc.numPages;\n  state.pageSvgCache = pages;\n  state.pageSpaceCuts = spaceCuts;\n  state.loopTargetUrl = normalizeLoopUrl(project.settings?.loopTargetUrl || \"\");\n  document.getElementById(\"settingLoopUrl\").value = state.loopTargetUrl;\n\n  state.libraryId = libMeta?.id || null;\n  state.libraryTitle = libMeta?.title || (state.sourcePdfName || \"partitura\").replace(/\\.pdf$/i, \"\");\n  state.libraryTags = Array.isArray(libMeta?.tags) ? [...libMeta.tags] : [];\n  state.libraryFav = Boolean(libMeta?.favorite);\n\n  const pConf = project.settings?.practice || {};\n  state.practice = {\n    timeSig: [\"4/4\",\"3/4\",\"2/4\",\"6/8\"].includes(pConf.timeSig) ? pConf.timeSig : \"4/4\",\n    bpm: Math.max(35, Math.min(240, Number(pConf.bpm) || 90)),\n    countInBars: [0, 1, 2].includes(Number(pConf.countInBars)) ? Number(pConf.countInBars) : 2,\n    metronome: pConf.metronome !== undefined ? Boolean(pConf.metronome) : true,\n    viewMode: pConf.viewMode === \"chunks\" ? \"chunks\" : \"full\",\n    advanceMode: pConf.advanceMode === \"manual\" ? \"manual\" : \"auto\",\n    pedalKey: [\"arrows_pagedown\",\"space_next\",\"enter_next\"].includes(pConf.pedalKey) ? pConf.pedalKey : \"arrows_pagedown\",\n    studyLoopEnabled: false,\n    loopCount: Math.max(1, Math.min(32, Number(pConf.loopCount) || 1)),\n    progBpmStep: [0, 2, 4, 6].includes(Number(pConf.progBpmStep)) ? Number(pConf.progBpmStep) : 0,\n    anchorSysId: null,\n    anchorMeasureIdx: 0,\n    pages: (project.practicePages && typeof project.practicePages === \"object\") ? project.practicePages : {},\n  };\n  syncPracticeControlsFromState();\n\n  state.scale = [2, 3, 4].includes(Number(project.scale)) ? Number(project.scale) : 3;\n  document.getElementById(\"quality\").value = String(state.scale);\n  state.page = 1;\n  history.clearAll();\n  clearSelection();\n  overlay.innerHTML = \"\";\n  overlay.removeAttribute(\"width\");\n  overlay.removeAttribute(\"height\");\n  overlay.removeAttribute(\"viewBox\");\n  emptyState.style.display = \"none\";\n  stageFrame.style.display = \"block\";\n  await renderPage(state.page, { skipSave: true });\n  window.scrollTo(0, 0);\n  setDirty(false);\n  document.getElementById(\"projectStatus\").textContent = libMeta ? `Biblioteca: ${state.libraryTitle}` : \"Proyecto editable abierto\";\n  updatePageNav();\n  updateLoopStatusBadge();\n}\n\ndocument.getElementById(\"saveProject\").addEventListener(\"click\", saveEditableProject);\ndocument.getElementById(\"openProject\").addEventListener(\"click\", () => document.getElementById(\"projectFile\").click());\ndocument.getElementById(\"projectFile\").addEventListener(\"change\", async (event) => {\n  const file = event.target.files[0];\n  if (!file) return;\n  try {\n    const project = JSON.parse(await file.text());\n    await loadProjectObject(project, null);\n  } catch (error) {\n    console.error(\"No se pudo abrir el proyecto editable:\", error);\n    showToast(`No se pudo abrir el proyecto: ${error.message}`);\n  } finally {\n    event.target.value = \"\";\n  }\n});\n\n/* ============ BIBLIOTECA LOCAL (INDEXEDDB) ============ */\nconst LIB_DB_NAME = \"partituras_editor_lib_v1\";\nconst LIB_STORE = \"scores\";\n\nfunction openLibraryDb() {\n  return new Promise((resolve, reject) => {\n    if (!window.indexedDB) { reject(new Error(\"IndexedDB no disponible en este navegador.\")); return; }\n    const req = indexedDB.open(LIB_DB_NAME, 1);\n    req.onupgradeneeded = () => {\n      const db = req.result;\n      if (!db.objectStoreNames.contains(LIB_STORE)) {\n        const store = db.createObjectStore(LIB_STORE, { keyPath: \"id\" });\n        store.createIndex(\"updatedAt\", \"updatedAt\");\n      }\n    };\n    req.onsuccess = () => resolve(req.result);\n    req.onerror = () => reject(req.error || new Error(\"Error abriendo IndexedDB\"));\n  });\n}\n\nasync function libGetAll() {\n  const db = await openLibraryDb();\n  return new Promise((resolve, reject) => {\n    const tx = db.transaction(LIB_STORE, \"readonly\");\n    const req = tx.objectStore(LIB_STORE).getAll();\n    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));\n    req.onerror = () => reject(req.error);\n  });\n}\n\nasync function libPutRecord(rec) {\n  const db = await openLibraryDb();\n  return new Promise((resolve, reject) => {\n    const tx = db.transaction(LIB_STORE, \"readwrite\");\n    tx.objectStore(LIB_STORE).put(rec);\n    tx.oncomplete = () => resolve(rec);\n    tx.onerror = () => reject(tx.error);\n  });\n}\n\nasync function libDeleteRecord(id) {\n  const db = await openLibraryDb();\n  return new Promise((resolve, reject) => {\n    const tx = db.transaction(LIB_STORE, \"readwrite\");\n    tx.objectStore(LIB_STORE).delete(id);\n    tx.oncomplete = () => resolve();\n    tx.onerror = () => reject(tx.error);\n  });\n}\n\nasync function saveCurrentScoreToLibrary(forceNew = false) {\n  if (!state.pdfDoc || !state.sourcePdfBytes) {\n    showToast(\"Carga primero un PDF o proyecto.\");\n    return;\n  }\n  const project = buildCurrentProjectObject();\n  const isNew = forceNew || !state.libraryId;\n  const id = isNew ? `score-${Date.now()}-${Math.random().toString(36).slice(2,7)}` : state.libraryId;\n  const defaultTitle = state.libraryTitle || (state.sourcePdfName || \"Partitura\").replace(/\\.pdf$/i, \"\");\n  const rec = {\n    id,\n    title: forceNew && state.libraryId ? `${defaultTitle} (copia)` : defaultTitle,\n    sourcePdfName: state.sourcePdfName,\n    pageCount: state.pageCount,\n    favorite: state.libraryFav,\n    tags: [...(state.libraryTags || [])],\n    updatedAt: Date.now(),\n    project,\n  };\n  await libPutRecord(rec);\n  state.libraryId = rec.id;\n  state.libraryTitle = rec.title;\n  setDirty(false);\n  document.getElementById(\"projectStatus\").textContent = `Guardado en biblioteca: ${rec.title}`;\n  showToast(`Guardado en biblioteca: \"${rec.title}\"`);\n  if (document.getElementById(\"libraryModal\").classList.contains(\"open\")) renderLibraryList();\n}\n\nconst libraryModal = document.getElementById(\"libraryModal\");\nfunction closeLibraryModal() { libraryModal.classList.remove(\"open\"); }\nasync function openLibraryModal() {\n  libraryModal.classList.add(\"open\");\n  await renderLibraryList();\n}\n\nasync function renderLibraryList() {\n  const listEl = document.getElementById(\"libList\");\n  const statsEl = document.getElementById(\"libStats\");\n  listEl.innerHTML = \"<div class='settings-desc'>Cargando biblioteca...</div>\";\n  try {\n    const all = await libGetAll();\n    const q = (document.getElementById(\"libSearchInput\").value || \"\").trim().toLowerCase();\n    const favOnly = document.getElementById(\"libFavOnly\").checked;\n    const filtered = all.filter(rec => {\n      if (favOnly && !rec.favorite) return false;\n      if (!q) return true;\n      const hay = `${rec.title || \"\"} ${rec.sourcePdfName || \"\"} ${(rec.tags || []).join(\" \")}`.toLowerCase();\n      return hay.includes(q);\n    });\n    statsEl.textContent = `${all.length} partitura(s) en biblioteca local`;\n    listEl.innerHTML = \"\";\n    if (filtered.length === 0) {\n      const empty = document.createElement(\"div\");\n      empty.className = \"settings-desc\";\n      empty.style.margin = \"8px 0\";\n      empty.textContent = all.length === 0\n        ? \"Tu biblioteca local está vacía. Carga un PDF y pulsa «+ Guardar en bibl.» para guardarlo.\"\n        : \"No hay partituras que coincidan con el filtro.\";\n      listEl.appendChild(empty);\n      return;\n    }\n    filtered.forEach(rec => {\n      const item = document.createElement(\"div\");\n      item.className = \"lib-item\" + (rec.id === state.libraryId ? \" current\" : \"\");\n      const main = document.createElement(\"div\");\n      main.className = \"lib-item-main\";\n\n      const titleRow = document.createElement(\"div\");\n      titleRow.className = \"lib-item-title-row\";\n      const starBtn = document.createElement(\"button\");\n      starBtn.type = \"button\";\n      starBtn.className = \"lib-star-btn\" + (rec.favorite ? \" fav\" : \"\");\n      starBtn.title = rec.favorite ? \"Quitar de favoritas\" : \"Marcar como favorita\";\n      starBtn.textContent = rec.favorite ? \"★\" : \"☆\";\n      starBtn.addEventListener(\"click\", async () => {\n        rec.favorite = !rec.favorite;\n        if (rec.id === state.libraryId) state.libraryFav = rec.favorite;\n        await libPutRecord(rec);\n        renderLibraryList();\n      });\n\n      const titleSpan = document.createElement(\"span\");\n      titleSpan.className = \"lib-title\";\n      titleSpan.textContent = rec.title || rec.sourcePdfName || \"Sin título\";\n      titleRow.append(starBtn, titleSpan);\n\n      const meta = document.createElement(\"div\");\n      meta.className = \"lib-meta\";\n      const d = rec.updatedAt ? new Date(rec.updatedAt).toLocaleString(\"es-ES\", { dateStyle: \"short\", timeStyle: \"short\" }) : \"\";\n      meta.textContent = `${rec.sourcePdfName || \"\"} · ${rec.pageCount || \"?\"} pág. · Act.: ${d}`;\n\n      main.append(titleRow, meta);\n      if (Array.isArray(rec.tags) && rec.tags.length > 0) {\n        const tagsDiv = document.createElement(\"div\");\n        tagsDiv.className = \"lib-tags\";\n        rec.tags.forEach(tg => {\n          const sp = document.createElement(\"span\");\n          sp.className = \"lib-tag\";\n          sp.textContent = tg;\n          tagsDiv.appendChild(sp);\n        });\n        main.appendChild(tagsDiv);\n      }\n\n      const actions = document.createElement(\"div\");\n      actions.className = \"lib-actions\";\n\n      const openBtn = document.createElement(\"button\");\n      openBtn.type = \"button\";\n      openBtn.className = \"primary\";\n      openBtn.textContent = \"Abrir\";\n      openBtn.addEventListener(\"click\", async () => {\n        try {\n          await loadProjectObject(rec.project, { id: rec.id, title: rec.title, tags: rec.tags, favorite: rec.favorite });\n          emptyState.style.display = \"none\";\n          stageFrame.style.display = \"block\";\n          closeLibraryModal();\n        } catch (err) {\n          showToast(`No se pudo abrir: ${err.message}`);\n        }\n      });\n\n      const metaBtn = document.createElement(\"button\");\n      metaBtn.type = \"button\";\n      metaBtn.textContent = \"Título / Etiquetas\";\n      metaBtn.addEventListener(\"click\", async () => {\n        const inlineBox = item.querySelector(\".lib-inline-edit\");\n        if (inlineBox) { inlineBox.remove(); return; }\n        const form = document.createElement(\"div\");\n        form.className = \"lib-inline-edit\";\n        form.style.cssText = \"width:100%; display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; padding-top:8px; border-top:1px dashed var(--border);\";\n        const tIn = document.createElement(\"input\");\n        tIn.type = \"text\"; tIn.value = rec.title || \"\"; tIn.placeholder = \"Título\";\n        tIn.style.flex = \"1 1 160px\";\n        const tagsIn = document.createElement(\"input\");\n        tagsIn.type = \"text\"; tagsIn.value = (rec.tags || []).join(\", \"); tagsIn.placeholder = \"Etiquetas separadas por coma\";\n        tagsIn.style.flex = \"1 1 180px\";\n        const saveMetaBtn = document.createElement(\"button\");\n        saveMetaBtn.type = \"button\"; saveMetaBtn.className = \"primary\"; saveMetaBtn.textContent = \"Guardar\";\n        saveMetaBtn.addEventListener(\"click\", async () => {\n          rec.title = tIn.value.trim() || rec.sourcePdfName || \"Sin título\";\n          rec.tags = tagsIn.value.split(\",\").map(s => s.trim()).filter(Boolean);\n          rec.updatedAt = Date.now();\n          if (rec.id === state.libraryId) { state.libraryTitle = rec.title; state.libraryTags = [...rec.tags]; }\n          await libPutRecord(rec);\n          renderLibraryList();\n        });\n        form.append(tIn, tagsIn, saveMetaBtn);\n        item.appendChild(form);\n        tIn.focus();\n      });\n\n      const expBtn = document.createElement(\"button\");\n      expBtn.type = \"button\";\n      expBtn.textContent = \".scoreproj\";\n      expBtn.title = \"Descargar archivo .scoreproj portable\";\n      expBtn.addEventListener(\"click\", () => {\n        const blob = new Blob([JSON.stringify(rec.project)], { type: \"application/json;charset=utf-8\" });\n        const url = URL.createObjectURL(blob);\n        const a = document.createElement(\"a\");\n        const base = (rec.title || \"partitura\").replace(/[^a-z0-9_\\-áéíóúñ ]/gi, \"_\");\n        a.href = url; a.download = `${base}.scoreproj`; a.click();\n        setTimeout(() => URL.revokeObjectURL(url), 2500);\n      });\n\n      const delBtn = document.createElement(\"button\");\n      delBtn.type = \"button\";\n      delBtn.className = \"danger\";\n      delBtn.textContent = \"Eliminar\";\n      delBtn.addEventListener(\"click\", async () => {\n        if (delBtn.dataset.confirm !== \"1\") {\n          delBtn.dataset.confirm = \"1\";\n          delBtn.textContent = \"¿Confirmar?\";\n          setTimeout(() => { if (delBtn.isConnected) { delBtn.dataset.confirm = \"\"; delBtn.textContent = \"Eliminar\"; } }, 3000);\n          return;\n        }\n        await libDeleteRecord(rec.id);\n        if (state.libraryId === rec.id) state.libraryId = null;\n        renderLibraryList();\n        showToast(\"Eliminada de la biblioteca\");\n      });\n\n      actions.append(openBtn, metaBtn, expBtn, delBtn);\n      item.append(main, actions);\n      listEl.appendChild(item);\n    });\n  } catch (err) {\n    listEl.innerHTML = `<div class=\"settings-desc\" style=\"color:var(--danger);\">Error accediendo a IndexedDB: ${err.message}</div>`;\n  }\n}\n\ndocument.getElementById(\"quickSaveLibraryBtn\").addEventListener(\"click\", () => saveCurrentScoreToLibrary(false));\ndocument.getElementById(\"libSaveCurrentBtn\").addEventListener(\"click\", () => saveCurrentScoreToLibrary(false));\ndocument.getElementById(\"libSaveNewCopyBtn\").addEventListener(\"click\", () => saveCurrentScoreToLibrary(true));\ndocument.getElementById(\"libSearchInput\").addEventListener(\"input\", renderLibraryList);\ndocument.getElementById(\"libFavOnly\").addEventListener(\"change\", renderLibraryList);\ndocument.getElementById(\"libraryClose\").addEventListener(\"click\", closeLibraryModal);\ndocument.getElementById(\"libraryDone\").addEventListener(\"click\", closeLibraryModal);\nlibraryModal.addEventListener(\"click\", (e) => { if (e.target === libraryModal) closeLibraryModal(); });\n\ndocument.getElementById(\"libExportBackupBtn\").addEventListener(\"click\", async () => {\n  try {\n    const all = await libGetAll();\n    const payload = { format: \"partituras-library-backup\", version: 1, exportedAt: Date.now(), items: all };\n    const blob = new Blob([JSON.stringify(payload)], { type: \"application/json;charset=utf-8\" });\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement(\"a\");\n    a.href = url;\n    a.download = `biblioteca_partituras_${new Date().toISOString().slice(0,10)}.json`;\n    a.click();\n    setTimeout(() => URL.revokeObjectURL(url), 3000);\n    showToast(`Copia exportada (${all.length} partituras)`);\n  } catch (err) {\n    showToast(\"No se pudo exportar la copia.\");\n  }\n});\n\ndocument.getElementById(\"libImportBackupBtn\").addEventListener(\"click\", () => document.getElementById(\"libBackupFile\").click());\ndocument.getElementById(\"libBackupFile\").addEventListener(\"change\", async (e) => {\n  const file = e.target.files[0];\n  if (!file) return;\n  try {\n    const data = JSON.parse(await file.text());\n    if (data.format !== \"partituras-library-backup\" || !Array.isArray(data.items)) {\n      throw new Error(\"Archivo de copia no válido.\");\n    }\n    let count = 0;\n    for (const item of data.items) {\n      if (item && item.id && item.project && item.project.format === \"partituras-editor-project\") {\n        await libPutRecord(item);\n        count++;\n      }\n    }\n    await renderLibraryList();\n    showToast(`Copia importada: ${count} partitura(s)`);\n  } catch (err) {\n    showToast(`Error al importar copia: ${err.message}`);\n  } finally {\n    e.target.value = \"\";\n  }\n});\n\n/* ============ RENDERIZADO PDF CON ESPACIOS Y COLA SEGURA ============ */\nasync function renderPdfCanvasWithCuts(pageObj, scale, cuts, targetCanvas) {\n  const viewport = pageObj.getViewport({ scale });\n  const srcW = Math.round(viewport.width);\n  const srcH = Math.round(viewport.height);\n  const cleanCuts = Array.isArray(cuts) ? cuts : [];\n  if (cleanCuts.length === 0) {\n    targetCanvas.width = srcW;\n    targetCanvas.height = srcH;\n    const tctx = targetCanvas.getContext(\"2d\");\n    await pageObj.render({ canvasContext: tctx, viewport }).promise;\n    return { width: srcW, height: srcH };\n  }\n  const srcCanvas = document.createElement(\"canvas\");\n  srcCanvas.width = srcW;\n  srcCanvas.height = srcH;\n  const sctx = srcCanvas.getContext(\"2d\");\n  await pageObj.render({ canvasContext: sctx, viewport }).promise;\n\n  let work = srcCanvas;\n  for (const cut of cleanCuts) {\n    const delta = Math.max(0, Math.round(cut.delta || 0));\n    const cutY = Math.max(0, Math.min(work.height, Math.round(cut.y || 0)));\n    if (delta <= 0) continue;\n    const nextCanvas = document.createElement(\"canvas\");\n    nextCanvas.width = work.width;\n    nextCanvas.height = work.height + delta;\n    const nctx = nextCanvas.getContext(\"2d\");\n    nctx.fillStyle = \"#ffffff\";\n    nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);\n    if (cutY > 0) nctx.drawImage(work, 0, 0, work.width, cutY, 0, 0, work.width, cutY);\n    if (work.height - cutY > 0) {\n      nctx.drawImage(work, 0, cutY, work.width, work.height - cutY, 0, cutY + delta, work.width, work.height - cutY);\n    }\n    work = nextCanvas;\n  }\n\n  targetCanvas.width = work.width;\n  targetCanvas.height = work.height;\n  const tctx = targetCanvas.getContext(\"2d\");\n  tctx.drawImage(work, 0, 0);\n  return { width: work.width, height: work.height };\n}\n\nlet renderQueue = Promise.resolve();\nfunction renderPage(pageNum, opts = {}) {\n  const task = renderQueue.then(() => _renderPageImpl(pageNum, opts)).catch(err => {\n    console.error(\"Error renderizando página:\", err);\n  });\n  renderQueue = task;\n  return task;\n}\n\nasync function _renderPageImpl(pageNum, opts = {}) {\n  if (!state.pdfDoc) return;\n  const samePagePreserve = Boolean(opts.preserveOverlay && pageNum === state.page);\n  if (!opts.skipSave && !samePagePreserve && overlay.getAttribute(\"width\")) saveCurrentPageAnnotations();\n  state.page = pageNum;\n\n  const page = await state.pdfDoc.getPage(pageNum);\n  const cuts = state.pageSpaceCuts[pageNum] || [];\n  const dims = await renderPdfCanvasWithCuts(page, state.scale, cuts, bgCanvas);\n\n  [overlay, practiceOverlay].forEach(svg => {\n    svg.setAttribute(\"width\", dims.width);\n    svg.setAttribute(\"height\", dims.height);\n    svg.setAttribute(\"viewBox\", `0 0 ${dims.width} ${dims.height}`);\n  });\n  syncCanvasDisplaySize();\n  syncZoomFrame();\n\n  if (!samePagePreserve) {\n    overlay.innerHTML = \"\";\n    clearSelection();\n    restorePageAnnotations(pageNum);\n  }\n  closeSystemPopover();\n  renderPracticeOverlay();\n  updateHistoryButtons();\n  updatePageNav();\n}\n\nfunction closeMobileMenu() {\n  document.body.classList.remove(\"mobile-menu-open\");\n  const toggleBtn = document.getElementById(\"mobMenuToggle\");\n  if (toggleBtn) {\n    toggleBtn.setAttribute(\"aria-expanded\", \"false\");\n    toggleBtn.textContent = \"☰ Menú\";\n    toggleBtn.classList.remove(\"active\");\n  }\n}\n\nfunction updatePageNav() {\n  document.getElementById(\"pageLabel\").textContent = state.pageCount\n    ? `${state.page} / ${state.pageCount}`\n    : \"— / —\";\n  document.getElementById(\"prevPage\").disabled = state.page <= 1;\n  document.getElementById(\"nextPage\").disabled = state.page >= state.pageCount;\n\n  const mobLbl = document.getElementById(\"mobPageLabel\");\n  const mobPrev = document.getElementById(\"mobPrevPage\");\n  const mobNext = document.getElementById(\"mobNextPage\");\n  if (mobLbl) mobLbl.textContent = state.pageCount ? `${state.page}/${state.pageCount}` : \"—/—\";\n  if (mobPrev) mobPrev.disabled = state.page <= 1;\n  if (mobNext) mobNext.disabled = state.page >= state.pageCount;\n}\ndocument.getElementById(\"prevPage\").addEventListener(\"click\", async () => {\n  if (state.page <= 1) return;\n  await renderPage(state.page - 1, { fromNav: true });\n});\ndocument.getElementById(\"nextPage\").addEventListener(\"click\", async () => {\n  if (state.page >= state.pageCount) return;\n  await renderPage(state.page + 1, { fromNav: true });\n});\n\n/* ============ MODO EDITAR / PRACTICAR Y PANTALLA COMPLETA ============ */\nlet pendingFinger = null, pendingLoop = null, pendingChord = null, pendingCustomChord = null, pendingTech = null;\nfunction hasPendingPlacement() {\n  return Boolean(pendingFinger || pendingLoop || pendingChord || pendingCustomChord || pendingTech);\n}\nfunction clearPendingPlacement() {\n  pendingFinger = null; pendingLoop = null; pendingChord = null; pendingCustomChord = null; pendingTech = null;\n  overlay.classList.remove(\"placing-pending\");\n}\nfunction setPendingPlacement(setterFn, toastMsg) {\n  clearPendingPlacement();\n  setterFn();\n  overlay.classList.add(\"placing-pending\");\n  closeMobileMenu();\n  if (toastMsg) showToast(toastMsg);\n}\n\nfunction setTool(name) {\n  document.querySelectorAll(\"[data-tool]\").forEach(b => b.classList.toggle(\"active\", b.dataset.tool === name));\n  state.tool = name;\n  lastSelectPress = null;\n  overlay.classList.toggle(\"tool-block\", name === \"block\");\n  overlay.classList.toggle(\"tool-addspace\", name === \"addspace\");\n  overlay.classList.toggle(\"tool-select\", name === \"select\");\n}\ndocument.querySelectorAll(\"[data-tool]\").forEach(btn => {\n  btn.addEventListener(\"click\", () => { clearPendingPlacement(); setTool(btn.dataset.tool); });\n});\n\nfunction setPracticeFullscreen(enable) {\n  const next = Boolean(enable);\n  document.body.classList.toggle(\"practice-fullscreen\", next);\n  if (next) {\n    if (practiceCalibrating) setCalibrating(false);\n    document.documentElement.requestFullscreen?.().catch(() => {});\n  } else if (document.fullscreenElement) {\n    document.exitFullscreen?.().catch(() => {});\n  }\n  setTimeout(() => { syncCanvasDisplaySize(); syncZoomFrame(); }, 60);\n}\ndocument.addEventListener(\"fullscreenchange\", () => {\n  if (!document.fullscreenElement && document.body.classList.contains(\"practice-fullscreen\")) {\n    document.body.classList.remove(\"practice-fullscreen\");\n    setTimeout(() => { syncCanvasDisplaySize(); syncZoomFrame(); }, 60);\n  }\n});\ndocument.getElementById(\"practiceFullscreenBtn\").addEventListener(\"click\", () => {\n  if (!state.pdfDoc) return;\n  setPracticeFullscreen(true);\n});\ndocument.getElementById(\"fsExitBtn\").addEventListener(\"click\", () => setPracticeFullscreen(false));\n\nfunction setAppMode(mode) {\n  state.mode = mode;\n  const isPractice = mode === \"practice\";\n  document.body.classList.toggle(\"practice-mode\", isPractice);\n  const btn = document.getElementById(\"toggleMode\");\n  btn.textContent = isPractice ? \"Modo: Practicar\" : \"Modo: Editar\";\n  btn.classList.toggle(\"btn-play-active\", isPractice);\n\n  const mobModeBtn = document.getElementById(\"mobModeToggle\");\n  if (mobModeBtn) {\n    mobModeBtn.textContent = isPractice ? \"Editar\" : \"Practicar\";\n    mobModeBtn.classList.toggle(\"btn-play-active\", isPractice);\n  }\n\n  if (isPractice) {\n    if (activeInlineEditor) finishInlineTextEdit(true);\n    clearSelection();\n    clearPendingPlacement();\n    chordPanel.style.display = \"none\";\n    chordEditor.style.display = \"none\";\n    document.getElementById(\"hintText\").innerHTML =\n      \"<strong>Modo Practicar</strong>: haz clic en cualquier compás para fijar el inicio y activa <b>🔁 Bucle</b> (elige nº de compases). Pulsa <b>▶ Practicar</b>, <b>Calibrar sistemas</b> o <b>Detectar sistemas</b>.\";\n  } else {\n    setPracticeFullscreen(false);\n    stopPracticePlayback();\n    setCalibrating(false);\n    document.getElementById(\"hintText\").innerHTML =\n      \"<strong>Editar</strong>: clic en Texto y escribe (Enter guarda). Doble clic o <b>Editar</b>/Enter cambia texto, acorde o bucle. <b>Supr</b> borra el seleccionado. <b>Ajustes y ayuda</b> guarda la URL de bucle y preferencias.\";\n  }\n  renderPracticeOverlay();\n}\ndocument.getElementById(\"toggleMode\").addEventListener(\"click\", () => {\n  setAppMode(state.mode === \"edit\" ? \"practice\" : \"edit\");\n});\n\nlet drawing = null;\n\nfunction svgPoint(evt, svgEl = overlay) {\n  const screenMatrix = svgEl.getScreenCTM();\n  if (!screenMatrix) return { x: 0, y: 0 };\n  const point = svgEl.createSVGPoint();\n  point.x = evt.clientX;\n  point.y = evt.clientY;\n  const localPoint = point.matrixTransform(screenMatrix.inverse());\n  return { x: localPoint.x, y: localPoint.y };\n}\nfunction resolveRoot(target) {\n  if (!target || target === overlay) return null;\n  let el = target;\n  while (el && el.parentNode && el.parentNode !== overlay) el = el.parentNode;\n  return el && el.parentNode === overlay ? el : null;\n}\n\n/* ============ BIBLIOTECA ACORDES ============ */\nconst BASE_CHORD_KEYS = new Set([\n  \"Am\",\"A\",\"C\",\"D\",\"E\",\"Em\",\"F\",\"G\",\"Bm\",\"Dm\",\"F#m\",\"B7\",\"E7\",\"A7\",\"D7\",\"G7\",\"C7\"\n]);\nconst CHORD_LIBRARY = {\n  \"Am\":  { traste:1, frets:5, pos:[[-1],[0],[2],[2],[1],[0]] },\n  \"A\":   { traste:1, frets:5, pos:[[-1],[0],[2],[2],[2],[0]] },\n  \"C\":   { traste:1, frets:5, pos:[[-1],[3],[2],[0],[1],[0]] },\n  \"D\":   { traste:1, frets:5, pos:[[-1],[-1],[0],[2],[3],[2]] },\n  \"E\":   { traste:1, frets:5, pos:[[0],[2],[2],[1],[0],[0]] },\n  \"Em\":  { traste:1, frets:5, pos:[[0],[2],[2],[0],[0],[0]] },\n  \"F\":   { traste:1, frets:5, pos:[[1],[3],[3],[2],[1],[1]], cejillas:[{traste:1, desde:1, hasta:6}] },\n  \"G\":   { traste:1, frets:5, pos:[[3],[2],[0],[0],[0],[3]] },\n  \"Bm\":  { traste:1, frets:5, pos:[[-1],[2],[4],[4],[3],[2]], cejillas:[{traste:2, desde:1, hasta:6}] },\n  \"Dm\":  { traste:1, frets:5, pos:[[-1],[-1],[0],[2],[3],[1]] },\n  \"F#m\": { traste:2, frets:5, pos:[[-1],[4],[4],[2],[2],[2]] },\n  \"B7\":  { traste:1, frets:5, pos:[[-1],[2],[1],[2],[0],[2]] },\n  \"E7\":  { traste:1, frets:5, pos:[[0],[2],[0],[1],[0],[0]] },\n  \"A7\":  { traste:1, frets:5, pos:[-1,0,2,0,2,0].map(v=>[v]) },\n  \"D7\":  { traste:1, frets:5, pos:[[-1],[-1],[0],[2],[1],[2]] },\n  \"G7\":  { traste:1, frets:5, pos:[[3],[2],[0],[0],[0],[1]] },\n  \"C7\":  { traste:1, frets:5, pos:[[-1],[3],[2],[3],[1],[0]] },\n};\nconst STORAGE_KEY = \"tab_editor_chords_v1\";\nlet savedCustomChords = {};\ntry {\n  savedCustomChords = JSON.parse(localStorage.getItem(STORAGE_KEY) || \"{}\");\n  Object.assign(CHORD_LIBRARY, savedCustomChords);\n} catch (e) {}\n\nfunction migrateChord(a) {\n  if (!a || !a.pos) return a;\n  if (Array.isArray(a.pos[0])) return a;\n  const newPos = a.pos.map(v => [v]);\n  const res = { traste: a.traste || 1, frets: a.frets || 5, pos: newPos };\n  if (a.cejilla) res.cejillas = [{ traste: a.cejilla[0], desde: a.cejilla[1], hasta: a.cejilla[2] }];\n  else if (a.cejillas) res.cejillas = a.cejillas;\n  return res;\n}\nfunction emptyHollowPositions() { return Array.from({ length: 6 }, () => []); }\nfunction normalizeChordModel(raw) {\n  const chord = migrateChord(raw);\n  const hollowPos = Array.isArray(chord.hollowPos) ? chord.hollowPos : emptyHollowPositions();\n  return {\n    traste: Math.max(1, Math.min(24, parseInt(chord.traste) || 1)),\n    frets: Math.max(1, Math.min(15, parseInt(chord.frets) || 5)),\n    pos: Array.from({ length: 6 }, (_, i) => [...(chord.pos?.[i] || [])]),\n    hollowPos: Array.from({ length: 6 }, (_, i) => [...(hollowPos[i] || [])]),\n    cejillas: (chord.cejillas || []).map(cj => ({ ...cj })),\n  };\n}\nObject.keys(CHORD_LIBRARY).forEach(k => { CHORD_LIBRARY[k] = normalizeChordModel(CHORD_LIBRARY[k]); });\nfunction saveCustomChord(nombre, acorde) {\n  const normalized = normalizeChordModel(acorde);\n  CHORD_LIBRARY[nombre] = normalized;\n  savedCustomChords[nombre] = normalized;\n  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCustomChords));\n}\nfunction deleteCustomChord(nombre) {\n  delete savedCustomChords[nombre];\n  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCustomChords));\n  if (!BASE_CHORD_KEYS.has(nombre)) delete CHORD_LIBRARY[nombre];\n  rebuildChordList();\n  renderCustomChordsManager();\n}\n\nconst ED = { W: 102, left: 21, right: 91, top: 25, strings: 6, fGap: 16 };\nED.sGap = (ED.right - ED.left) / (ED.strings - 1);\nfunction chordDiagramHeight(frets) { return ED.top + frets * ED.fGap + 15; }\n\nfunction buildChordGroup(nombre, pos, trasteIni, cejillas, x, y, size, hollowPos = [], fretsCount = 5) {\n  const NS = \"http://www.w3.org/2000/svg\";\n  const frets = Math.max(1, Math.min(15, parseInt(fretsCount) || 5));\n  const W = ED.W, left = ED.left, right = ED.right, top = ED.top;\n  const fGap = ED.fGap, sGap = ED.sGap;\n  const bottom = top + frets * fGap;\n  const H = chordDiagramHeight(frets);\n  const cleanName = (nombre || \"\").trim();\n\n  const g = document.createElementNS(NS, \"g\");\n  g.setAttribute(\"class\", \"chord-diagram\");\n  g.setAttribute(\"data-size\", size);\n  g.setAttribute(\"data-frets\", frets);\n  g.setAttribute(\"data-x\", x); g.setAttribute(\"data-y\", y);\n  g.setAttribute(\"transform\", `translate(${x},${y}) scale(${size/100})`);\n\n  const bg = document.createElementNS(NS, \"rect\");\n  bg.setAttribute(\"x\", 0); bg.setAttribute(\"y\", 0);\n  bg.setAttribute(\"width\", W); bg.setAttribute(\"height\", H);\n  bg.setAttribute(\"fill\", \"#ffffff\");\n  g.appendChild(bg);\n\n  if (cleanName) {\n    const nameEl = document.createElementNS(NS, \"text\");\n    nameEl.setAttribute(\"x\", (left + right) / 2); nameEl.setAttribute(\"y\", 15);\n    nameEl.setAttribute(\"text-anchor\", \"middle\");\n    nameEl.setAttribute(\"font-family\", \"monospace\"); nameEl.setAttribute(\"font-weight\", \"bold\");\n    nameEl.setAttribute(\"font-size\", \"14\"); nameEl.setAttribute(\"fill\", \"#000\");\n    nameEl.textContent = cleanName;\n    g.appendChild(nameEl);\n  }\n\n  for (let i = 0; i < ED.strings; i++) {\n    const l = document.createElementNS(NS, \"line\");\n    const xpos = left + i * sGap;\n    l.setAttribute(\"x1\", xpos); l.setAttribute(\"y1\", top);\n    l.setAttribute(\"x2\", xpos); l.setAttribute(\"y2\", bottom);\n    l.setAttribute(\"stroke\", \"#000\"); l.setAttribute(\"stroke-width\", \"1\");\n    g.appendChild(l);\n  }\n  for (let i = 0; i <= frets; i++) {\n    const l = document.createElementNS(NS, \"line\");\n    const ypos = top + i * fGap;\n    l.setAttribute(\"x1\", left); l.setAttribute(\"y1\", ypos);\n    l.setAttribute(\"x2\", right); l.setAttribute(\"y2\", ypos);\n    l.setAttribute(\"stroke\", \"#000\");\n    l.setAttribute(\"stroke-width\", i === 0 && trasteIni === 1 ? \"3\" : \"1\");\n    g.appendChild(l);\n  }\n  if (trasteIni > 1) {\n    const t = document.createElementNS(NS, \"text\");\n    t.setAttribute(\"x\", left - 4); t.setAttribute(\"y\", top + fGap * 0.5);\n    t.setAttribute(\"text-anchor\", \"end\");\n    t.setAttribute(\"dominant-baseline\", \"central\");\n    t.setAttribute(\"font-family\", \"monospace\"); t.setAttribute(\"font-weight\", \"bold\");\n    t.setAttribute(\"font-size\", \"14\"); t.setAttribute(\"fill\", \"#000\");\n    t.textContent = trasteIni;\n    g.appendChild(t);\n  }\n\n  const cejList = cejillas || [];\n  cejList.forEach(cj => {\n    const trasteRel = cj.traste - trasteIni;\n    if (trasteRel < 0 || trasteRel >= frets) return;\n    const yc = top + (trasteRel + 0.5) * fGap;\n    const x1 = left + (cj.desde - 1) * sGap;\n    const x2 = left + (cj.hasta - 1) * sGap;\n    const bar = document.createElementNS(NS, \"rect\");\n    bar.setAttribute(\"x\", Math.min(x1, x2) - 4);\n    bar.setAttribute(\"y\", yc - 5);\n    bar.setAttribute(\"width\", Math.abs(x2 - x1) + 8);\n    bar.setAttribute(\"height\", 10);\n    bar.setAttribute(\"rx\", 5);\n    bar.setAttribute(\"fill\", \"#000\");\n    g.appendChild(bar);\n  });\n\n  for (let i = 0; i < ED.strings; i++) {\n    const xpos = left + i * sGap;\n    const arr = pos[i] || [];\n    if (arr.includes(-1)) {\n      const t = document.createElementNS(NS, \"text\");\n      t.setAttribute(\"x\", xpos); t.setAttribute(\"y\", top - 5);\n      t.setAttribute(\"text-anchor\", \"middle\");\n      t.setAttribute(\"font-family\", \"monospace\"); t.setAttribute(\"font-size\", \"11\"); t.setAttribute(\"fill\", \"#000\");\n      t.textContent = \"X\";\n      g.appendChild(t);\n    } else if (arr.includes(0)) {\n      const c = document.createElementNS(NS, \"circle\");\n      c.setAttribute(\"cx\", xpos); c.setAttribute(\"cy\", top - 9);\n      c.setAttribute(\"r\", 3.5); c.setAttribute(\"fill\", \"none\");\n      c.setAttribute(\"stroke\", \"#000\"); c.setAttribute(\"stroke-width\", \"1\");\n      g.appendChild(c);\n    }\n    const drawPosition = (fret, hollow) => {\n      if (fret <= 0) return;\n      const covered = cejList.some(cj => cj.traste === fret && i + 1 >= cj.desde && i + 1 <= cj.hasta);\n      if (covered) return;\n      const fretRel = fret - trasteIni;\n      if (fretRel < 0 || fretRel >= frets) return;\n      const cy = top + (fretRel + 0.5) * fGap;\n      const c = document.createElementNS(NS, \"circle\");\n      c.setAttribute(\"cx\", xpos); c.setAttribute(\"cy\", cy);\n      c.setAttribute(\"r\", 5); c.setAttribute(\"fill\", hollow ? \"#fff\" : \"#000\");\n      if (hollow) { c.setAttribute(\"stroke\", \"#000\"); c.setAttribute(\"stroke-width\", \"1.6\"); }\n      g.appendChild(c);\n    };\n    arr.forEach(fret => drawPosition(fret, false));\n    (hollowPos[i] || []).forEach(fret => drawPosition(fret, true));\n  }\n\n  g.dataset.chordModel = JSON.stringify({\n    nombre: cleanName,\n    traste: trasteIni,\n    frets,\n    pos: pos.map(arr => [...arr]),\n    hollowPos: Array.from({ length: 6 }, (_, stringIndex) => [...(hollowPos[stringIndex] || [])]),\n    cejillas: cejList.map(cj => ({ ...cj })),\n  });\n  return g;\n}\n\n/* ============ FINGER / LOOP / BLOCK ============ */\nfunction buildFingerGroup(finger, x, y, size) {\n  const NS = \"http://www.w3.org/2000/svg\";\n  const g = document.createElementNS(NS, \"g\");\n  g.setAttribute(\"class\", \"finger-marker\");\n  g.setAttribute(\"data-finger\", finger);\n  g.setAttribute(\"data-size\", size);\n  g.setAttribute(\"data-x\", x); g.setAttribute(\"data-y\", y);\n  g.setAttribute(\"transform\", `translate(${x},${y}) scale(${size/100})`);\n  const c = document.createElementNS(NS, \"circle\");\n  c.setAttribute(\"cx\", 50); c.setAttribute(\"cy\", 50); c.setAttribute(\"r\", 45);\n  c.setAttribute(\"fill\", \"#fff\"); c.setAttribute(\"stroke\", \"#000\"); c.setAttribute(\"stroke-width\", 4);\n  g.appendChild(c);\n  const t = document.createElementNS(NS, \"text\");\n  t.setAttribute(\"x\", 50); t.setAttribute(\"y\", 50);\n  t.setAttribute(\"text-anchor\", \"middle\"); t.setAttribute(\"dominant-baseline\", \"central\");\n  t.setAttribute(\"font-family\", \"monospace\"); t.setAttribute(\"font-weight\", \"bold\");\n  t.setAttribute(\"font-size\", 60); t.setAttribute(\"fill\", \"#000\");\n  t.textContent = String(finger);\n  g.appendChild(t);\n  return g;\n}\n\nfunction buildLoopGroup(text, x, y, size) {\n  const NS = \"http://www.w3.org/2000/svg\";\n  const g = document.createElementNS(NS, \"g\");\n  g.setAttribute(\"class\", \"loop-label\");\n  g.setAttribute(\"data-text\", text);\n  g.setAttribute(\"data-size\", size);\n  g.setAttribute(\"data-x\", x); g.setAttribute(\"data-y\", y);\n  g.setAttribute(\"transform\", `translate(${x},${y}) scale(${size/100})`);\n  const r = document.createElementNS(NS, \"rect\");\n  r.setAttribute(\"x\", 2); r.setAttribute(\"y\", 2);\n  r.setAttribute(\"width\", 96); r.setAttribute(\"height\", 56);\n  r.setAttribute(\"rx\", 10); r.setAttribute(\"ry\", 10);\n  r.setAttribute(\"fill\", \"#fff\"); r.setAttribute(\"stroke\", \"#000\"); r.setAttribute(\"stroke-width\", 3);\n  g.appendChild(r);\n  const t = document.createElementNS(NS, \"text\");\n  t.setAttribute(\"x\", 50); t.setAttribute(\"y\", 28);\n  t.setAttribute(\"text-anchor\", \"middle\"); t.setAttribute(\"dominant-baseline\", \"central\");\n  t.setAttribute(\"font-family\", \"monospace\"); t.setAttribute(\"font-weight\", \"bold\");\n  t.setAttribute(\"font-size\", text.length > 4 ? \"26\" : \"34\");\n  t.setAttribute(\"fill\", \"#000\");\n  t.textContent = text;\n  g.appendChild(t);\n  applyLoopVisualState(g, Boolean(state.loopTargetUrl));\n  return g;\n}\n\nfunction buildBlockGroup(dataUrl, x, y, w, h, pairId) {\n  const NS = \"http://www.w3.org/2000/svg\";\n  const g = document.createElementNS(NS, \"g\");\n  g.setAttribute(\"class\", \"block-rect\");\n  g.dataset.blockPair = pairId;\n  g.setAttribute(\"data-x\", x); g.setAttribute(\"data-y\", y);\n  g.setAttribute(\"data-w\", w); g.setAttribute(\"data-h\", h);\n  g.setAttribute(\"transform\", `translate(${x},${y})`);\n  const img = document.createElementNS(NS, \"image\");\n  img.setAttribute(\"href\", dataUrl);\n  img.setAttribute(\"x\", 0); img.setAttribute(\"y\", 0);\n  img.setAttribute(\"width\", w); img.setAttribute(\"height\", h);\n  img.setAttribute(\"preserveAspectRatio\", \"none\");\n  img.setAttribute(\"class\", \"block-img\");\n  g.appendChild(img);\n  return g;\n}\n\n/* ============ PANEL ACORDES ============ */\nconst chordPanel = document.getElementById(\"chordPanel\");\nconst chordList = document.getElementById(\"chordList\");\nfunction rebuildChordList() {\n  chordList.innerHTML = \"\";\n  Object.keys(CHORD_LIBRARY).forEach(nombre => {\n    const a = CHORD_LIBRARY[nombre];\n    const frets = a.frets || 5;\n    const H = chordDiagramHeight(frets);\n    const div = document.createElement(\"div\");\n    div.className = \"chord-item\";\n    const wrap = document.createElementNS(\"http://www.w3.org/2000/svg\", \"svg\");\n    wrap.setAttribute(\"width\", 58); wrap.setAttribute(\"height\", Math.round(58 * H / 100));\n    wrap.setAttribute(\"viewBox\", `0 0 100 ${H}`);\n    wrap.appendChild(buildChordGroup(nombre, a.pos, a.traste, a.cejillas, 0, 0, 100, a.hollowPos, frets));\n    const label = document.createElement(\"div\");\n    label.className = \"name\"; label.textContent = nombre;\n    div.appendChild(wrap); div.appendChild(label);\n\n    if (savedCustomChords[nombre] && !BASE_CHORD_KEYS.has(nombre)) {\n      const del = document.createElement(\"button\");\n      del.className = \"del-chord\";\n      del.type = \"button\";\n      del.title = `Eliminar ${nombre}`;\n      del.textContent = \"×\";\n      del.addEventListener(\"click\", (ev) => {\n        ev.stopPropagation();\n        deleteCustomChord(nombre);\n        showToast(`Acorde \"${nombre}\" eliminado`);\n      });\n      div.appendChild(del);\n    }\n\n    div.addEventListener(\"click\", () => {\n      if (!state.pdfDoc) { showToast(\"Carga primero un PDF.\"); return; }\n      setPendingPlacement(() => { pendingChord = nombre; }, `Haz clic en la partitura para colocar \"${nombre}\" (Esc cancela)`);\n      chordPanel.style.display = \"none\";\n      setTool(\"select\");\n    });\n    chordList.appendChild(div);\n  });\n}\nrebuildChordList();\ndocument.getElementById(\"insertChord\").addEventListener(\"click\", () => {\n  chordPanel.style.display = chordPanel.style.display === \"none\" ? \"block\" : \"none\";\n});\ndocument.getElementById(\"closeChordPanel\").addEventListener(\"click\", () => { chordPanel.style.display = \"none\"; });\n\n/* ============ EDITOR ACORDES ============ */\nconst chordEditor = document.getElementById(\"chordEditor\");\nconst chordEditorSvg = document.getElementById(\"chordEditorSvg\");\nconst chordNameInput = document.getElementById(\"chordName\");\nconst chordStartFretInput = document.getElementById(\"chordStartFret\");\nconst chordFretCountInput = document.getElementById(\"chordFretCount\");\nlet editingChord = null;\nlet editingChordElement = null;\nlet editorMode = \"dots\";\nlet cejillaDrag = null;\n\nfunction newEmptyChord() {\n  return { traste: 1, frets: 5, pos: [[],[],[],[],[],[]], hollowPos: emptyHollowPositions(), cejillas: [] };\n}\n\nfunction chordSvgCellFromEvent(evt) {\n  const pt = svgPoint(evt, chordEditorSvg);\n  const frets = editingChord ? editingChord.frets : 5;\n  const s = Math.max(0, Math.min(ED.strings - 1, Math.round((pt.x - ED.left) / ED.sGap)));\n  const f = Math.max(0, Math.min(frets - 1, Math.floor((pt.y - ED.top) / ED.fGap)));\n  return { s, f, pt };\n}\n\nfunction renderChordEditor() {\n  if (!editingChord) return;\n  const NS = \"http://www.w3.org/2000/svg\";\n  chordEditorSvg.innerHTML = \"\";\n  const a = editingChord;\n  const frets = Math.max(1, Math.min(15, parseInt(a.frets) || 5));\n  const H = chordDiagramHeight(frets);\n  const bottom = ED.top + frets * ED.fGap;\n  chordEditorSvg.setAttribute(\"viewBox\", `0 0 ${ED.W} ${H}`);\n  chordEditorSvg.setAttribute(\"width\", \"270\");\n  chordEditorSvg.setAttribute(\"height\", String(Math.round(H * 2.7)));\n\n  const bg = document.createElementNS(NS, \"rect\");\n  bg.setAttribute(\"x\", 0); bg.setAttribute(\"y\", 0);\n  bg.setAttribute(\"width\", ED.W); bg.setAttribute(\"height\", H);\n  bg.setAttribute(\"fill\", \"#fff\");\n  chordEditorSvg.appendChild(bg);\n\n  const cleanName = chordNameInput.value.trim();\n  if (cleanName) {\n    const name = document.createElementNS(NS, \"text\");\n    name.setAttribute(\"x\", (ED.left + ED.right) / 2); name.setAttribute(\"y\", 15);\n    name.setAttribute(\"text-anchor\", \"middle\");\n    name.setAttribute(\"font-family\", \"monospace\"); name.setAttribute(\"font-weight\", \"bold\");\n    name.setAttribute(\"font-size\", \"14\"); name.setAttribute(\"fill\", \"#000\");\n    name.textContent = cleanName;\n    chordEditorSvg.appendChild(name);\n  }\n\n  for (let i = 0; i < ED.strings; i++) {\n    const l = document.createElementNS(NS, \"line\");\n    const xpos = ED.left + i * ED.sGap;\n    l.setAttribute(\"x1\", xpos); l.setAttribute(\"y1\", ED.top);\n    l.setAttribute(\"x2\", xpos); l.setAttribute(\"y2\", bottom);\n    l.setAttribute(\"stroke\", \"#000\"); l.setAttribute(\"stroke-width\", \"1\");\n    chordEditorSvg.appendChild(l);\n  }\n  for (let i = 0; i <= frets; i++) {\n    const l = document.createElementNS(NS, \"line\");\n    const ypos = ED.top + i * ED.fGap;\n    l.setAttribute(\"x1\", ED.left); l.setAttribute(\"y1\", ypos);\n    l.setAttribute(\"x2\", ED.right); l.setAttribute(\"y2\", ypos);\n    l.setAttribute(\"stroke\", \"#000\");\n    l.setAttribute(\"stroke-width\", i === 0 && a.traste === 1 ? \"3\" : \"1\");\n    chordEditorSvg.appendChild(l);\n  }\n\n  if (a.traste > 1) {\n    const t = document.createElementNS(NS, \"text\");\n    t.setAttribute(\"x\", ED.left - 4); t.setAttribute(\"y\", ED.top + ED.fGap * 0.5);\n    t.setAttribute(\"text-anchor\", \"end\");\n    t.setAttribute(\"dominant-baseline\", \"central\");\n    t.setAttribute(\"font-family\", \"monospace\"); t.setAttribute(\"font-weight\", \"bold\");\n    t.setAttribute(\"font-size\", \"14\"); t.setAttribute(\"fill\", \"#000\");\n    t.textContent = a.traste;\n    chordEditorSvg.appendChild(t);\n  }\n\n  for (let i = 0; i < ED.strings; i++) {\n    const xpos = ED.left + i * ED.sGap;\n    const arr = a.pos[i];\n    if (arr.includes(-1)) {\n      const t = document.createElementNS(NS, \"text\");\n      t.setAttribute(\"x\", xpos); t.setAttribute(\"y\", ED.top - 5);\n      t.setAttribute(\"text-anchor\", \"middle\");\n      t.setAttribute(\"font-family\", \"monospace\"); t.setAttribute(\"font-size\", \"11\"); t.setAttribute(\"fill\", \"#000\");\n      t.textContent = \"X\";\n      chordEditorSvg.appendChild(t);\n    } else if (arr.includes(0)) {\n      const c = document.createElementNS(NS, \"circle\");\n      c.setAttribute(\"cx\", xpos); c.setAttribute(\"cy\", ED.top - 9);\n      c.setAttribute(\"r\", 3.5); c.setAttribute(\"fill\", \"none\");\n      c.setAttribute(\"stroke\", \"#000\"); c.setAttribute(\"stroke-width\", \"1\");\n      chordEditorSvg.appendChild(c);\n    }\n    const drawPosition = (fret, hollow) => {\n      if (fret <= 0) return;\n      const covered = a.cejillas.some(cj => cj.traste === fret && i + 1 >= cj.desde && i + 1 <= cj.hasta);\n      if (covered) return;\n      const fretRel = fret - a.traste;\n      if (fretRel < 0 || fretRel >= frets) return;\n      const cy = ED.top + (fretRel + 0.5) * ED.fGap;\n      const c = document.createElementNS(NS, \"circle\");\n      c.setAttribute(\"cx\", xpos); c.setAttribute(\"cy\", cy);\n      c.setAttribute(\"r\", 5); c.setAttribute(\"fill\", hollow ? \"#fff\" : \"#000\");\n      if (hollow) { c.setAttribute(\"stroke\", \"#000\"); c.setAttribute(\"stroke-width\", \"1.6\"); }\n      chordEditorSvg.appendChild(c);\n    };\n    arr.forEach(fret => drawPosition(fret, false));\n    (a.hollowPos?.[i] || []).forEach(fret => drawPosition(fret, true));\n  }\n\n  for (let i = 0; i < ED.strings; i++) {\n    const xpos = ED.left + i * ED.sGap;\n    const zone = document.createElementNS(NS, \"rect\");\n    zone.setAttribute(\"x\", xpos - ED.sGap / 2); zone.setAttribute(\"y\", 0);\n    zone.setAttribute(\"width\", ED.sGap); zone.setAttribute(\"height\", ED.top);\n    zone.setAttribute(\"fill\", \"transparent\");\n    zone.setAttribute(\"data-top-string\", i);\n    chordEditorSvg.appendChild(zone);\n  }\n  for (let s = 0; s < ED.strings; s++) {\n    for (let f = 0; f < frets; f++) {\n      const rect = document.createElementNS(NS, \"rect\");\n      rect.setAttribute(\"x\", ED.left + s * ED.sGap - ED.sGap / 2);\n      rect.setAttribute(\"y\", ED.top + f * ED.fGap);\n      rect.setAttribute(\"width\", ED.sGap); rect.setAttribute(\"height\", ED.fGap);\n      rect.setAttribute(\"fill\", \"transparent\");\n      rect.setAttribute(\"data-cell-string\", s);\n      rect.setAttribute(\"data-cell-fret\", f);\n      chordEditorSvg.appendChild(rect);\n    }\n  }\n\n  a.cejillas.forEach((cj, idx) => {\n    const trasteRel = cj.traste - a.traste;\n    if (trasteRel < 0 || trasteRel >= frets) return;\n    const yc = ED.top + (trasteRel + 0.5) * ED.fGap;\n    const x1 = ED.left + (cj.desde - 1) * ED.sGap;\n    const x2 = ED.left + (cj.hasta - 1) * ED.sGap;\n    const bar = document.createElementNS(NS, \"rect\");\n    bar.setAttribute(\"x\", Math.min(x1, x2) - 4);\n    bar.setAttribute(\"y\", yc - 5);\n    bar.setAttribute(\"width\", Math.abs(x2 - x1) + 8);\n    bar.setAttribute(\"height\", 10);\n    bar.setAttribute(\"rx\", 5);\n    bar.setAttribute(\"fill\", \"#000\");\n    bar.setAttribute(\"data-cejilla-idx\", String(idx));\n    bar.style.pointerEvents = editorMode === \"cejilla\" ? \"all\" : \"none\";\n    if (editorMode === \"cejilla\") bar.style.cursor = \"pointer\";\n    chordEditorSvg.appendChild(bar);\n  });\n\n  if (cejillaDrag) {\n    const minS = Math.min(cejillaDrag.startString, cejillaDrag.currentString);\n    const maxS = Math.max(cejillaDrag.startString, cejillaDrag.currentString);\n    const yc = ED.top + (cejillaDrag.startFret + 0.5) * ED.fGap;\n    const x1 = ED.left + minS * ED.sGap;\n    const x2 = ED.left + maxS * ED.sGap;\n    const preview = document.createElementNS(NS, \"rect\");\n    preview.setAttribute(\"x\", x1 - 4); preview.setAttribute(\"y\", yc - 5);\n    preview.setAttribute(\"width\", x2 - x1 + 8); preview.setAttribute(\"height\", 10);\n    preview.setAttribute(\"rx\", 5); preview.setAttribute(\"fill\", \"rgba(20,125,104,0.65)\");\n    preview.style.pointerEvents = \"none\";\n    chordEditorSvg.appendChild(preview);\n  }\n}\n\nfunction setEditorMode(mode) {\n  editorMode = mode;\n  document.getElementById(\"modeDots\").classList.toggle(\"mode-active\", mode === \"dots\");\n  document.getElementById(\"modeCejilla\").classList.toggle(\"mode-active\", mode === \"cejilla\");\n  renderChordEditor();\n}\ndocument.getElementById(\"modeDots\").addEventListener(\"click\", () => setEditorMode(\"dots\"));\ndocument.getElementById(\"modeCejilla\").addEventListener(\"click\", () => setEditorMode(\"cejilla\"));\n\nlet editingChordStartBaseline = null;\nfunction captureChordStartBaseline() {\n  if (!editingChord) { editingChordStartBaseline = null; return; }\n  editingChordStartBaseline = {\n    traste: editingChord.traste,\n    pos: editingChord.pos.map(arr => [...arr]),\n    hollowPos: editingChord.hollowPos.map(arr => [...arr]),\n    cejillas: editingChord.cejillas.map(cj => ({ ...cj })),\n  };\n}\n\nchordEditorSvg.addEventListener(\"pointerdown\", (evt) => {\n  if (!editingChord) return;\n  const t = evt.target;\n  if (editorMode === \"cejilla\") {\n    if (t.dataset && t.dataset.cejillaIdx !== undefined) {\n      const idx = parseInt(t.dataset.cejillaIdx);\n      if (!Number.isNaN(idx)) editingChord.cejillas.splice(idx, 1);\n      captureChordStartBaseline();\n      renderChordEditor();\n      return;\n    }\n    const { s, f, pt } = chordSvgCellFromEvent(evt);\n    const bottom = ED.top + editingChord.frets * ED.fGap;\n    if (pt.y >= ED.top && pt.y <= bottom) {\n      cejillaDrag = { startString: s, startFret: f, currentString: s };\n      chordEditorSvg.setPointerCapture(evt.pointerId);\n      renderChordEditor();\n      evt.preventDefault();\n    }\n    return;\n  }\n\n  if (t.dataset && t.dataset.topString !== undefined) {\n    const i = parseInt(t.dataset.topString);\n    const arr = editingChord.pos[i];\n    if (arr.includes(-1)) editingChord.pos[i] = [];\n    else if (arr.includes(0)) editingChord.pos[i] = [-1];\n    else editingChord.pos[i] = [0];\n    captureChordStartBaseline();\n    renderChordEditor();\n    return;\n  }\n\n  if (t.dataset && t.dataset.cellString !== undefined) {\n    const s = parseInt(t.dataset.cellString);\n    const f = parseInt(t.dataset.cellFret);\n    const trasteAbs = editingChord.traste + f;\n    const filled = editingChord.pos[s];\n    const hollow = editingChord.hollowPos[s];\n    const filledIndex = filled.indexOf(trasteAbs);\n    const hollowIndex = hollow.indexOf(trasteAbs);\n    if (filledIndex >= 0) {\n      filled.splice(filledIndex, 1);\n      hollow.push(trasteAbs);\n    } else if (hollowIndex >= 0) {\n      hollow.splice(hollowIndex, 1);\n    } else {\n      filled.push(trasteAbs);\n    }\n    captureChordStartBaseline();\n    renderChordEditor();\n  }\n});\n\nchordEditorSvg.addEventListener(\"pointermove\", (evt) => {\n  if (!cejillaDrag || !editingChord) return;\n  const { s } = chordSvgCellFromEvent(evt);\n  if (s !== cejillaDrag.currentString) {\n    cejillaDrag.currentString = s;\n    renderChordEditor();\n  }\n});\n\nfunction commitCejillaDrag(evt) {\n  if (!cejillaDrag || !editingChord) return;\n  if (evt && evt.pointerId !== undefined && chordEditorSvg.hasPointerCapture?.(evt.pointerId)) {\n    try { chordEditorSvg.releasePointerCapture(evt.pointerId); } catch (e) {}\n  }\n  const { startString, currentString, startFret } = cejillaDrag;\n  if (startString !== currentString) {\n    const desde = Math.min(startString, currentString) + 1;\n    const hasta = Math.max(startString, currentString) + 1;\n    const trasteAbs = editingChord.traste + startFret;\n    const exists = editingChord.cejillas.some(c => c.traste === trasteAbs && c.desde === desde && c.hasta === hasta);\n    if (!exists) editingChord.cejillas.push({ traste: trasteAbs, desde, hasta });\n  }\n  cejillaDrag = null;\n  captureChordStartBaseline();\n  renderChordEditor();\n}\nchordEditorSvg.addEventListener(\"pointerup\", commitCejillaDrag);\nchordEditorSvg.addEventListener(\"pointercancel\", () => { cejillaDrag = null; renderChordEditor(); });\n\nchordStartFretInput.addEventListener(\"focus\", captureChordStartBaseline);\nchordStartFretInput.addEventListener(\"input\", () => {\n  if (!editingChord) return;\n  const raw = chordStartFretInput.value.trim();\n  if (!raw) return;\n  const parsed = parseInt(raw, 10);\n  if (Number.isNaN(parsed)) return;\n  const nextTraste = Math.max(1, Math.min(24, parsed));\n  if (!editingChordStartBaseline) captureChordStartBaseline();\n  const base = editingChordStartBaseline;\n  const delta = nextTraste - base.traste;\n  editingChord.traste = nextTraste;\n  editingChord.pos = base.pos.map(arr => arr.map(p => (p > 0 ? Math.max(1, p + delta) : p)));\n  editingChord.hollowPos = base.hollowPos.map(arr => arr.map(p => (p > 0 ? Math.max(1, p + delta) : p)));\n  editingChord.cejillas = base.cejillas.map(cj => ({ ...cj, traste: Math.max(1, cj.traste + delta) }));\n  renderChordEditor();\n});\nchordStartFretInput.addEventListener(\"blur\", () => {\n  if (!editingChord) return;\n  chordStartFretInput.value = String(editingChord.traste);\n  captureChordStartBaseline();\n});\nchordFretCountInput.addEventListener(\"input\", () => {\n  if (!editingChord) return;\n  const raw = chordFretCountInput.value.trim();\n  if (!raw) return;\n  const parsed = parseInt(raw, 10);\n  if (Number.isNaN(parsed)) return;\n  editingChord.frets = Math.max(1, Math.min(15, parsed));\n  renderChordEditor();\n});\nchordFretCountInput.addEventListener(\"blur\", () => {\n  if (!editingChord) return;\n  chordFretCountInput.value = String(editingChord.frets);\n});\nchordNameInput.addEventListener(\"input\", renderChordEditor);\n\nfunction resetChordEditorControls() {\n  document.getElementById(\"chordEditorInsertNow\").style.display = \"\";\n  document.getElementById(\"chordEditorSave\").textContent = \"Guardar\";\n}\n\nfunction openChordEditorForElement(element) {\n  let model = null;\n  try { model = JSON.parse(element.dataset.chordModel || \"null\"); } catch (error) {}\n  if (!model) {\n    const name = element.querySelector(\"text\")?.textContent || \"\";\n    const libraryChord = CHORD_LIBRARY[name];\n    if (libraryChord) model = { nombre: name, ...libraryChord };\n  }\n  if (!model || !Array.isArray(model.pos)) {\n    showToast(\"Este diagrama no contiene datos editables.\");\n    return;\n  }\n  editingChordElement = element;\n  const normalized = normalizeChordModel(model);\n  editingChord = normalized;\n  captureChordStartBaseline();\n  chordNameInput.value = model.nombre || \"\";\n  chordStartFretInput.value = String(normalized.traste);\n  chordFretCountInput.value = String(normalized.frets);\n  document.getElementById(\"chordEditorInsertNow\").style.display = \"none\";\n  document.getElementById(\"chordEditorSave\").textContent = \"Aplicar cambios\";\n  chordEditor.style.display = \"block\";\n  chordPanel.style.display = \"none\";\n  setEditorMode(\"dots\");\n  chordNameInput.focus();\n  chordNameInput.select();\n}\n\ndocument.getElementById(\"createChord\").addEventListener(\"click\", () => {\n  editingChordElement = null;\n  resetChordEditorControls();\n  editingChord = newEmptyChord();\n  captureChordStartBaseline();\n  chordNameInput.value = \"\";\n  chordStartFretInput.value = \"1\";\n  chordFretCountInput.value = \"5\";\n  chordEditor.style.display = \"block\";\n  chordPanel.style.display = \"none\";\n  setEditorMode(\"dots\");\n  chordNameInput.focus();\n});\ndocument.getElementById(\"chordEditorCancel\").addEventListener(\"click\", () => {\n  chordEditor.style.display = \"none\";\n  editingChord = null;\n  editingChordStartBaseline = null;\n  editingChordElement = null;\n  resetChordEditorControls();\n});\n\nfunction editingChordToData() {\n  return {\n    nombre: (chordNameInput.value || \"\").trim(),\n    traste: editingChord.traste,\n    frets: editingChord.frets,\n    pos: editingChord.pos.map(arr => [...arr]),\n    hollowPos: editingChord.hollowPos.map(arr => [...arr]),\n    cejillas: editingChord.cejillas.map(cj => ({ ...cj })),\n  };\n}\n\ndocument.getElementById(\"chordEditorSave\").addEventListener(\"click\", () => {\n  const data = editingChordToData();\n  if (editingChordElement) {\n    const original = editingChordElement;\n    const position = snapshot(original);\n    const updated = buildChordGroup(\n      data.nombre, data.pos, data.traste, data.cejillas,\n      position.x, position.y, position.size, data.hollowPos, data.frets\n    );\n    history.push({ type: \"replace\", from: original, to: updated });\n    const wasSelected = selectedEl === original;\n    original.replaceWith(updated);\n    ensureOverlayLayers();\n    if (wasSelected) selectElement(updated);\n    editingChordElement = null;\n    editingChord = null;\n    chordEditor.style.display = \"none\";\n    resetChordEditorControls();\n    return;\n  }\n  if (!data.nombre) {\n    showToast(\"Para guardarlo en biblioteca ponle nombre, o usa «Colocar en partitura».\");\n    chordNameInput.focus();\n    return;\n  }\n  saveCustomChord(data.nombre, {\n    traste: data.traste, frets: data.frets, pos: data.pos, hollowPos: data.hollowPos, cejillas: data.cejillas\n  });\n  rebuildChordList();\n  renderCustomChordsManager();\n  chordEditor.style.display = \"none\";\n  editingChord = null;\n  resetChordEditorControls();\n  showToast(`Acorde \"${data.nombre}\" guardado en biblioteca`);\n});\n\ndocument.getElementById(\"chordEditorInsertNow\").addEventListener(\"click\", () => {\n  if (!state.pdfDoc) { showToast(\"Carga primero un PDF.\"); return; }\n  const data = editingChordToData();\n  chordEditor.style.display = \"none\";\n  editingChord = null;\n  setTool(\"select\");\n  setPendingPlacement(\n    () => { pendingCustomChord = data; },\n    \"Haz clic en la partitura donde quieras colocar el acorde (Esc cancela)\"\n  );\n});\n\n/* ============ FINGER / LOOP MODAL ============ */\ndocument.querySelectorAll(\".finger-btn\").forEach(btn => {\n  btn.addEventListener(\"click\", () => {\n    if (!state.pdfDoc) { showToast(\"Carga primero un PDF.\"); return; }\n    const finger = parseInt(btn.dataset.finger);\n    setPendingPlacement(\n      () => { pendingFinger = { finger }; },\n      `Haz clic en la partitura para colocar el dedo ${finger}`\n    );\n  });\n});\n\ndocument.getElementById(\"techSymbolSelect\").addEventListener(\"change\", (e) => {\n  const sym = e.target.value;\n  e.target.value = \"\";\n  if (!sym) return;\n  if (!state.pdfDoc) { showToast(\"Carga primero un PDF.\"); return; }\n  setTool(\"select\");\n  setPendingPlacement(\n    () => { pendingTech = { text: sym }; },\n    `Haz clic en la partitura para colocar \"${sym}\" (Esc cancela)`\n  );\n});\n\nconst loopModal = document.getElementById(\"loopModal\");\nconst loopInput = document.getElementById(\"loopInput\");\nlet editingLoopElement = null;\n\nfunction formatLoopLabel(raw) {\n  let clean = (raw || \"\").trim().toUpperCase();\n  if (!clean) return \"\";\n  if (/^\\d+$/.test(clean)) return \"L\" + clean;\n  return clean;\n}\n\nfunction openLoopModal(loopEl = null) {\n  if (!state.pdfDoc) { showToast(\"Carga primero un PDF.\"); return; }\n  editingLoopElement = loopEl;\n  document.getElementById(\"loopModalTitle\").textContent = loopEl ? \"Editar etiqueta de bucle\" : \"Insertar etiqueta de bucle\";\n  loopInput.value = loopEl ? (loopEl.dataset.text || loopEl.querySelector(\"text\")?.textContent || \"\") : \"\";\n  document.getElementById(\"loopModalHint\").textContent = state.loopTargetUrl\n    ? `Al pulsar esta etiqueta se abrirá: ${state.loopTargetUrl}`\n    : \"No hay URL configurada en Ajustes; se insertará como texto plano.\";\n  loopModal.classList.add(\"open\");\n  setTimeout(() => { loopInput.focus(); loopInput.select(); }, 20);\n}\n\nfunction closeLoopModal() {\n  loopModal.classList.remove(\"open\");\n  editingLoopElement = null;\n}\n\nfunction confirmLoopModal() {\n  const formatted = formatLoopLabel(loopInput.value);\n  if (!formatted) {\n    showToast(\"Escribe un número o texto para el bucle.\");\n    loopInput.focus();\n    return;\n  }\n  if (editingLoopElement) {\n    const orig = editingLoopElement;\n    const snap = snapshot(orig);\n    const updated = buildLoopGroup(formatted, snap.x, snap.y, snap.size);\n    history.push({ type: \"replace\", from: orig, to: updated });\n    const wasSelected = selectedEl === orig;\n    orig.replaceWith(updated);\n    ensureOverlayLayers();\n    if (wasSelected) selectElement(updated);\n    closeLoopModal();\n    return;\n  }\n  closeLoopModal();\n  setPendingPlacement(\n    () => { pendingLoop = { text: formatted }; },\n    `Haz clic en la partitura para colocar \"${formatted}\"`\n  );\n}\n\ndocument.getElementById(\"insertLoop\").addEventListener(\"click\", () => openLoopModal(null));\ndocument.getElementById(\"loopModalClose\").addEventListener(\"click\", closeLoopModal);\ndocument.getElementById(\"loopModalCancel\").addEventListener(\"click\", closeLoopModal);\ndocument.getElementById(\"loopModalConfirm\").addEventListener(\"click\", confirmLoopModal);\nloopInput.addEventListener(\"keydown\", (e) => {\n  if (e.key === \"Enter\") { e.preventDefault(); confirmLoopModal(); }\n  else if (e.key === \"Escape\") { e.preventDefault(); closeLoopModal(); }\n  e.stopPropagation();\n});\n\n/* ============ SELECCIÓN Y MANIPULACIÓN ============ */\nlet selectedEl = null, selectedInfo = null, dragState = null, lastSelectPress = null;\n\nfunction getBBox(el) {\n  try {\n    const box = el.getBBox();\n    const elementToScreen = el.getScreenCTM();\n    const screenToOverlay = overlay.getScreenCTM()?.inverse();\n    if (!elementToScreen || !screenToOverlay) return { x: 0, y: 0, width: 0, height: 0 };\n    const corners = [\n      [box.x, box.y],\n      [box.x + box.width, box.y],\n      [box.x, box.y + box.height],\n      [box.x + box.width, box.y + box.height],\n    ].map(([x, y]) => {\n      const point = overlay.createSVGPoint();\n      point.x = x; point.y = y;\n      return point.matrixTransform(elementToScreen).matrixTransform(screenToOverlay);\n    });\n    const xs = corners.map(point => point.x);\n    const ys = corners.map(point => point.y);\n    const minX = Math.min(...xs), maxX = Math.max(...xs);\n    const minY = Math.min(...ys), maxY = Math.max(...ys);\n    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };\n  } catch (error) { return { x: 0, y: 0, width: 0, height: 0 }; }\n}\n\nfunction isScalableGroup(el) {\n  return el.classList && (el.classList.contains(\"chord-diagram\") || el.classList.contains(\"finger-marker\") || el.classList.contains(\"loop-label\"));\n}\nfunction isBlock(el) { return el.classList && el.classList.contains(\"block-rect\"); }\nfunction supportsResize(el) {\n  return isScalableGroup(el) || el.tagName === \"text\" || (el.tagName === \"rect\" && el.dataset.resizable === \"1\");\n}\n\nfunction updateSelectionActions() {\n  document.getElementById(\"duplicateSelected\").disabled = !selectedEl;\n  document.getElementById(\"deleteSelected\").disabled = !selectedEl;\n  document.getElementById(\"editSelected\").disabled = !selectedEl || !(\n    selectedEl.tagName === \"text\" ||\n    selectedEl.classList?.contains(\"chord-diagram\") ||\n    selectedEl.classList?.contains(\"loop-label\")\n  );\n  const openLinkBtn = document.getElementById(\"openLoopLinkBtn\");\n  const showLoopLink = Boolean(selectedEl && selectedEl.classList?.contains(\"loop-label\") && state.loopTargetUrl);\n  openLinkBtn.style.display = showLoopLink ? \"inline-flex\" : \"none\";\n}\n\nfunction clearSelection() {\n  if (selectedInfo) {\n    selectedInfo.rect.remove();\n    if (selectedInfo.handle) selectedInfo.handle.remove();\n  }\n  selectedEl = null; selectedInfo = null;\n  lastSelectPress = null;\n  updateSelectionActions();\n}\n\nfunction selectElement(el) {\n  clearSelection();\n  selectedEl = el;\n  updateSelectionActions();\n  const b = getBBox(el);\n  const NS = \"http://www.w3.org/2000/svg\";\n  const rect = document.createElementNS(NS, \"rect\");\n  rect.setAttribute(\"class\", \"sel-rect\");\n  rect.setAttribute(\"x\", b.x - 2); rect.setAttribute(\"y\", b.y - 2);\n  rect.setAttribute(\"width\", b.width + 4); rect.setAttribute(\"height\", b.height + 4);\n  overlay.appendChild(rect);\n  let handle = null;\n  if (supportsResize(el)) {\n    handle = document.createElementNS(NS, \"circle\");\n    handle.setAttribute(\"class\", \"sel-handle\");\n    handle.setAttribute(\"cx\", b.x + b.width);\n    handle.setAttribute(\"cy\", b.y + b.height);\n    handle.setAttribute(\"r\", 7);\n    overlay.appendChild(handle);\n  }\n  selectedInfo = { rect, handle };\n}\n\nfunction refreshSelectionBox() {\n  if (!selectedEl || !selectedInfo) return;\n  const b = getBBox(selectedEl);\n  selectedInfo.rect.setAttribute(\"x\", b.x - 2); selectedInfo.rect.setAttribute(\"y\", b.y - 2);\n  selectedInfo.rect.setAttribute(\"width\", b.width + 4); selectedInfo.rect.setAttribute(\"height\", b.height + 4);\n  if (selectedInfo.handle) {\n    selectedInfo.handle.setAttribute(\"cx\", b.x + b.width);\n    selectedInfo.handle.setAttribute(\"cy\", b.y + b.height);\n  }\n}\n\nfunction isHole(el) { return el.classList && el.classList.contains(\"block-hole\"); }\nfunction snapshot(el) {\n  if (isScalableGroup(el)) {\n    return {\n      kind: el.classList.contains(\"chord-diagram\") ? \"chord\"\n           : el.classList.contains(\"finger-marker\") ? \"finger\" : \"loop\",\n      x: parseFloat(el.dataset.x), y: parseFloat(el.dataset.y),\n      size: parseFloat(el.dataset.size),\n    };\n  }\n  if (isBlock(el)) return { kind: \"block\", x: parseFloat(el.dataset.x), y: parseFloat(el.dataset.y) };\n  if (isHole(el)) return {\n    kind: \"hole\",\n    x: parseFloat(el.getAttribute(\"x\")), y: parseFloat(el.getAttribute(\"y\")),\n    w: parseFloat(el.getAttribute(\"width\")), h: parseFloat(el.getAttribute(\"height\")),\n  };\n  if (el.tagName === \"text\") return { kind: \"text\", x: parseFloat(el.getAttribute(\"x\")), y: parseFloat(el.getAttribute(\"y\")), size: parseFloat(el.getAttribute(\"font-size\")) };\n  if (el.tagName === \"line\") return {\n    kind: \"line\",\n    x1: parseFloat(el.getAttribute(\"x1\")), y1: parseFloat(el.getAttribute(\"y1\")),\n    x2: parseFloat(el.getAttribute(\"x2\")), y2: parseFloat(el.getAttribute(\"y2\")),\n  };\n  if (el.tagName === \"rect\") return {\n    kind: \"rect\",\n    x: parseFloat(el.getAttribute(\"x\")), y: parseFloat(el.getAttribute(\"y\")),\n    w: parseFloat(el.getAttribute(\"width\")), h: parseFloat(el.getAttribute(\"height\")),\n  };\n  return null;\n}\n\nfunction removeElementWithHistory(root) {\n  if (!root) return;\n  const pairId = root.dataset.blockPair;\n  const patch = pairId && root.classList.contains(\"block-rect\")\n    ? Array.from(overlay.querySelectorAll(\".block-hole\")).find(el => el.dataset.blockPair === pairId)\n    : null;\n  const elements = patch ? [patch, root] : [root];\n  history.push({ type: \"remove\", elements, next: root.nextSibling });\n  if (elements.includes(selectedEl)) clearSelection();\n  elements.forEach(el => el.remove());\n}\n\nfunction duplicateSelected() {\n  if (!selectedEl) return;\n  if (activeInlineEditor) finishInlineTextEdit(true);\n  const original = snapshot(selectedEl);\n  if (!original) return;\n  const clone = selectedEl.cloneNode(true);\n  const offset = 24;\n  const copy = { ...original };\n  if ([\"chord\",\"finger\",\"loop\",\"text\",\"rect\",\"block\"].includes(copy.kind)) { copy.x += offset; copy.y += offset; }\n  else if (copy.kind === \"line\") { copy.x1 += offset; copy.x2 += offset; copy.y1 += offset; copy.y2 += offset; }\n  if (copy.kind === \"block\") clone.dataset.blockPair = `copy-${Date.now()}-${Math.random().toString(36).slice(2)}`;\n  applySnapshot(clone, copy);\n  overlay.appendChild(clone);\n  ensureOverlayLayers();\n  history.push({ type: \"add\", el: clone });\n  setTool(\"select\");\n  selectElement(clone);\n}\ndocument.getElementById(\"duplicateSelected\").addEventListener(\"click\", duplicateSelected);\ndocument.getElementById(\"deleteSelected\").addEventListener(\"click\", () => { if (selectedEl) removeElementWithHistory(selectedEl); });\ndocument.getElementById(\"openLoopLinkBtn\").addEventListener(\"click\", () => { if (state.loopTargetUrl) openExternalUrl(state.loopTargetUrl); });\n\nfunction applyMove(p) {\n  if (!dragState || dragState.type !== \"move\") return;\n  const dx = p.x - dragState.startX, dy = p.y - dragState.startY;\n  const el = dragState.el, o = dragState.orig;\n  if (o.kind === \"chord\" || o.kind === \"finger\" || o.kind === \"loop\") {\n    el.dataset.x = o.x + dx; el.dataset.y = o.y + dy;\n    el.setAttribute(\"transform\", `translate(${o.x+dx},${o.y+dy}) scale(${o.size/100})`);\n  } else if (o.kind === \"block\") {\n    el.dataset.x = o.x + dx; el.dataset.y = o.y + dy;\n    el.setAttribute(\"transform\", `translate(${o.x+dx},${o.y+dy})`);\n  } else if (o.kind === \"text\") {\n    el.setAttribute(\"x\", o.x + dx); el.setAttribute(\"y\", o.y + dy);\n  } else if (o.kind === \"line\") {\n    el.setAttribute(\"x1\", o.x1 + dx); el.setAttribute(\"y1\", o.y1 + dy);\n    el.setAttribute(\"x2\", o.x2 + dx); el.setAttribute(\"y2\", o.y2 + dy);\n  } else if (o.kind === \"rect\") {\n    el.setAttribute(\"x\", o.x + dx); el.setAttribute(\"y\", o.y + dy);\n  }\n  refreshSelectionBox();\n}\nfunction finishMove() {\n  if (!dragState || dragState.type !== \"move\") return;\n  const el = dragState.el;\n  const from = dragState.orig, to = snapshot(el);\n  if (JSON.stringify(from) !== JSON.stringify(to)) {\n    history.push({ type: \"move\", el, from, to });\n    lastSelectPress = null;\n  }\n  dragState = null;\n}\nfunction startMove(el, p) { const s = snapshot(el); if (s) dragState = { el, startX: p.x, startY: p.y, orig: s, type: \"move\" }; }\nfunction startResize(el, p) { const s = snapshot(el); if (s) dragState = { el, startX: p.x, startY: p.y, orig: s, type: \"resize\" }; }\nfunction applyResize(p) {\n  if (!dragState || dragState.type !== \"resize\") return;\n  const dx = p.x - dragState.startX, dy = p.y - dragState.startY;\n  const el = dragState.el, o = dragState.orig;\n  if (o.kind === \"chord\" || o.kind === \"finger\" || o.kind === \"loop\") {\n    const newSize = Math.max(20, o.size + (dx + dy) / 2 * 1.2);\n    el.dataset.size = newSize;\n    el.setAttribute(\"transform\", `translate(${o.x},${o.y}) scale(${newSize/100})`);\n  } else if (o.kind === \"text\") {\n    const newSize = Math.max(6, o.size + (dx + dy) / 2 * 0.6);\n    el.setAttribute(\"font-size\", newSize);\n    el.dataset.size = newSize;\n  } else if (o.kind === \"rect\") {\n    el.setAttribute(\"width\", Math.max(2, o.w + dx));\n    el.setAttribute(\"height\", Math.max(2, o.h + dy));\n  }\n  refreshSelectionBox();\n}\nfunction finishResize() {\n  if (!dragState || dragState.type !== \"resize\") return;\n  const el = dragState.el;\n  const from = dragState.orig, to = snapshot(el);\n  if (JSON.stringify(from) !== JSON.stringify(to)) {\n    history.push({ type: \"resize\", el, from, to });\n    if (to && [\"chord\",\"finger\",\"loop\",\"text\"].includes(to.kind)) {\n      const map = { chord: \"chordSize\", finger: \"fingerSize\", loop: \"loopSize\", text: \"fontSize\" };\n      const pref = document.getElementById(map[to.kind]);\n      if (pref) { pref.value = Math.round(to.size); savePrefs(); }\n    }\n  }\n  dragState = null;\n}\n\n/* ============ EDICIÓN DE TEXTO INLINE ============ */\nfunction finishInlineTextEdit(commit) {\n  const editor = activeInlineEditor;\n  if (!editor) return;\n  activeInlineEditor = null;\n  const value = editor.input.value;\n  editor.host.remove();\n  if (editor.isNew) {\n    if (commit && value.trim()) {\n      editor.textEl.textContent = value;\n      ensureOverlayLayers();\n      history.push({ type: \"add\", el: editor.textEl });\n    } else {\n      if (selectedEl === editor.textEl) clearSelection();\n      editor.textEl.remove();\n    }\n  } else if (commit && value !== editor.original) {\n    history.push({ type: \"text-edit\", el: editor.textEl, from: editor.original, to: value });\n    editor.textEl.textContent = value;\n  }\n  if (selectedEl === editor.textEl) refreshSelectionBox();\n}\n\nfunction beginInlineTextEdit(textEl, isNew = false) {\n  if (activeInlineEditor) finishInlineTextEdit(true);\n  if (isNew) setTool(\"select\");\n  selectElement(textEl);\n  const NS = \"http://www.w3.org/2000/svg\";\n  const XHTML = \"http://www.w3.org/1999/xhtml\";\n  const x = parseFloat(textEl.getAttribute(\"x\")) || 0;\n  const y = parseFloat(textEl.getAttribute(\"y\")) || 0;\n  const fontSize = parseFloat(textEl.getAttribute(\"font-size\")) || 18;\n  const box = textEl.getBBox();\n  const host = document.createElementNS(NS, \"foreignObject\");\n  host.setAttribute(\"class\", \"inline-editor-host\");\n  host.setAttribute(\"x\", x);\n  host.setAttribute(\"y\", y - fontSize * 1.18);\n  host.setAttribute(\"width\", Math.max(150, box.width + 48));\n  host.setAttribute(\"height\", Math.max(28, fontSize * 1.7));\n  const input = document.createElementNS(XHTML, \"input\");\n  input.setAttribute(\"class\", \"inline-text-editor\");\n  input.setAttribute(\"type\", \"text\");\n  input.setAttribute(\"aria-label\", \"Editar texto de la partitura\");\n  input.value = textEl.textContent;\n  input.placeholder = isNew ? \"Escribe aquí\" : \"\";\n  input.style.fontSize = `${fontSize}px`;\n  host.appendChild(input);\n  overlay.appendChild(host);\n  activeInlineEditor = { host, input, textEl, original: textEl.textContent, isNew };\n  input.addEventListener(\"keydown\", (event) => {\n    if (event.key === \"Escape\") { event.preventDefault(); finishInlineTextEdit(false); return; }\n    if (event.key === \"Enter\") {\n      if (event.isComposing || event.keyCode === 229) return;\n      event.preventDefault();\n      finishInlineTextEdit(true);\n    }\n    event.stopPropagation();\n  });\n  input.addEventListener(\"blur\", () => { if (activeInlineEditor?.input === input) finishInlineTextEdit(true); });\n  input.focus();\n  input.select();\n}\n\nfunction editElementInPlace(element) {\n  if (!element) return;\n  if (element.tagName === \"text\") beginInlineTextEdit(element);\n  else if (element.classList?.contains(\"chord-diagram\")) openChordEditorForElement(element);\n  else if (element.classList?.contains(\"loop-label\")) openLoopModal(element);\n}\nfunction editSelectedElement() { editElementInPlace(selectedEl); }\ndocument.getElementById(\"editSelected\").addEventListener(\"click\", editSelectedElement);\n\n/* ============ CREAR BLOQUE CORTAR Y MOVER ============ */\nfunction finalizeBlock(x, y, w, h) {\n  const sx = Math.max(0, Math.floor(x));\n  const sy = Math.max(0, Math.floor(y));\n  const ex = Math.min(bgCanvas.width, Math.ceil(x + w));\n  const ey = Math.min(bgCanvas.height, Math.ceil(y + h));\n  const sw = ex - sx, sh = ey - sy;\n  if (sw < 8 || sh < 8) return;\n\n  const tmp = document.createElement(\"canvas\");\n  tmp.width = sw; tmp.height = sh;\n  const tctx = tmp.getContext(\"2d\");\n  if (!tctx) return;\n  tctx.drawImage(bgCanvas, sx, sy, sw, sh, 0, 0, sw, sh);\n  const dataUrl = tmp.toDataURL(\"image/png\");\n  const pairId = `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;\n  const patch = document.createElementNS(\"http://www.w3.org/2000/svg\", \"rect\");\n  patch.setAttribute(\"class\", \"block-hole\");\n  patch.setAttribute(\"x\", sx); patch.setAttribute(\"y\", sy);\n  patch.setAttribute(\"width\", sw); patch.setAttribute(\"height\", sh);\n  patch.setAttribute(\"fill\", document.getElementById(\"patchColor\").value);\n  patch.setAttribute(\"pointer-events\", \"none\");\n  patch.dataset.blockPair = pairId;\n  const g = buildBlockGroup(dataUrl, sx, sy, sw, sh, pairId);\n  overlay.append(patch, g);\n  ensureOverlayLayers();\n  history.push({ type: \"add\", elements: [patch, g] });\n  setTool(\"select\");\n  selectElement(g);\n}\n\n/* ============ LISTENERS OVERLAY ============ */\noverlay.addEventListener(\"pointerdown\", (evt) => {\n  if (activeInlineEditor?.host.contains(evt.target)) { evt.stopPropagation(); return; }\n  if (!state.pdfDoc) return;\n\n  if (state.mode === \"practice\") {\n    const root = resolveRoot(evt.target);\n    if (root && root.classList?.contains(\"loop-label\") && state.loopTargetUrl) {\n      openExternalUrl(state.loopTargetUrl);\n      evt.preventDefault(); evt.stopPropagation();\n    }\n    return;\n  }\n\n  const p = svgPoint(evt);\n\n  if (pendingFinger) {\n    const size = parseFloat(document.getElementById(\"fingerSize\").value) || 40;\n    const g = buildFingerGroup(pendingFinger.finger, p.x - size / 2, p.y - size / 2, size);\n    overlay.appendChild(g); ensureOverlayLayers(); history.push({ type: \"add\", el: g });\n    clearPendingPlacement(); setTool(\"select\"); selectElement(g);\n    evt.preventDefault(); evt.stopPropagation(); return;\n  }\n  if (pendingLoop) {\n    const size = parseFloat(document.getElementById(\"loopSize\").value) || 60;\n    const g = buildLoopGroup(pendingLoop.text, p.x - size / 2, p.y - (size * 0.6) / 2, size);\n    overlay.appendChild(g); ensureOverlayLayers(); history.push({ type: \"add\", el: g });\n    clearPendingPlacement(); setTool(\"select\"); selectElement(g);\n    evt.preventDefault(); evt.stopPropagation(); return;\n  }\n  if (pendingChord) {\n    const size = parseFloat(document.getElementById(\"chordSize\").value) || 120;\n    const a = CHORD_LIBRARY[pendingChord];\n    const g = buildChordGroup(pendingChord, a.pos, a.traste, a.cejillas, p.x, p.y, size, a.hollowPos, a.frets || 5);\n    overlay.appendChild(g); ensureOverlayLayers(); history.push({ type: \"add\", el: g });\n    clearPendingPlacement(); setTool(\"select\"); selectElement(g);\n    evt.preventDefault(); evt.stopPropagation(); return;\n  }\n  if (pendingCustomChord) {\n    const size = parseFloat(document.getElementById(\"chordSize\").value) || 120;\n    const data = pendingCustomChord;\n    const g = buildChordGroup(data.nombre, data.pos, data.traste, data.cejillas, p.x, p.y, size, data.hollowPos, data.frets);\n    overlay.appendChild(g); ensureOverlayLayers(); history.push({ type: \"add\", el: g });\n    clearPendingPlacement(); setTool(\"select\"); selectElement(g);\n    evt.preventDefault(); evt.stopPropagation(); return;\n  }\n  if (pendingTech) {\n    const fs = parseFloat(document.getElementById(\"fontSize\").value) || 18;\n    const t = document.createElementNS(\"http://www.w3.org/2000/svg\", \"text\");\n    t.setAttribute(\"x\", p.x); t.setAttribute(\"y\", p.y);\n    t.setAttribute(\"font-size\", fs);\n    t.setAttribute(\"data-size\", fs);\n    t.setAttribute(\"font-family\", \"sans-serif\");\n    t.setAttribute(\"font-weight\", \"bold\");\n    t.setAttribute(\"fill\", document.getElementById(\"lineColor\").value);\n    t.textContent = pendingTech.text;\n    overlay.appendChild(t); ensureOverlayLayers(); history.push({ type: \"add\", el: t });\n    clearPendingPlacement(); setTool(\"select\"); selectElement(t);\n    evt.preventDefault(); evt.stopPropagation(); return;\n  }\n\n  if (state.tool === \"select\") {\n    const target = evt.target;\n    if (selectedInfo && selectedInfo.handle && target === selectedInfo.handle) {\n      startResize(selectedEl, p);\n      overlay.setPointerCapture(evt.pointerId);\n      evt.preventDefault(); evt.stopPropagation(); return;\n    }\n    if (selectedEl && selectedInfo && target === selectedInfo.rect) {\n      startMove(selectedEl, p);\n      overlay.setPointerCapture(evt.pointerId);\n      evt.preventDefault(); evt.stopPropagation(); return;\n    }\n    const root = resolveRoot(target);\n    if (root) {\n      if ((evt.ctrlKey || evt.metaKey) && root.classList?.contains(\"loop-label\") && state.loopTargetUrl) {\n        openExternalUrl(state.loopTargetUrl);\n        evt.preventDefault(); evt.stopPropagation(); return;\n      }\n      const previous = lastSelectPress;\n      const isDoublePress = previous && previous.el === root &&\n        performance.now() - previous.time <= 650 &&\n        Math.hypot(evt.clientX - previous.x, evt.clientY - previous.y) <= 10;\n      if (isDoublePress) {\n        lastSelectPress = null;\n        editElementInPlace(root);\n        evt.preventDefault(); evt.stopPropagation(); return;\n      }\n      if (root === selectedEl) startMove(root, p);\n      else { selectElement(root); startMove(root, p); }\n      lastSelectPress = { el: root, time: performance.now(), x: evt.clientX, y: evt.clientY };\n      overlay.setPointerCapture(evt.pointerId);\n      evt.preventDefault(); evt.stopPropagation(); return;\n    }\n    clearSelection();\n    evt.stopPropagation(); return;\n  }\n\n  if (state.tool === \"erase\") {\n    removeElementWithHistory(resolveRoot(evt.target));\n    evt.stopPropagation(); return;\n  }\n  if (state.tool === \"text\") {\n    const size = parseFloat(document.getElementById(\"fontSize\").value) || 18;\n    const t = document.createElementNS(\"http://www.w3.org/2000/svg\", \"text\");\n    t.setAttribute(\"x\", p.x); t.setAttribute(\"y\", p.y);\n    t.setAttribute(\"font-size\", size); t.dataset.size = size;\n    t.setAttribute(\"font-family\", \"monospace\");\n    t.setAttribute(\"fill\", document.getElementById(\"lineColor\").value);\n    t.textContent = \"\";\n    overlay.appendChild(t);\n    ensureOverlayLayers();\n    beginInlineTextEdit(t, true);\n    evt.preventDefault(); evt.stopPropagation(); return;\n  }\n  if (state.tool === \"patch\") {\n    const r = document.createElementNS(\"http://www.w3.org/2000/svg\", \"rect\");\n    r.setAttribute(\"x\", p.x); r.setAttribute(\"y\", p.y);\n    r.setAttribute(\"width\", 0); r.setAttribute(\"height\", 0);\n    r.setAttribute(\"fill\", document.getElementById(\"patchColor\").value);\n    r.dataset.resizable = \"1\";\n    overlay.appendChild(r);\n    ensureOverlayLayers();\n    drawing = { type: \"patch\", startX: p.x, startY: p.y, el: r };\n    overlay.setPointerCapture(evt.pointerId);\n    evt.stopPropagation(); return;\n  }\n  if (state.tool === \"line\") {\n    const l = document.createElementNS(\"http://www.w3.org/2000/svg\", \"line\");\n    l.setAttribute(\"x1\", p.x); l.setAttribute(\"y1\", p.y);\n    l.setAttribute(\"x2\", p.x); l.setAttribute(\"y2\", p.y);\n    l.setAttribute(\"stroke\", document.getElementById(\"lineColor\").value);\n    l.setAttribute(\"stroke-width\", document.getElementById(\"lineWidth\").value);\n    l.setAttribute(\"stroke-linecap\", \"round\");\n    overlay.appendChild(l);\n    ensureOverlayLayers();\n    drawing = { type: \"line\", startX: p.x, startY: p.y, el: l };\n    overlay.setPointerCapture(evt.pointerId);\n    evt.stopPropagation(); return;\n  }\n  if (state.tool === \"block\") {\n    const r = document.createElementNS(\"http://www.w3.org/2000/svg\", \"rect\");\n    r.setAttribute(\"x\", p.x); r.setAttribute(\"y\", p.y);\n    r.setAttribute(\"width\", 0); r.setAttribute(\"height\", 0);\n    r.setAttribute(\"class\", \"block-selection\");\n    overlay.appendChild(r);\n    drawing = { type: \"block\", startX: p.x, startY: p.y, el: r };\n    overlay.setPointerCapture(evt.pointerId);\n    evt.stopPropagation(); return;\n  }\n  if (state.tool === \"addspace\") {\n    const NS = \"http://www.w3.org/2000/svg\";\n    const vw = overlay.viewBox.baseVal.width || bgCanvas.width || 1000;\n    const g = document.createElementNS(NS, \"g\");\n    const band = document.createElementNS(NS, \"rect\");\n    band.setAttribute(\"x\", 0); band.setAttribute(\"y\", p.y);\n    band.setAttribute(\"width\", vw); band.setAttribute(\"height\", 0);\n    band.setAttribute(\"class\", \"space-cut-band\");\n    const ln = document.createElementNS(NS, \"line\");\n    ln.setAttribute(\"x1\", 0); ln.setAttribute(\"y1\", p.y);\n    ln.setAttribute(\"x2\", vw); ln.setAttribute(\"y2\", p.y);\n    ln.setAttribute(\"class\", \"space-cut-line\");\n    const lblBg = document.createElementNS(NS, \"rect\");\n    lblBg.setAttribute(\"x\", Math.max(12, Math.min(vw - 170, p.x - 60)));\n    lblBg.setAttribute(\"y\", p.y + 6);\n    lblBg.setAttribute(\"width\", 140); lblBg.setAttribute(\"height\", 24);\n    lblBg.setAttribute(\"class\", \"space-cut-label-bg\");\n    const lbl = document.createElementNS(NS, \"text\");\n    lbl.setAttribute(\"x\", Math.max(12, Math.min(vw - 170, p.x - 60)) + 70);\n    lbl.setAttribute(\"y\", p.y + 22);\n    lbl.setAttribute(\"text-anchor\", \"middle\");\n    lbl.setAttribute(\"class\", \"space-cut-label-text\");\n    lbl.textContent = \"Arrastra ↓\";\n    g.append(band, ln, lblBg, lbl);\n    overlay.appendChild(g);\n    drawing = { type: \"addspace\", startY: p.y, deltaY: 0, el: g, band, lblBg, lbl };\n    overlay.setPointerCapture(evt.pointerId);\n    evt.stopPropagation(); return;\n  }\n}, true);\n\nfunction applySpaceCut(cutY, deltaY) {\n  const delta = Math.round(deltaY);\n  const cy = Math.round(cutY);\n  if (delta < 12) return;\n  const pNum = state.page;\n  if (!state.pageSpaceCuts[pNum]) state.pageSpaceCuts[pNum] = [];\n  const cut = { id: `cut-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, y: cy, delta };\n  state.pageSpaceCuts[pNum].push(cut);\n\n  const shiftedEls = [];\n  Array.from(overlay.children).forEach(el => {\n    if (el.classList?.contains(\"sel-rect\") || el.classList?.contains(\"sel-handle\") || el.classList?.contains(\"inline-editor-host\")) return;\n    const from = snapshot(el);\n    if (!from) return;\n    const to = { ...from };\n    let changed = false;\n    if ([\"chord\", \"finger\", \"loop\", \"text\", \"rect\", \"block\", \"hole\"].includes(to.kind)) {\n      const refY = to.kind === \"text\" ? to.y - (to.size || 14) * 0.8 : to.y;\n      if (refY >= cy) { to.y += delta; changed = true; }\n    } else if (to.kind === \"line\") {\n      if (to.y1 >= cy) { to.y1 += delta; changed = true; }\n      if (to.y2 >= cy) { to.y2 += delta; changed = true; }\n    }\n    if (changed) {\n      applySnapshot(el, to);\n      shiftedEls.push({ el, from, to });\n    }\n  });\n\n  const shiftedSystems = [];\n  getPageSystems(pNum).forEach(sys => {\n    if (sys.y >= cy) {\n      const fromY = sys.y;\n      sys.y = sys.y + delta;\n      shiftedSystems.push({ sys, fromY, toY: sys.y });\n    }\n  });\n\n  history.push({ type: \"space-cut\", page: pNum, cut, shiftedEls, shiftedSystems });\n  if (selectedEl) refreshSelectionBox();\n  renderPage(pNum, { preserveOverlay: true });\n  showToast(`Espacio añadido (+${delta} px)`);\n}\n\noverlay.addEventListener(\"pointermove\", (evt) => {\n  if (lastSelectPress && Math.hypot(evt.clientX - lastSelectPress.x, evt.clientY - lastSelectPress.y) > 10) {\n    lastSelectPress = null;\n  }\n  if (dragState) {\n    const p = svgPoint(evt);\n    if (dragState.type === \"move\") applyMove(p);\n    else applyResize(p);\n    evt.preventDefault(); return;\n  }\n  if (!drawing) return;\n  const p = svgPoint(evt);\n  if (drawing.type === \"patch\") {\n    const x = Math.min(drawing.startX, p.x), y = Math.min(drawing.startY, p.y);\n    const w = Math.abs(p.x - drawing.startX), h = Math.abs(p.y - drawing.startY);\n    drawing.el.setAttribute(\"x\", x); drawing.el.setAttribute(\"y\", y);\n    drawing.el.setAttribute(\"width\", w); drawing.el.setAttribute(\"height\", h);\n  } else if (drawing.type === \"line\") {\n    drawing.el.setAttribute(\"x2\", p.x); drawing.el.setAttribute(\"y2\", p.y);\n  } else if (drawing.type === \"block\") {\n    const x = Math.min(drawing.startX, p.x), y = Math.min(drawing.startY, p.y);\n    const w = Math.abs(p.x - drawing.startX), h = Math.abs(p.y - drawing.startY);\n    drawing.el.setAttribute(\"x\", x); drawing.el.setAttribute(\"y\", y);\n    drawing.el.setAttribute(\"width\", w); drawing.el.setAttribute(\"height\", h);\n  } else if (drawing.type === \"addspace\") {\n    const dy = Math.max(0, Math.round(p.y - drawing.startY));\n    drawing.deltaY = dy;\n    drawing.band.setAttribute(\"height\", dy);\n    drawing.lblBg.setAttribute(\"y\", drawing.startY + dy + 6);\n    drawing.lbl.setAttribute(\"y\", drawing.startY + dy + 22);\n    drawing.lbl.textContent = `+${dy} px`;\n  }\n}, true);\n\noverlay.addEventListener(\"pointerup\", () => {\n  if (dragState) {\n    if (dragState.type === \"move\") finishMove();\n    else if (dragState.type === \"resize\") finishResize();\n    return;\n  }\n  if (!drawing) return;\n  if (drawing.type === \"block\") {\n    const r = drawing.el;\n    const bbox = {\n      x: parseFloat(r.getAttribute(\"x\")), y: parseFloat(r.getAttribute(\"y\")),\n      w: parseFloat(r.getAttribute(\"width\")), h: parseFloat(r.getAttribute(\"height\")),\n    };\n    r.remove();\n    drawing = null;\n    finalizeBlock(bbox.x, bbox.y, bbox.w, bbox.h);\n    return;\n  }\n  if (drawing.type === \"addspace\") {\n    const cutY = drawing.startY;\n    const deltaY = drawing.deltaY;\n    drawing.el.remove();\n    drawing = null;\n    if (deltaY >= 12) applySpaceCut(cutY, deltaY);\n    else showToast(\"Haz clic y arrastra hacia abajo para abrir espacio.\");\n    return;\n  }\n  history.push({ type: \"add\", el: drawing.el });\n  const el = drawing.el;\n  drawing = null;\n  ensureOverlayLayers();\n  selectElement(el);\n}, true);\n\noverlay.addEventListener(\"pointercancel\", () => {\n  if (dragState) {\n    applySnapshot(dragState.el, dragState.orig);\n    dragState = null;\n    refreshSelectionBox();\n  }\n  if (drawing) { drawing.el.remove(); drawing = null; }\n}, true);\n\n/* ============ MODO PRACTICAR: v11.0 (BUCLE DE ESTUDIO, PULSO COMPLETO, REINICIO LIMPIO Y MÓVIL) ============ */\nlet practiceCalibrating = false;\nlet selectedSystemIdx = -1;\nlet selectedMeasureIdx = -1;\nlet sysDrag = null;\nlet audioCtx = null;\n\nconst playback = {\n  running: false,\n  advancing: false,\n  waitingForPedal: false,\n  finishStopPending: null,\n  timerId: null,\n  cursor: 0,\n  beatIdx: 0,\n  loopLap: 1,\n  countInRemaining: 0,\n  countInBar: 1,\n  countInBeat: 0,\n  timeline: [],\n  plan: [],\n};\n\nfunction getTimeSigBeats(sig) {\n  if (sig === \"3/4\") return 3;\n  if (sig === \"2/4\") return 2;\n  if (sig === \"6/8\") return 6;\n  return 4;\n}\n\nfunction getPageSystemsObj(pageNum) {\n  if (!state.practice.pages[pageNum] || typeof state.practice.pages[pageNum] !== \"object\") {\n    state.practice.pages[pageNum] = { systems: [], manualOrder: false };\n  }\n  if (!Array.isArray(state.practice.pages[pageNum].systems)) {\n    state.practice.pages[pageNum].systems = [];\n  }\n  state.practice.pages[pageNum].systems.forEach((sys, i) => {\n    if (sys && !sys.id) sys.id = `sys-${pageNum}-${i}`;\n  });\n  return state.practice.pages[pageNum];\n}\n\nfunction getPageSystems(pageNum) {\n  return getPageSystemsObj(pageNum).systems;\n}\n\n// Ordenación 2D estable: agrupa sistemas/compases que comparten fila visual y ordena izquierda->derecha\nfunction sortSystemsReadingOrder(systemsList) {\n  const arr = [...systemsList];\n  if (arr.length <= 1) return arr;\n  arr.sort((a, b) => (a.y + a.h * 0.5) - (b.y + b.h * 0.5));\n  const rows = [];\n  for (const sys of arr) {\n    const cy = sys.y + sys.h * 0.5;\n    const lastRow = rows[rows.length - 1];\n    if (lastRow) {\n      const tol = Math.max(22, Math.min(lastRow.avgH, sys.h) * 0.65);\n      if (Math.abs(cy - lastRow.avgCy) <= tol) {\n        lastRow.items.push(sys);\n        const n = lastRow.items.length;\n        lastRow.avgCy = lastRow.items.reduce((s, it) => s + it.y + it.h * 0.5, 0) / n;\n        lastRow.avgH = lastRow.items.reduce((s, it) => s + it.h, 0) / n;\n        continue;\n      }\n    }\n    rows.push({ items: [sys], avgCy: cy, avgH: sys.h });\n  }\n  const ordered = [];\n  for (const row of rows) {\n    row.items.sort((a, b) => (a.x - b.x) || (a.y - b.y));\n    ordered.push(...row.items);\n  }\n  return ordered;\n}\n\nfunction getOrderedPageSystems(pageNum) {\n  const pObj = getPageSystemsObj(pageNum);\n  if (pObj.manualOrder) return [...pObj.systems];\n  return sortSystemsReadingOrder(pObj.systems);\n}\n\nfunction syncPageSystemsOrderIfAuto(pageNum) {\n  const pObj = getPageSystemsObj(pageNum);\n  if (!pObj.manualOrder && pObj.systems.length > 1) {\n    pObj.systems = sortSystemsReadingOrder(pObj.systems);\n  }\n}\n\nfunction getGlobalOffsetsForPage(targetPage) {\n  let sysOffset = 0;\n  let measureOffset = 0;\n  for (let p = 1; p < targetPage; p++) {\n    const list = getOrderedPageSystems(p);\n    sysOffset += list.length;\n    for (const s of list) measureOffset += Math.max(1, s.measures || 4);\n  }\n  return { sysOffset, measureOffset };\n}\n\nfunction getSystemGlobalSpan(pageNum, localIdx) {\n  const systems = getPageSystems(pageNum);\n  const { sysOffset, measureOffset } = getGlobalOffsetsForPage(pageNum);\n  let beforeMeasures = 0;\n  for (let i = 0; i < localIdx; i++) {\n    beforeMeasures += Math.max(1, systems[i]?.measures || 4);\n  }\n  const mTotal = Math.max(1, systems[localIdx]?.measures || 4);\n  const globalSysNum = sysOffset + localIdx + 1;\n  const firstMeasure = measureOffset + beforeMeasures + 1;\n  const lastMeasure = firstMeasure + mTotal - 1;\n  return { globalSysNum, firstMeasure, lastMeasure, mTotal };\n}\n\n// Lee marcas de compás con retrocompatibilidad v7 (repeatStartMeasure/repeatEndMeasure)\nfunction getMeasureMarks(sys, mIdx) {\n  const raw = (sys.measureMarks && sys.measureMarks[mIdx]) ? sys.measureMarks[mIdx] : {};\n  return {\n    repeatStart: Boolean(raw.repeatStart || sys.repeatStartMeasure === mIdx),\n    repeatEnd: Boolean(raw.repeatEnd || sys.repeatEndMeasure === mIdx),\n    repeatCount: Number(raw.repeatCount || sys.repeatCount || 2),\n    volta: raw.volta ? Number(raw.volta) : null, // 1, 2, 3\n    segno: Boolean(raw.segno),\n    toCoda: Boolean(raw.toCoda),\n    codaDest: Boolean(raw.codaDest),\n    dc: Boolean(raw.dc),\n    ds: Boolean(raw.ds),\n    fine: Boolean(raw.fine),\n  };\n}\n\nfunction migrateLegacyMarksOnSystem(sys) {\n  if (!sys.measureMarks) sys.measureMarks = {};\n  if (sys.repeatStartMeasure !== null && sys.repeatStartMeasure !== undefined) {\n    const m = sys.repeatStartMeasure;\n    sys.measureMarks[m] = { ...(sys.measureMarks[m] || {}), repeatStart: true };\n    delete sys.repeatStartMeasure;\n  }\n  if (sys.repeatEndMeasure !== null && sys.repeatEndMeasure !== undefined) {\n    const m = sys.repeatEndMeasure;\n    sys.measureMarks[m] = { ...(sys.measureMarks[m] || {}), repeatEnd: true, repeatCount: sys.repeatCount || 2 };\n    delete sys.repeatEndMeasure;\n  }\n}\n\nfunction toggleMeasureMark(sys, mIdx, key, value) {\n  migrateLegacyMarksOnSystem(sys);\n  if (!sys.measureMarks) sys.measureMarks = {};\n  const cur = { ...(sys.measureMarks[mIdx] || {}) };\n  if (value === undefined) {\n    cur[key] = !cur[key];\n    if (!cur[key]) delete cur[key];\n  } else {\n    if (cur[key] === value || value === null) delete cur[key];\n    else cur[key] = value;\n  }\n  if (Object.keys(cur).length === 0) delete sys.measureMarks[mIdx];\n  else sys.measureMarks[mIdx] = cur;\n}\n\nfunction syncPracticeControlsFromState() {\n  document.getElementById(\"practiceTimeSig\").value = state.practice.timeSig;\n  document.getElementById(\"practiceBpm\").value = String(state.practice.bpm);\n  document.getElementById(\"practiceCountIn\").value = String(state.practice.countInBars);\n  document.getElementById(\"practiceViewMode\").value = state.practice.viewMode;\n  document.getElementById(\"practiceAdvanceMode\").value = state.practice.advanceMode;\n  document.getElementById(\"settingPedalMode\").value = state.practice.pedalKey;\n  document.getElementById(\"practiceLoopCount\").value = String(state.practice.loopCount || 1);\n  document.getElementById(\"practiceProgBpm\").value = String(state.practice.progBpmStep || 0);\n\n  const mBtn = document.getElementById(\"practiceMetronomeBtn\");\n  mBtn.classList.toggle(\"active\", state.practice.metronome);\n  mBtn.textContent = state.practice.metronome ? \"Metrónomo: Sí\" : \"Metrónomo: No\";\n\n  const loopActive = Boolean(state.practice.studyLoopEnabled);\n  const loopLabel = loopActive ? \"🔁 Bucle: Sí\" : \"🔁 Bucle: No\";\n  const lBtn = document.getElementById(\"practiceLoopBtn\");\n  const fsLBtn = document.getElementById(\"fsLoopBtn\");\n  const mobLBtn = document.getElementById(\"mobLoopBtn\");\n  if (lBtn) {\n    lBtn.classList.toggle(\"active\", loopActive);\n    lBtn.textContent = loopLabel;\n  }\n  if (fsLBtn) {\n    fsLBtn.classList.toggle(\"primary\", loopActive);\n    fsLBtn.textContent = loopLabel;\n  }\n  if (mobLBtn) {\n    mobLBtn.classList.toggle(\"active\", loopActive);\n  }\n}\nsyncPracticeControlsFromState();\n\nfunction playMetronomeClick(beatIdx, timeSig, forceSound = false) {\n  if (!forceSound && !state.practice.metronome) return;\n  try {\n    const AudioCtor = window.AudioContext || window.webkitAudioContext;\n    if (!AudioCtor) return;\n    if (!audioCtx) audioCtx = new AudioCtor();\n    if (audioCtx.state === \"suspended\") audioCtx.resume();\n    const now = audioCtx.currentTime;\n    const osc = audioCtx.createOscillator();\n    const gain = audioCtx.createGain();\n    let freq = 660;\n    let peak = 0.18;\n    if (beatIdx === 0) { freq = 960; peak = 0.30; }\n    else if (timeSig === \"6/8\" && beatIdx === 3) { freq = 780; peak = 0.22; }\n    osc.type = \"triangle\";\n    osc.frequency.setValueAtTime(freq, now);\n    gain.gain.setValueAtTime(peak, now);\n    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);\n    osc.connect(gain);\n    gain.connect(audioCtx.destination);\n    osc.start(now);\n    osc.stop(now + 0.05);\n  } catch (e) {}\n}\n\nfunction setCalibrating(flag) {\n  practiceCalibrating = Boolean(flag);\n  document.body.classList.toggle(\"calibrating\", practiceCalibrating);\n  document.getElementById(\"toggleCalibrateBtn\").classList.toggle(\"active\", practiceCalibrating);\n  if (!practiceCalibrating) closeSystemPopover();\n  renderPracticeOverlay();\n}\n\ndocument.getElementById(\"toggleCalibrateBtn\").addEventListener(\"click\", () => {\n  if (!state.pdfDoc) return;\n  if (playback.running) stopPracticePlayback();\n  setCalibrating(!practiceCalibrating);\n  if (practiceCalibrating) showToast(`Arrastra sobre una línea (${state.lastCalibratedMeasures} comp. por defecto)`);\n});\n\ndocument.getElementById(\"duplicateLastSysBtn\").addEventListener(\"click\", () => {\n  if (!state.pdfDoc) return;\n  const pObj = getPageSystemsObj(state.page);\n  const systems = pObj.systems;\n  if (systems.length === 0) {\n    showToast(\"Dibuja primero un sistema con «Calibrar sistemas».\");\n    return;\n  }\n  const ref = selectedSystemIdx >= 0 && systems[selectedSystemIdx] ? systems[selectedSystemIdx] : systems[systems.length - 1];\n  const vh = overlay.viewBox.baseVal.height || bgCanvas.height || 1000;\n  const ny = Math.min(vh - ref.h - 8, ref.y + ref.h + Math.round(ref.h * 0.35));\n  const mCount = ref.measures || state.lastCalibratedMeasures || 4;\n  state.lastCalibratedMeasures = mCount;\n  const copy = {\n    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,\n    x: ref.x,\n    y: Math.max(8, ny),\n    w: ref.w,\n    h: ref.h,\n    measures: mCount,\n    repeatCount: 2,\n    measureMarks: {},\n  };\n  systems.push(copy);\n  syncPageSystemsOrderIfAuto(state.page);\n  const finalIdx = systems.indexOf(copy);\n  setDirty(true);\n  if (!practiceCalibrating) setCalibrating(true);\n  openSystemPopover(finalIdx, 0);\n  renderPracticeOverlay();\n});\n\ndocument.getElementById(\"autoOrderSystemsBtn\").addEventListener(\"click\", () => {\n  if (!state.pdfDoc) return;\n  const pObj = getPageSystemsObj(state.page);\n  if (pObj.systems.length < 2) {\n    pObj.manualOrder = false;\n    showToast(\"Sistemas ordenados (izq.→der., arriba→abajo)\");\n    return;\n  }\n  const activeSys = selectedSystemIdx >= 0 ? pObj.systems[selectedSystemIdx] : null;\n  pObj.systems = sortSystemsReadingOrder(pObj.systems);\n  pObj.manualOrder = false;\n  if (activeSys) {\n    const newIdx = pObj.systems.indexOf(activeSys);\n    if (newIdx >= 0) openSystemPopover(newIdx, Math.max(0, selectedMeasureIdx));\n  }\n  setDirty(true);\n  renderPracticeOverlay();\n  showToast(\"Sistemas ordenados en sentido de lectura\");\n});\n\ndocument.getElementById(\"clearPageSystemsBtn\").addEventListener(\"click\", () => {\n  if (!state.pdfDoc) return;\n  state.practice.pages[state.page] = { systems: [], manualOrder: false };\n  closeSystemPopover();\n  setDirty(true);\n  renderPracticeOverlay();\n  updatePracticeReadout();\n  showToast(\"Sistemas de esta página borrados\");\n});\n\n// Detección asistida de sistemas/pentagramas sobre la imagen renderizada del PDF (v10.0)\nfunction detectStaffSystemsOnCurrentPage() {\n  if (!bgCanvas || !bgCanvas.width || !bgCanvas.height) return [];\n  const w = bgCanvas.width;\n  const h = bgCanvas.height;\n  const imgData = bgCtx.getImageData(0, 0, w, h).data;\n  const xStart = Math.round(w * 0.025);\n  const xEnd = Math.round(w * 0.975);\n  const sampleStep = w > 1200 ? 2 : 1;\n  const sampledCols = Math.max(1, Math.floor((xEnd - xStart) / sampleStep));\n\n  const rowDarkFrac = new Float32Array(h);\n  for (let y = 0; y < h; y++) {\n    let dark = 0;\n    const rowBase = y * w * 4;\n    for (let x = xStart; x < xEnd; x += sampleStep) {\n      const idx = rowBase + x * 4;\n      const lum = (imgData[idx] * 3 + imgData[idx + 1] * 6 + imgData[idx + 2]) / 10;\n      if (lum < 195) dark++;\n    }\n    rowDarkFrac[y] = dark / sampledCols;\n  }\n\n  // Etapa 1: detectar filas correspondientes a líneas horizontales de pentagrama / tablatura\n  const staffLineRows = [];\n  for (let y = Math.round(h * 0.02); y < Math.round(h * 0.97); y++) {\n    if (rowDarkFrac[y] >= 0.30) staffLineRows.push(y);\n  }\n\n  let bands = [];\n  if (staffLineRows.length >= 3) {\n    const mergeGap = Math.max(18, Math.round(h * 0.015));\n    let cur = { top: staffLineRows[0], bottom: staffLineRows[0], lineCount: 1 };\n    for (let i = 1; i < staffLineRows.length; i++) {\n      const y = staffLineRows[i];\n      if (y - cur.bottom <= mergeGap) {\n        if (y - cur.bottom > 2) cur.lineCount++;\n        cur.bottom = y;\n      } else {\n        bands.push(cur);\n        cur = { top: y, bottom: y, lineCount: 1 };\n      }\n    }\n    bands.push(cur);\n    bands = bands.filter(b => (b.bottom - b.top) >= Math.max(14, h * 0.008));\n\n    // Detectar distribución bimodal (partitura + tablatura emparejadas) para unir solo pares cercanos\n    if (bands.length >= 3) {\n      const gaps = [];\n      for (let i = 0; i < bands.length - 1; i++) gaps.push(bands[i + 1].top - bands[i].bottom);\n      const minG = Math.min(...gaps);\n      const maxG = Math.max(...gaps);\n      if (maxG > minG * 1.65 && minG < h * 0.055) {\n        const splitThreshold = (minG + maxG) * 0.48;\n        const paired = [];\n        for (let i = 0; i < bands.length; i++) {\n          if (i < bands.length - 1 && (bands[i + 1].top - bands[i].bottom) <= splitThreshold) {\n            paired.push({ top: bands[i].top, bottom: bands[i + 1].bottom, lineCount: bands[i].lineCount + bands[i + 1].lineCount });\n            i++;\n          } else {\n            paired.push(bands[i]);\n          }\n        }\n        bands = paired;\n      }\n    }\n  }\n\n  // Etapa 2 (respaldo si el PDF tiene poco contraste de líneas): bandas densas de tinta\n  if (bands.length === 0) {\n    const minBandH = Math.max(24, Math.round(h * 0.018));\n    const minGap = Math.max(22, Math.round(h * 0.02));\n    let inBand = false;\n    let startY = 0;\n    let gapCount = 0;\n    for (let y = Math.round(h * 0.05); y < Math.round(h * 0.96); y++) {\n      if (rowDarkFrac[y] >= 0.018) {\n        if (!inBand) { inBand = true; startY = y; }\n        gapCount = 0;\n      } else if (inBand) {\n        gapCount++;\n        if (gapCount >= minGap) {\n          const endY = y - gapCount;\n          if (endY - startY >= minBandH) bands.push({ top: startY, bottom: endY });\n          inBand = false;\n        }\n      }\n    }\n    if (inBand && (h * 0.96 - startY) >= minBandH) {\n      bands.push({ top: startY, bottom: Math.round(h * 0.95) });\n    }\n  }\n\n  // Calcular márgenes horizontales reales dentro de cada banda detectada\n  const systems = [];\n  const defaultMeasures = state.lastCalibratedMeasures || 4;\n  for (let idx = 0; idx < bands.length; idx++) {\n    const b = bands[idx];\n    const spanH = b.bottom - b.top;\n    const padY = Math.max(10, Math.round(spanH * 0.24));\n    const sy = Math.max(6, b.top - padY);\n    const ey = Math.min(h - 6, b.bottom + padY);\n    let minX = xEnd, maxX = xStart;\n    for (let x = xStart; x < xEnd; x += 2) {\n      let colDark = 0;\n      for (let y = b.top; y <= b.bottom; y++) {\n        const i = (y * w + x) * 4;\n        const lum = (imgData[i] * 3 + imgData[i + 1] * 6 + imgData[i + 2]) / 10;\n        if (lum < 200) { colDark++; if (colDark >= 2) break; }\n      }\n      if (colDark >= 2) {\n        if (x < minX) minX = x;\n        if (x > maxX) maxX = x;\n      }\n    }\n    const sx = minX < maxX ? Math.max(6, minX - 8) : Math.round(w * 0.05);\n    const sw = minX < maxX ? Math.min(w - sx - 6, (maxX - minX) + 16) : Math.round(w * 0.90);\n    if (sw < Math.round(w * 0.22)) continue;\n    systems.push({\n      id: `sys-${Date.now()}-${idx}-${Math.random().toString(36).slice(2,5)}`,\n      x: Math.round(sx),\n      y: Math.round(sy),\n      w: Math.round(sw),\n      h: Math.round(ey - sy),\n      measures: defaultMeasures,\n      repeatCount: 2,\n      measureMarks: {},\n    });\n  }\n  return sortSystemsReadingOrder(systems);\n}\n\nconst autoDetectSystemsBtn = document.getElementById(\"autoDetectSystemsBtn\");\nautoDetectSystemsBtn.addEventListener(\"click\", () => {\n  if (!state.pdfDoc) return;\n  if (playback.running) stopPracticePlayback();\n  const pObj = getPageSystemsObj(state.page);\n  if (pObj.systems.length > 0 && autoDetectSystemsBtn.dataset.confirm !== \"1\") {\n    autoDetectSystemsBtn.dataset.confirm = \"1\";\n    autoDetectSystemsBtn.textContent = `¿Reemplazar ${pObj.systems.length} sist.?`;\n    clearTimeout(autoDetectSystemsBtn._timer);\n    autoDetectSystemsBtn._timer = setTimeout(() => {\n      autoDetectSystemsBtn.dataset.confirm = \"\";\n      autoDetectSystemsBtn.textContent = \"Detectar sistemas\";\n    }, 3500);\n    return;\n  }\n  autoDetectSystemsBtn.dataset.confirm = \"\";\n  autoDetectSystemsBtn.textContent = \"Detectar sistemas\";\n\n  const detected = detectStaffSystemsOnCurrentPage();\n  if (detected.length === 0) {\n    showToast(\"No se detectaron pentagramas claros en esta página. Puedes dibujarlos manualmente.\");\n    return;\n  }\n  pObj.systems = detected;\n  pObj.manualOrder = false;\n  setDirty(true);\n  setCalibrating(true);\n  openSystemPopover(0, 0);\n  renderPracticeOverlay();\n  updatePracticeReadout();\n  showToast(`${detected.length} sistema(s) detectado(s) en la página ${state.page}`);\n});\n\nfunction closeSystemPopover() {\n  selectedSystemIdx = -1;\n  selectedMeasureIdx = -1;\n  document.getElementById(\"systemPopover\").classList.remove(\"open\");\n}\n\nfunction summarizeMeasureBadge(marks) {\n  const parts = [];\n  if (marks.repeatStart) parts.push(\"|:\");\n  if (marks.volta) parts.push(`${marks.volta}.`);\n  if (marks.segno) parts.push(\"𝄋\");\n  if (marks.codaDest) parts.push(\"⊕C\");\n  if (marks.toCoda) parts.push(\"→⊕\");\n  if (marks.fine) parts.push(\"Fine\");\n  if (marks.dc) parts.push(\"D.C.\");\n  if (marks.ds) parts.push(\"D.S.\");\n  if (marks.repeatEnd) parts.push(\":|\");\n  return parts.join(\" \");\n}\n\nfunction openSystemPopover(sysIdx, measureIdx = 0, opts = {}) {\n  const systems = getPageSystems(state.page);\n  const sys = systems[sysIdx];\n  if (!sys) { closeSystemPopover(); return; }\n  selectedSystemIdx = sysIdx;\n  const mTotal = Math.max(1, sys.measures || 4);\n  state.lastCalibratedMeasures = mTotal;\n  selectedMeasureIdx = Math.max(0, Math.min(mTotal - 1, measureIdx));\n\n  const span = getSystemGlobalSpan(state.page, sysIdx);\n  const rangeLabel = span.mTotal > 1 ? `c.${span.firstMeasure}–${span.lastMeasure}` : `c.${span.firstMeasure}`;\n  document.getElementById(\"sysPopTitle\").textContent = `Sistema ${span.globalSysNum} (${rangeLabel})`;\n\n  const orderInput = document.getElementById(\"sysOrderInput\");\n  orderInput.max = String(Math.max(1, systems.length));\n  if (!opts.keepOrderInput) orderInput.value = String(sysIdx + 1);\n\n  const measuresInput = document.getElementById(\"sysMeasuresInput\");\n  if (!opts.keepMeasuresInput) measuresInput.value = String(mTotal);\n\n  const curMarks = getMeasureMarks(sys, selectedMeasureIdx);\n  const repeatInput = document.getElementById(\"sysRepeatCount\");\n  if (!opts.keepRepeatInput) repeatInput.value = String(curMarks.repeatCount || sys.repeatCount || 2);\n\n  // Selector de compases del sistema con numeración continua global\n  const btnRow = document.getElementById(\"sysMeasureButtons\");\n  btnRow.innerHTML = \"\";\n  const mLbl = document.createElement(\"span\");\n  mLbl.className = \"pop-subtitle\";\n  mLbl.textContent = \"Compás:\";\n  btnRow.appendChild(mLbl);\n\n  for (let m = 0; m < mTotal; m++) {\n    const b = document.createElement(\"button\");\n    const mk = getMeasureMarks(sys, m);\n    const badge = summarizeMeasureBadge(mk);\n    const gNum = span.firstMeasure + m;\n    b.type = \"button\";\n    b.textContent = badge ? `c.${gNum} (${badge})` : `c.${gNum}`;\n    if (m === selectedMeasureIdx) b.classList.add(\"active\");\n    b.addEventListener(\"click\", () => openSystemPopover(sysIdx, m));\n    btnRow.appendChild(b);\n  }\n\n  const activeGlobalM = span.firstMeasure + selectedMeasureIdx;\n\n  // Fila de Repeticiones y Casillas\n  const marksRow = document.getElementById(\"sysMarksRow\");\n  marksRow.innerHTML = \"\";\n  const rLbl = document.createElement(\"span\");\n  rLbl.className = \"pop-subtitle\";\n  rLbl.textContent = `c.${activeGlobalM} Repetición:`;\n  marksRow.appendChild(rLbl);\n\n  const addToggle = (parent, label, active, onClick) => {\n    const btn = document.createElement(\"button\");\n    btn.type = \"button\";\n    btn.textContent = label;\n    if (active) btn.classList.add(\"active\");\n    btn.addEventListener(\"click\", () => {\n      onClick();\n      setDirty(true);\n      openSystemPopover(sysIdx, selectedMeasureIdx);\n      renderPracticeOverlay();\n    });\n    parent.appendChild(btn);\n  };\n\n  addToggle(marksRow, \"|: Inicio\", curMarks.repeatStart, () => toggleMeasureMark(sys, selectedMeasureIdx, \"repeatStart\"));\n  addToggle(marksRow, \":| Fin\", curMarks.repeatEnd, () => toggleMeasureMark(sys, selectedMeasureIdx, \"repeatEnd\"));\n  addToggle(marksRow, \"Casilla 1.\", curMarks.volta === 1, () => toggleMeasureMark(sys, selectedMeasureIdx, \"volta\", 1));\n  addToggle(marksRow, \"Casilla 2.\", curMarks.volta === 2, () => toggleMeasureMark(sys, selectedMeasureIdx, \"volta\", 2));\n  addToggle(marksRow, \"Casilla 3.\", curMarks.volta === 3, () => toggleMeasureMark(sys, selectedMeasureIdx, \"volta\", 3));\n\n  // Fila de Saltos y Forma musical\n  const jumpsRow = document.getElementById(\"sysJumpsRow\");\n  jumpsRow.innerHTML = \"\";\n  const jLbl = document.createElement(\"span\");\n  jLbl.className = \"pop-subtitle\";\n  jLbl.textContent = `c.${activeGlobalM} Signos:`;\n  jumpsRow.appendChild(jLbl);\n\n  addToggle(jumpsRow, \"𝄋 Segno\", curMarks.segno, () => toggleMeasureMark(sys, selectedMeasureIdx, \"segno\"));\n  addToggle(jumpsRow, \"Al ⊕ (To Coda)\", curMarks.toCoda, () => toggleMeasureMark(sys, selectedMeasureIdx, \"toCoda\"));\n  addToggle(jumpsRow, \"⊕ Coda\", curMarks.codaDest, () => toggleMeasureMark(sys, selectedMeasureIdx, \"codaDest\"));\n  addToggle(jumpsRow, \"D.C.\", curMarks.dc, () => toggleMeasureMark(sys, selectedMeasureIdx, \"dc\"));\n  addToggle(jumpsRow, \"D.S.\", curMarks.ds, () => toggleMeasureMark(sys, selectedMeasureIdx, \"ds\"));\n  addToggle(jumpsRow, \"Fine\", curMarks.fine, () => toggleMeasureMark(sys, selectedMeasureIdx, \"fine\"));\n\n  const clearMeasureBtn = document.createElement(\"button\");\n  clearMeasureBtn.type = \"button\";\n  clearMeasureBtn.className = \"danger\";\n  clearMeasureBtn.textContent = `Limpiar c.${activeGlobalM}`;\n  clearMeasureBtn.addEventListener(\"click\", () => {\n    migrateLegacyMarksOnSystem(sys);\n    if (sys.measureMarks) delete sys.measureMarks[selectedMeasureIdx];\n    setDirty(true);\n    openSystemPopover(sysIdx, selectedMeasureIdx);\n    renderPracticeOverlay();\n  });\n  jumpsRow.appendChild(clearMeasureBtn);\n\n  document.getElementById(\"systemPopover\").classList.add(\"open\");\n}\n\nconst sysOrderInputEl = document.getElementById(\"sysOrderInput\");\nsysOrderInputEl.addEventListener(\"change\", () => {\n  const pObj = getPageSystemsObj(state.page);\n  const systems = pObj.systems;\n  if (selectedSystemIdx < 0 || selectedSystemIdx >= systems.length) return;\n  const parsed = parseInt(sysOrderInputEl.value, 10);\n  if (Number.isNaN(parsed)) { sysOrderInputEl.value = String(selectedSystemIdx + 1); return; }\n  const targetIdx = Math.max(0, Math.min(systems.length - 1, parsed - 1));\n  if (targetIdx !== selectedSystemIdx) {\n    const [moved] = systems.splice(selectedSystemIdx, 1);\n    systems.splice(targetIdx, 0, moved);\n    pObj.manualOrder = true;\n    selectedSystemIdx = targetIdx;\n    setDirty(true);\n    renderPracticeOverlay();\n  }\n  openSystemPopover(selectedSystemIdx, Math.max(0, selectedMeasureIdx));\n});\n\nconst sysMeasuresInputEl = document.getElementById(\"sysMeasuresInput\");\nsysMeasuresInputEl.addEventListener(\"input\", () => {\n  const systems = getPageSystems(state.page);\n  const sys = systems[selectedSystemIdx];\n  if (!sys) return;\n  const raw = sysMeasuresInputEl.value.trim();\n  if (!raw) return;\n  const parsed = parseInt(raw, 10);\n  if (Number.isNaN(parsed) || parsed < 1) return;\n  const val = Math.min(16, parsed);\n  sys.measures = val;\n  state.lastCalibratedMeasures = val;\n  if (sys.measureMarks) {\n    Object.keys(sys.measureMarks).forEach(k => { if (Number(k) >= val) delete sys.measureMarks[k]; });\n  }\n  if (sys.repeatStartMeasure !== null && sys.repeatStartMeasure !== undefined && sys.repeatStartMeasure >= val) sys.repeatStartMeasure = null;\n  if (sys.repeatEndMeasure !== null && sys.repeatEndMeasure !== undefined && sys.repeatEndMeasure >= val) sys.repeatEndMeasure = null;\n  setDirty(true);\n  openSystemPopover(selectedSystemIdx, Math.min(Math.max(0, selectedMeasureIdx), val - 1), { keepMeasuresInput: true });\n  renderPracticeOverlay();\n});\nsysMeasuresInputEl.addEventListener(\"blur\", () => {\n  const sys = getPageSystems(state.page)[selectedSystemIdx];\n  if (sys) sysMeasuresInputEl.value = String(Math.max(1, sys.measures || 4));\n});\n\nconst sysRepeatCountEl = document.getElementById(\"sysRepeatCount\");\nsysRepeatCountEl.addEventListener(\"input\", () => {\n  const sys = getPageSystems(state.page)[selectedSystemIdx];\n  if (!sys) return;\n  const raw = sysRepeatCountEl.value.trim();\n  if (!raw) return;\n  const parsed = parseInt(raw, 10);\n  if (Number.isNaN(parsed) || parsed < 2) return;\n  const val = Math.min(12, parsed);\n  sys.repeatCount = val;\n  migrateLegacyMarksOnSystem(sys);\n  if (!sys.measureMarks) sys.measureMarks = {};\n  sys.measureMarks[selectedMeasureIdx] = { ...(sys.measureMarks[selectedMeasureIdx] || {}), repeatCount: val };\n  setDirty(true);\n  openSystemPopover(selectedSystemIdx, selectedMeasureIdx, { keepRepeatInput: true });\n  renderPracticeOverlay();\n});\nsysRepeatCountEl.addEventListener(\"blur\", () => {\n  const sys = getPageSystems(state.page)[selectedSystemIdx];\n  if (sys) {\n    const mk = getMeasureMarks(sys, selectedMeasureIdx);\n    sysRepeatCountEl.value = String(mk.repeatCount || sys.repeatCount || 2);\n  }\n});\n\ndocument.getElementById(\"sysDeleteBtn\").addEventListener(\"click\", () => {\n  const systems = getPageSystems(state.page);\n  if (selectedSystemIdx < 0 || selectedSystemIdx >= systems.length) return;\n  systems.splice(selectedSystemIdx, 1);\n  closeSystemPopover();\n  setDirty(true);\n  renderPracticeOverlay();\n  updatePracticeReadout();\n});\ndocument.getElementById(\"sysCloseBtn\").addEventListener(\"click\", closeSystemPopover);\n\nfunction drawMeasureSymbolsSvg(NS, sys, mIdx, mx, mw, isCalibrating) {\n  const mk = getMeasureMarks(sys, mIdx);\n  const topY = sys.y;\n  const botY = sys.y + sys.h;\n\n  if (mk.repeatStart) {\n    const bar = document.createElementNS(NS, \"line\");\n    bar.setAttribute(\"x1\", mx + 3); bar.setAttribute(\"y1\", topY);\n    bar.setAttribute(\"x2\", mx + 3); bar.setAttribute(\"y2\", botY);\n    bar.setAttribute(\"stroke\", \"#0c6654\"); bar.setAttribute(\"stroke-width\", \"4\");\n    bar.setAttribute(\"pointer-events\", \"none\");\n    practiceOverlay.appendChild(bar);\n    [0.38, 0.62].forEach(f => {\n      const dot = document.createElementNS(NS, \"circle\");\n      dot.setAttribute(\"cx\", mx + 11); dot.setAttribute(\"cy\", topY + sys.h * f);\n      dot.setAttribute(\"r\", \"2.6\"); dot.setAttribute(\"fill\", \"#0c6654\");\n      dot.setAttribute(\"pointer-events\", \"none\");\n      practiceOverlay.appendChild(dot);\n    });\n  }\n\n  if (mk.repeatEnd) {\n    const rx = mx + mw;\n    const bar = document.createElementNS(NS, \"line\");\n    bar.setAttribute(\"x1\", rx - 3); bar.setAttribute(\"y1\", topY);\n    bar.setAttribute(\"x2\", rx - 3); bar.setAttribute(\"y2\", botY);\n    bar.setAttribute(\"stroke\", \"#a33b35\"); bar.setAttribute(\"stroke-width\", \"4\");\n    bar.setAttribute(\"pointer-events\", \"none\");\n    practiceOverlay.appendChild(bar);\n    [0.38, 0.62].forEach(f => {\n      const dot = document.createElementNS(NS, \"circle\");\n      dot.setAttribute(\"cx\", rx - 11); dot.setAttribute(\"cy\", topY + sys.h * f);\n      dot.setAttribute(\"r\", \"2.6\"); dot.setAttribute(\"fill\", \"#a33b35\");\n      dot.setAttribute(\"pointer-events\", \"none\");\n      practiceOverlay.appendChild(dot);\n    });\n    const lbl = document.createElementNS(NS, \"text\");\n    lbl.setAttribute(\"x\", rx - 8); lbl.setAttribute(\"y\", topY + 15);\n    lbl.setAttribute(\"text-anchor\", \"end\"); lbl.setAttribute(\"font-size\", \"12\");\n    lbl.setAttribute(\"font-weight\", \"bold\"); lbl.setAttribute(\"fill\", \"#a33b35\");\n    lbl.setAttribute(\"pointer-events\", \"none\");\n    lbl.textContent = `×${mk.repeatCount || 2}`;\n    practiceOverlay.appendChild(lbl);\n  }\n\n  if (mk.volta) {\n    const poly = document.createElementNS(NS, \"polyline\");\n    poly.setAttribute(\"points\", `${mx + 2},${topY + 16} ${mx + 2},${topY + 2} ${mx + mw - 2},${topY + 2}`);\n    poly.setAttribute(\"fill\", \"none\"); poly.setAttribute(\"stroke\", \"#1e2d28\");\n    poly.setAttribute(\"stroke-width\", \"2\"); poly.setAttribute(\"pointer-events\", \"none\");\n    practiceOverlay.appendChild(poly);\n    const vt = document.createElementNS(NS, \"text\");\n    vt.setAttribute(\"x\", mx + 7); vt.setAttribute(\"y\", topY + 14);\n    vt.setAttribute(\"font-size\", \"12\"); vt.setAttribute(\"font-weight\", \"bold\");\n    vt.setAttribute(\"fill\", \"#1e2d28\"); vt.setAttribute(\"pointer-events\", \"none\");\n    vt.textContent = `${mk.volta}.`;\n    practiceOverlay.appendChild(vt);\n  }\n\n  const topBadges = [];\n  if (mk.segno) topBadges.push({ text: \"𝄋\", color: \"#0c6654\" });\n  if (mk.codaDest) topBadges.push({ text: \"⊕ Coda\", color: \"#0c6654\" });\n  if (mk.toCoda) topBadges.push({ text: \"Al ⊕\", color: \"#8c3f19\" });\n  if (mk.fine) topBadges.push({ text: \"Fine\", color: \"#1e2d28\" });\n  if (mk.dc) topBadges.push({ text: \"D.C.\", color: \"#a33b35\" });\n  if (mk.ds) topBadges.push({ text: \"D.S.\", color: \"#a33b35\" });\n\n  if (topBadges.length > 0) {\n    const labelStr = topBadges.map(b => b.text).join(\" · \");\n    const bx = mx + (mk.volta ? 26 : 6);\n    const by = isCalibrating ? botY - 6 : topY + 14;\n    const pillBg = document.createElementNS(NS, \"rect\");\n    const estW = Math.min(mw - 8, labelStr.length * 7.5 + 10);\n    pillBg.setAttribute(\"x\", bx - 2); pillBg.setAttribute(\"y\", by - 11);\n    pillBg.setAttribute(\"width\", Math.max(24, estW)); pillBg.setAttribute(\"height\", 15);\n    pillBg.setAttribute(\"rx\", \"4\"); pillBg.setAttribute(\"fill\", \"rgba(255,255,255,0.92)\");\n    pillBg.setAttribute(\"stroke\", topBadges[0].color); pillBg.setAttribute(\"stroke-width\", \"1\");\n    pillBg.setAttribute(\"pointer-events\", \"none\");\n    practiceOverlay.appendChild(pillBg);\n\n    const txt = document.createElementNS(NS, \"text\");\n    txt.setAttribute(\"x\", bx + 3); txt.setAttribute(\"y\", by);\n    txt.setAttribute(\"font-size\", \"11\"); txt.setAttribute(\"font-weight\", \"bold\");\n    txt.setAttribute(\"font-family\", \"sans-serif\"); txt.setAttribute(\"fill\", topBadges[0].color);\n    txt.setAttribute(\"pointer-events\", \"none\");\n    txt.textContent = labelStr;\n    practiceOverlay.appendChild(txt);\n  }\n}\n\nfunction buildPracticeTimeline() {\n  const items = [];\n  let globalSysNum = 0;\n  let globalMeasureNum = 0;\n  for (let p = 1; p <= state.pageCount; p++) {\n    const systems = getOrderedPageSystems(p);\n    systems.forEach((sys, sIdx) => {\n      globalSysNum++;\n      const mCount = Math.max(1, sys.measures || 4);\n      const mw = sys.w / mCount;\n      for (let m = 0; m < mCount; m++) {\n        globalMeasureNum++;\n        items.push({\n          page: p,\n          sysId: sys.id || `sys-${p}-${sIdx}`,\n          sysIdx: sIdx,\n          globalSysNum,\n          measureIdx: m,\n          globalMeasureNum,\n          x: sys.x + m * mw,\n          y: sys.y,\n          w: mw,\n          h: sys.h,\n          marks: getMeasureMarks(sys, m),\n        });\n      }\n    });\n  }\n  return items;\n}\n\nfunction resolveStudyAnchorIndex(rawTimeline) {\n  if (!Array.isArray(rawTimeline) || rawTimeline.length === 0) return 0;\n  if (state.practice.anchorSysId) {\n    const exact = rawTimeline.findIndex(\n      it => it.sysId === state.practice.anchorSysId && it.measureIdx === (state.practice.anchorMeasureIdx || 0)\n    );\n    if (exact >= 0) return exact;\n    const sameSys = rawTimeline.findIndex(it => it.sysId === state.practice.anchorSysId);\n    if (sameSys >= 0) return sameSys;\n  }\n  const onCurPage = rawTimeline.findIndex(it => it.page === state.page);\n  return onCurPage >= 0 ? onCurPage : 0;\n}\n\nfunction getStudyLoopRange(rawTimeline) {\n  if (!Array.isArray(rawTimeline) || rawTimeline.length === 0) return null;\n  const startIdx = resolveStudyAnchorIndex(rawTimeline);\n  const count = Math.max(1, Math.min(32, parseInt(state.practice.loopCount) || 1));\n  const endIdx = Math.min(rawTimeline.length - 1, startIdx + count - 1);\n  return {\n    startIdx,\n    endIdx,\n    items: rawTimeline.slice(startIdx, endIdx + 1),\n  };\n}\n\nfunction buildStudyLoopPlan(rawTimeline) {\n  const range = getStudyLoopRange(rawTimeline);\n  if (!range || range.items.length === 0) return [];\n  return range.items.map((item, offset) => ({\n    tlIndex: range.startIdx + offset,\n    item,\n    pass: 1,\n    jumpedReturn: false,\n    endedByFine: false,\n    inStudyLoop: true,\n  }));\n}\n\n// Compilador determinista de recorrido musical completo:\n// soporta |: :|, casillas 1./2./3. simples o de varios compases, múltiples repeticiones, D.C., D.S., Segno, Al ⊕, ⊕ Coda y Fine.\nfunction buildPracticePlaybackPlan(rawTimeline) {\n  if (!Array.isArray(rawTimeline) || rawTimeline.length === 0) return [];\n  const n = rawTimeline.length;\n  const effVolta = new Array(n).fill(null);\n\n  for (let i = 0; i < n; i++) {\n    const v = rawTimeline[i].marks.volta;\n    if (!v) continue;\n    effVolta[i] = v;\n    if (rawTimeline[i].marks.repeatEnd) continue;\n    // Propagar casilla de varios compases hasta el compás con :| o el inicio de otra casilla/signo\n    let hasRepeatEndAhead = false;\n    let endAt = i;\n    for (let j = i + 1; j < n; j++) {\n      const mj = rawTimeline[j].marks;\n      if (mj.volta || mj.repeatStart || mj.segno || mj.codaDest) break;\n      endAt = j;\n      if (mj.repeatEnd) { hasRepeatEndAhead = true; break; }\n      if (mj.dc || mj.ds || mj.fine || mj.toCoda) break;\n    }\n    if (hasRepeatEndAhead) {\n      for (let j = i + 1; j <= endAt; j++) effVolta[j] = v;\n    }\n  }\n\n  const plan = [];\n  const MAX_STEPS = Math.max(600, n * 16);\n  let idx = 0;\n  let pass = 1;\n  let jumpedReturn = false;\n  let repeatVisitCounts = new Map();\n\n  while (idx >= 0 && idx < n && plan.length < MAX_STEPS) {\n    const cur = rawTimeline[idx];\n    const mk = cur.marks;\n    plan.push({ tlIndex: idx, item: cur, pass, jumpedReturn, endedByFine: Boolean(mk.fine && jumpedReturn) });\n\n    if (mk.fine && jumpedReturn) break;\n\n    if (mk.toCoda && jumpedReturn) {\n      const codaIdx = rawTimeline.findIndex(it => it.marks.codaDest);\n      if (codaIdx >= 0) {\n        pass = 1;\n        repeatVisitCounts.clear();\n        idx = codaIdx;\n        continue;\n      }\n    }\n\n    if (mk.dc && !jumpedReturn) {\n      jumpedReturn = true;\n      pass = 1;\n      repeatVisitCounts.clear();\n      idx = 0;\n      continue;\n    }\n\n    if (mk.ds && !jumpedReturn) {\n      jumpedReturn = true;\n      pass = 1;\n      repeatVisitCounts.clear();\n      const segnoIdx = rawTimeline.findIndex(it => it.marks.segno);\n      idx = segnoIdx >= 0 ? segnoIdx : 0;\n      continue;\n    }\n\n    if (mk.repeatEnd) {\n      const totalPlays = Math.max(2, mk.repeatCount || 2);\n      const countSoFar = (repeatVisitCounts.get(idx) || 0) + 1;\n      if (countSoFar < totalPlays) {\n        repeatVisitCounts.set(idx, countSoFar);\n        pass = pass + 1;\n        let startIdx = idx;\n        while (startIdx > 0 && !rawTimeline[startIdx].marks.repeatStart) startIdx--;\n        if (!rawTimeline[startIdx].marks.repeatStart) startIdx = 0;\n        idx = startIdx;\n        continue;\n      }\n      // Hemos completado todas las pasadas de este :|\n      repeatVisitCounts.delete(idx);\n      pass = 1;\n    }\n\n    // Avance lineal saltando casillas que no correspondan a la vuelta actual\n    let nextIdx = idx + 1;\n    let skippedVolta = false;\n    while (nextIdx < n && effVolta[nextIdx] !== null && effVolta[nextIdx] !== pass) {\n      skippedVolta = true;\n      nextIdx++;\n    }\n    if (nextIdx >= n) break;\n\n    // Al salir de cualquier casilla hacia un compás normal (o al entrar en un nuevo |:), reiniciar contador de vueltas\n    if ((effVolta[nextIdx] === null && (effVolta[idx] !== null || skippedVolta)) || rawTimeline[nextIdx].marks.repeatStart) {\n      pass = 1;\n    }\n\n    idx = nextIdx;\n  }\n\n  return plan;\n}\n\nfunction buildEffectivePlaybackPlan(rawTimeline) {\n  return state.practice.studyLoopEnabled\n    ? buildStudyLoopPlan(rawTimeline)\n    : buildPracticePlaybackPlan(rawTimeline);\n}\n\nfunction renderPracticeOverlay() {\n  practiceOverlay.innerHTML = \"\";\n  if (state.mode !== \"practice\" || !state.pdfDoc) return;\n  const NS = \"http://www.w3.org/2000/svg\";\n  const systems = getPageSystems(state.page);\n  const showBoxes = practiceCalibrating;\n  const { sysOffset, measureOffset } = getGlobalOffsetsForPage(state.page);\n  let runningMeasures = measureOffset;\n\n  const timeline = (!showBoxes && systems.length > 0) ? buildPracticeTimeline() : null;\n  const loopRange = (timeline && state.practice.studyLoopEnabled) ? getStudyLoopRange(timeline) : null;\n  const loopSet = new Set();\n  let loopStartKey = null;\n  if (loopRange && loopRange.items.length > 0) {\n    loopRange.items.forEach(it => loopSet.add(`${it.sysId}:${it.measureIdx}`));\n    const firstLoop = loopRange.items[0];\n    loopStartKey = `${firstLoop.sysId}:${firstLoop.measureIdx}`;\n  }\n\n  systems.forEach((sys, idx) => {\n    const measures = Math.max(1, sys.measures || 4);\n    const mw = sys.w / measures;\n    const gSysNum = sysOffset + idx + 1;\n    const firstM = runningMeasures + 1;\n    const lastM = runningMeasures + measures;\n    runningMeasures += measures;\n\n    if (showBoxes) {\n      const isSelected = idx === selectedSystemIdx;\n      const g = document.createElementNS(NS, \"g\");\n      const box = document.createElementNS(NS, \"rect\");\n      box.setAttribute(\"x\", sys.x); box.setAttribute(\"y\", sys.y);\n      box.setAttribute(\"width\", sys.w); box.setAttribute(\"height\", sys.h);\n      box.setAttribute(\"fill\", isSelected ? \"rgba(20,125,104,0.10)\" : \"rgba(20,125,104,0.04)\");\n      box.setAttribute(\"stroke\", isSelected ? \"#0c6654\" : \"#147d68\");\n      box.setAttribute(\"stroke-width\", isSelected ? \"2.5\" : \"1.5\");\n      box.setAttribute(\"stroke-dasharray\", \"6 4\");\n      box.dataset.sysIdx = String(idx);\n      g.appendChild(box);\n\n      for (let m = 1; m < measures; m++) {\n        const line = document.createElementNS(NS, \"line\");\n        const lx = sys.x + m * mw;\n        line.setAttribute(\"x1\", lx); line.setAttribute(\"y1\", sys.y);\n        line.setAttribute(\"x2\", lx); line.setAttribute(\"y2\", sys.y + sys.h);\n        line.setAttribute(\"stroke\", \"rgba(20,125,104,0.55)\");\n        line.setAttribute(\"stroke-width\", \"1.2\");\n        line.setAttribute(\"pointer-events\", \"none\");\n        g.appendChild(line);\n      }\n\n      if (isSelected && selectedMeasureIdx >= 0 && selectedMeasureIdx < measures) {\n        const selM = document.createElementNS(NS, \"rect\");\n        selM.setAttribute(\"x\", sys.x + selectedMeasureIdx * mw);\n        selM.setAttribute(\"y\", sys.y);\n        selM.setAttribute(\"width\", mw);\n        selM.setAttribute(\"height\", sys.h);\n        selM.setAttribute(\"fill\", \"rgba(20,125,104,0.14)\");\n        selM.setAttribute(\"pointer-events\", \"none\");\n        g.appendChild(selM);\n      }\n\n      const tag = document.createElementNS(NS, \"text\");\n      tag.setAttribute(\"x\", sys.x + 6); tag.setAttribute(\"y\", Math.max(16, sys.y - 6));\n      tag.setAttribute(\"font-size\", \"13\"); tag.setAttribute(\"font-weight\", \"bold\");\n      tag.setAttribute(\"font-family\", \"sans-serif\"); tag.setAttribute(\"fill\", \"#0c6654\");\n      tag.setAttribute(\"pointer-events\", \"none\");\n      tag.textContent = measures > 1 ? `S${gSysNum} · c.${firstM}–${lastM}` : `S${gSysNum} · c.${firstM}`;\n      g.appendChild(tag);\n\n      if (isSelected) {\n        const handle = document.createElementNS(NS, \"circle\");\n        handle.setAttribute(\"cx\", sys.x + sys.w); handle.setAttribute(\"cy\", sys.y + sys.h);\n        handle.setAttribute(\"r\", \"8\"); handle.setAttribute(\"fill\", \"#0c6654\");\n        handle.setAttribute(\"stroke\", \"#fff\"); handle.setAttribute(\"stroke-width\", \"2\");\n        handle.style.cursor = \"nwse-resize\";\n        handle.dataset.sysResize = String(idx);\n        g.appendChild(handle);\n      }\n      practiceOverlay.appendChild(g);\n    } else {\n      // Zonas clicables por compás para iniciar desde ahí o fijar el bucle de estudio\n      for (let m = 0; m < measures; m++) {\n        const mx = sys.x + m * mw;\n        const gNum = firstM + m;\n        const mKey = `${sys.id}:${m}`;\n        const inLoop = loopSet.has(mKey);\n        const isAnchor = state.practice.anchorSysId === sys.id && (state.practice.anchorMeasureIdx || 0) === m;\n\n        if (inLoop || isAnchor) {\n          const markRect = document.createElementNS(NS, \"rect\");\n          markRect.setAttribute(\"x\", mx); markRect.setAttribute(\"y\", sys.y);\n          markRect.setAttribute(\"width\", mw); markRect.setAttribute(\"height\", sys.h);\n          markRect.setAttribute(\"fill\", inLoop ? \"rgba(168, 93, 18, 0.10)\" : \"rgba(20, 125, 104, 0.06)\");\n          markRect.setAttribute(\"stroke\", inLoop ? \"#a85d12\" : \"#147d68\");\n          markRect.setAttribute(\"stroke-width\", inLoop ? \"2\" : \"1.5\");\n          if (!inLoop) markRect.setAttribute(\"stroke-dasharray\", \"5 4\");\n          markRect.setAttribute(\"pointer-events\", \"none\");\n          practiceOverlay.appendChild(markRect);\n\n          if ((inLoop && mKey === loopStartKey) || (!state.practice.studyLoopEnabled && isAnchor)) {\n            const firstLoopItem = loopRange?.items?.[0];\n            const lastLoopItem = loopRange?.items?.[loopRange.items.length - 1];\n            const bText = inLoop\n              ? (loopRange.items.length > 1\n                  ? `🔁 c.${firstLoopItem.globalMeasureNum}–${lastLoopItem.globalMeasureNum}`\n                  : `🔁 c.${gNum}`)\n              : `▶ c.${gNum}`;\n            const bW = Math.max(46, bText.length * 6.8 + 12);\n            const bY = Math.max(2, sys.y - 17);\n            const bBg = document.createElementNS(NS, \"rect\");\n            bBg.setAttribute(\"x\", mx + 2); bBg.setAttribute(\"y\", bY);\n            bBg.setAttribute(\"width\", bW); bBg.setAttribute(\"height\", 16);\n            bBg.setAttribute(\"rx\", \"4\");\n            bBg.setAttribute(\"fill\", inLoop ? \"#a85d12\" : \"#0c6654\");\n            bBg.setAttribute(\"pointer-events\", \"none\");\n            practiceOverlay.appendChild(bBg);\n\n            const bLbl = document.createElementNS(NS, \"text\");\n            bLbl.setAttribute(\"x\", mx + 8); bLbl.setAttribute(\"y\", bY + 11.5);\n            bLbl.setAttribute(\"font-size\", \"10.5\"); bLbl.setAttribute(\"font-weight\", \"bold\");\n            bLbl.setAttribute(\"font-family\", \"sans-serif\"); bLbl.setAttribute(\"fill\", \"#ffffff\");\n            bLbl.setAttribute(\"pointer-events\", \"none\");\n            bLbl.textContent = bText;\n            practiceOverlay.appendChild(bLbl);\n          }\n        }\n\n        const hit = document.createElementNS(NS, \"rect\");\n        hit.setAttribute(\"x\", mx); hit.setAttribute(\"y\", sys.y);\n        hit.setAttribute(\"width\", mw); hit.setAttribute(\"height\", sys.h);\n        hit.setAttribute(\"fill\", \"transparent\");\n        hit.setAttribute(\"pointer-events\", \"all\");\n        hit.style.cursor = \"pointer\";\n        hit.dataset.anchorSysid = sys.id;\n        hit.dataset.anchorMidx = String(m);\n        hit.dataset.anchorGnum = String(gNum);\n        practiceOverlay.appendChild(hit);\n      }\n    }\n\n    for (let m = 0; m < measures; m++) {\n      drawMeasureSymbolsSvg(NS, sys, m, sys.x + m * mw, mw, showBoxes);\n    }\n  });\n\n  if (sysDrag && sysDrag.type === \"create\") {\n    const r = document.createElementNS(NS, \"rect\");\n    r.setAttribute(\"x\", sysDrag.x); r.setAttribute(\"y\", sysDrag.y);\n    r.setAttribute(\"width\", sysDrag.w); r.setAttribute(\"height\", sysDrag.h);\n    r.setAttribute(\"fill\", \"rgba(20,125,104,0.14)\");\n    r.setAttribute(\"stroke\", \"#147d68\"); r.setAttribute(\"stroke-width\", \"2\");\n    r.setAttribute(\"stroke-dasharray\", \"6 4\");\n    practiceOverlay.appendChild(r);\n  }\n\n  // Resaltado durante cuenta atrás (pre-inicio) o reproducción activa\n  if (playback.running && playback.plan.length > 0) {\n    const step = playback.plan[playback.cursor];\n    const cur = step?.item;\n    if (cur && cur.page === state.page) {\n      if (playback.countInRemaining > 0) {\n        const prepRect = document.createElementNS(NS, \"rect\");\n        prepRect.setAttribute(\"x\", cur.x); prepRect.setAttribute(\"y\", cur.y);\n        prepRect.setAttribute(\"width\", cur.w); prepRect.setAttribute(\"height\", cur.h);\n        prepRect.setAttribute(\"fill\", \"rgba(168, 93, 18, 0.14)\");\n        prepRect.setAttribute(\"stroke\", \"#a85d12\");\n        prepRect.setAttribute(\"stroke-width\", \"2.5\");\n        prepRect.setAttribute(\"stroke-dasharray\", \"5 3\");\n        prepRect.setAttribute(\"pointer-events\", \"none\");\n        practiceOverlay.appendChild(prepRect);\n      } else {\n        const beats = getTimeSigBeats(state.practice.timeSig);\n        const bw = cur.w / beats;\n        const bx = cur.x + playback.beatIdx * bw;\n\n        const mShade = document.createElementNS(NS, \"rect\");\n        mShade.setAttribute(\"x\", cur.x); mShade.setAttribute(\"y\", cur.y);\n        mShade.setAttribute(\"width\", cur.w); mShade.setAttribute(\"height\", cur.h);\n        mShade.setAttribute(\"fill\", \"rgba(20, 125, 104, 0.08)\");\n        mShade.setAttribute(\"stroke\", \"rgba(20, 125, 104, 0.35)\");\n        mShade.setAttribute(\"stroke-width\", \"1.5\");\n        mShade.setAttribute(\"pointer-events\", \"none\");\n        practiceOverlay.appendChild(mShade);\n\n        const bShade = document.createElementNS(NS, \"rect\");\n        bShade.setAttribute(\"x\", bx); bShade.setAttribute(\"y\", cur.y);\n        bShade.setAttribute(\"width\", bw); bShade.setAttribute(\"height\", cur.h);\n        bShade.setAttribute(\"fill\", \"rgba(20, 125, 104, 0.28)\");\n        bShade.setAttribute(\"pointer-events\", \"none\");\n        practiceOverlay.appendChild(bShade);\n      }\n    }\n  }\n}\n\npracticeOverlay.addEventListener(\"pointerdown\", (evt) => {\n  if (!practiceCalibrating || !state.pdfDoc) return;\n  const pt = svgPoint(evt, practiceOverlay);\n  const t = evt.target;\n  if (t.dataset && t.dataset.sysResize !== undefined) {\n    const idx = parseInt(t.dataset.sysResize);\n    const sys = getPageSystems(state.page)[idx];\n    if (!sys) return;\n    sysDrag = { type: \"resize\", idx, startX: pt.x, startY: pt.y, origW: sys.w, origH: sys.h };\n    practiceOverlay.setPointerCapture(evt.pointerId);\n    evt.preventDefault(); return;\n  }\n  if (t.dataset && t.dataset.sysIdx !== undefined) {\n    const idx = parseInt(t.dataset.sysIdx);\n    const sys = getPageSystems(state.page)[idx];\n    if (!sys) return;\n    const mIdx = Math.max(0, Math.min((sys.measures || 4) - 1, Math.floor((pt.x - sys.x) / (sys.w / (sys.measures || 4)))));\n    openSystemPopover(idx, mIdx);\n    sysDrag = { type: \"move\", idx, startX: pt.x, startY: pt.y, origX: sys.x, origY: sys.y };\n    practiceOverlay.setPointerCapture(evt.pointerId);\n    renderPracticeOverlay();\n    evt.preventDefault(); return;\n  }\n  closeSystemPopover();\n  sysDrag = { type: \"create\", startX: pt.x, startY: pt.y, x: pt.x, y: pt.y, w: 0, h: 0 };\n  practiceOverlay.setPointerCapture(evt.pointerId);\n  evt.preventDefault();\n});\n\npracticeOverlay.addEventListener(\"pointermove\", (evt) => {\n  if (!sysDrag) return;\n  const pt = svgPoint(evt, practiceOverlay);\n  const systems = getPageSystems(state.page);\n  if (sysDrag.type === \"create\") {\n    sysDrag.x = Math.min(sysDrag.startX, pt.x);\n    sysDrag.y = Math.min(sysDrag.startY, pt.y);\n    sysDrag.w = Math.abs(pt.x - sysDrag.startX);\n    sysDrag.h = Math.abs(pt.y - sysDrag.startY);\n  } else if (sysDrag.type === \"move\") {\n    const sys = systems[sysDrag.idx];\n    if (sys) {\n      sys.x = Math.max(0, sysDrag.origX + (pt.x - sysDrag.startX));\n      sys.y = Math.max(0, sysDrag.origY + (pt.y - sysDrag.startY));\n    }\n  } else if (sysDrag.type === \"resize\") {\n    const sys = systems[sysDrag.idx];\n    if (sys) {\n      sys.w = Math.max(40, sysDrag.origW + (pt.x - sysDrag.startX));\n      sys.h = Math.max(24, sysDrag.origH + (pt.y - sysDrag.startY));\n    }\n  }\n  renderPracticeOverlay();\n});\n\npracticeOverlay.addEventListener(\"pointerup\", () => {\n  if (!sysDrag) return;\n  const pObj = getPageSystemsObj(state.page);\n  const systems = pObj.systems;\n  if (sysDrag.type === \"create\") {\n    if (sysDrag.w >= 40 && sysDrag.h >= 20) {\n      const mCount = state.lastCalibratedMeasures || 4;\n      const newSys = {\n        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,\n        x: Math.round(sysDrag.x), y: Math.round(sysDrag.y),\n        w: Math.round(sysDrag.w), h: Math.round(sysDrag.h),\n        measures: mCount,\n        repeatCount: 2,\n        measureMarks: {},\n      };\n      systems.push(newSys);\n      syncPageSystemsOrderIfAuto(state.page);\n      setDirty(true);\n      openSystemPopover(systems.indexOf(newSys), 0);\n    }\n  } else {\n    const movedSys = systems[sysDrag.idx];\n    syncPageSystemsOrderIfAuto(state.page);\n    if (movedSys && selectedSystemIdx >= 0) {\n      openSystemPopover(systems.indexOf(movedSys), Math.max(0, selectedMeasureIdx));\n    }\n    setDirty(true);\n  }\n  sysDrag = null;\n  renderPracticeOverlay();\n});\npracticeOverlay.addEventListener(\"pointercancel\", () => { sysDrag = null; renderPracticeOverlay(); });\n\n// Clic directo en compás en Modo Practicar (priorizando enlaces web de etiquetas Lxx)\npracticeOverlay.addEventListener(\"click\", (evt) => {\n  if (state.mode !== \"practice\" || practiceCalibrating || !state.pdfDoc) return;\n\n  if (state.loopTargetUrl) {\n    const pt = svgPoint(evt, overlay);\n    for (const lbl of overlay.querySelectorAll(\".loop-label\")) {\n      const b = getBBox(lbl);\n      if (pt.x >= b.x && pt.x <= b.x + b.width && pt.y >= b.y && pt.y <= b.y + b.height) {\n        openExternalUrl(state.loopTargetUrl);\n        evt.preventDefault(); evt.stopPropagation();\n        return;\n      }\n    }\n  }\n\n  const t = evt.target;\n  if (!t || !t.dataset || !t.dataset.anchorSysid) return;\n  const sysId = t.dataset.anchorSysid;\n  const mIdx = parseInt(t.dataset.anchorMidx, 10) || 0;\n  const gNum = parseInt(t.dataset.anchorGnum, 10) || (mIdx + 1);\n\n  state.practice.anchorSysId = sysId;\n  state.practice.anchorMeasureIdx = mIdx;\n  wasPausedMidway = false;\n\n  if (playback.running) {\n    if (state.practice.studyLoopEnabled) {\n      rebuildActivePracticeLoop(true);\n    } else {\n      const tlIdx = playback.plan.findIndex(\n        step => step.item.sysId === sysId && step.item.measureIdx === mIdx\n      );\n      if (tlIdx >= 0) {\n        playback.cursor = tlIdx;\n        playback.beatIdx = 0;\n        playback.countInRemaining = 0;\n      }\n    }\n  }\n\n  renderPracticeOverlay();\n  updatePracticeReadout();\n\n  if (state.practice.studyLoopEnabled) {\n    const tl = buildPracticeTimeline();\n    const r = getStudyLoopRange(tl);\n    if (r && r.items.length > 0) {\n      const a = r.items[0].globalMeasureNum;\n      const b = r.items[r.items.length - 1].globalMeasureNum;\n      showToast(a === b ? `Bucle fijado en compás c.${a}` : `Bucle fijado: c.${a}–c.${b} (${r.items.length} comp.)`);\n      return;\n    }\n  }\n  showToast(`Inicio fijado en compás c.${gNum}`);\n});\n\nfunction updatePracticeReadout() {\n  const el = document.getElementById(\"practiceBeatReadout\");\n  const fsEl = document.getElementById(\"fsReadout\");\n  el.classList.remove(\"pedal-wait\", \"countin-flag\");\n  let txt = \"Listo\";\n  if (playback.waitingForPedal) {\n    txt = \"Esperando pedal (pág. sig.)\";\n    el.classList.add(\"pedal-wait\");\n  } else if (playback.running && playback.countInRemaining > 0) {\n    const beats = getTimeSigBeats(state.practice.timeSig);\n    txt = `Prepárate: c.${playback.countInBar}/${state.practice.countInBars} · ${playback.countInBeat + 1}/${beats}`;\n    el.classList.add(\"countin-flag\");\n  } else if (playback.running) {\n    const beats = getTimeSigBeats(state.practice.timeSig);\n    const step = playback.plan[playback.cursor];\n    const lapPrefix = state.practice.studyLoopEnabled ? `🔁 V${playback.loopLap || 1} · ` : \"\";\n    if (step?.item) {\n      const cur = step.item;\n      txt = `${lapPrefix}Pág. ${cur.page} · S${cur.globalSysNum} · c.${cur.globalMeasureNum} · ${playback.beatIdx + 1}/${beats}`;\n    } else {\n      txt = `${lapPrefix}Metrónomo (${state.practice.bpm} BPM) · ${playback.beatIdx + 1}/${beats}`;\n    }\n  } else if (state.practice.studyLoopEnabled) {\n    const tl = buildPracticeTimeline();\n    const r = getStudyLoopRange(tl);\n    if (r && r.items.length > 0) {\n      const a = r.items[0].globalMeasureNum;\n      const b = r.items[r.items.length - 1].globalMeasureNum;\n      txt = a === b ? `🔁 Bucle c.${a}` : `🔁 Bucle c.${a}–c.${b}`;\n    } else {\n      txt = \"🔁 Bucle (calibra sistemas)\";\n    }\n  }\n  el.textContent = txt;\n  fsEl.textContent = txt;\n}\n\nfunction scrollSystemIntoViewIfNeeded(item, forceAlign = false) {\n  if (!item) return;\n  const overlayRect = practiceOverlay.getBoundingClientRect();\n  const vbH = practiceOverlay.viewBox.baseVal.height || 1;\n  if (overlayRect.height <= 0 || vbH <= 0) return;\n  const scaleY = overlayRect.height / vbH;\n  const sysTopViewport = overlayRect.top + item.y * scaleY;\n  const sysBottomViewport = overlayRect.top + (item.y + item.h) * scaleY;\n  const isFs = document.body.classList.contains(\"practice-fullscreen\");\n  const tbRect = document.getElementById(\"toolbar\")?.getBoundingClientRect();\n  const pBarRect = document.getElementById(\"practiceBar\")?.getBoundingClientRect();\n  const headerBottom = isFs ? 14 : (Math.max(tbRect?.bottom || 0, pBarRect?.bottom || 0, 0) + 14);\n  const footerSafe = isFs ? 68 : 28;\n  const isChunks = state.practice.viewMode === \"chunks\";\n  if (forceAlign || sysBottomViewport > window.innerHeight - footerSafe || sysTopViewport < headerBottom) {\n    const margin = isChunks ? 18 : 24;\n    const targetDocY = window.scrollY + sysTopViewport - headerBottom - margin;\n    window.scrollTo({ top: Math.max(0, targetDocY), behavior: \"smooth\" });\n  }\n}\n\nasync function advanceBeatTick() {\n  if (!playback.running || playback.waitingForPedal || playback.advancing) return;\n  playback.advancing = true;\n  try {\n    const beats = getTimeSigBeats(state.practice.timeSig);\n\n    // Fase de cuenta atrás (2 compases previos por defecto)\n    if (playback.countInRemaining > 0) {\n      playMetronomeClick(playback.countInBeat, state.practice.timeSig, true);\n      if (playback.plan.length > 0) {\n        const cur = playback.plan[playback.cursor]?.item;\n        if (cur && cur.page === state.page) scrollSystemIntoViewIfNeeded(cur);\n      }\n      renderPracticeOverlay();\n      updatePracticeReadout();\n      playback.countInRemaining--;\n      playback.countInBeat++;\n      if (playback.countInBeat >= beats) {\n        playback.countInBeat = 0;\n        playback.countInBar++;\n      }\n      return;\n    }\n\n    // Si en el pulso anterior finalizó la obra, detenemos ahora (tras respetar todo el último pulso visualmente)\n    if (playback.finishStopPending) {\n      const reason = playback.finishStopPending;\n      playback.finishStopPending = null;\n      state.practice.anchorSysId = null;\n      state.practice.anchorMeasureIdx = 0;\n      stopPracticePlayback();\n      showToast(reason === \"fine\" ? \"Fine · Fin de la partitura\" : \"Fin de la práctica\");\n      return;\n    }\n\n    // Cambio de página diferido al inicio del primer pulso del nuevo compás (también al reiniciar vuelta de bucle)\n    let pageChanged = false;\n    if (playback.plan.length > 0) {\n      const cur = playback.plan[playback.cursor]?.item;\n      if (cur && cur.page !== state.page) {\n        if (!state.practice.studyLoopEnabled && state.practice.advanceMode === \"manual\") {\n          playback.waitingForPedal = true;\n          clearInterval(playback.timerId);\n          playback.timerId = null;\n          updatePracticeReadout();\n          return;\n        }\n        await renderPage(cur.page);\n        if (!playback.running) return;\n        pageChanged = true;\n      }\n      if (cur && cur.page === state.page) scrollSystemIntoViewIfNeeded(cur, pageChanged);\n    }\n\n    playMetronomeClick(playback.beatIdx, state.practice.timeSig);\n    renderPracticeOverlay();\n    updatePracticeReadout();\n\n    // Avanzar punteros internos DESPUÉS de dibujar el pulso actual (sin sobrescribir el último pulso del bucle ni cambiar de página antes de tiempo)\n    playback.beatIdx++;\n    if (playback.beatIdx < beats) return;\n\n    playback.beatIdx = 0;\n    if (playback.plan.length === 0) return;\n\n    const prevStep = playback.plan[playback.cursor];\n    const nextCursor = playback.cursor + 1;\n    if (nextCursor >= playback.plan.length) {\n      if (state.practice.studyLoopEnabled && playback.plan.length > 0) {\n        playback.loopLap = (playback.loopLap || 1) + 1;\n        const stepBpm = Number(state.practice.progBpmStep) || 0;\n        if (stepBpm > 0 && state.practice.bpm < 240) {\n          state.practice.bpm = Math.min(240, state.practice.bpm + stepBpm);\n          const bpmInput = document.getElementById(\"practiceBpm\");\n          if (bpmInput) bpmInput.value = String(state.practice.bpm);\n          restartPracticeTimerIfRunning();\n        }\n        playback.cursor = 0;\n        return;\n      }\n\n      playback.finishStopPending = prevStep?.endedByFine ? \"fine\" : \"end\";\n      return;\n    }\n\n    playback.cursor = nextCursor;\n  } finally {\n    playback.advancing = false;\n  }\n}\n\nfunction syncPlayButtonsUI(isRunning, isPaused = false) {\n  const playBtn = document.getElementById(\"practicePlayBtn\");\n  const fsBtn = document.getElementById(\"fsPlayBtn\");\n  const mobPlayBtn = document.getElementById(\"mobPlayBtn\");\n  if (isRunning) {\n    playBtn.textContent = \"⏸ Pausar\";\n    playBtn.classList.add(\"active\");\n    fsBtn.textContent = \"⏸ Pausar\";\n    if (mobPlayBtn) {\n      mobPlayBtn.textContent = \"⏸\";\n      mobPlayBtn.classList.add(\"active\");\n    }\n  } else {\n    const lbl = isPaused ? \"▶ Reanudar\" : \"▶ Practicar\";\n    playBtn.textContent = lbl;\n    playBtn.classList.remove(\"active\");\n    fsBtn.textContent = lbl;\n    if (mobPlayBtn) {\n      mobPlayBtn.textContent = \"▶\";\n      mobPlayBtn.classList.remove(\"active\");\n    }\n  }\n}\n\nfunction rebuildActivePracticeLoop(resetCursor = false) {\n  const currentStep = playback.plan[playback.cursor];\n  playback.timeline = buildPracticeTimeline();\n  playback.plan = buildEffectivePlaybackPlan(playback.timeline);\n  if (resetCursor || state.practice.studyLoopEnabled) {\n    playback.cursor = 0;\n    playback.beatIdx = 0;\n    playback.loopLap = 1;\n    playback.finishStopPending = null;\n  } else if (currentStep?.item) {\n    const matchIdx = playback.plan.findIndex(\n      s => s.item.sysId === currentStep.item.sysId && s.item.measureIdx === currentStep.item.measureIdx\n    );\n    playback.cursor = matchIdx >= 0 ? matchIdx : 0;\n  } else {\n    playback.cursor = 0;\n  }\n  renderPracticeOverlay();\n  updatePracticeReadout();\n}\n\nasync function startPracticePlayback(isResume = false) {\n  if (!state.pdfDoc) return;\n  if (practiceCalibrating) setCalibrating(false);\n  closeMobileMenu();\n  const beats = getTimeSigBeats(state.practice.timeSig);\n  if (!isResume) {\n    playback.timeline = buildPracticeTimeline();\n    playback.plan = buildEffectivePlaybackPlan(playback.timeline);\n    playback.loopLap = 1;\n    playback.finishStopPending = null;\n    if (playback.plan.length > 0) {\n      if (state.practice.studyLoopEnabled) {\n        playback.cursor = 0;\n      } else if (state.practice.anchorSysId) {\n        const anchorPos = playback.plan.findIndex(\n          s => s.item.sysId === state.practice.anchorSysId && s.item.measureIdx === (state.practice.anchorMeasureIdx || 0)\n        );\n        const onPage = playback.plan.findIndex(step => step.item.page === state.page);\n        playback.cursor = anchorPos >= 0 ? anchorPos : (onPage >= 0 ? onPage : 0);\n      } else {\n        const firstOnPage = playback.plan.findIndex(step => step.item.page === state.page);\n        playback.cursor = firstOnPage >= 0 ? firstOnPage : 0;\n      }\n    } else {\n      playback.cursor = 0;\n    }\n    playback.beatIdx = 0;\n    playback.countInRemaining = (state.practice.countInBars || 0) * beats;\n    playback.countInBar = 1;\n    playback.countInBeat = 0;\n  }\n  playback.waitingForPedal = false;\n  playback.advancing = false;\n  playback.running = true;\n  syncPlayButtonsUI(true);\n\n  const curItem = playback.plan[playback.cursor]?.item;\n  if (curItem && curItem.page !== state.page) {\n    await renderPage(curItem.page);\n    if (!playback.running) return;\n  }\n  if (curItem) scrollSystemIntoViewIfNeeded(curItem, true);\n\n  if (playback.timerId) clearInterval(playback.timerId);\n  const intervalMs = Math.round(60000 / Math.max(35, Math.min(240, state.practice.bpm)));\n  advanceBeatTick();\n  playback.timerId = setInterval(advanceBeatTick, intervalMs);\n}\n\nlet wasPausedMidway = false;\nfunction pauseOrResumePractice() {\n  if (!state.pdfDoc) return;\n  if (!playback.running) {\n    startPracticePlayback(wasPausedMidway);\n    wasPausedMidway = false;\n    return;\n  }\n  if (playback.timerId) {\n    clearInterval(playback.timerId);\n    playback.timerId = null;\n    playback.running = false;\n    wasPausedMidway = true;\n    syncPlayButtonsUI(false, true);\n    renderPracticeOverlay();\n    updatePracticeReadout();\n  }\n}\n\nfunction stopPracticePlayback() {\n  if (playback.timerId) clearInterval(playback.timerId);\n  playback.timerId = null;\n  playback.running = false;\n  playback.advancing = false;\n  playback.waitingForPedal = false;\n  playback.finishStopPending = null;\n  wasPausedMidway = false;\n  playback.cursor = 0;\n  playback.beatIdx = 0;\n  playback.loopLap = 1;\n  playback.countInRemaining = 0;\n  syncPlayButtonsUI(false, false);\n  renderPracticeOverlay();\n  updatePracticeReadout();\n}\n\nasync function resetPracticePlayback() {\n  state.practice.anchorSysId = null;\n  state.practice.anchorMeasureIdx = 0;\n  stopPracticePlayback();\n  if (!state.pdfDoc) return;\n  if (state.page !== 1) {\n    await renderPage(1, { fromNav: true });\n  } else {\n    renderPracticeOverlay();\n    updatePracticeReadout();\n  }\n  window.scrollTo({ top: 0, behavior: \"smooth\" });\n}\n\nfunction restartPracticeTimerIfRunning() {\n  if (!playback.running || playback.waitingForPedal) return;\n  clearInterval(playback.timerId);\n  const intervalMs = Math.round(60000 / Math.max(35, Math.min(240, state.practice.bpm)));\n  playback.timerId = setInterval(advanceBeatTick, intervalMs);\n}\n\nfunction toggleStudyLoop() {\n  if (!state.pdfDoc) return;\n  const tl = buildPracticeTimeline();\n  if (!state.practice.studyLoopEnabled && tl.length === 0) {\n    showToast(\"Calibra o detecta primero los sistemas de la página.\");\n    return;\n  }\n  state.practice.studyLoopEnabled = !state.practice.studyLoopEnabled;\n  if (state.practice.studyLoopEnabled && !state.practice.anchorSysId && tl.length > 0) {\n    const firstOnPage = tl.find(it => it.page === state.page) || tl[0];\n    state.practice.anchorSysId = firstOnPage.sysId;\n    state.practice.anchorMeasureIdx = firstOnPage.measureIdx;\n  } else if (!state.practice.studyLoopEnabled) {\n    state.practice.anchorSysId = null;\n    state.practice.anchorMeasureIdx = 0;\n    wasPausedMidway = false;\n    if (!playback.running) {\n      playback.cursor = 0;\n      playback.beatIdx = 0;\n    }\n  }\n  syncPracticeControlsFromState();\n  if (playback.running) {\n    rebuildActivePracticeLoop(state.practice.studyLoopEnabled);\n  } else {\n    renderPracticeOverlay();\n    updatePracticeReadout();\n  }\n  if (state.practice.studyLoopEnabled) {\n    const r = getStudyLoopRange(tl);\n    if (r && r.items.length > 0) {\n      const a = r.items[0].globalMeasureNum;\n      const b = r.items[r.items.length - 1].globalMeasureNum;\n      showToast(a === b ? `Bucle activado en compás c.${a} (haz clic en otro compás para cambiar)` : `Bucle activado: c.${a}–c.${b}`);\n    }\n  } else {\n    showToast(\"Bucle de estudio desactivado\");\n  }\n}\n\nasync function pedalNextStep() {\n  if (!state.pdfDoc) return;\n  if (playback.waitingForPedal) {\n    const nextItem = playback.plan[playback.cursor]?.item;\n    playback.waitingForPedal = false;\n    if (nextItem && nextItem.page !== state.page) await renderPage(nextItem.page);\n    if (nextItem) scrollSystemIntoViewIfNeeded(nextItem, true);\n    playback.running = true;\n    const intervalMs = Math.round(60000 / Math.max(35, Math.min(240, state.practice.bpm)));\n    advanceBeatTick();\n    playback.timerId = setInterval(advanceBeatTick, intervalMs);\n    return;\n  }\n  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;\n  if (maxScroll > 24 && window.scrollY + 24 < maxScroll) {\n    const step = Math.max(180, Math.round(window.innerHeight * 0.65));\n    window.scrollTo({ top: Math.min(maxScroll, window.scrollY + step), behavior: \"smooth\" });\n    return;\n  }\n  if (state.page < state.pageCount) {\n    await renderPage(state.page + 1);\n    window.scrollTo({ top: 0, behavior: \"smooth\" });\n  }\n}\n\nasync function pedalPrevStep() {\n  if (!state.pdfDoc) return;\n  if (window.scrollY > 24) {\n    const step = Math.max(180, Math.round(window.innerHeight * 0.65));\n    window.scrollTo({ top: Math.max(0, window.scrollY - step), behavior: \"smooth\" });\n    return;\n  }\n  if (state.page > 1) {\n    await renderPage(state.page - 1);\n    window.scrollTo({ top: 0, behavior: \"smooth\" });\n  }\n}\n\ndocument.getElementById(\"practicePlayBtn\").addEventListener(\"click\", pauseOrResumePractice);\ndocument.getElementById(\"practiceStopBtn\").addEventListener(\"click\", resetPracticePlayback);\ndocument.getElementById(\"practiceLoopBtn\").addEventListener(\"click\", toggleStudyLoop);\ndocument.getElementById(\"pedalNextBtn\").addEventListener(\"click\", pedalNextStep);\ndocument.getElementById(\"pedalPrevBtn\").addEventListener(\"click\", pedalPrevStep);\n\ndocument.getElementById(\"fsPlayBtn\").addEventListener(\"click\", pauseOrResumePractice);\ndocument.getElementById(\"fsStopBtn\").addEventListener(\"click\", resetPracticePlayback);\ndocument.getElementById(\"fsLoopBtn\").addEventListener(\"click\", toggleStudyLoop);\ndocument.getElementById(\"fsPedalNext\").addEventListener(\"click\", pedalNextStep);\ndocument.getElementById(\"fsPedalPrev\").addEventListener(\"click\", pedalPrevStep);\n\n/* ============ BARRA RÁPIDA MÓVIL (v11.0) ============ */\ndocument.getElementById(\"mobMenuToggle\").addEventListener(\"click\", () => {\n  const willOpen = !document.body.classList.contains(\"mobile-menu-open\");\n  document.body.classList.toggle(\"mobile-menu-open\", willOpen);\n  const btn = document.getElementById(\"mobMenuToggle\");\n  btn.setAttribute(\"aria-expanded\", willOpen ? \"true\" : \"false\");\n  btn.textContent = willOpen ? \"✕ Menú\" : \"☰ Menú\";\n  btn.classList.toggle(\"active\", willOpen);\n});\ndocument.getElementById(\"mobPrevPage\").addEventListener(\"click\", () => document.getElementById(\"prevPage\").click());\ndocument.getElementById(\"mobNextPage\").addEventListener(\"click\", () => document.getElementById(\"nextPage\").click());\ndocument.getElementById(\"mobUndoBtn\").addEventListener(\"click\", () => history.undo());\ndocument.getElementById(\"mobPlayBtn\").addEventListener(\"click\", pauseOrResumePractice);\ndocument.getElementById(\"mobLoopBtn\").addEventListener(\"click\", toggleStudyLoop);\ndocument.getElementById(\"mobFullscreenBtn\").addEventListener(\"click\", () => {\n  if (!state.pdfDoc) return;\n  closeMobileMenu();\n  setPracticeFullscreen(true);\n});\ndocument.getElementById(\"mobModeToggle\").addEventListener(\"click\", () => {\n  setAppMode(state.mode === \"edit\" ? \"practice\" : \"edit\");\n});\nstageFrame.addEventListener(\"pointerdown\", () => {\n  if (document.body.classList.contains(\"mobile-menu-open\")) closeMobileMenu();\n});\n[\"openLibraryBtn\",\"openPdfBtn\",\"openProject\",\"openSettings\",\"createChord\",\"insertChord\",\"toggleCalibrateBtn\",\"autoDetectSystemsBtn\",\"practiceFullscreenBtn\"].forEach(id => {\n  document.getElementById(id)?.addEventListener(\"click\", () => closeMobileMenu());\n});\ndocument.querySelectorAll(\"[data-tool]\").forEach(btn => {\n  btn.addEventListener(\"click\", () => closeMobileMenu());\n});\n\nconst practiceLoopCountEl = document.getElementById(\"practiceLoopCount\");\npracticeLoopCountEl.addEventListener(\"input\", () => {\n  const raw = practiceLoopCountEl.value.trim();\n  if (!raw) return;\n  const parsed = parseInt(raw, 10);\n  if (Number.isNaN(parsed) || parsed < 1) return;\n  state.practice.loopCount = Math.min(32, parsed);\n  setDirty(true);\n  if (playback.running && state.practice.studyLoopEnabled) rebuildActivePracticeLoop(true);\n  else {\n    renderPracticeOverlay();\n    updatePracticeReadout();\n  }\n});\npracticeLoopCountEl.addEventListener(\"blur\", () => {\n  practiceLoopCountEl.value = String(state.practice.loopCount || 1);\n});\n\ndocument.getElementById(\"practiceProgBpm\").addEventListener(\"change\", (e) => {\n  state.practice.progBpmStep = parseInt(e.target.value, 10) || 0;\n  setDirty(true);\n});\n\ndocument.getElementById(\"practiceTimeSig\").addEventListener(\"change\", (e) => {\n  state.practice.timeSig = e.target.value;\n  playback.beatIdx = 0;\n  setDirty(true);\n  updatePracticeReadout();\n  renderPracticeOverlay();\n});\ndocument.getElementById(\"practiceBpm\").addEventListener(\"input\", (e) => {\n  const raw = e.target.value.trim();\n  if (!raw) return;\n  const parsed = parseInt(raw, 10);\n  if (Number.isNaN(parsed) || parsed < 35) return;\n  state.practice.bpm = Math.min(240, parsed);\n  setDirty(true);\n  restartPracticeTimerIfRunning();\n  updatePracticeReadout();\n});\ndocument.getElementById(\"practiceBpm\").addEventListener(\"blur\", (e) => {\n  e.target.value = String(state.practice.bpm || 90);\n});\ndocument.getElementById(\"practiceCountIn\").addEventListener(\"change\", (e) => {\n  state.practice.countInBars = Math.max(0, Math.min(2, parseInt(e.target.value) || 0));\n  setDirty(true);\n});\ndocument.getElementById(\"practiceMetronomeBtn\").addEventListener(\"click\", () => {\n  state.practice.metronome = !state.practice.metronome;\n  syncPracticeControlsFromState();\n  setDirty(true);\n});\ndocument.getElementById(\"practiceViewMode\").addEventListener(\"change\", (e) => {\n  state.practice.viewMode = e.target.value;\n  setDirty(true);\n});\ndocument.getElementById(\"practiceAdvanceMode\").addEventListener(\"change\", (e) => {\n  state.practice.advanceMode = e.target.value;\n  setDirty(true);\n});\ndocument.getElementById(\"settingPedalMode\").addEventListener(\"change\", (e) => {\n  state.practice.pedalKey = e.target.value;\n  setDirty(true);\n});\n\n/* ============ AJUSTES Y AYUDA ============ */\nconst settingsModal = document.getElementById(\"settingsModal\");\nconst settingLoopUrlInput = document.getElementById(\"settingLoopUrl\");\n\nfunction renderCustomChordsManager() {\n  const container = document.getElementById(\"customChordsManager\");\n  container.innerHTML = \"\";\n  const names = Object.keys(savedCustomChords);\n  if (names.length === 0) {\n    const empty = document.createElement(\"span\");\n    empty.className = \"settings-desc\";\n    empty.style.margin = \"0\";\n    empty.textContent = \"No tienes acordes personalizados guardados todavía.\";\n    container.appendChild(empty);\n    return;\n  }\n  names.forEach(name => {\n    const chip = document.createElement(\"span\");\n    chip.className = \"custom-chord-item\";\n    const label = document.createElement(\"span\");\n    label.textContent = name;\n    const btn = document.createElement(\"button\");\n    btn.type = \"button\";\n    btn.title = `Eliminar ${name}`;\n    btn.textContent = \"×\";\n    btn.addEventListener(\"click\", () => deleteCustomChord(name));\n    chip.append(label, btn);\n    container.appendChild(chip);\n  });\n}\n\nfunction updateScoreSummary() {\n  const summary = document.getElementById(\"scoreSummary\");\n  if (!state.pdfDoc) {\n    summary.textContent = \"No hay ningún PDF cargado todavía.\";\n    return;\n  }\n  saveCurrentPageAnnotations();\n  let loopCount = 0;\n  let sysCount = 0;\n  let cutCount = 0;\n  const parser = new DOMParser();\n  for (let p = 1; p <= state.pageCount; p++) {\n    const markup = p === state.page ? overlay.innerHTML : (state.pageSvgCache[p] || \"\");\n    if (markup) {\n      const doc = parser.parseFromString(`<svg xmlns=\"http://www.w3.org/2000/svg\">${markup}</svg>`, \"image/svg+xml\");\n      loopCount += doc.querySelectorAll(\".loop-label\").length;\n    }\n    sysCount += getPageSystems(p).length;\n    cutCount += (state.pageSpaceCuts[p] || []).length;\n  }\n  summary.textContent = `Archivo: ${state.sourcePdfName} · ${state.pageCount} pág. · ${loopCount} bucle(s) · ${sysCount} sistema(s) · ${cutCount} espacio(s) añadido(s).`;\n}\n\nfunction switchSettingsTab(tabName) {\n  document.querySelectorAll(\".modal-tab\").forEach(tab => {\n    const active = tab.dataset.settingsTab === tabName;\n    tab.classList.toggle(\"active\", active);\n    tab.setAttribute(\"aria-selected\", active ? \"true\" : \"false\");\n  });\n  document.querySelectorAll(\".settings-tab-panel\").forEach(panel => {\n    panel.style.display = panel.id === `tab-${tabName}` ? \"block\" : \"none\";\n  });\n}\n\nfunction openSettingsModal(initialTab = \"score\") {\n  settingLoopUrlInput.value = state.loopTargetUrl || \"\";\n  document.getElementById(\"loopUrlValidation\").textContent = \"\";\n  updateScoreSummary();\n  renderCustomChordsManager();\n  switchSettingsTab(initialTab);\n  settingsModal.classList.add(\"open\");\n}\n\nfunction closeSettingsModal() { settingsModal.classList.remove(\"open\"); }\n\ndocument.getElementById(\"openSettings\").addEventListener(\"click\", () => openSettingsModal(\"score\"));\ndocument.getElementById(\"settingsClose\").addEventListener(\"click\", closeSettingsModal);\ndocument.getElementById(\"settingsDone\").addEventListener(\"click\", closeSettingsModal);\nsettingsModal.addEventListener(\"click\", (e) => { if (e.target === settingsModal) closeSettingsModal(); });\nloopModal.addEventListener(\"click\", (e) => { if (e.target === loopModal) closeLoopModal(); });\n\ndocument.querySelectorAll(\".modal-tab\").forEach(tab => {\n  tab.addEventListener(\"click\", () => switchSettingsTab(tab.dataset.settingsTab));\n});\n\nfunction applyLoopUrlFromInput() {\n  const raw = settingLoopUrlInput.value.trim();\n  const validation = document.getElementById(\"loopUrlValidation\");\n  if (!raw) {\n    state.loopTargetUrl = \"\";\n    validation.textContent = \"Sin URL: las etiquetas de bucle serán texto plano.\";\n    validation.style.color = \"var(--muted)\";\n    refreshAllLoopLabelsAppearance();\n    if (state.pdfDoc) setDirty(true);\n    return;\n  }\n  const normalized = normalizeLoopUrl(raw);\n  if (!isValidHttpUrl(normalized)) {\n    validation.textContent = \"Introduce una dirección web válida (ej. https://mi-web.com/cancion).\";\n    validation.style.color = \"var(--danger)\";\n    return;\n  }\n  state.loopTargetUrl = normalized;\n  validation.textContent = `Enlace activo para esta partitura: ${normalized}`;\n  validation.style.color = \"var(--accent-dark)\";\n  refreshAllLoopLabelsAppearance();\n  if (state.pdfDoc) setDirty(true);\n}\nsettingLoopUrlInput.addEventListener(\"input\", applyLoopUrlFromInput);\nsettingLoopUrlInput.addEventListener(\"blur\", () => { if (state.loopTargetUrl) settingLoopUrlInput.value = state.loopTargetUrl; });\ndocument.getElementById(\"clearLoopUrlBtn\").addEventListener(\"click\", () => { settingLoopUrlInput.value = \"\"; applyLoopUrlFromInput(); });\ndocument.getElementById(\"testLoopUrlBtn\").addEventListener(\"click\", () => {\n  applyLoopUrlFromInput();\n  if (state.loopTargetUrl) openExternalUrl(state.loopTargetUrl);\n  else showToast(\"Escribe primero una URL válida.\");\n});\n\ndocument.getElementById(\"resetPageCutsBtn\").addEventListener(\"click\", async () => {\n  if (!state.pdfDoc) return;\n  const cuts = state.pageSpaceCuts[state.page] || [];\n  if (cuts.length === 0) {\n    showToast(\"Esta página no tiene espacios añadidos.\");\n    return;\n  }\n  // Revertir en orden inverso cada corte sobre anotaciones y sistemas\n  for (let i = cuts.length - 1; i >= 0; i--) {\n    const cut = cuts[i];\n    const threshold = cut.y + cut.delta;\n    Array.from(overlay.children).forEach(el => {\n      if (el.classList?.contains(\"sel-rect\") || el.classList?.contains(\"sel-handle\") || el.classList?.contains(\"inline-editor-host\")) return;\n      const snap = snapshot(el);\n      if (!snap) return;\n      if ([\"chord\", \"finger\", \"loop\", \"text\", \"rect\", \"block\", \"hole\"].includes(snap.kind)) {\n        const refY = snap.kind === \"text\" ? snap.y - (snap.size || 14) * 0.8 : snap.y;\n        if (refY >= threshold) {\n          snap.y = Math.max(0, snap.y - cut.delta);\n          applySnapshot(el, snap);\n        }\n      } else if (snap.kind === \"line\") {\n        if (snap.y1 >= threshold) snap.y1 = Math.max(0, snap.y1 - cut.delta);\n        if (snap.y2 >= threshold) snap.y2 = Math.max(0, snap.y2 - cut.delta);\n        applySnapshot(el, snap);\n      }\n    });\n    getPageSystems(state.page).forEach(sys => {\n      if (sys.y >= threshold) sys.y = Math.max(0, sys.y - cut.delta);\n    });\n  }\n  state.pageSpaceCuts[state.page] = [];\n  if (history.byPage[state.page]) {\n    history.byPage[state.page].undoStack = history.byPage[state.page].undoStack.filter(a => a.type !== \"space-cut\");\n    history.byPage[state.page].redoStack = history.byPage[state.page].redoStack.filter(a => a.type !== \"space-cut\");\n  }\n  if (selectedEl) refreshSelectionBox();\n  setDirty(true);\n  await renderPage(state.page, { preserveOverlay: true });\n  updateScoreSummary();\n  showToast(\"Espacios añadidos eliminados de esta página\");\n});\n\ndocument.getElementById(\"resetPrefsBtn\").addEventListener(\"click\", () => {\n  Object.entries(DEFAULT_PREFS).forEach(([id, val]) => {\n    const el = document.getElementById(id);\n    if (el) el.value = val;\n  });\n  savePrefs();\n  onQualityChange();\n  showToast(\"Estilos restablecidos\");\n});\n\n/* ============ ATAJOS DE TECLADO ============ */\ndocument.getElementById(\"undo\").addEventListener(\"click\", () => history.undo());\ndocument.getElementById(\"redo\").addEventListener(\"click\", () => history.redo());\n\ndocument.addEventListener(\"keydown\", (e) => {\n  if (e.key === \"Escape\") {\n    if (document.body.classList.contains(\"practice-fullscreen\")) { setPracticeFullscreen(false); return; }\n    if (libraryModal.classList.contains(\"open\")) { closeLibraryModal(); return; }\n    if (settingsModal.classList.contains(\"open\")) { closeSettingsModal(); return; }\n    if (loopModal.classList.contains(\"open\")) { closeLoopModal(); return; }\n    if (chordEditor.style.display === \"block\") { document.getElementById(\"chordEditorCancel\").click(); return; }\n    if (chordPanel.style.display === \"block\") { chordPanel.style.display = \"none\"; return; }\n    if (practiceCalibrating) { setCalibrating(false); return; }\n    if (hasPendingPlacement()) { clearPendingPlacement(); showToast(\"Inserción cancelada\"); return; }\n    clearSelection();\n    return;\n  }\n\n  const target = e.target;\n  const isTyping = target instanceof HTMLElement && (\n    target.isContentEditable || [\"INPUT\", \"TEXTAREA\", \"SELECT\"].includes(target.tagName)\n  );\n  if (isTyping) return;\n\n  if (state.mode === \"practice\" && state.pdfDoc) {\n    if (e.key === \"PageDown\" || e.key === \"ArrowRight\") { e.preventDefault(); pedalNextStep(); return; }\n    if (e.key === \"PageUp\" || e.key === \"ArrowLeft\") { e.preventDefault(); pedalPrevStep(); return; }\n    if (e.key === \" \" || e.code === \"Space\") {\n      e.preventDefault();\n      if (state.practice.pedalKey === \"space_next\") pedalNextStep();\n      else pauseOrResumePractice();\n      return;\n    }\n    if (e.key === \"Enter\" && state.practice.pedalKey === \"enter_next\") {\n      e.preventDefault(); pedalNextStep(); return;\n    }\n    return;\n  }\n\n  if ((e.key === \"PageDown\" || (e.key === \"ArrowRight\" && !selectedEl)) && state.pdfDoc && state.page < state.pageCount) {\n    e.preventDefault(); renderPage(state.page + 1, { fromNav: true }); return;\n  }\n  if ((e.key === \"PageUp\" || (e.key === \"ArrowLeft\" && !selectedEl)) && state.pdfDoc && state.page > 1) {\n    e.preventDefault(); renderPage(state.page - 1, { fromNav: true }); return;\n  }\n\n  if ([\"ArrowUp\",\"ArrowDown\",\"ArrowLeft\",\"ArrowRight\"].includes(e.key) && selectedEl) {\n    e.preventDefault();\n    const step = e.shiftKey ? 10 : 2;\n    const dx = e.key === \"ArrowLeft\" ? -step : e.key === \"ArrowRight\" ? step : 0;\n    const dy = e.key === \"ArrowUp\" ? -step : e.key === \"ArrowDown\" ? step : 0;\n    const from = snapshot(selectedEl);\n    if (!from) return;\n    const to = { ...from };\n    if ([\"chord\",\"finger\",\"loop\",\"text\",\"rect\",\"block\"].includes(to.kind)) { to.x += dx; to.y += dy; }\n    else if (to.kind === \"line\") { to.x1 += dx; to.x2 += dx; to.y1 += dy; to.y2 += dy; }\n    applySnapshot(selectedEl, to);\n    refreshSelectionBox();\n    history.push({ type: \"move\", el: selectedEl, from, to });\n    return;\n  }\n\n  if ((e.key === \"Delete\" || e.key === \"Backspace\") && selectedEl) {\n    e.preventDefault();\n    removeElementWithHistory(selectedEl);\n    return;\n  }\n  if (e.key === \"Enter\" && selectedEl) {\n    e.preventDefault();\n    editSelectedElement();\n    return;\n  }\n  const isMod = e.ctrlKey || e.metaKey;\n  if (!isMod) return;\n  const k = e.key.toLowerCase();\n  if (k === \"d\") { e.preventDefault(); duplicateSelected(); }\n  else if (k === \"z\" && !e.shiftKey) { e.preventDefault(); history.undo(); }\n  else if (k === \"y\" || (k === \"z\" && e.shiftKey)) { e.preventDefault(); history.redo(); }\n});\n\n/* ============ EXPORTAR PNG Y PDF VECTORIAL HÍBRIDO (CON ENLACES EN BUCLES) ============ */\nasync function composePageCanvas(pageNum, pageObj) {\n  const out = document.createElement(\"canvas\");\n  const cuts = state.pageSpaceCuts[pageNum] || [];\n  await renderPdfCanvasWithCuts(pageObj, state.scale, cuts, out);\n  const ctx = out.getContext(\"2d\");\n\n  let svgStr;\n  if (pageNum === state.page) {\n    const selRect = selectedInfo && selectedInfo.rect;\n    const selHandle = selectedInfo && selectedInfo.handle;\n    const parentRect = selRect && selRect.parentNode;\n    const parentHandle = selHandle && selHandle.parentNode;\n    if (selRect) selRect.remove();\n    if (selHandle) selHandle.remove();\n    ensureOverlayLayers();\n    svgStr = new XMLSerializer().serializeToString(overlay);\n    if (selRect && parentRect) parentRect.appendChild(selRect);\n    if (selHandle && parentHandle) parentHandle.appendChild(selHandle);\n  } else {\n    const savedInner = state.pageSvgCache[pageNum] || \"\";\n    const tempWrap = document.createElementNS(\"http://www.w3.org/2000/svg\", \"svg\");\n    tempWrap.setAttribute(\"xmlns\", \"http://www.w3.org/2000/svg\");\n    tempWrap.setAttribute(\"width\", String(out.width));\n    tempWrap.setAttribute(\"height\", String(out.height));\n    tempWrap.setAttribute(\"viewBox\", `0 0 ${out.width} ${out.height}`);\n    tempWrap.innerHTML = savedInner;\n    tempWrap.querySelectorAll(\".loop-label\").forEach(g => applyLoopVisualState(g, Boolean(state.loopTargetUrl)));\n    svgStr = new XMLSerializer().serializeToString(tempWrap);\n  }\n\n  if (svgStr && svgStr.indexOf(\"<svg\") >= 0) {\n    const img = new Image();\n    const blob = new Blob([svgStr], { type: \"image/svg+xml;charset=utf-8\" });\n    const url = URL.createObjectURL(blob);\n    await new Promise(res => { img.onload = res; img.onerror = res; img.src = url; });\n    ctx.drawImage(img, 0, 0, out.width, out.height);\n    URL.revokeObjectURL(url);\n  }\n  return out;\n}\n\nfunction getPageAnnotationsDoc(pageNum) {\n  if (pageNum === state.page) return overlay;\n  const savedInner = state.pageSvgCache[pageNum] || \"\";\n  if (!savedInner) return null;\n  return new DOMParser().parseFromString(\n    `<svg xmlns=\"http://www.w3.org/2000/svg\">${savedInner}</svg>`,\n    \"image/svg+xml\"\n  );\n}\n\nfunction collectLoopBoxesForPage(pageNum) {\n  const rootDoc = getPageAnnotationsDoc(pageNum);\n  if (!rootDoc) return [];\n  const boxes = [];\n  rootDoc.querySelectorAll(\".loop-label\").forEach(g => {\n    const x = parseFloat(g.getAttribute(\"data-x\"));\n    const y = parseFloat(g.getAttribute(\"data-y\"));\n    const size = parseFloat(g.getAttribute(\"data-size\")) || 60;\n    if (Number.isNaN(x) || Number.isNaN(y)) return;\n    const factor = size / 100;\n    boxes.push({\n      x: x + 2 * factor,\n      y: y + 2 * factor,\n      w: 96 * factor,\n      h: 56 * factor,\n    });\n  });\n  return boxes;\n}\n\nfunction parseColorToPdfRgb(rawColor, rgbFn) {\n  const c = (rawColor || \"#000000\").trim();\n  if (/^#[0-9a-f]{6}$/i.test(c)) {\n    return rgbFn(\n      parseInt(c.slice(1, 3), 16) / 255,\n      parseInt(c.slice(3, 5), 16) / 255,\n      parseInt(c.slice(5, 7), 16) / 255\n    );\n  }\n  if (/^#[0-9a-f]{3}$/i.test(c)) {\n    return rgbFn(\n      parseInt(c[1] + c[1], 16) / 255,\n      parseInt(c[2] + c[2], 16) / 255,\n      parseInt(c[3] + c[3], 16) / 255\n    );\n  }\n  const m = c.match(/rgb\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\)/i);\n  if (m) return rgbFn(Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255);\n  return rgbFn(0, 0, 0);\n}\n\nfunction canDrawWinAnsiText(font, txt) {\n  if (!txt) return true;\n  try {\n    font.encodeText(txt);\n    return true;\n  } catch (e) {\n    return false;\n  }\n}\n\nfunction canExportPageAsVector(pageNum, pdfLibPage) {\n  if (!state.sourcePdfBytes || state.pdfExportMode !== \"vector\") return false;\n  if ((state.pageSpaceCuts[pageNum] || []).length > 0) return false;\n  const rot = ((pdfLibPage.getRotation()?.angle || 0) % 360 + 360) % 360;\n  if (rot !== 0) return false;\n  const rootDoc = getPageAnnotationsDoc(pageNum);\n  if (!rootDoc) return true;\n  if (rootDoc.querySelector(\".block-rect, .block-hole\")) return false;\n  return true;\n}\n\nfunction drawVectorAnnotationsOnPdfPage(pdfPage, pageNum, fonts, validLink, rgbFn) {\n  const rootDoc = getPageAnnotationsDoc(pageNum);\n  if (!rootDoc) return true;\n\n  const crop = pdfPage.getCropBox?.() || pdfPage.getMediaBox?.() || { x: 0, y: 0, width: pdfPage.getWidth(), height: pdfPage.getHeight() };\n  const s = state.scale || 3;\n  const px = (sx) => (crop.x || 0) + sx / s;\n  const py = (sy) => (crop.y || 0) + (crop.height || pdfPage.getHeight()) - sy / s;\n\n  const nodes = Array.from(rootDoc.documentElement ? rootDoc.documentElement.children : rootDoc.children);\n  for (const node of nodes) {\n    const cl = node.classList;\n    if (cl?.contains(\"sel-rect\") || cl?.contains(\"sel-handle\") || cl?.contains(\"inline-editor-host\") || cl?.contains(\"block-selection\")) continue;\n\n    if (node.tagName === \"rect\" && node.getAttribute(\"data-resizable\") === \"1\") {\n      const rx = parseFloat(node.getAttribute(\"x\")) || 0;\n      const ry = parseFloat(node.getAttribute(\"y\")) || 0;\n      const rw = parseFloat(node.getAttribute(\"width\")) || 0;\n      const rh = parseFloat(node.getAttribute(\"height\")) || 0;\n      const color = parseColorToPdfRgb(node.getAttribute(\"fill\") || \"#ffffff\", rgbFn);\n      pdfPage.drawRectangle({ x: px(rx), y: py(ry + rh), width: rw / s, height: rh / s, color });\n    } else if (node.tagName === \"line\") {\n      const x1 = parseFloat(node.getAttribute(\"x1\")) || 0;\n      const y1 = parseFloat(node.getAttribute(\"y1\")) || 0;\n      const x2 = parseFloat(node.getAttribute(\"x2\")) || 0;\n      const y2 = parseFloat(node.getAttribute(\"y2\")) || 0;\n      const sw = parseFloat(node.getAttribute(\"stroke-width\")) || 2;\n      const color = parseColorToPdfRgb(node.getAttribute(\"stroke\") || \"#000000\", rgbFn);\n      pdfPage.drawLine({\n        start: { x: px(x1), y: py(y1) },\n        end: { x: px(x2), y: py(y2) },\n        thickness: sw / s,\n        color,\n      });\n    } else if (node.tagName === \"text\") {\n      const txt = node.textContent || \"\";\n      if (!canDrawWinAnsiText(fonts.helveticaBold, txt)) return false;\n      const tx = parseFloat(node.getAttribute(\"x\")) || 0;\n      const ty = parseFloat(node.getAttribute(\"y\")) || 0;\n      const fs = parseFloat(node.getAttribute(\"font-size\")) || 18;\n      const color = parseColorToPdfRgb(node.getAttribute(\"fill\") || \"#000000\", rgbFn);\n      if (txt) {\n        pdfPage.drawText(txt, { x: px(tx), y: py(ty), size: fs / s, font: fonts.helveticaBold, color });\n      }\n    } else if (cl?.contains(\"finger-marker\")) {\n      const gx = parseFloat(node.getAttribute(\"data-x\")) || 0;\n      const gy = parseFloat(node.getAttribute(\"data-y\")) || 0;\n      const size = parseFloat(node.getAttribute(\"data-size\")) || 40;\n      const finger = node.getAttribute(\"data-finger\") || node.querySelector(\"text\")?.textContent || \"1\";\n      if (!canDrawWinAnsiText(fonts.courierBold, finger)) return false;\n      const k = (size / 100) / s;\n      const cx = px(gx) + 50 * k;\n      const cy = py(gy) - 50 * k;\n      pdfPage.drawCircle({\n        x: cx, y: cy, size: 45 * k,\n        color: rgbFn(1, 1, 1), borderColor: rgbFn(0, 0, 0), borderWidth: 4 * k,\n      });\n      const fsPt = 60 * k;\n      const tw = fonts.courierBold.widthOfTextAtSize(finger, fsPt);\n      const th = fonts.courierBold.heightAtSize(fsPt, { descender: false });\n      pdfPage.drawText(finger, { x: cx - tw / 2, y: cy - th * 0.45, size: fsPt, font: fonts.courierBold, color: rgbFn(0, 0, 0) });\n    } else if (cl?.contains(\"loop-label\")) {\n      const gx = parseFloat(node.getAttribute(\"data-x\")) || 0;\n      const gy = parseFloat(node.getAttribute(\"data-y\")) || 0;\n      const size = parseFloat(node.getAttribute(\"data-size\")) || 60;\n      const txt = node.getAttribute(\"data-text\") || node.querySelector(\"text\")?.textContent || \"\";\n      if (!canDrawWinAnsiText(fonts.courierBold, txt)) return false;\n      const k = (size / 100) / s;\n      const col = validLink ? rgbFn(0.047, 0.4, 0.329) : rgbFn(0, 0, 0);\n      pdfPage.drawRectangle({\n        x: px(gx) + 2 * k,\n        y: py(gy) - 58 * k,\n        width: 96 * k,\n        height: 56 * k,\n        color: rgbFn(1, 1, 1),\n        borderColor: col,\n        borderWidth: 3 * k,\n      });\n      if (validLink) {\n        pdfPage.drawLine({\n          start: { x: px(gx) + 16 * k, y: py(gy) - 46 * k },\n          end: { x: px(gx) + 84 * k, y: py(gy) - 46 * k },\n          thickness: 2.4 * k,\n          color: rgbFn(0.078, 0.49, 0.408),\n        });\n      }\n      const fsPt = (txt.length > 4 ? 26 : 34) * k;\n      const tw = fonts.courierBold.widthOfTextAtSize(txt, fsPt);\n      const th = fonts.courierBold.heightAtSize(fsPt, { descender: false });\n      pdfPage.drawText(txt, {\n        x: px(gx) + 50 * k - tw / 2,\n        y: py(gy) - 28 * k - th * 0.42,\n        size: fsPt,\n        font: fonts.courierBold,\n        color: col,\n      });\n    } else if (cl?.contains(\"chord-diagram\")) {\n      let model = null;\n      try { model = JSON.parse(node.getAttribute(\"data-chord-model\") || \"null\"); } catch (e) {}\n      if (!model || !Array.isArray(model.pos)) return false;\n      const gx = parseFloat(node.getAttribute(\"data-x\")) || 0;\n      const gy = parseFloat(node.getAttribute(\"data-y\")) || 0;\n      const size = parseFloat(node.getAttribute(\"data-size\")) || 120;\n      const frets = Math.max(1, Math.min(15, parseInt(model.frets) || 5));\n      const trasteIni = Math.max(1, parseInt(model.traste) || 1);\n      const cleanName = (model.nombre || \"\").trim();\n      if (!canDrawWinAnsiText(fonts.courierBold, cleanName)) return false;\n\n      const k = (size / 100) / s;\n      const H = chordDiagramHeight(frets);\n      const cx = (lx) => px(gx) + lx * k;\n      const cy = (ly) => py(gy) - ly * k;\n\n      pdfPage.drawRectangle({\n        x: cx(0), y: cy(H), width: ED.W * k, height: H * k, color: rgbFn(1, 1, 1),\n      });\n\n      if (cleanName) {\n        const nfs = 14 * k;\n        const tw = fonts.courierBold.widthOfTextAtSize(cleanName, nfs);\n        pdfPage.drawText(cleanName, {\n          x: cx((ED.left + ED.right) / 2) - tw / 2,\n          y: cy(15),\n          size: nfs,\n          font: fonts.courierBold,\n          color: rgbFn(0, 0, 0),\n        });\n      }\n\n      const bottom = ED.top + frets * ED.fGap;\n      for (let i = 0; i < ED.strings; i++) {\n        const xpos = ED.left + i * ED.sGap;\n        pdfPage.drawLine({\n          start: { x: cx(xpos), y: cy(ED.top) },\n          end: { x: cx(xpos), y: cy(bottom) },\n          thickness: 1 * k,\n          color: rgbFn(0, 0, 0),\n        });\n      }\n      for (let i = 0; i <= frets; i++) {\n        const ypos = ED.top + i * ED.fGap;\n        pdfPage.drawLine({\n          start: { x: cx(ED.left), y: cy(ypos) },\n          end: { x: cx(ED.right), y: cy(ypos) },\n          thickness: (i === 0 && trasteIni === 1 ? 3 : 1) * k,\n          color: rgbFn(0, 0, 0),\n        });\n      }\n\n      if (trasteIni > 1) {\n        const fStr = String(trasteIni);\n        const ffs = 14 * k;\n        const tw = fonts.courierBold.widthOfTextAtSize(fStr, ffs);\n        const th = fonts.courierBold.heightAtSize(ffs, { descender: false });\n        pdfPage.drawText(fStr, {\n          x: cx(ED.left - 4) - tw,\n          y: cy(ED.top + ED.fGap * 0.5) - th * 0.45,\n          size: ffs,\n          font: fonts.courierBold,\n          color: rgbFn(0, 0, 0),\n        });\n      }\n\n      const cejList = model.cejillas || [];\n      cejList.forEach(cj => {\n        const rel = cj.traste - trasteIni;\n        if (rel < 0 || rel >= frets) return;\n        const yc = ED.top + (rel + 0.5) * ED.fGap;\n        const x1 = ED.left + (cj.desde - 1) * ED.sGap;\n        const x2 = ED.left + (cj.hasta - 1) * ED.sGap;\n        pdfPage.drawRectangle({\n          x: cx(Math.min(x1, x2) - 4),\n          y: cy(yc + 5),\n          width: (Math.abs(x2 - x1) + 8) * k,\n          height: 10 * k,\n          color: rgbFn(0, 0, 0),\n        });\n      });\n\n      for (let i = 0; i < ED.strings; i++) {\n        const xpos = ED.left + i * ED.sGap;\n        const arr = model.pos[i] || [];\n        if (arr.includes(-1)) {\n          const xfs = 11 * k;\n          const tw = fonts.courier.widthOfTextAtSize(\"X\", xfs);\n          pdfPage.drawText(\"X\", { x: cx(xpos) - tw / 2, y: cy(ED.top - 5), size: xfs, font: fonts.courier, color: rgbFn(0, 0, 0) });\n        } else if (arr.includes(0)) {\n          pdfPage.drawCircle({\n            x: cx(xpos), y: cy(ED.top - 9), size: 3.5 * k,\n            borderColor: rgbFn(0, 0, 0), borderWidth: 1 * k,\n          });\n        }\n        const drawPos = (fret, hollow) => {\n          if (fret <= 0) return;\n          if (cejList.some(cj => cj.traste === fret && i + 1 >= cj.desde && i + 1 <= cj.hasta)) return;\n          const rel = fret - trasteIni;\n          if (rel < 0 || rel >= frets) return;\n          const yc = ED.top + (rel + 0.5) * ED.fGap;\n          pdfPage.drawCircle({\n            x: cx(xpos), y: cy(yc), size: 5 * k,\n            color: hollow ? rgbFn(1, 1, 1) : rgbFn(0, 0, 0),\n            borderColor: rgbFn(0, 0, 0),\n            borderWidth: hollow ? 1.6 * k : 0,\n          });\n        };\n        arr.forEach(f => drawPos(f, false));\n        (model.hollowPos?.[i] || []).forEach(f => drawPos(f, true));\n      }\n    }\n  }\n  return true;\n}\n\ndocument.getElementById(\"exportPng\").addEventListener(\"click\", async () => {\n  if (!state.pdfDoc) return;\n  const page = await state.pdfDoc.getPage(state.page);\n  const out = await composePageCanvas(state.page, page);\n  const a = document.createElement(\"a\");\n  const baseName = (state.sourcePdfName || \"partitura\").replace(/\\.pdf$/i, \"\");\n  a.download = `${baseName}_pag_${state.page}.png`;\n  a.href = out.toDataURL(\"image/png\");\n  a.click();\n});\n\ndocument.getElementById(\"exportPdf\").addEventListener(\"click\", async () => {\n  if (!state.pdfDoc) return;\n  saveCurrentPageAnnotations();\n  showToast(\"Generando PDF completo...\");\n\n  const { PDFDocument, PDFName, PDFString, StandardFonts, rgb } = PDFLib;\n  const pdfDoc = await PDFDocument.create();\n  const fonts = {\n    helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),\n    courierBold: await pdfDoc.embedFont(StandardFonts.CourierBold),\n    courier: await pdfDoc.embedFont(StandardFonts.Courier),\n  };\n\n  let srcPdfDoc = null;\n  if (state.sourcePdfBytes && state.pdfExportMode === \"vector\") {\n    try { srcPdfDoc = await PDFDocument.load(state.sourcePdfBytes, { ignoreEncryption: true }); }\n    catch (e) { srcPdfDoc = null; }\n  }\n\n  const loopUrl = state.loopTargetUrl ? normalizeLoopUrl(state.loopTargetUrl) : \"\";\n  const validLink = Boolean(loopUrl && isValidHttpUrl(loopUrl));\n  let vectorPagesCount = 0;\n  let rasterPagesCount = 0;\n\n  for (let p = 1; p <= state.pageCount; p++) {\n    let page = null;\n    let crop = { x: 0, y: 0, width: 0, height: 0 };\n    let usedVector = false;\n\n    if (srcPdfDoc && canExportPageAsVector(p, srcPdfDoc.getPage(p - 1))) {\n      try {\n        const [copied] = await pdfDoc.copyPages(srcPdfDoc, [p - 1]);\n        pdfDoc.addPage(copied);\n        crop = copied.getCropBox?.() || copied.getMediaBox?.() || { x: 0, y: 0, width: copied.getWidth(), height: copied.getHeight() };\n        const ok = drawVectorAnnotationsOnPdfPage(copied, p, fonts, validLink, rgb);\n        if (ok) {\n          page = copied;\n          usedVector = true;\n          vectorPagesCount++;\n        } else {\n          pdfDoc.removePage(pdfDoc.getPageCount() - 1);\n        }\n      } catch (err) {\n        if (pdfDoc.getPageCount() >= p) pdfDoc.removePage(pdfDoc.getPageCount() - 1);\n        usedVector = false;\n      }\n    }\n\n    if (!usedVector) {\n      const pageObj = await state.pdfDoc.getPage(p);\n      const out = await composePageCanvas(p, pageObj);\n      const pngDataUrl = out.toDataURL(\"image/png\");\n      const pngBytes = await fetch(pngDataUrl).then(r => r.arrayBuffer());\n      const ptWidth = out.width / state.scale;\n      const ptHeight = out.height / state.scale;\n      page = pdfDoc.addPage([ptWidth, ptHeight]);\n      crop = { x: 0, y: 0, width: ptWidth, height: ptHeight };\n      const pngImage = await pdfDoc.embedPng(pngBytes);\n      page.drawImage(pngImage, { x: 0, y: 0, width: ptWidth, height: ptHeight });\n      rasterPagesCount++;\n    }\n\n    if (validLink && page) {\n      const boxes = collectLoopBoxesForPage(p);\n      if (boxes.length > 0) {\n        const ox = crop.x || 0;\n        const oy = crop.y || 0;\n        const ch = crop.height || page.getHeight();\n        const annotRefs = boxes.map(box => {\n          const x1 = ox + box.x / state.scale;\n          const x2 = ox + (box.x + box.w) / state.scale;\n          const y1 = oy + ch - (box.y + box.h) / state.scale;\n          const y2 = oy + ch - box.y / state.scale;\n          const linkAnnot = pdfDoc.context.obj({\n            Type: \"Annot\",\n            Subtype: \"Link\",\n            Rect: [x1, y1, x2, y2],\n            Border: [0, 0, 0],\n            A: {\n              Type: \"Action\",\n              S: \"URI\",\n              URI: PDFString.of(loopUrl),\n            },\n          });\n          return pdfDoc.context.register(linkAnnot);\n        });\n        page.node.set(PDFName.of(\"Annots\"), pdfDoc.context.obj(annotRefs));\n      }\n    }\n  }\n\n  const pdfBytes = await pdfDoc.save();\n  const blob = new Blob([pdfBytes], { type: \"application/pdf\" });\n  const url = URL.createObjectURL(blob);\n  const a = document.createElement(\"a\");\n  const baseName = (state.sourcePdfName || \"partitura\").replace(/\\.pdf$/i, \"\");\n  a.download = `${baseName}_editado.pdf`;\n  a.href = url; a.click();\n  setTimeout(() => URL.revokeObjectURL(url), 1500);\n  const modeMsg = vectorPagesCount > 0 && rasterPagesCount === 0\n    ? \"PDF vectorial exportado\"\n    : vectorPagesCount > 0\n      ? `PDF híbrido exportado (${vectorPagesCount} vect. / ${rasterPagesCount} img.)`\n      : \"PDF exportado\";\n  showToast(validLink ? `${modeMsg} con enlaces` : modeMsg);\n});\n<\/script>\n</body>\n</html>\n";
// src/standalone/CONTINUIDAD.md?raw
var CONTINUIDAD_default = "# Editor PDF de partituras — Continuidad de desarrollo\n\n## Cómo retomar en la próxima sesión\n\nEn la próxima sesión basta con adjuntar **`partituras-editor-v11.html` y este `CONTINUIDAD.md`**. No hace falta volver a explicar el historial previo: este documento recoge la arquitectura completa, los formatos de datos, las correcciones aplicadas, el estado actual y la hoja de ruta para la siguiente fase (**v12.0**). Al cerrar cada versión futura, actualiza el HTML, este `CONTINUIDAD.md` y la pestaña **Ayuda** dentro del modal de Ajustes.\n\n---\n\n## Objetivo y filosofía del producto\n\nEditor y herramienta de estudio personal de partituras/tablaturas en PDF orientado a guitarra en **un único archivo `.html` autocontenido** (sin instalación ni servidor, ejecutable directamente en local mediante `file://`).\n- El **PDF** es el origen (no exige MusicXML ni MIDI).\n- El archivo **`.scoreproj`** conserva el PDF original (Base64), las anotaciones editables por página, los cortes de espacio añadido (`pageSpaceCuts`), los ajustes de la partitura (URL de bucles, parámetros de práctica) y la calibración de sistemas/compases junto con sus signos musicales.\n- La **Biblioteca local (IndexedDB)** guarda las partituras en el navegador para abrirlas al instante sin buscar archivos cada vez, manteniendo `.scoreproj` para portabilidad entre equipos.\n- El **PDF exportado** conserva vectores nítidos en modo híbrido cuando es posible (recurso automático a PNG solo en páginas con cortes o bloques), e incrusta enlaces clicables reales en las etiquetas de bucle cuando hay URL configurada.\n\n---\n\n## Estado actual: v11.0\n\nArchivo principal: `partituras-editor-v11.html` (y envoltorio Vite PWA para instalación en Android/Chrome).\n\n### Correcciones y mejoras aplicadas en v11.0\n\n1. **Cursor verde en el último pulso del bucle (`advanceBeatTick`):**\n   - Corregido el bug por el que en el último pulso del último compás del bucle (`beatIdx === beats - 1`), el redibujo de vuelta a `cursor = 0` se ejecutaba síncronamente al instante y ocultaba el último tiempo en verde.\n   - Ahora los cambios de página, la parada por fin/Fine (`finishStopPending`) y la transición visual al primer compás de la siguiente vuelta se difieren al inicio del siguiente tick del metrónomo, respetando todo el tiempo del último pulso en pantalla.\n\n2. **Limpieza total del compás marcado al apagar `🔁 Bucle` o pulsar `⏹ Reiniciar`:**\n   - Al desactivar `toggleStudyLoop()` se limpian `anchorSysId = null` y `anchorMeasureIdx = 0` para que ningún compás quede marcado en naranja/verde.\n   - Al pulsar **⏹ Reiniciar** (`resetPracticePlayback()`), tanto en la barra de práctica como en el HUD de pantalla completa, se limpia el ancla, se detiene la reproducción, se vuelve a la **página 1** y se desplaza la vista al inicio del documento.\n\n3. **Apertura de partituras siempre en la página 1:**\n   - Corregido `loadProjectObject()` (y el lector de PDF nuevo) para fijar siempre `state.page = 1` y ejecutar `window.scrollTo(0, 0)` al abrir un PDF, un `.scoreproj` o una partitura de la Biblioteca local, evitando arrancar en páginas intermedias como la página 2.\n\n4. **Interfaz adaptativa para móvil y Android (sin alterar la vista de PC):**\n   - Añadida barra rápida fija en pantallas estrechas (`<= 860px`, `#mobileQuickBar`) con acceso directo a **☰ Menú** (cajón desplegable `#menusHost` con el resto de controles), cambio rápido de página (`‹ 1/3 ›`), botón **Practicar / Editar**, y en *Modo Practicar* botones táctiles **▶ / ⏸**, **🔁 Bucle** y **⛶ Pantalla completa** (o **↶ Deshacer** en edición).\n   - Reglas inteligentes de `touch-action` para permitir desplazamiento y pellizco natural con un dedo en la partitura cuando se estudia o con *Seleccionar* sobre el fondo blanco, reservando `touch-action: none` exclusivamente al trazar dibujos o arrastrar elementos.\n\n5. **PWA instalable y operativa offline en Android / Chrome (sobre Vite + `vite-plugin-pwa`):**\n   - Configurado Manifiesto Web (`id: '/'`, `short_name: 'Partituras'`, `display: 'standalone'`, iconos PNG `192x192`, `512x512` `any`, `512x512` `maskable` y `180x180` `apple-touch-icon.png`), Service Worker con Workbox que precachea el shell + `partituras-editor-v11.html` y cachea en `CacheFirst` las librerías `pdf.js` (`pdf.min.js`, `pdf.worker.min.js`) y `pdf-lib` desde `cdnjs.cloudflare.com`.\n   - Botón in-app de instalación (`PWAInstallButton`) e indicador de estado sin conexión (`OfflineIndicator`) en la barra superior de la aplicación web. El archivo `partituras-editor-v11.html` continúa siendo 100% autocontenido para abrirse localmente con `file://` en PC.\n\n### Resumen de mejoras de v10.0 mantenidas\n\n1. **Zoom centrado al ampliar o reducir (`−` / `+`):**\n   - Corregido `transform-origin` en `#stage` (`top left` en lugar de `top center`) dentro de `#stageFrame` (`margin: 18px auto 48px` con dimensiones exactas escaladas por `state.viewZoom`), evitando que el documento quede desplazado hacia la derecha al hacer zoom inferior al 100%.\n\n2. **Bucle de estudio de 1 o varios compases (`Bucle estudio`) + Tempo en vivo / progresivo:**\n   - Nuevo botón **🔁 Bucle: Sí/No** (`#practiceLoopBtn` en la barra de práctica y `#fsLoopBtn` en el HUD de pantalla completa), selector de **Comp.** (`#practiceLoopCount`, de `1` a `32`, por defecto `1`) y selector opcional **+BPM** (`#practiceProgBpm`: `+0`, `+2`, `+4`, `+6`) para subir automáticamente el tempo al completar cada vuelta del ciclo (tope `240` BPM).\n   - Al llegar al final del ciclo elegido, el cursor vuelve al primer compás seleccionado sin repetir la cuenta atrás (mantiene el pulso), cruzando automáticamente de sistema o de página si el bucle abarca varios sistemas o cambia de página.\n   - El campo **BPM** sigue editable en tiempo real durante la reproducción (`restartPracticeTimerIfRunning()`).\n\n3. **Selección y arranque directo desde cualquier compás (`startFromMeasure`):**\n   - En *Modo Practicar* (cuando no se está calibrando), todos los compases calibrados tienen zona clicable con indicador visual (`▶ c.X` o `🔁 c.X–Y`).\n   - Hacer clic sobre un compás fija el ancla de inicio/bucle (`anchorSysId`, `anchorMeasureIdx`); si ya está sonando, salta o reconstruye el bucle en caliente sin detener el metrónomo.\n   - Si una etiqueta de bucle externa (`L23`) con URL configurada coincide sobre el área de un compás, el clic sobre la etiqueta prioriza abrir la URL externa configurada.\n\n4. **Detección asistida de sistemas desde la imagen PDF (`Detectar sistemas`):**\n   - Nueva función `detectStaffSystemsOnCurrentPage()` que analiza localmente el canvas PDF (`bgCanvas`) mediante proyección horizontal de filas de tinta (detectando líneas de pentagrama/tablatura y uniendo pares bimodales partitura+tablatura cuando corresponda, con respaldo por densidad de tinta).\n   - El botón **Detectar sistemas** (`#autoDetectSystemsBtn`) propone al instante las cajas calibradas de la página actual y abre *Calibrar sistemas* para revisar o ajustar compases y signos (con confirmación inline de 2 clics si ya existían cajas en esa página).\n\n5. **Anotaciones rápidas de técnica guitarrística (`Técnica ▾`):**\n   - Selector `#techSymbolSelect` en el grupo *Insertar* con símbolos listos para colocar con un clic: `H`, `P`, `sl.`, `~~~`, `Arm. ◇`, `↓`, `↑`, `C.II`, `C.V`, `Intro`, `Estribillo`, `Solo`. Se insertan como nodos `<text>` editables, redimensionables y exportables en PDF vectorial.\n\n---\n\n## Arquitectura y formatos de datos (referencia técnica)\n\n### Modelo de acorde (`CHORD_LIBRARY` y `data-chord-model`)\n```json\n{\n  \"nombre\": \"Am7\",\n  \"traste\": 1,\n  \"frets\": 5,\n  \"pos\": [[-1], [0], [2], [0], [1], [0]],\n  \"hollowPos\": [[], [0], [], [], [], []],\n  \"cejillas\": [{ \"traste\": 1, \"desde\": 1, \"hasta\": 6 }]\n}\n```\nDimensiones vectoriales (`ED`): `W = 102`, `left = 21`, `right = 91`, `top = 25`, `strings = 6`, `fGap = 16`, `sGap = 14`.\n\n### Formato `.scoreproj` (v5, retrocompatible con v1–v4)\n```json\n{\n  \"format\": \"partituras-editor-project\",\n  \"version\": 5,\n  \"sourcePdfName\": \"cancion.pdf\",\n  \"sourcePdfBase64\": \"...\",\n  \"page\": 1,\n  \"scale\": 3,\n  \"settings\": {\n    \"loopTargetUrl\": \"https://mi-app-bucles.com/cancion\",\n    \"practice\": {\n      \"timeSig\": \"4/4\",\n      \"bpm\": 90,\n      \"countInBars\": 2,\n      \"metronome\": true,\n      \"viewMode\": \"full\",\n      \"advanceMode\": \"auto\",\n      \"pedalKey\": \"arrows_pagedown\",\n      \"loopCount\": 1,\n      \"progBpmStep\": 0\n    }\n  },\n  \"practicePages\": {\n    \"1\": {\n      \"manualOrder\": false,\n      \"systems\": [\n        {\n          \"id\": \"sys-...\",\n          \"x\": 80, \"y\": 140, \"w\": 1500, \"h\": 180,\n          \"measures\": 4,\n          \"repeatCount\": 2,\n          \"measureMarks\": {\n            \"0\": { \"repeatStart\": true, \"segno\": true },\n            \"2\": { \"volta\": 1, \"repeatEnd\": true, \"repeatCount\": 2 },\n            \"3\": { \"volta\": 2, \"toCoda\": true }\n          }\n        }\n      ]\n    }\n  },\n  \"pageSpaceCuts\": {\n    \"1\": [{ \"id\": \"cut-...\", \"y\": 420, \"delta\": 90 }]\n  },\n  \"pages\": {\n    \"1\": \"<rect class=\\\"block-hole\\\" ... /><g class=\\\"chord-diagram\\\" ...>...</g>\"\n  }\n}\n```\n\n### Dependencias externas (CDN)\n- `pdf.js` `3.11.174`\n- `pdf-lib` `1.17.1`\n\n---\n\n## Validación y pruebas\n\n- **v11.0:**\n  - Sintaxis JS completa verificada con Node (`vm.Script`, 0 errores en 5.066 líneas inline).\n  - Batería automatizada de **5 bloques de prueba** en Node (preservación del último pulso verde antes de volver al compás inicial del bucle, visibilidad del último pulso antes de fin/Fine, limpieza de ancla y retorno a pág. 1 al apagar bucle o pulsar Reiniciar, apertura en pág. 1 aunque el `.scoreproj` guardase `page: 2`, y regresión de repeticiones `1./2.`, `D.C.`, `D.S.`, `Segno`, `Coda` y `Fine`).\n  - Compilación TypeScript + Vite PWA (`tsc --noEmit` + `vite build`) y ESLint verificados al cerrar la versión.\n- **v10.0:**\n  - Sintaxis JS completa verificada con Node (`vm.Script`, 0 errores en 4.962 líneas inline).\n  - Batería automatizada de **17 pruebas unitarias** en Node -> **17/17 OK**.\n\n---\n\n## Hoja de ruta: próxima fase (v12.0)\n\n### Fase v12.0 — Estudio inteligente y afinación sobre móvil/escritorio\n1. **Aceleración progresiva con metas y contador de vueltas:** mostrar objetivo de BPM (ej. `90 → 120 BPM`) y detener o mantener al llegar a la meta elegida durante el bucle.\n2. **Afinador cromático por micrófono (Web Audio FFT) / diapasón de referencia:** referencia rápida de cuerdas `E A D G B E` o detección de altura opcional integrada en *Modo Practicar*.\n3. **Compartir / exportar lote de Biblioteca:** exportar e importar en bloque varias partituras favoritas desde la Biblioteca local en un solo `.zip`/JSON para copias de seguridad rápidas entre PC y Android.\n\n---\n\n## Registro de bugs e ideas\n\n| Versión / Fecha | Idea o bug | Estado |\n|---|---|---|\n| v2 · 2026-11-20 | Bloque dejaba el original intacto | Resuelto (`block-hole` + `block-rect`) |\n| v5 · 2026-11-20 | Doble clic y caja de selección inestables con zoom | Resuelto con matrices SVG (`getScreenCTM`) y botón Editar |\n| v5 · 2026-11-20 | Puntos huecos para tónica/octavas en acordes | Resuelto (`hollowPos`) |\n| v6 · 2026-11-20 | Bug cejilla, `?` sin nombre, trastes hasta 15, Ajustes y Bucles web/PDF | Resuelto en v6.0 |\n| v7 · 2026-11-20 | Acorde oculto bajo hueco/bloque desplazado con *Cortar y mover* | Resuelto (`ensureOverlayLayers`) |\n| v7 · 2026-11-20 | Acorde nuevo se insertaba en sitio fijo en vez de donde se hace clic | Resuelto (`pendingCustomChord`) |\n| v7 · 2026-11-20 | Modo Practicar, metrónomo Web Audio, calibración, repeticiones, tramos y pedal | Implementado en v7.0 |\n| v8 · 2026-11-20 | Herencia nº compases al calibrar, cuenta atrás 2 compases, signos completos (`1./2./3.`, `D.C.`, `D.S.`, `Segno`, `Coda`, `Fine`) y Pantalla completa | Implementado en v8.0 |\n| v9 · 2026-11-20 | Bug cambio traste inicial en acordes + nº traste pequeño | Resuelto en v9.0 (traslación delta + fuente 14 negrita) |\n| v9 · 2026-11-20 | Cajas de compases reproducían desordenadas, numeración reiniciaba por pág. y input compases se reseteaba | Resuelto en v9.0 (orden 2D + numeración global continua + `Orden pág.`) |\n| v9 · 2026-11-20 | Casillas `1./2.` y avance automático / paso de página fallaban en reproducción | Resuelto en v9.0 (`buildPracticePlaybackPlan` + scroll/cambio pág. serializado) |\n| v9 · 2026-11-20 | Biblioteca local IndexedDB, herramienta *Añadir espacio* y exportación PDF vectorial híbrida | Implementado en v9.0 |\n| v10 · 2026-11-20 | Al reducir zoom (`−`/`+`) el documento se quedaba pegado a la derecha | Resuelto en v10.0 (`transform-origin: top left` en `#stage`) |\n| v10 · 2026-11-20 | Bucle de estudio (1 o N compases desde clic) + tempo en vivo/+BPM progresivo, detección asistida de sistemas y símbolos rápidos de técnica | Implementado en v10.0 |\n| v11 · 2026-11-20 | Cursor último pulso del bucle, limpieza de ancla en Bucle/Reiniciar, apertura siempre en pág. 1, UI móvil/Android adaptativa + PWA instalable offline | Implementado en v11.0 |\n| v12 · Pendiente | Meta de BPM en bucle progresivo, diapasón/afinador rápido y respaldo en lote de Biblioteca | Planificado para v12.0 |\n";
// src/hooks/usePWAInstall.ts
function usePWAInstall() {
	const [deferredPrompt, setDeferredPrompt] = (0, import_react.useState)(null);
	const [isInstalled, setIsInstalled] = (0, import_react.useState)(false);
	const [isIOS, setIsIOS] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
		setIsInstalled(isStandalone);
		const userAgent = window.navigator.userAgent.toLowerCase();
		const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
		setIsIOS(isIOSDevice);
		const handleBeforeInstallPrompt = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
		};
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setDeferredPrompt(null);
		};
		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);
	const install = async () => {
		if (!deferredPrompt) return false;
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") {
			setIsInstalled(true);
			setDeferredPrompt(null);
			return true;
		}
		return false;
	};
	return {
		isInstallable: !!deferredPrompt,
		isInstalled,
		isIOS,
		install
	};
}
// node_modules/react/cjs/react-jsx-runtime.production.js
/**
* @license React
* react-jsx-runtime.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
// src/components/PWAInstallButton.tsx
var import_jsx_runtime = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_production();
})))();
var PWAInstallButton = () => {
	const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
	const [showIOSGuide, setShowIOSGuide] = (0, import_react.useState)(false);
	if (isInstalled) return null;
	if (isInstallable) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: install,
		className: "inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-[#147d68] bg-[#e3f2ed] px-2.5 py-1.5 text-xs font-semibold text-[#0c6654] transition-colors hover:bg-[#d2ebe3]",
		title: "Instalar en Android o escritorio para usar sin conexión",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
			className: "h-3.5 w-3.5",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Instalar app" })]
	});
	if (isIOS) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setShowIOSGuide(true),
		className: "inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-[#dce4e0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1e2d28] transition-colors hover:bg-[#eef5f2]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
			className: "h-3.5 w-3.5 text-[#147d68]",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Instalar en iOS" })]
	}), showIOSGuide && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-[#1e2d28]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-base font-semibold",
					children: "Instalar en iPhone / iPad"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-[#62716b] leading-relaxed",
					children: [
						"1. Pulsa el botón ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Compartir" }),
						" en la barra de Safari.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"2. Desliza hacia abajo y selecciona ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Añadir a pantalla de inicio" }),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setShowIOSGuide(false),
					className: "mt-4 w-full rounded-lg bg-[#147d68] py-2 text-sm font-semibold text-white hover:bg-[#0c6654]",
					children: "Cerrar"
				})
			]
		})
	})] });
	return null;
};
// src/hooks/useOnlineStatus.ts
function useOnlineStatus() {
	const [isOnline, setIsOnline] = (0, import_react.useState)(typeof navigator !== "undefined" ? navigator.onLine : true);
	(0, import_react.useEffect)(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);
	return isOnline;
}
// src/components/OfflineIndicator.tsx
var OfflineIndicator = () => {
	if (useOnlineStatus()) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-lg bg-[#a85d12] px-3 py-1.5 text-xs font-medium text-white shadow-lg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-white animate-pulse" }), "Sin conexión — Usando caché local y Biblioteca IndexedDB"]
	});
};
// src/App.tsx
function downloadTextFile(filename, content, mimeType) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 3e3);
}
function App() {
	const [copiedHtml, setCopiedHtml] = (0, import_react.useState)(false);
	const handleCopyHtml = async () => {
		try {
			await navigator.clipboard.writeText(partituras_editor_v11_default);
			setCopiedHtml(true);
			setTimeout(() => setCopiedHtml(false), 2e3);
		} catch {
			downloadTextFile("partituras-editor-v11.html", partituras_editor_v11_default, "text/html;charset=utf-8");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh w-screen flex-col overflow-hidden bg-[#f3f5f4] text-[#1e2d28]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex shrink-0 items-center justify-between gap-2 border-b border-[#dce4e0] bg-white px-3 py-2 sm:gap-4 sm:px-5 sm:py-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-xs font-semibold tracking-tight text-[#1e2d28] sm:text-sm",
					children: "Editor PDF de Partituras v11"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 items-center gap-1.5 sm:gap-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PWAInstallButton, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => downloadTextFile("CONTINUIDAD.md", CONTINUIDAD_default, "text/markdown;charset=utf-8"),
							className: "inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-[#dce4e0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1e2d28] transition-colors hover:bg-[#eef5f2] sm:px-3",
							title: "Descargar CONTINUIDAD.md",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
									className: "h-3.5 w-3.5 text-[#62716b]",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden md:inline",
									children: "Descargar CONTINUIDAD.md"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "md:hidden",
									children: "MD"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleCopyHtml,
							className: "hidden lg:inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-[#dce4e0] bg-white px-3 py-1.5 text-xs font-medium text-[#1e2d28] transition-colors hover:bg-[#eef5f2]",
							title: "Copiar código HTML completo al portapapeles",
							children: [copiedHtml ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "h-3.5 w-3.5 text-[#147d68]",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
								className: "h-3.5 w-3.5 text-[#62716b]",
								"aria-hidden": "true"
							}), copiedHtml ? "HTML copiado" : "Copiar HTML"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/partituras-pwa-v11.zip",
							download: "partituras-pwa-v11.zip",
							className: "inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-[#147d68] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0c6654] transition-colors hover:bg-[#eef5f2] sm:px-3",
							title: "Descargar paquete ZIP completo listo para subir como PWA (index.html, manifest, Service Worker e iconos)",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderArchive, {
									className: "h-3.5 w-3.5 text-[#147d68]",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: "Descargar ZIP PWA"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sm:hidden",
									children: "ZIP PWA"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => downloadTextFile("partituras-editor-v11.html", partituras_editor_v11_default, "text/html;charset=utf-8"),
							className: "inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-[#147d68] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0c6654] sm:gap-2 sm:px-3.5",
							title: "Descargar archivo HTML único autocontenido para PC",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
									className: "h-3.5 w-3.5",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: "Descargar HTML v11 para PC"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sm:hidden",
									children: "HTML PC"
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "min-h-0 flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
					src: "/partituras-editor-v11.html",
					title: "Editor PDF de partituras v11",
					className: "h-full w-full border-0 bg-[#f3f5f4]"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfflineIndicator, {})
		]
	});
}
// src/main.tsx
registerSW({ immediate: true });
(0, import_client.createRoot)(document.getElementById("root")).render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {}));
