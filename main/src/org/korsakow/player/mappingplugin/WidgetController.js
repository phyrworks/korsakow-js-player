NS('org.korsakow.mappingplugin.controller.widget');

org.korsakow.mappingplugin.controller.widget.MainMap = Class.register('org.korsakow.mappingplugin.controller.widget.MainMap',
org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
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

    setMap:function(env, map) {
    	this.clear();

    	if (map == null)
    		return;

    	this.view.setup(env, map);
    	this.element.append(this.view.element);
    }

});


org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.mappingplugin.widget.MainMapWidget", org.korsakow.mappingplugin.controller.widget.MainMap);
