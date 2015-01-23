NS('org.korsakow.mappingplugin.controller.widget');

Class.register('org.korsakow.mappingplugin.controller.widget.MainMap',
org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    destroy: function($super) {
        $super();
    },
    setup: function($super, env) {
        $super(env);
        this.element.addClass("MainMap");

        this.view = new org.korsakow.mappingplugin.ui.MapUI(env, env.currentMap);
        this.element.append(this.view.element);
        
    },

    clear: function() {
    	//remove any element with class "map" from this.element
    	this.element.empty();
    },

    setMap:function(env, map, loc) {
    	this.clear();

    	if (map == null)
    		return;

        //get the snus to be shown for this map
        var snuToLoc = map.lookupSnus(env, loc);

        //display the snu previews that are associated with every map loc
        org.korsakow.log.info(snuToLoc);

    	this.view.setup(env, map, snuToLoc, this.model.mapMoveable);

    	this.element.append(this.view.element);
    }


});


org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.mappingplugin.widget.MainMapWidget", org.korsakow.mappingplugin.controller.widget.MainMap);
