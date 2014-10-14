//View factory for MainMap display

NS('org.korsakow.mappingplugin.ui');

//This is to fix the Javascript mod bug that returns an incorrect value when attempting to get the remainder of a negative number.  The prototype below will achieve the correct value.
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}


Class.register('org.korsakow.mappingplugin.ui.MapUI', {
	initialize: function($super, env, model) {
		$super();

		this.setup(env, model);
	},

	setup: function(env, model, snuToLocMap, mapMoveable) {
		
		this.model = model;

		this.previewSize = { "width": 150, "height": 100 };

		if (this.model == null) {
			/*
				There is a map widget but no map to show.  Show a default view (this initial view
				should eventually be specified by the interface, or by an option associated with either
				a map or snu)
			*/
			this.element = jQuery("<div />").addClass("map").css({"width": "100%", "height" : "100%"});
			this.mapSize = { width: this.element.width(), height: this.element.height() };
		} else if (this.model.mapRep.kind == 'google') {
			//Nothing for now
			this.element = jQuery("<div />").addClass("map").css({"width": "100%", "height" : "100%"});
			this.mapSize = { width: this.element.width(), height: this.element.height() };
		} else { //(this.model.mapRep.kind == 'image')
			//Assume the contained url is an image
			var self = this;

			this.element = jQuery("<div />");
			this.mapImage = jQuery("<img />")
						 	.attr({"src" : env.resolvePath(model.mapRep.image.filename)})
						 	.addClass("map")
						 	.load(function() {
						 		//Do some final setup and get the original size of the image
						 		//jQuery(this).appendTo("self.wrapper");
						 		self.mapSize = { width: this.width != 0 ? this.width : 1, height: this.height != 0 ? this.height : 1};

						 		self.setupImageMapPreviews(env, snuToLocMap);

						        if (snuToLocMap.length > 0) {
						            //center the map on the first loc in the list
						            var loc = snuToLocMap[0].loc;
						            var offset = { x: (self.previewSize.width * 0.5) / self.mapSize.width, y: (self.previewSize.height * 0.5) / self.mapSize.height};
						            self.centerMapToPoint(loc.x + offset.x, snuToLocMap[0].loc.y + offset.y, mapMoveable);
						        }

						 	});

			this.element.append(this.mapImage);
		}
	},

    setupImageMapPreviews: function(env, snuToLoc) {
    	//remove any existing previews
    	this.element.remove(".mapPreview");

    	var self = this;

        jQuery.each(snuToLoc, function(index, value) {
        	var actualLOC = { "x": value.loc.x * self.mapSize.width, "y": value.loc.y * self.mapSize.height };
        	var locPointerCenter = {};
        	var widget = null;


            //adjust the position of the box, and the location pointer
            if (actualLOC.x + self.previewSize.width > self.mapSize.width) {
                actualLOC.x -= self.previewSize.width + 6;
                locPointerCenter.left = actualLOC.x + self.previewSize.width - 8;
            } else {
                locPointerCenter.left = actualLOC.x - 6;
            }

            if (actualLOC.y + self.previewSize.height > self.mapSize.height) {
                //the widget falls off the bottom of the map, show from bottom-left
                actualLOC.y -= self.previewSize.height + 6;
                locPointerCenter.top = actualLOC.y + self.previewSize.height - 8;
            } else {
                locPointerCenter.top = actualLOC.y - 6;
            }

        	self.addImageMapPreview(env, value.snu, actualLOC, self.previewSize, locPointerCenter);

        	// self.element.append(widget.element);
        });
    },

    addImageMapPreview: function(env, snu, coord, size, locPointerCenter) {
    	//Uncomment below for a test widget (for showing placement)
    	// var widget = jQuery("<div />").addClass("mapPreview").css({"width": size.width  + "px", "height": size.height + "px", "top": coord.x + "px", "left": coord.y + "px"});

    	var widgetModel = new org.korsakow.domain.widget.Preview(0 /*id*/, [] /*keywords*/, "org.korsakow.widget.SnuAutoLink" /*type*/, coord.x /*x*/, coord.y /*y*/, size.width /*width*/, size.height /*height*/, 0 /*index*/, "black" /*font color*/, "Arial" /*font family*/, "12" /*font size*/, "normal" /*font style*/, "normal" /* font weight*/, "none" /*text decoration*/, "center" /*horizontal text alignment*/, "top" /*vertical text alignment*/, "mouseover" /*preview text mode*/, "none" /*preview text effct*/);

    	var widget = new org.korsakow.controller.PreviewWidgetController(widgetModel);
    	widget.setup(env);
    	widget.element.addClass("mapPreview").css({"top":coord.y, "left":coord.x, "width":size.width, "height":size.height});

    	this.element.append(widget.element);

    	widget.setSnu(snu);

        //add a small circle around the point on the map
        var locPointer = jQuery("<div />").addClass("locPointer").css(locPointerCenter);
        this.element.append(locPointer);


    	return widget;
    },

    centerMapToPoint: function(x, y, mapMoveable) {
        /*
        point is a normalized x, y coordinate.  So (0,0) is the top left of the map, (1,0) is the top right, (0,1) is the bottom left, (1, 1) is the bottom right, and (0.5, 0.5) is the middle, middle of the map.  Negative values will be set to their offset from the right or bottom, instead of the top or left.
        */


        //Get us in the range for the map
        // if (Math.abs(x) > 1 || Math.abs(y) > 1) {
        //     x = x / this.mapSize.width;
        //     y = y / this.mapSize.height;

        //     x = x.mod(1);
        //     y = y.mod(1);
        // }

        if (x < 0) {
            //calculate from right
            x = 1 - x;
        }

        if (y < 0) {
            //calculate from bottom
            y = 1 - y;
        }

        //we need the center point of the map to align with the center of element
        if ((this.model.mapRep.kind != 'google') || mapMoveable) {
            //when the map is moveable, we attempt to set the scroll position to as close to center as possible.
            var xdiff = (this.element.parent().width() / 2.) - (x * this.mapSize.width);
            var ydiff = (this.element.parent().height() / 2.) - (y * this.mapSize.height);

            this.element.parent().scrollLeft(-xdiff);
            this.element.parent().scrollTop(-ydiff);
        } else {
            //if the map is not moveable (ie, the user cannot scroll the view on their own), we need to move the map around to center it
            var xdiff = (this.element.width() / 2.) - (x * this.mapSize.width);
            var ydiff = (this.element.height() / 2.) - (y * this.mapSize.height);

            this.element.css({"left": xdiff, "top": ydiff});
        }
    },

	bind: function() {
		this.element.bind.apply(this.element, arguments);
	},

	setMediaLink: function(previewMedia, keyword) {
		//remove the loc specifier (""), from the keyword

		//lookup the location associated with the given keyword

		//show the preview media at this location
	}
});