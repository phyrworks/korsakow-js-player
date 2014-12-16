/* Classes related to unmarshalling domain objects
 * 
 * Finder: a finder knows how to locate a certain type of domain object in various ways from the project.xml
 * 		finder methods return a jQuery-wrapped XML node
 * 
 * Mapper: knows how to create a domain object from an XML node
 * 
 */
NS('org.korsakow.domain.rule');
NS('org.korsakow.domain.trigger');
NS('org.korsakow.domain.widget');


/* Locates XML nodes by various criteria
 * 
 */
Class.register('org.korsakow.domain.Finder', {
	/*
	 * @param data jQuery-wrapped XML
	 */
	initialize: function($super, data) {
		$super();
		this.data = data;
		this.idIndex = {};
		this.snuKeywordIndex = {};
		/* MAPPING PLUGIN */
		this.mapLocIndex = {};
		
		var thisFinder = this;
		function buildIndices() {
		    ['videos', 'images', 'sounds', 'texts', 'interfaces', 'snus', 'maps'].forEach(function(type) {
		        thisFinder.data && thisFinder.data[type] && thisFinder.data[type].forEach(function(d) {
	                thisFinder.idIndex[d.id] = d;
	                
	                if (type === 'snus') {
    	                d.keywords && d.keywords.forEach(function(k) {
    	                    var value = k.value;
    	                    thisFinder.snuKeywordIndex[value] = thisFinder.snuKeywordIndex[value] || [];
    	                    thisFinder.snuKeywordIndex[value].push(d);
    	                });
	                } else if (type === 'maps') { /* MAPPING PLUGIN */
	                	d.locs && d.locs.forEach(function(loc) {
	                		var value = loc.keyword;
	                		thisFinder.mapLocIndex[value] = thisFinder.mapLocIndex[value] || [];
	                		thisFinder.mapLocIndex[value].push(d);
	                	})
	                }
	            });
		    });
		}
        var before = org.korsakow.Date.now();
		buildIndices();
        var after = org.korsakow.Date.now();
        
        org.korsakow.log.info("Building indices took " + (after-before) + "ms");
        org.korsakow.log.info('IdIndex size: ', Object.keys(this.idIndex).length);
        org.korsakow.log.info('SnuKeywordIndex size', Object.keys(this.snuKeywordIndex).length);
        org.korsakow.log.info('MapLocIndex size', Object.keys(this.mapLocIndex).length);
	},
	/**
	 * @param id the id of the object to find, corresponds to the <id> tag in the xml
	 * @param opts currently not used
	 */
	findById: function(id, opts) {
	    return this.idIndex[id];
	},
	findMediaById: function(id, opts) {
		return this.findById(id, opts);
	},
	findSnusWithKeyword: function(keyword) {
	    return this.snuKeywordIndex[keyword] && this.snuKeywordIndex[keyword] || [];
	},
	findSnusFilter: function(filter) {
	    return this.data.snus.filter(filter);
	},

	/* MAPPING PLUGIN */
	findMapsFilter: function(filter) {
		return this.data.maps.filter(filter);
	},

	findProject: function() {
	    return this.data.Project;
	},
	/* MAPPING PLUGIN */
	findMapsWithLOC: function(locValue) {
		if (this.mapLocIndex[locValue] == null)
			return [];
		else
			return this.mapLocIndex[locValue];
		// return this.mapLocIndex[locValue] != null ? this.mapLocIndex[locValue] : [] ;
		/*return this.data.maps.filter(function() {
				var x = $(this).children('locs').children('LOC');
				for (var i = 0; i < x.length; ++i)
					var value = $(x[i]).children("keyword")[0]; //<-- There should be exactly 1
					var txt = $(value).text();
					if (txt == opts.loc) {
						return true;
					}
				return false;

			});*/
	}
});

org.korsakow.domain.MapperException = org.korsakow.Exception;
org.korsakow.domain.DomainObjectNotFoundException = org.korsakow.Exception;

/* Data Access Object
 * Finds domain objects
 */
Class.register('org.korsakow.domain.Dao', {
	/*
	 * @param $super
	 * @param finder
	 * @param mappers Array[{org.korsakow.Mapper}
	 */
	initialize: function($super, finder, mappers) {
		$super();
		this.idmap = {};
		this.mappers = mappers;
		this.finder = finder;
	},
	getMapper: function(clazz) {
		var mapper = this.mappers[clazz];
		if (!mapper)
			throw new org.korsakow.domain.MapperException("No mapper for: " + clazz);
		return mapper;
	},
	findById: function(id) {
		if (this.idmap[id])
			return this.idmap[id];
		var data = this.finder.findById.apply(this.finder, arguments);
		if (!data)
			throw new org.korsakow.domain.DomainObjectNotFoundException("DomainObject not found: #" + id);
		var mapper = this.getMapper(data.className);
		var obj = mapper.map(data);
		this.idmap[obj.id] = obj;
		return obj;
	},
    findMediaById: function(id) {
        if (this.idmap[id])
            return this.idmap[id];
        var data = this.finder.findMediaById.apply(this.finder, arguments);
        if (!data)
            throw new org.korsakow.domain.DomainObjectNotFoundException("DomainObject not found: #" + id);
        var mapper = this.getMapper(data.className);
        var obj = mapper.map(data);
        this.idmap[obj.id] = obj;
        return obj;
    },
    findSnusWithKeyword: function(keyword) {
        return this.finder.findSnusWithKeyword(keyword).map(function(d) {
            if (this.idmap[d.id])
                return this.idmap[d.id];
            var mapper = this.getMapper('Snu');
            var obj = mapper.map(d);
            this.idmap[obj.id] = obj;
            return obj;
        }.bind(this));
    },
    findSnusFilter: function(filter) {
        return this.finder.findSnusFilter(filter).map(function(d) {
            if (this.idmap[d.id])
                return this.idmap[d.id];
            var mapper = this.getMapper('Snu');
            var obj = mapper.map(d);
            this.idmap[obj.id] = obj;
            return obj;
        }.bind(this));
    },
    findSnus: function() { return this.findSnusFilter(function() { return true; }); },

    /* MAPPING PLUGIN */
    findMapsFilter: function(filter) {
    	return this.finder.findMapsFilter(filter).map(function(d) {
    		if (this.idmap[d.id])
    			return this.idmap[d.id];

    		var mapper = this.getMapper('Map');
    		var obj = mapper.map(d);

    		this.idmap[obj.id] = obj;
    		return obj;
    	}.bind(this));
    },

    /* MAPPING PLUGIN */
    findMapsWithLOC: function(locValue) {
    	var maps = this.finder.findMapsWithLOC(locValue);
    	return maps.map(function(d) {
    		if (this.idmap[d.id])
    			return this.idmap[d.id];

    		var mapper = this.getMapper('Map');
    		var obj = mapper.map(d);
    		this.idmap[obj.id] = obj;

    		return obj;
    	}.bind(this));
    },

    /* MAPPING PLUGIN */
    findMaps: function() { return this.findMapsFilter(function() { return true; }); },

    findProject: function() {
        var d = this.finder.findProject();
        var mapper = this.getMapper('Project');
        var obj = mapper.map(d);
        this.idmap[obj.id] = obj;
        return obj;
    },

    //Used to be "mapKeywords", but this has use outside of just keywords (LOCs for instance).  Actually works with most things. --Phoenix 09/18/2014
	mapGeneric: function(data) {
	    return data.map(function(datum) {
	        var mapper = this.getMapper(datum.className);
	        var obj = mapper.map(datum);
	        return obj;
	    }.bind(this));
	},

	map: function(datum) {
	    var id = datum.id;
        if (this.idmap[id])
            return this.idmap[id];
        var mapper = this.getMapper(datum.className);
        var obj = mapper.map(datum);
        this.idmap[obj.id] = obj;
        return obj;
	},
    mapAll: function(data) {
        return data.map(this.map.bind(this));
    }
});
/* Factory method
 * @param data jQuery-wrapped XML
 * @returns {org.korsakow.domain.Dao}
 */
org.korsakow.domain.Dao.create = function(data) {
	
	var dao = new org.korsakow.domain.Dao();
	dao.initialize(new org.korsakow.domain.Finder(data), {
		'Keyword': new org.korsakow.domain.KeywordInputMapper(dao),
		'Video': new org.korsakow.domain.VideoInputMapper(dao),
		'Sound' : new org.korsakow.domain.SoundInputMapper(dao),
		'Image': new org.korsakow.domain.ImageInputMapper(dao),
		'Snu': new org.korsakow.domain.SnuInputMapper(dao),

		/* MAPPING PLUGIN */
		'Map': new org.korsakow.mappingplugin.domain.MapInputMapper(dao),
		/* MAPPING PLUGIN */
		'LOC': new org.korsakow.mappingplugin.domain.LOCInputMapper(dao),

		'Interface': new org.korsakow.domain.InterfaceInputMapper(dao),
		'Widget': new org.korsakow.domain.WidgetInputMapper(dao),
		'Event': new org.korsakow.domain.EventInputMapper(dao),
		'Predicate': new org.korsakow.domain.PredicateInputMapper(dao),
		'Trigger': new org.korsakow.domain.TriggerInputMapper(dao),
		'Rule': new org.korsakow.domain.RuleInputMapper(dao),
		'Project': new org.korsakow.domain.ProjectInputMapper(dao)
	});
	return dao;
};

org.korsakow.domain.ParseException = org.korsakow.Exception;
/*
Class.create(Error, {
	initialize: function($super, message) {
		$super(message);
	}
});
*/

var PU = org.korsakow.domain.ParseUtil = Class.register('org.korsakow.domain.ParseUtil', {
});

org.korsakow.domain.ParseUtil.parseInt = function(expr, message) {
	if (!org.korsakow.isValue(expr))
		throw new org.korsakow.domain.ParseException("Int Not found: " + message);
	return parseInt(expr, null);
};
org.korsakow.domain.ParseUtil.parseFloat = function(expr, message) {
    if (!org.korsakow.isValue(expr))
		throw new org.korsakow.domain.ParseException("Float Not found: " + message);
	return parseFloat(expr);
};
org.korsakow.domain.ParseUtil.parseString = function(expr, message) {
    if (!org.korsakow.isValue(expr))
		throw new org.korsakow.domain.ParseException("String Not found: " + message);
	return expr;
};
org.korsakow.domain.ParseUtil.parseBoolean = function(expr, message) {
    if (!org.korsakow.isValue(expr))
		throw new org.korsakow.domain.ParseException("Boolean Not found: " + message);
	return !!expr;
};
org.korsakow.domain.ParseUtil.parseColor = function(expr, message) {
    if (!org.korsakow.isValue(expr))
		throw new org.korsakow.domain.ParseException("Color Not found: " + message);
	return expr;
};

Class.register('org.korsakow.domain.InputMapper', {
	initialize: function($super, dao) {
		$super();
		this.dao = dao;
	},
	parseInt: function(data, prop) {
		return PU.parseInt(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
	},
	parseFloat: function(data, prop) {
		return PU.parseFloat(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
	},
	parseString: function(data, prop) {
		return PU.parseString(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
	},
	parseBoolean: function(data, prop) {
		return PU.parseBoolean(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
	},
	parseColor: function(data, prop) {
		return PU.parseColor(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
	},

	parseIntNoThrow: function(data, prop, defaultValue) {
		try {
			return PU.parseInt(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
		} catch (err) {
			org.korsakow.log.info(err);

			return defaultValue;
		}
	},
	parseFloatNoThrow: function(data, prop, defaultValue) {
		try {
			return PU.parseFloat(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
		} catch (err) {
			org.korsakow.log.info(err);

			return defaultValue;
		}
	},
	parseStringNoThrow: function(data, prop, defaultValue) {
		try {
			return PU.parseString(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
		} catch (err) {
			org.korsakow.log.info(err);

			return defaultValue;
		}
	},
	parseBooleanNoThrow: function(data, prop, defaultValue) {
		try {
			return PU.parseBoolean(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
		} catch (err) {
			org.korsakow.log.info(err);

			return defaultValue;
		}
	},
	parseColorNoThrow: function(data, prop, defaultValue) {
		try {
			return PU.parseColor(data[prop], this.getClass().qualifiedName + "." + prop + ':' + data['id']);
		} catch (err) {
			org.korsakow.log.info(err);

			return defaultValue;
		}
	}
});

Class.register('org.korsakow.domain.KeywordInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var value = this.parseString(data, "value");
		var weight = 1;
		return new org.korsakow.domain.Keyword(value, weight);
	}
});

Class.register('org.korsakow.domain.VideoInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var This = this;
		var id = this.parseInt(data, "id");
		var filename = this.parseString(data, "filename");
		filename = filename.substring(0, filename.lastIndexOf('.'));

		var subtitlesTag = data['subtitles'];
		var subtitlesFilename = (function () {
			if (!subtitlesTag) {
				return null;
			} else {
				return This.parseString(data, "subtitles");
			}
		})();

		return new org.korsakow.domain.Video(id, filename, subtitlesFilename);
	}
});

Class.register('org.korsakow.domain.ImageInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var filename = this.parseString(data, "filename");
		var duration = (function() {
			if (org.korsakow.isValue(data["duration"])) {
				return this.parseFloat(data, "duration");
			} else {
				return undefined;
			}
		})();
		return new org.korsakow.domain.Image(id, filename, duration);
	}
});

Class.register('org.korsakow.domain.SoundInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var filename = this.parseString(data, "filename");
		return new org.korsakow.domain.Sound(id, filename);
	}
});

Class.register('org.korsakow.domain.SnuInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var name = this.parseString(data, "name");
		var keywords = this.dao.mapGeneric(data.keywords);
		var mainMedia = this.dao.findMediaById(this.parseInt(data, "mainMediaId"));
        var previewImage = (function() {
            if (org.korsakow.isValue(data["previewImageId"])) {
                return this.dao.findMediaById(this.parseInt(data, "previewImageId"));
            } else {
                return null;
            }
        }).apply(this);
		var previewMedia = (function() {
			if (org.korsakow.isValue(data["previewMediaId"])) {
				return this.dao.findMediaById(this.parseInt(data, "previewMediaId"));
			} else {
				return null;
			}
		}).apply(this);
		var interface = this.dao.findById(this.parseInt(data, "interfaceId"));
		var starter = this.parseBoolean(data, "starter");
		var events = this.dao.mapAll(data.events);
		var lives = (function(){
		    if (org.korsakow.isValue(data["lives"]))
                return this.parseInt(data, "lives");
		    else
		        return NaN;
		}).apply(this);
		var looping = this.parseBoolean(data, "looping");
		var insertText = this.parseString(data, "insertText");
		var previewText = this.parseString(data, "previewText");
		var rating = this.parseFloat(data, "rating");
		var backgroundSoundMode = this.parseString(data, "backgroundSoundMode");
		var backgroundSoundLooping = this.parseString(data, "backgroundSoundLooping");
		var backgroundSoundVolume = 1.0;
		var backgroundSoundMedia = (function(){
			if(org.korsakow.isValue(data["backgroundSoundId"])){
				backgroundSoundVolume = this.parseFloat(data, "backgroundSoundVolume");
				return this.dao.findById(this.parseInt(data, "backgroundSoundId"));
			} else
				return null;
		}).apply(this);
		return new org.korsakow.domain.Snu(id, name, keywords, 
		        mainMedia, previewImage, previewMedia, 
		        interface, events, lives,
				looping, starter, insertText, previewText, rating,
				backgroundSoundMode,backgroundSoundLooping, backgroundSoundMedia, backgroundSoundVolume);
	}
});

Class.register('org.korsakow.domain.InterfaceInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var name = this.parseString(data, "name");
		var keywords = [];
		// TODO: a better way to gracefully handle unknown widgets than "ignoreError"
		var widgets = this.dao.mapAll(data.widgets);
		var clickSound = (function() {
			if (org.korsakow.isValue(data["clickSoundId"])) {
				var clickSoundId = this.parseInt(data, "clickSoundId");
				return this.dao.findById(clickSoundId);
			} else
				return null;
		}).apply(this);
		var backgroundImage = (function() {
			if (org.korsakow.isValue(data["backgroundImageId"])) {
				return this.dao.findById(this.parseInt(data, "backgroundImageId"));
			} else
				return null;
		}).apply(this);
		var backgroundColor = org.korsakow.isValue(data["backgroundColor"])?this.parseColor(data, "backgroundColor"):null;
		return new org.korsakow.domain.Interface(id, name, keywords, widgets, clickSound, backgroundColor, backgroundImage);
	}
});

//
/**
 * This is actually a sort of MetaInputMapper in that it does a lookup for the actual mapper based on the widget's type
 */
Class.register('org.korsakow.domain.WidgetInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var mapper = org.korsakow.domain.InputMapperFactory.create(type, this.dao);
		return mapper.map(data);
	}
});

Class.register('org.korsakow.domain.MainMediaInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		var widget = new org.korsakow.domain.widget.MainMedia(id, [], type, x, y, width, height);
		return widget;
	}
});

Class.register('org.korsakow.domain.PreviewInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		var index = this.parseInt(data, "index");
		
		var fontColor = this.parseStringNoThrow(data, "fontColor", "black");
		var fontFamily = this.parseStringNoThrow(data, "fontFamily", "Arial");
		var fontSize = this.parseIntNoThrow(data, "fontSize", "12");
		var fontStyle = this.parseStringNoThrow(data, "fontStyle", "normal");
		var fontWeight = this.parseStringNoThrow(data, "fontWeight", "normal");
		var textDecoration = this.parseString(data, "textDecoration", "none");
		
		var horizontalTextAlignment = this.parseString(data, "horizontalTextAlignment");
		var verticalTextAlignment = this.parseString(data, "verticalTextAlignment");
		
		var previewTextMode = (function() {
			if (org.korsakow.isValue(data["previewTextMode"])) {
				return org.korsakow.domain.widget.Preview.PreviewTextMode.fromValue(this.parseString(data, "previewTextMode"));
			} else
				return null;
		}).apply(this);
		var previewTextEffect = (function() {
			if (org.korsakow.isValue(data["previewTextEffect"])) {
				return org.korsakow.domain.widget.Preview.PreviewTextEffect.fromValue(this.parseString(data, "previewTextEffect"));
			} else
				return null;
		}).apply(this);
		
		var widget = new org.korsakow.domain.widget.Preview(id, [], type, x, y, width, height, index, fontColor, fontFamily, fontSize, fontStyle, fontWeight, textDecoration, horizontalTextAlignment, verticalTextAlignment, previewTextMode, previewTextEffect);
		return widget;
	}
});

Class.register('org.korsakow.domain.FixedLinkMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = PU.parseString(data["type"], "FixedPreview.type");
		var id = PU.parseInt(data["id"], "FixedPreview.id");
		var x = PU.parseInt(data["x"], "FixedPreview.x");
		var y = PU.parseInt(data["y"], "FixedPreview.y");
		var width = PU.parseInt(data["width"], "FixedPreview.width");
		var height = PU.parseInt(data["height"], "FixedPreview.height");
		var snuId = PU.parseInt(data["snuId"], "FixedPreview.snuId");
		var widget = new org.korsakow.domain.widget.FixedPreview(id, [], type, x, y, width, height, snuId);
		return widget;
	}
});

Class.register('org.korsakow.domain.InsertTextInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		var fontColor = this.parseString(data, "fontColor");
		var fontFamily = this.parseString(data, "fontFamily");
		var fontSize = this.parseInt(data, "fontSize");
		var fontStyle = this.parseString(data, "fontStyle");
		var fontWeight = this.parseString(data, "fontWeight");
		var textDecoration = this.parseString(data, "textDecoration");
		
		var widget = new org.korsakow.domain.widget.InsertText(id, [], type, x, y, width, height, fontColor, fontFamily, fontSize, fontStyle, fontWeight, textDecoration);
		return widget;
	}
});
Class.register('org.korsakow.domain.PlayButtonInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		
		var widget = new org.korsakow.domain.widget.PlayButton(id, [], type, x, y, width, height);
		return widget;
	}
});
Class.register('org.korsakow.domain.PlayTimeInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
		
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		var fontColor = this.parseString(data, "fontColor");
		var fontFamily = this.parseString(data, "fontFamily");
		var fontSize = this.parseInt(data, "fontSize");
		var fontStyle = this.parseString(data, "fontStyle");
		var fontWeight = this.parseString(data, "fontWeight");
		var textDecoration = this.parseString(data, "textDecoration");
		
		var widget = new org.korsakow.domain.widget.PlayTime(id, [], type, x, y, width, height, fontColor, fontFamily, fontSize, fontStyle, fontWeight, textDecoration);
		return widget;
	}
});

Class.register('org.korsakow.domain.TotalTimeInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
		
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		var fontColor = this.parseString(data, "fontColor");
		var fontFamily = this.parseString(data, "fontFamily");
		var fontSize = this.parseInt(data, "fontSize");
		var fontStyle = this.parseString(data, "fontStyle");
		var fontWeight = this.parseString(data, "fontWeight");
		var textDecoration = this.parseString(data, "textDecoration");
		
		var widget = new org.korsakow.domain.widget.TotalTime(id, [], type, x, y, width, height, fontColor, fontFamily, fontSize, fontStyle, fontWeight, textDecoration);
		return widget;
	}
});

Class.register('org.korsakow.domain.ScrubberInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
		
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		var backgroundColor = this.parseString(data, "backgroundColor");
		var foregroundColor = this.parseString(data, "foregroundColor");
		var interactive = this.parseBoolean(data, "interactive");
		var loading = this.parseBoolean(data, "loading");
		var loadingColor = this.parseString(data, "loadingColor");
		var barWidth = this.parseInt(data, "barWidth");
		var barHeight = this.parseInt(data, "barHeight");
		
		var widget = new org.korsakow.domain.widget.Scrubber(id, [], type, x, y, width, height, backgroundColor, foregroundColor, interactive, loading, loadingColor, barWidth, barHeight);
		return widget;
	}
});
Class.register('org.korsakow.domain.FullscreenButtonInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
		
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		
		var widget = new org.korsakow.domain.widget.FullscreenButton(id, [], type, x, y, width, height);
		return widget;
	}
});

Class.register('org.korsakow.domain.MasterVolumeInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
		
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		
		var widget = new org.korsakow.domain.widget.MasterVolume(id, [], type, x, y, width, height);
		return widget;
	}
});

Class.register('org.korsakow.domain.SubtitlesInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var x = this.parseInt(data, "x");
		var y = this.parseInt(data, "y");
		var width = this.parseInt(data, "width");
		var height = this.parseInt(data, "height");
		var fontWeight = this.parseString(data, "fontWeight");
		var fontColor = this.parseString(data, "fontColor");
		var textDecoration = this.parseString(data, "textDecoration");
		var fontStyle = this.parseString(data, "fontStyle");
		var fontFamily = this.parseString(data, "fontFamily");
		var fontSize = this.parseInt(data, "fontSize");
		var keywords = this.parseInt(data, "keywords");
		var widget = new org.korsakow.domain.widget.Subtitles(
			id,
			keywords,
			type,
			x,
			y,
			width,
			height,
			{
				fontWeight: fontWeight,
				fontColor: fontColor,
				textDecoration: textDecoration,
				fontStyle: fontStyle,
				fontFamily: fontFamily,
				fontSize: fontSize
			}
		);
		return widget;
	}
});

Class.register('org.korsakow.domain.EventInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var predicate = this.dao.map(data.Predicate);
		var trigger = this.dao.map(data.Trigger);
		var rule = this.dao.map(data.Rule);
		var event = new org.korsakow.domain.Event(id, predicate, trigger, rule);
		return event;
	}
});

Class.register('org.korsakow.domain.PredicateInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		// TODO: map to an actual Predicate class.
		var id = this.parseInt(data, "id");
		var type = this.parseString(data, "type");
		var pred = {id: id, type: type};
		return pred;
	}
});

Class.register('org.korsakow.domain.TriggerInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var mapper = org.korsakow.domain.InputMapperFactory.create(type, this.dao);
		var trigger = mapper.map(data);
		return trigger;
	}
});

Class.register('org.korsakow.domain.trigger.SnuTimeInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var time = this.parseInt(data, "time");
		var trigger = new org.korsakow.domain.trigger.SnuTime(id, time);
		return trigger;
	}
});

//
/**
 * This is actually a sort of MetaInputMapper in that it does a lookup for the actual mapper based on the rule's type
 */
Class.register('org.korsakow.domain.RuleInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var mapper = org.korsakow.domain.InputMapperFactory.create(type, this.dao);
		return mapper.map(data);
	}
});

Class.register('org.korsakow.domain.KeywordLookupInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var keywords = this.dao.mapGeneric(data.keywords);
		var rule = new org.korsakow.domain.rule.KeywordLookup(id, keywords, type);
		return rule;
	}
});
Class.register('org.korsakow.domain.ExcludeKeywordsInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var keywords = this.dao.mapGeneric(data.keywords);
		var rule = new org.korsakow.domain.rule.ExcludeKeywords(id, keywords, type);
		return rule;
	}
});

Class.register('org.korsakow.domain.SearchInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var type = this.parseString(data, "type");
		var id = this.parseInt(data, "id");
		var rules = this.dao.mapAll(data.rules);
		var maxLinks = org.korsakow.isValue(data["maxLinks"])?this.parseInt(data, "maxLinks"):null;
		var rule = new org.korsakow.domain.rule.Search(id, [], type, rules, maxLinks);
		return rule;
	}
});
//

Class.register('org.korsakow.domain.ProjectInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var name = this.parseString(data, "name");
		var width = this.parseInt(data, "movieWidth");
		var height = this.parseInt(data, "movieHeight");
		var splashScreenMedia = (function() {
			if (org.korsakow.isValue(data["splashScreenMediaId"])) {
				return this.dao.findById(this.parseInt(data, "splashScreenMediaId"));
			} else
				return null;
		}).apply(this);
		
		var backgroundSoundVolume = 1.0;
		var backgroundSoundLooping = true;
		var backgroundSoundMedia = (function() {
			if(org.korsakow.isValue(data["backgroundSoundId"])) {
				backgroundSoundVolume = this.parseFloat(data, "backgroundSoundVolume");
				backgroundSoundLooping = this.parseBoolean(data, "backgroundSoundLooping");
				return this.dao.findById(this.parseInt(data, "backgroundSoundId"));
			} else
				return null;
		}).apply(this);

		var clickSound = (function() {
			if (org.korsakow.isValue(data["clickSoundId"])) {
				var clickSoundId = this.parseInt(data, "clickSoundId");
				return this.dao.findById(clickSoundId);
			} else
				return null;
		}).apply(this);
		var backgroundColor = org.korsakow.isValue(data["backgroundColor"])?this.parseColor(data, "backgroundColor"):null;
		var backgroundImage = (function() {
			if (org.korsakow.isValue(data["backgroundImageId"])) {
				return this.dao.findById(this.parseInt(data, "backgroundImageId"));
			} else
				return null;
		}).apply(this);
		var maxLinks = (function() {
		    if (org.korsakow.isValue(data['maxLinks'])) {
		        return this.parseInt(data, 'maxLinks');
		    } else
		        return null;
		}).apply(this);
		return new org.korsakow.domain.Project(id, name, width, height, splashScreenMedia, backgroundSoundMedia, backgroundSoundVolume, backgroundSoundLooping, clickSound, backgroundColor, backgroundImage, maxLinks);
	}
});

Class.register('org.korsakow.domain.InputMapperFactory', org.korsakow.Factory, {
	initialize: function($super) {
		$super("InputMapperFactory");
	}
});

org.korsakow.domain.InputMapperFactory.instance = new org.korsakow.domain.InputMapperFactory();
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.MainMedia", org.korsakow.domain.MainMediaInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.SnuAutoLink", org.korsakow.domain.PreviewInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.SnuFixedLink", org.korsakow.domain.FixedLinkMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.InsertText", org.korsakow.domain.InsertTextInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.PlayTime", org.korsakow.domain.PlayTimeInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.TotalTime", org.korsakow.domain.TotalTimeInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.Scrubber", org.korsakow.domain.ScrubberInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.PlayButton", org.korsakow.domain.PlayButtonInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.FullscreenButton", org.korsakow.domain.FullscreenButtonInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.MasterVolume", org.korsakow.domain.MasterVolumeInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.widget.Subtitles", org.korsakow.domain.SubtitlesInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.rule.KeywordLookup", org.korsakow.domain.KeywordLookupInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.rule.ExcludeKeywords", org.korsakow.domain.ExcludeKeywordsInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.rule.Search", org.korsakow.domain.SearchInputMapper);
org.korsakow.domain.InputMapperFactory.register("org.korsakow.trigger.SnuTime", org.korsakow.domain.trigger.SnuTimeInputMapper);
