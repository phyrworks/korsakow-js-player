NS('org.korsakow.mappingplugin.domain');

org.korsakow.mappingplugin.domain.LOCInputMapper = Class.register('org.korsakow.mappingplugin.domain.LOCInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var kind = PU.parseString(data, "LOC.kind");
		var x = PU.parseFloat(data, "LOC.x");
		var y = PU.parseFloat(data, "LOC.y");
		var keyword = PU.parstString(data, "LOC.keyword");

		return new org.korsakow.mappingplugin.domain.LOC(kind, x, y, keyword);
	}

});

org.korsakow.mappingplugin.domain.MapInputMapper = Class.register('org.korsakow.mappingplugin.domain.MapInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var name = this.parseString(data, "name");
		var mapRepKind = this.parseString(data, "map_kind");

		var mapRep = null;

		if (mapRepKind == "image") {
			var mapRepImage = this.dao.findMediaById(this.parstInt(data, "map_imageId"));

			mapRep = new org.korsakow.mappingplugin.domain.ImageMapRep(mapRepImage);

		} else if (mapRepKind == "google") {
			var mapRepURL = this.parseString(data, "map_url");

			mapRep = new org.korsakow.mappingplugin.domain.GoogleMapRep(mapRepURL);
		}

		var foundKeywords = this.dao.find({parent: id, path: 'keywords/Keyword' });
		var keywords = [];
		var locs = [];

		return new org.korsakow.mappingplugin.domain.Map(id, name, mapRep, keywords, locs);
	}
});

org.korsakow.mappingplugin.domain.MainMapInputMapper = Class.register('org.korsakow.mappingplugin.domain.MainMapInputMapper', org.korsakow.domain.InputMapper, {
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
		var mapMoveable = true;//this.parseBoolean(data, "mapMoveable");

		//var widget = new org.korsakow.mappingplugin.controller.widget.MainMap(id, [], type, x, y, width, height, mapMoveable);
		var widget = new org.korsakow.mappingplugin.domain.widget.MainMap(id, [], type, x, y, width, height, mapMoveable);
		return widget;
	}
});

org.korsakow.domain.InputMapperFactory.register("org.korsakow.mappingplugin.widget.MainMapWidget", org.korsakow.mappingplugin.domain.MainMapInputMapper);