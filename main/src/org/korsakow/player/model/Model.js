NS('org.korsakow.domain.rule');
NS('org.korsakow.domain.trigger');

/* Parent class for all domain objects (models)
 * 
 */
Class.register('org.korsakow.domain.DomainObject', org.korsakow.Object, {
	initialize: function($super, id) {
		$super();
		this.id = id;
	},
	toString: function($super) {
		return $super("%"+this.id);
	}
});

Class.register('org.korsakow.domain.Keyword', org.korsakow.Object, {
	initialize: function($super, value, weight) {
		$super(null);
		this.value = value;
		this.weight = weight;
	},
	/*
	 * returns true if the keyword is a LOC, false otherwise.
	 */
	/* MAPPING PLUGIN */
	isLOC: function() {
	 	return this.value.charAt(0) == '♦';
	},

	/*
	 * returns the LOC name of the keyword (keyword.value with the '♦' stripped frome the beginning) if the keyword
	 * is a type of LOC.  Returns null otherwise.
	 */
	/* MAPPING PLUGIN */
	LOCValue: function() {
		if (this.isLOC()) {
			//This is a LOC
			return this.value.substr(1);
		}

		return null;
	},

	toString: function() {
		return "[Keyword value='"+this.value+"'; weight='"+this.weight+"']";
	}
});

/* Parent class for all Media types
 * 
 * TODO: is this class useful?
 */
Class.register('org.korsakow.domain.Media', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, filename) {
		$super(id);
		this.filename = filename;
	}
});

Class.register('org.korsakow.domain.Video', org.korsakow.domain.Media, {
	initialize: function($super, id, filename, subtitlesFilename) {
		$super(id, filename);
		this.subtitlesFilename = subtitlesFilename;
	}
});

Class.register('org.korsakow.domain.Sound', org.korsakow.domain.Media, {
	initialize: function($super, id, filename){
		$super(id,filename);
	}
});

Class.register('org.korsakow.domain.Image', org.korsakow.domain.Media, {
	initialize: function($super, id, filename, duration) {
		$super(id, filename);
		this.duration = duration;
	}
});

Class.register('org.korsakow.domain.Snu', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, name, keywords, mainMedia, previewImage, previewMedia, interface, events, lives, looping, starter, insertText, previewText, rating, backgroundSoundMode, backgroundSoundLooping, backgroundSoundMedia, backgroundSoundVolume) {
		$super(id);
		this.name = name;
		this.keyword = keywords;
		this.mainMedia = mainMedia;
        this.previewImage = previewImage;
        this.previewMedia = previewMedia;
		this.interface = interface;
		this.events = events;
		this.lives = lives;
		this.looping = looping;
		this.start = starter;
		this.insertText = insertText;
		this.previewText = previewText;
		this.rating = rating;
		this.backgroundSoundMode = backgroundSoundMode;
		this.backgroundSoundLooping = backgroundSoundLooping;
		this.backgroundSoundMedia = backgroundSoundMedia;
		this.backgroundSoundVolume = backgroundSoundVolume;
	}
});

Class.register('org.korsakow.domain.Event', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, predicate, trigger, rule) {
		$super(id);
		this.id = id;
		this.predicate = predicate;
		this.trigger = trigger;
		this.rule = rule;
	},
	setup: function(env) {
		var This = this;
		this.trigger.setup(env, function triggeredRule () {
			// TODO check the predicate
			This.rule.execute(env);
		});
	},
	destroy: function() {
		this.cancel();
	},
	cancel: function (env) {
		this.trigger.cancel();
	}
});

/**
 * Executes an event's rules after <time> seconds.
 */
Class.register('org.korsakow.domain.trigger.SnuTime', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, time) {
		$super(id);
		this.id = id;
		this.time = time;
	},
	setup: function (env, callback) {
		var This = this,
			mainMediaUI = env.getMainMediaWidget().view;

		// This needs to happen inside setup() so if the same
		// trigger is loaded for a new SNU it isn't already marked
		// as done.
		this.cancelled = false;
		this.done = false;

		mainMediaUI.bind('timeupdate', function triggerTimeUpdate () {
			var curTime = mainMediaUI.currentTime();
			var ready = (This.done === false && This.cancelled === false);
			if (curTime >= This.time && ready) {
				org.korsakow.log.debug('SnuTime triggered at: ' + curTime/1000 + 's');
				This.done = true;
				callback();
			}
		});
	},
	cancel: function () {
		this.cancelled = true;
	}
});

Class.register('org.korsakow.domain.Interface', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, name, keywords, widgets, clickSound, backgroundColor, backgroundImage) {
		$super(id);
		this.name = name;
		this.keyword = keywords;
		this.widgets = widgets;
		this.clickSound = clickSound;
		this.backgroundColor = backgroundColor;
		this.backgroundImage = backgroundImage;
	}
});

Class.register('org.korsakow.domain.Project', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, name, width, height, splashScreenMedia, backgroundSoundMedia, backgroundSoundVolume, backgroundSoundLooping, clickSound, backgroundColor, backgroundImage, maxLinks) {
		$super(id);
		this.name = name;
		this.width = width;
		this.height = height;
		this.splashScreenMedia = splashScreenMedia;
		this.backgroundSoundMedia = backgroundSoundMedia;
		this.backgroundSoundLooping = backgroundSoundLooping;
		this.backgroundSoundVolume = backgroundSoundVolume;
		this.clickSound = clickSound;
		this.backgroundColor = backgroundColor;
		this.backgroundImage = backgroundImage;
		this.maxLinks = maxLinks;
	}
});

Class.register('org.korsakow.SearchResults', {
	initialize: function() {
		this.results = [];
		this.keywords = [];
	},

	/* MAPPING PLUGIN */
	addKeyword: function(keyword) {
		if (keyword == null || keyword.value == null || keyword.value.length == 0)
			return;

		for (var i = 0; i < this.keywords.length; ++i) {
			if (this.keywords[i].keyword == keyword) {
				this.keywords[i].score += keyword.weight;
				return this.keywords[i].score;
			}
		}

		//not in the list above, add it
		this.keywords.push( {"keyword": keyword, "score": keyword.weight });

	},

	/* MAPPING PLUGIN */
	excludeKeyword: function(keyword) {
		if (keyword == null || keyword.value == null || keyword.value.length == 0)
			return;

		for (var i = 0; i < this.keywords.length; ++i) {
			if (this.keywords[i].keyword.value == keyword.value) {
				this.keywords.splice(i, 1);

				break;
			}
		};
	},

	indexOfSnu: function(snu) {
		for (var i = 0; i < this.results.length; ++i)
			if (this.results[i].snu.id == snu.id)
				return i;
		return -1;
	},
	resultOfSnu: function(snu) {
		for (var i = 0; i < this.results.length; ++i)
			if (this.results[i].snu.id == snu.id)
				return this.results[i];
		return null;
	},
	toString: function() {
		return "[org.korsakow.SearchResults]";
	}
});
Class.register('org.korsakow.SearchResult', {
	initialize: function(snu, score, keyword) {
		this.snu = snu;
		this.score = score;
		/* MAPPING PLUGIN */
		//The Mapping plugin needs to know which keywords are associated with a SNU to work properly
		this.keywords = [];
		if (keyword != null) {
			this.keywords.push({ "keyword": keyword, "score": keyword.weight});
		}
	},
	addScore: function(value) {
		this.score += value * this.snu.rating;
	},
	/* MAPPING PLUGIN */
	addKeyword: function(keyword) {
		if (keyword == null || keyword.value == null || keyword.value.length == 0)
			return;

		for (var i = 0; i < this.keywords.length; ++i) {
			if (this.keywords[i].keyword.value == keyword.value) {
				this.keywords[i].score += keyword.weight;
				return this.keywords[i].score;
			}
		}

		this.keywords.push({"keyword": keyword, "score": keyword.weight});
	},

	/* MAPPING PLUGIN */
	excludeKeyword: function(keyword) {
		if (keyword == null || keyword.value == null || keyword.value.length == 0)
			return;

		for (var i = 0; i < this.keywords.length; ++i) {
			if (this.keywords[i].keyword.value == keyword.value) {
				this.keywords.splice(i, 1);

				break;
			}
		};
	},

	toString: function() {
		return "[org.korsakow.SearchResult; snu="+this.snu.id+"("+this.snu.name+")]";
	}
});

Class.register('org.korsakow.SoundManager', {
	initialize: function($super) {
		$super();
		this.channels = {};
	},
	playSound: function(opts) {
		var prev = this.channels[opts.channel];
		
		var f = org.korsakow.Fade.fade({
			duration: prev?opts.fade*0.75:0,
			begin: prev?prev.audio.volume():1,
			end: 0,
			target:prev?prev.audio:{volume:0},
			property: 'volume',
			complete: org.korsakow.ftor(this, function() {
				if (prev) prev.audio.cancel();
				
				if (this.channels[opts.channel]) {
					delete this.channels[opts.channel];
				}
				var audio = new org.korsakow.Audio(opts.uri, opts.volume);
				audio.play();
				if(opts.loop) audio.setLooping(opts.loop);
				
				var f = org.korsakow.Fade.fade({
					duration: opts.fade,
					begin: 0,
					end: opts.volume || 1,
					target: audio,
					property: 'volume'
				});
				this.channels[opts.channel] = {
					audio: audio,
					tween: f
				};
			})
		});
		if (prev) {
			prev.tween.cancel();
			prev.tween = f;
		}
	}
});
