NS('org.korsakow.domain.rule');
NS('org.korsakow.domain.trigger');

/* Parent class for all domain objects (models)
 * 
 */
org.korsakow.domain.DomainObject = Class.register('org.korsakow.domain.DomainObject', org.korsakow.Object, {
	initialize: function($super, id) {
		$super();
		this.id = id;
	},
	toString: function($super) {
		return $super("%"+this.id);
	}
});

org.korsakow.domain.Keyword = Class.register('org.korsakow.domain.Keyword', org.korsakow.Object, {
	initialize: function($super, value, weight) {
		$super(null);
		this.value = value;
		this.weight = weight;
	},
	toString: function() {
		return "[Keyword value='"+this.value+"'; weight='"+this.weight+"']";
	}
});

/* MAPPING PLUGIN */
org.korsakow.mappingplugin.LOC = Class.register('org.korsakow.mappingplugin.LOC'), org.korsakow.Object {
    initialize: function($super, kind, x, y, value) {
        $super(null);
        this.x = x;
        this.y = y;
        this.longitude = x;
        this.latitude = y;
        this.kind = kind;
        this.keyword = value;
        
        if (this.kind == "geo") {
            this.latitudeRadians = this.latitude * Math.PI / 180;
            this.longitudeRadians = this.longitude * Math.PI / 180;
            var earth_radius_in_meters = 6372797.560856;
            
            var getArcRadiansFromCoordinate = function(loc) {                
                var latitudeArc  = (loc.latitudeRadians - this.latitudeRadians); 
                var longitudeArc = (loc.longitudeRadians - this.longitudeRadians); 
                var latitudeH = Math.pow(Math.sin(latitudeArc * 0.5), 2);
                var longitudeH = Math.pow(Math.sin(longitudeArc * 0.5), 2);
                var tmp = Math.pow(Math.cos(this.latitudeRadians), 2);
                return 2.0 * Math.asin(Math.sqrt(latitudeH + tmp*longitudeH));
            }

            this.distance = function(loc) {
                if (loc.kind != this.kind)
                    return NaN;

               return earth_radius_in_meters * getArcRadiansFromCoordinate(loc);
            }



        } else {
            this.distance = function(loc) {
                if (loc.kind != this.kind)
                    return NaN;
                
                return math.sqrt(math.pow(loc.x - this.x, 2) + math.pow(loc.y - this.y, 2));
            }
        }
        
    },
    
    equals: function(loc) {
        //Two locs are considered equivalent if their kind and value are the same.  
        return this.kind == loc.kind && this.value == loc.value;
    }
    
    sameAs: function(loc) {
        //Two locs are the same if all their values are equal
        return this.equals(loc) && this.x == x && this.y == y;
    }
        
    toString: function() {
        return "[" + this.kind + "LOC x='" + this.x + "'; y='" + this.y + "'; keyword='" + value + "';]";   
    }
});

/* MAPPING PLUGIN */
org.korsakow.mappingplugin.MapRep = Class.register('org.korsakow.mappingplugin.MapRep'), org.korsakow.Object {
    initialize: function($super, mapKind, mapURL, defaultCoordX, defaultCoordY) {
        $super(null);
        this.kind = mapKind;
        this.url = mapURL;
        
        this.defaultCoord = {x: defaultCoordX, y:defaultCoordY};
    }
});

/* MAPPING PLUGIN */
org.korsakow.mappingplugin.Map = Class.register('org.korsakow.mappingplugin.Map'), org.korsakow.domain.DomainObject {
    initialize: function($super, id, name, mapRep, originX, originY, _width, _height, locs, keywords) {
        $super(id);
        this.name = name;
        this.mapRep = mapRep;
        this.bounds = { 
            origin: {x: originX, y: originY}, 
            size:{width: _width, height: _height}
            center: function() {
                return { x:this.origin.x + 0.5 * this.size.width, y:this.origin.y + 0.5 * this.size.height };
            }
    
            getRegionBounds: function(region) {
                //returns the bounds for the given region
                region = math.floor(region);
                //clamp the region to between 1 and 5.  If region < 1 then region = 1,
                //and if region > 5 region = 5.  Finally, subtract 1, so region is now 0 indexed
                region = max(min(region, 5), 1) - 1;
            
                var outerRegionOffset = { x: region / this.size.width, y: region / this.size.height };
                
                var outerRect = {
                        origin :  { x: this.origin.x + outerRegionOffset.x, y: this.origin.y + outerRegionOffset.y },
                        size : { width: outerRegionOffset.x * 2, height: outerRegionOffset.y * 2 }
                };
                
                var innerRect;
                
                if (region == 4) {
                    //special case for region 5 - it has no inner region, so set innerRect to center
                    //with width==height==0
                    var center = this.center();
                    innerRect = { origin: { x: center.x, y: center.y}, size:{width:0, height:0} };
                                
                } else {
                    var innerRegionOffset = { x: (region + 1) / this.size.width, y: (region + 1) / this.size.height };

                    var innerRect = {
                        origin :  { x: this.origin.x + innerRegionOffset.x, y: this.origin.y + innerRegionOffset.y },
                        size : { width: innerRegionOffset.x * 2, height: innerRegionOffset.y * 2 }
                }
                
                return { 
                    outer: outerRect, 
                    inner: innerRect,
                    isWithin: function(x, y) {
                        return  
                            /* First check to see if is inside the outer rectangle */
                             ( (x >= this.outer.origin.x && x < this.outer.origin.x + this.outer.size.width) &&
                               (y >= this.outer.origin.y && y < this.outer.origin.y + this.outer.size.height) ) &&
                            /* Second check to see if not inside the inner rectangle */
                            !( (x >= this.inner.origin.x && x < this.inner.origin.x + this.inner.size.width) &&
                               (y >= this.inner.origin.y && y < this.inner.origin.y + this.inner.size.height) );
                               
                    }
                };
            }
    
            regionForPoint: function(x, y) {
                //returns a number between 1 and 5, which represents the relative strength for
                //a loc.  A point right on the center will have 5, points between the center and
                //perifery will vary between 5 and 1, and points near the edge will be 1.
                for (region = 1; region <= 5; ++region) {
                    if (this.getRegionBounds(region).isWithin(x, y))
                        return region;
                }
                
                //If for some reason we get here, then we are out of bounds, and thus lowest strength
                return 1;
            }                
        };
    
        this.locs = locs;
        this.keywords = keywords;
    }

    findLOC: function(loc) {
    }


    strengthForLOC: function(loc) {
        //check to see if the loc is in this map.
                
    }

});

/* Parent class for all Media types
 * 
 * TODO: is this class useful?
 */
org.korsakow.domain.Media = Class.register('org.korsakow.domain.Media', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, filename) {
		$super(id);
		this.filename = filename;
	}
});

org.korsakow.domain.Video = Class.register('org.korsakow.domain.Video', org.korsakow.domain.Media, {
	initialize: function($super, id, filename, subtitlesFilename) {
		$super(id, filename);
		this.subtitlesFilename = subtitlesFilename;
	}
});

org.korsakow.domain.Sound = Class.register('org.korsakow.domain.Sound', org.korsakow.domain.Media, {
	initialize: function($super, id, filename){
		$super(id,filename);
	}
});

org.korsakow.domain.Image = Class.register('org.korsakow.domain.Image', org.korsakow.domain.Media, {
	initialize: function($super, id, filename, duration) {
		$super(id, filename);
		this.duration = duration;
	}
});

org.korsakow.domain.Snu = Class.register('org.korsakow.domain.Snu', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, name, keywords, mainMedia, previewMedia, interface, events, lives, looping, starter, insertText, rating, backgroundSoundMode, backgroundSoundLooping, backgroundSoundMedia, backgroundSoundVolume) {
		$super(id);
		this.name = name;
		this.keyword = keywords;
		this.mainMedia = mainMedia;
		this.previewMedia = previewMedia;
		this.interface = interface;
		this.events = events;
		this.lives = lives;
		this.looping = looping;
		this.start = starter;
		this.insertText = insertText;
		this.rating = rating;
		this.backgroundSoundMode = backgroundSoundMode;
		this.backgroundSoundLooping = backgroundSoundLooping;
		this.backgroundSoundMedia = backgroundSoundMedia;
		this.backgroundSoundVolume = backgroundSoundVolume;
	}
});

org.korsakow.domain.Event = Class.register('org.korsakow.domain.Event', org.korsakow.domain.DomainObject, {
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
org.korsakow.domain.trigger.SnuTime = Class.register('org.korsakow.domain.trigger.SnuTime', org.korsakow.domain.DomainObject, {
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

org.korsakow.domain.Interface = Class.register('org.korsakow.domain.Interface', org.korsakow.domain.DomainObject, {
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

org.korsakow.domain.Project = Class.register('org.korsakow.domain.Project', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, name, width, height, splashScreenMedia, backgroundSoundMedia, backgroundSoundVolume, backgroundSoundLooping, clickSound, backgroundColor, backgroundImage) {
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
	}
});

org.korsakow.SearchResults = Class.register('org.korsakow.SearchResults', {
	initialize: function() {
		this.results = [];
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
org.korsakow.SearchResult = Class.register('org.korsakow.SearchResult', {
	initialize: function(snu, score) {
		this.snu = snu;
		this.score = score;
	},
	toString: function() {
		return "[org.korsakow.SearchResult; snu="+this.snu.id+"("+this.snu.name+")]";
	}
});

org.korsakow.SoundManager = Class.register('org.korsakow.SoundManager', {
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
