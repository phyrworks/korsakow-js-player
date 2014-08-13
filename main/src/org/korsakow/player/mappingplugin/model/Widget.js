NS('org.korsakow.mappingplugin.domain.widget');

org.korsakow.mappingplugin.domain.widget.MainMap = Class.register('org.korsakow.mappingplugin.domain.widget.MainMap', org.korsakow.domain.Widget, {
    initialize: function($super, id, keywords, type, x, y, width, height, mapMoveable) {
        $super(id, keywords, type, x, y, width, height);
        this.mapMoveable = mapMoveable;
    }
    
});
