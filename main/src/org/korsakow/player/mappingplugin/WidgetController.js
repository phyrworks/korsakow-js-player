NS('org.korsakow.mappingplugin.controller.widget');

org.korsakow.mappingplugin.controller.widget.MainMap = Class.register('org.korsakow.mappingplugin.controller.widget.MainMap',
org.korsakow.controller.AbstractWidgetController, {
    initialize: function($super, model) {
        $super(model);
    },
    setup: function($super, env) {
        $super(env);
        this.element.addClass("MainMap");

        this.view = env.createMapUI();
        this.element.append(this.view.element);
        
    }
});


org.korsakow.controller.WidgetControllerFactory.register("org.korsakow.mappingplugin.widget.MainMapWidget", org.korsakow.mappingplugin.controller.widget.MainMap);
