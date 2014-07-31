NS('org.korsakow');

/* Interpolates a value over a period of time at a fixed rate.
 * 
 * Events:
 *     change: called once per iteration
 *     complete: called once on the last iteration
 * 
 */
org.korsakow.Tween = Class.register('org.korsakow.Tween', {
	initialize: function($super, duration, begin, end) {
		$super();
		this.running = false;
		this.begin = begin;
		this.end = end;
		this.duration = duration;
		this.position = 0;
		this.time = 0;
		this.prev = 0;
	},
	start: function() {
		if (this.running) return;
		this.running = true;
		prev = org.korsakow.Date.now();
		this.timeout = org.korsakow.setInterval(org.korsakow.ftor(this, this.onTimer), Math.min(50, this.duration)); // TODO: why is this capped at 50?
		return this;
	},
	pause: function() {
		if (!this.running) return;
		org.korsakow.clearInterval(this.timeout);
		this.timeout = null;
		return this;
	},
	stop: function() {
		if (!this.running) return;
		this.cancel();
		this.position = this.end;
		jQuery(this).trigger('change', this.end);
		jQuery(this).trigger('complete');
		return this;
	},
	cancel: function() {
		if (!this.running) return;
		this.running = false;
		org.korsakow.clearInterval(this.timeout);
		this.timeout = null;
		return this;
	},
	onTimer: function() {
		var now = org.korsakow.Date.now();
		this.time = (now-prev);
		this.prev = now;
		if (this.time > this.duration)
			this.time = this.duration;
		this.position = this.begin + (this.end-this.begin) * (this.duration?(this.time / this.duration):1);
		if (this.time >= this.duration)
			this.stop();
		else
			jQuery(this).trigger('change', this.position);
	}
});
org.korsakow.Tween.run = function(duration, begin, end, onchange) {
	var t = new org.korsakow.Tween(duration, begin, end);
	jQuery(t).bind('change', onchange);
	return t;
};

org.korsakow.Fade = Class.register('org.korsakow.Fade', {
	
});
/* Creates a fading tween.
 * 
 * @param opts {
 *     duration: see Tween
 *     begin: see Tween
 *     end: see Tween
 *     target: the object whose property will be faded
 *     property: the property which will be faded (may be a property or accessor)
 *     complete: a callback invoked when the tween completes
 * }
 * 
 * @return the tween object
 */
org.korsakow.Fade.fade = function(opts) {
	var t = new org.korsakow.Tween(opts.duration, opts.begin, opts.end);
	var init = org.korsakow.Utility.apply(opts.target, opts.property);
	jQuery(t).bind('change', function() {
		org.korsakow.Utility.update(opts.target, opts.property, t.position);
	});
	if (opts.complete)
		jQuery(t).bind('complete', opts.complete);
	org.korsakow.Utility.update(opts.target, opts.property, 0);
	t.start();
	return t;
};
