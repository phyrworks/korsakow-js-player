/* NameSpace
 * 
 * Creates a hierarchy of objects matching the given path,
 * used to scope definitions. The first path element is created
 * as a property of window.
 * 
 * Only creates missing parts of the path, so
 * NS('org.korsakow') will create two objects but a subsequent
 * NS('org.korsakow.domain') will only create one.
 * 
 * @param ns a dot separated string of namespaces
 * 
 * e.g. NS('org.korsakow.domain') is equivalent to
 * window.org = {
 *         korsakow: {
 *             domain: {}
 *         }
 *     }
 * 
 * Subsequently you might define class MyDomainObject as
 * org.korsakow.domain.MyDomainObject = ...
 */
function NS(ns) {
	ns = ns.split('.');
	var ctx = window;
	for (var i = 0; i < ns.length; ++i) {
		var n = ns[i];
		if (!ctx[n])
			ctx[n] = {};
		ctx = ctx[n];
	}
	return ctx;
}

NS('org.korsakow');
NS('org.korsakow.domain');
NS('org.korsakow.domain.rule');
NS('org.korsakow.domain.widget');

var Class = Prototype.Class;
/* Wrapper around Prototype.Class.create
 * (see http://prototypejs.org/learn/class-inheritance)
 * 
 * - Applies org.korskow.Object as the supertype of all registered classes
 * - Creates the property class.qualifiedName
 * 
 * @param name the fully qualified name of the class
 */
Class.register = function(name) {
	var args = jQuery.makeArray(arguments);
	args.shift();
	if (name != 'org.korsakow.Object' && args.length >= 1 && !args[0].qualifiedName)
		args.unshift(org.korsakow.Object);
	var clazz = Class.create.apply(null, args);
	clazz.qualifiedName = name;

    var dotIndex = name.lastIndexOf('.');
    clazz.packageName = (function() {
        if (dotIndex !== -1)
            return name.substring(0, dotIndex);
        else
            return '';
    })();
    clazz.className = name.substring(dotIndex + 1);

	NS(clazz.packageName)[clazz.className] = clazz;
	
	return clazz;
};

Class.registerSingleton = function() {
    var clazz = Class.register.apply(this, arguments);
    var instance = new clazz();
    NS(clazz.packageName)[clazz.className] = instance;
    return instance;
};

/* Exception-safe wrapper for a function.
 * 
 * Will catch and rethrow any exceptions after alerting. This is used to facilitate debugging.
 * In the future we might not rethrow - throwing from jQuery callbacks can have unexpected
 * results, for example.
 * 
 */
org.korsakow.WrapCallback = function(f) {
	return function() {
		try {
			return f.apply(this, arguments);
		} catch (e) {
			org.korsakow.log.error('Uncaught exception in anonymous function: ' + e.fileName + "(" + e.lineNumber + "): " + e);
			throw e;
		}
	};
};

/* The supertype of all classes.
 * 
 * Defines methods and properties useful for debugging.
 * 
 */
Class.register('org.korsakow.Object', {
	initialize: function(name) {
		this._uniqueId = ++org.korsakow.Object._uniqueIdGen;
	},
	getClass: function() {
		return this.__proto__.constructor;
	},
	toString: function(s) {
		return "[" + this.getClass().qualifiedName + "#" + this._uniqueId + ";" + (s?s:"") + "]";
	}
});
org.korsakow.Object._uniqueIdGen = 0;

/* Exception hierarchy is not currently used because we could not reliably
 * get file and line-number info this way.
 */
Class.register('org.korsakow.Exception', {
	initialize: function($super, message) {
		$super();
		this.message = message;
	},
	toString: function() {
		return "Exception: "+this.message;
	}
});

// for now we just throw regular javascript errors
org.korsakow.Exception = Error;
org.korsakow.NullPointerException = org.korsakow.Exception;
org.korsakow.Exception.getStackString = function() {
	return org.korsakow.Exception.getStackTrace().join("\n");
};

/* Browser-compatible stack trace
 * 
 * http://www.eriwen.com/javascript/js-stack-trace/
 */
org.korsakow.Exception.getStackTrace = function() {
    var callstack = [];
    var isCallstackPopulated = false;
    try {
        i.dont.exist+=0; //doesn't exist- that's the point
    } catch(e) {
        if (e.stack) { //Firefox
            var lines = e.stack.split('\n');
            for (var i=0, len=lines.length; i<len; i++) {
//                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {	// dr
                    callstack.push(lines[i]);
//                }	// dr
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
        else if (window.opera && e.message) { //Opera
            var lines = e.message.split('\n');
            for (var i=0, len=lines.length; i<len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                    var entry = lines[i];
                    //Append next line also since it has the file info
                    if (lines[i+1]) {
                        entry += ' at ' + lines[i+1];
                        i++;
                    }
                    callstack.push(entry);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
    }
    if (!isCallstackPopulated) { //IE and Safari
        var currentFunction = arguments.callee.caller;
        while (currentFunction) {
            var fn = currentFunction.toString();
            var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
            callstack.push(fname);
            currentFunction = currentFunction.caller;
        }
    }
    return callstack;	// dr
};


Class.register('org.korsakow.Enum', {
	initialize: function($super, values) {
		$super();
		this.values = Object.keys(values).map(function(name) {
			var ev = new org.korsakow.EnumValue(values[name], name);
			this[name] = ev;
			return ev;
		}.bind(this));
	},
	fromValue: function(value) {
		return this.values.find(function(e) {
			return e.value === value;
		});
	}
});
Class.register('org.korsakow.EnumValue', {
	initialize: function($super, value, label) {
		$super();
		this.value = value;
		this.label = label;
	},
	toString: function() {
		return 'Enum[' + this.label + ' = ' + this.value + ']';
	}
});

/* Supertype for factories
 * 
 * Provides functionality for registering a class to an ID and creating
 * instances of classes by ID.
 */
Class.register('org.korsakow.Factory', org.korsakow.Object, {
	initialize: function($super, name) {
		$super();
		// dynamically setup static delegate methods in case the factory is a singleton
		var clazz = this.getClass();
		if (!clazz.create) {
			clazz.create = function() {
				return clazz.instance.create.apply(clazz.instance, arguments);
			};
		}
		if (!clazz.register) {
			clazz.register = function() {
				return clazz.instance.register.apply(clazz.instance, arguments);
			};
		}

		this.name = name;
		this.registry = {};
		
	},
	register: function(id, clazz) {
		if (!clazz)
			throw new Error(this + " - Register with null clazz: " + id);
		this.registry[id] = clazz;
	},
	create: function(type, args) {
		var clazz = this.registry[type];
		if (!clazz)
			throw new Error(this +  " - No class registered for: \"" + type + "\"");
		var obj = new clazz(args);
		return obj;
	},
	toString: function() {
		return "[Factory: " + this.name + "]";
	}
});

/* Wrapper around logging.
 * 
 */
Class.register('org.korsakow.Logger', org.korsakow.Object, {
	initialize: function($super) {
		$super();
	},
	console: function(level, args) {
		window.console && window.console.log.apply(window.console, [level].concat(jQuery.makeArray(args)));
	},
	debug: function() {
		this.console('DEBUG', arguments);
	},
	info: function() {
		this.console('INFO', arguments);
	},
	warn: function() {
		this.console('WARN', arguments);
	},
	error: function() {
		this.console('ERROR', arguments);
	}
});

org.korsakow.log = new org.korsakow.Logger();

Class.register('org.korsakow.TimeoutFactory', org.korsakow.Object, {
	initialize: function($super) {
		$super();
	},
	create: function(func, delay) {
		return setTimeout(func, delay);
	},
	clear: function(id) {
		clearTimeout(id);
	}
});
org.korsakow.Timeout = new org.korsakow.TimeoutFactory();

Class.register('org.korsakow.IntervalFactory', org.korsakow.Object, {
	initialize: function($super) {
		$super();
	},
	create: function(func, delay) {
		return setInterval(func, delay);
	},
	clear: function(id) {
		clearInterval(id);
	}
});
org.korsakow.Interval = new org.korsakow.IntervalFactory();

org.korsakow.setTimeout = function(func, delay) {
	return org.korsakow.Timeout.create.apply(org.korsakow.Timeout, arguments);
};
org.korsakow.clearTimeout = function(func, delay) {
	return org.korsakow.Timeout.clear.apply(org.korsakow.Timeout, arguments);
};

org.korsakow.setInterval = function(func, delay) {
	return org.korsakow.Interval.create.apply(org.korsakow.Interval, arguments);
};
org.korsakow.clearInterval = function(func, delay) {
	return org.korsakow.Interval.clear.apply(org.korsakow.Interval, arguments);
};

Class.register('org.korsakow.Utility', org.korsakow.Object, {
	initialize: function($super){
		$super();
	}
});

org.korsakow.isValue = function(x) {
    switch (jQuery.type(x)) {
    case 'undefined':
    case 'null':
        return false;
    default:
        return true;
    }
};

/* Converts the number to a string and pads to the number of zeros
 * 
 */
org.korsakow.Utility.leadingZeros = function(number, zeros){
	var n = "" + number;
	while(n.length < zeros){
		n = "0" + n;
	}
	return n;
};

/* Creates a string representation of a timestamp.
 * 
 * Format: hh:mm:ss, or mm:ss
 * 
 * 
 * @param time the time in seconds
 * @param if false then the number of hours is computed in minutes (minutes do not wrap at 60)
 */
org.korsakow.Utility.formatTime = function(time, hours){
	var m,s;
	if (hours) {
        var h = Math.floor(time / 3600);
        time = time - h * 3600;

        m = Math.floor(time / 60);
        s = Math.floor(time % 60);

        return this.leadingZeros(h,2)  + ":" + this.leadingZeros(m,2) + ":" + this.leadingZeros(s,2);
    } else {
        m = Math.floor(time / 60);
        s = Math.floor(time % 60);

        return this.leadingZeros(m,2) + ":" + this.leadingZeros(s,2);
    }
};

/* Gets the value of property on target, whether it is a value or a function.
 * 
 * if the property is a function, the result of its invocation is returned,
 * otherwise the property is returned.
 * 
 */
org.korsakow.Utility.apply = function(target, property) {
	if (typeof target[property] == "function")
		return target[property]();
	else
		return target[property];
};

/* Sets the value of property on target, whether it is a value or a function.
 * 
 * if the property is a function, the function is called with value as an argument
 * otherwise the property is assigned to
 * 
 * @param value the value to assign
 */
org.korsakow.Utility.update = function(target, property, value) {
	var current = target[property];
	if (typeof target[property] == "function")
		target[property](value);
	else
		target[property] = value;
};

/* Performs string interpolation of operators.
 * 
 * Allows for smart accessors.
 * 
 * e.g. applyOperators("+=10", 1) yields 11
 * 
 * TODO: is this currently even used?
 * 
 * @param value the value to assign
 */
org.korsakow.Utility.applyOperators = function(value, current) {
	var t;
	var vs = value?value.toString():"";
	// TODO: this looks broken since we don't strip off the operation
	if (vs.indexOf("+=") === 0)
		t = current + value;
	else if (vs.indexOf("-=") === 0)
		t = current - value;
	else if (vs.indexOf("*=") === 0)
		t = current * value;
	else if (vs.indexOf("%") === vs.length-1)
		t = current * value/100;
	else
		t = value;
	return t;
};

/* Browser compatible fullscreen toggling.
 * 
 * derived from: http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
 */
Class.register('org.korsakow.FullScreenAPI',org.korsakow.Object,{
	initialize: function($super){
		$super();
		
		this.supportsFullScreen = false;
		this.fullScreenEventName = '';
        this.prefix = '';

		// check for native support
		if (typeof document.cancelFullScreen != 'undefined') {
			this.supportsFullScreen = true;
		} else {
			// check for fullscreen support by vendor prefix
			var browserPrefixes = 'webkit moz o ms khtml'.split(' ');
			for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
				this.prefix = browserPrefixes[i];
				if (typeof document[this.prefix + 'CancelFullScreen' ] != 'undefined' ) {
					this.supportsFullScreen = true;
					this.fullScreenEventName = this.prefix + 'fullscreenchange';
					break;
				}
			}
		}
	},
	isFullScreen: function() {
		if(this.supportsFullScreen){
			switch (this.prefix) {
				case '':
					return document.fullScreen;
				case 'webkit':
					return document.webkitIsFullScreen;
				default:
					return document[this.prefix + 'FullScreen'];
			}
		}
		else{
			return false;
		}
	},
    requestFullScreen: function(element) {
		if(this.supportsFullScreen){
			return (this.prefix === '') ? element.requestFullScreen() : element[this.prefix + 'RequestFullScreen']();
		}
		else return null;
	},
    cancelFullScreen: function(element) {
		if(this.supportsFullScreen){
			return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
		}
		else return null;
	}
});

/* Ties a function to an object.
 * 
 * Returns a function wrapper that guarantees a specific value for "this"
 * when the actual target function is called. Useful when providing a callback.
 * 
 * e.g.
 *     var foo = {
 *         value: 10
 *     };
 *     var bar = function() { return this.value; }
 *     var f = ftor(foo, bar);
 *     
 *     f() // returns 10
 * }
 * 
 * @param This the object which will be "this" in the execution context
 * @param func the function to call
 * 
 * TODO: this is obviated by Function.bind
 */
Class.register('org.korsakow.Functor', {
});
org.korsakow.ftor =
org.korsakow.Functor.create = function(This, func) {
	return function() {
		func.apply(This, arguments);
	};
};

/* TODO: unused?
 * 
 */
Class.register('org.korsakow.domain.Player', {
	
});

/* Browser compatible wrapper around the HTML5 <audio> element.
 * 
 */
Class.register('org.korsakow.Audio', {
	initialize: function($super, url, vol) {
		$super();
		this.url = url;
		this.innerVolume = vol || 1.0;
		//this.globalVolume = 1.0;
		this.init(url);
	},
	init: function(url) {
		var src = url.substring(0,url.lastIndexOf('.'));
		var This = this;
		this.elem = $("<audio/>")
		/*.attr('src', url)
		.attr('type', 'audio/ogg')*/
		.bind('error', function(event) {
			org.korsakow.log.error('Audio error: ' + org.korsakow.Audio.errorToString(event.currentTarget.error.code) + "\n" + org.korsakow.Exception.getStackString());
		});
		// TODO: better handling of browser-specific media formats
		$.each([
			{
				type: 'audio/mpeg',
				src: src + '.mp3'
			},
			{
				type: 'audio/wav',
				src: src + '.wav'
			},
			{
				type: 'audio/ogg',
				src: src + '.ogg'
			}],
			function(i,info){
				if(This.elem[0].canPlayType(info.type)){
					var source = jQuery("<source />")
						.attr("src", info.src)
						.attr("type", info.type);
					This.elem.append(source);
				}
			}
		);
	},
	play: function() {
		this.elem[0].play();
	},
	pause: function() {
		this.elem[0].pause();
	},
	/*
	 * If no arguments are supplied, retrieves the current volume.
	 * If there is an argument the volume is first set, then returned.
	 * 
	 * @param v [0,1], supports operations, e.g. "+=0.5"
	 */
	volume: function(v) {
		if (arguments.length) {
			var t = org.korsakow.Utility.applyOperators(v, this.innerVolume);
			// TODO: remove this debug code or clean it up
			if (isNaN(t)) {
				org.korsakow.log.warn("Audio.volume, isNan(t)", v,t);
			}
			this.innerVolume = t;
			this.elem[0].volume = t * org.korsakow.Audio.globalVolume;
		}
		return this.innerVolume;
	},
	/* Completely cancels the audio, stopping it and preventing any further download.
	 * 
	 * @param opts {
	 *     fade [optional]: duration (milliseconds) to fade out over before stopping, default is 0
	 * }
	 */
	cancel: function(opts) {
		opts = opts || {};
		org.korsakow.Fade.fade({
			duration: opts.fade || 0,
			begin: 1,
			end: 0,
			target: this.elem[0],
			property: 'volume',
			complete: org.korsakow.ftor(this, function() {
				if (this.elem) {
					// stops any ongoing browser download of the media
					// https://developer.mozilla.org/en-US/docs/Using_HTML5_audio_and_video
					this.elem[0].pause();
					this.elem[0].src = "";
					this.elem.remove();
				}
				this.init(this.url);
			})
		});
	},
	/* Gets or sets the current time in seconds
	 * 
	 * Supports operators.
	 */
	currentTime: function() {
		if (arguments.length) {
			var t = org.korsakow.Utility.applyOperators(v, this.elem[0].currentTime);
			e.currentTime = t;
		}
		return this.elem[0].currentTime;
	},
	playTime: function() {
		return this.elem[0].played.end();
	},
	length: function() {
		return this.elem[0].seekable.end() - this.elem[0].seekable.start();
	},
	setLooping: function(loop){
		this.elem[0].loop = loop;
	}

});

org.korsakow.Audio.globalVolume = 1.0;

org.korsakow.Audio.ERR_ABORTED = 1;
org.korsakow.Audio.ERR_NETWORK = 2;
org.korsakow.Audio.ERR_DECODE = 3;
org.korsakow.Audio.ERR_SRC_NOT_SUPPORTED = 4;
org.korsakow.Audio.errorToString = function(e) {
	switch (e) {
	case org.korsakow.Audio.ERR_ABORTED: return "aborted";
	case org.korsakow.Audio.ERR_NETWORK: return "network error";
	case org.korsakow.Audio.ERR_DECODE: return "decoding error";
	case org.korsakow.Audio.ERR_SRC_NOT_SUPPORTED: return "source not supported";
	default: return "unknown #" + e;
	}
};

Class.register('org.korsakow.Date', org.korsakow.Object, {
});
/* Gets the current data/time in milliseconds.
 */
org.korsakow.Date.now = function() {
	return Date.now();
};
