NS('org.korsakow.mappingplugin.domain');

Class.register('org.korsakow.mappingplugin.domain.LOCInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var kind = this.parseString(data, "kind");
		var x = this.parseFloat(data, "x");
		var y = this.parseFloat(data, "y");
		var keyword = this.parseString(data, "keyword");

		return new org.korsakow.mappingplugin.domain.LOC(kind, x, y, keyword);
	}

});

Class.register('org.korsakow.mappingplugin.domain.MapInputMapper', org.korsakow.domain.InputMapper, {
	initialize: function($super, dao) {
		$super(dao);
	},
	map: function(data) {
		var id = this.parseInt(data, "id");
		var name = this.parseString(data, "name");
		var mapRepKind = this.parseString(data, "map_kind");

		var mapRep = null;

		if (mapRepKind == "image") {
			var mapImageID = this.parseInt(data, "map_imageId");
			var mapRepImage = this.dao.findMediaById(mapImageID);

			mapRep = new org.korsakow.mappingplugin.domain.ImageMapRep(mapRepImage);

		} else if (mapRepKind == "google") {
			var mapRepURL = this.parseString(data, "map_url");

			mapRep = new org.korsakow.mappingplugin.domain.GoogleMapRep(mapRepURL);
		}

		var keywords = this.dao.mapGeneric(data.keywords);
		var locs = this.dao.mapGeneric(data.locs);

		return new org.korsakow.mappingplugin.domain.Map(id, name, mapRep, locs, keywords);
	}
});

Class.register('org.korsakow.mappingplugin.domain.MainMapInputMapper', org.korsakow.domain.InputMapper, {
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