//View factory for MainMap display

NS('org.korsakow.mappingplugin.ui');

//This is to fix the Javascript mod bug that returns an incorrect value when attempting to get the remainder of a negative number.  The prototype below will achieve the correct value.
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}


org.korsakow.mappingplugin.ui.MapUI = Class.register('org.korsakow.mappingplugin.ui.MapUI', {
	initialize: function($super, model) {
		$super();

		this.model = model;
		this.setup();
	},

	setup: function() {
		// this.element = jQuery("<div />").addClass('mapcontainer');
		this.mapMoveable = true;

		if (this.model == null) {
			/*
				There is a map widget but no map to show.  Show a default view (this initial view
				should eventually be specified by the interface, or by an option associated with either
				a map or snu)
			*/
			this.element = jQuery("<div />").addClass("map").css({"width": "100%", "height" : "100%"});
			//this.element.append("<h2>Map Goes Here</h2>");
		} else if (this.model.mapRep.kind == 'google') {
			//Nothing for now
			this.element = jQuery("<div />").addClass("map").css({"width": "100%", "height" : "100%"});
		} else {
			//Assume the contained url is an image
			var self = this;
			this.element = jQuery("<img />")
						 	.attr({"src" : model.mapRep.url})
						 	.addClass("map")
						 	.load(function() {
						 		//Do some final setup and get the original size of the image
						 		jQuery(this).appendTo("self.wrapper");
						 		self.mapSize = { width: this.width, height: this.height };

						 	});
		}

		this.mapSize = { width: this.element.width(), height: this.element.height() };
	},

	bind: function() {
		this.element.bind.apply(this.element, arguments);
	},

	centerMapToLoc: function(keyword) {
		//lookup the loc from the keyword
		loc = {latitude: 0, longitude: 0};

		//center the map to it
		centerMapToPoint(loc.longitude, loc.latitude);
	},

	centerMapToPoint: function(x, y) {
		/*
		point is a normalized x, y coordinate.  So (0,0) is the top left of the map, (1,0) is the top right, (0,1) is the bottom left, (1, 1) is the bottom right, and (0.5, 0.5) is the middle, middle of the map.  If either value is larger than 1, then an attempt is made to normalize the coordinate.  Values given that are larger than the map size will be set to the value modulo [width | height].  Negative values will be set to their offset from the right or bottom, instead of the top or left.
		*/


		//Get us in the range for the map
		if (Math.abs(x) > 1 || Math.abs(y) > 1) {
			x = x / this.map.width();
			y = y / this.map.height();

			x = x.mod(1);
			y = y.mod(1);
		}

		if (x < 0) {
			//calculate from right
			x = 1 - x;
		}

		if (y < 0) {
			//calculate from bottom
			y = 1 - y;
		}

		//we need the center point of the map to align with the center of element
		if (this.mapMoveable) {
			//when the map is moveable, we attempt to set the scroll position to as close to center as possible.

		} else {
			//if the map is not moveable, we need to move the map around to center it
			var xdiff = (this.element.width() / 2.) - (x * this.map.width());
			var ydiff = (this.element.height() / 2.) - (y * this.map.height());

			this.map.css({"left": xdiff, "top": ydiff});
		}
	},

	setMapMoveable: function(val) {
		
		this.mapMoveable = val;

		if (val == true) {
			this.element.css("overflow", "auto");
		} else {
			this.element.css("overflow", "hidden");
		}
	},

	setMediaLink: function(previewMedia, keyword) {
		//remove the loc specifier (""), from the keyword

		//lookup the location associated with the given keyword

		//show the preview media at this location
	}
});