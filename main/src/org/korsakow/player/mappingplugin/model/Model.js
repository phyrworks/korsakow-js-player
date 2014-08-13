NS('org.korsakow.mappingplugin.domain');
NS('org.korsakow.domain');

org.korsakow.mappingplugin.domain.LOC = Class.register('org.korsakow.mappingplugin.domain.LOC', org.korsakow.Object, {
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
            };

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
    },
    
    sameAs: function(loc) {
        //Two locs are the same if all their values are equal
        return this.equals(loc) && this.x == x && this.y == y;
    },
        
    toString: function() {
        return "[" + this.kind + "LOC x='" + this.x + "'; y='" + this.y + "'; keyword='" + value + "';]";   
    }
});

org.korsakow.mappingplugin.domain.MapRep = Class.register('org.korsakow.mappingplugin.domain.MapRep', org.korsakow.Object, {
    initialize: function($super, mapKind) {
        $super(null);
        this.kind = mapKind;
    }
});

org.korsakow.mappingplugin.domain.ImageMapRep = Class.register('org.korsakow.mappingplugin.domain.ImageMapRep', org.korsakow.mappingplugin.domain.MapRep, {
    initialize: function($super, image) {
        $super("image");
        this.image = image;
    }
});

org.korsakow.mappingplugin.domain.GoogleMapRep = Class.register('org.korsakow.mappingplugin.domain.GoogleMapRep', org.korsakow.mappingplugin.domain.MapRep, {
    initialize: function($super, mapURL) {
        $super("google");
        this.url = mapURL;
    }
});


org.korsakow.mappingplugin.domain.Map = Class.register('org.korsakow.mappingplugin.domain.Map', org.korsakow.domain.DomainObject, {
    initialize: function($super, id, name, mapRep, locs, keywords) {//function($super, id, name, mapRep, /*originX, originY, _width, _height,*/ locs, keywords) {
        $super(id);
        this.name = name;
        this.mapRep = mapRep;
        // this.bounds = { 
        //     origin: {x: originX, y: originY}, 
        //     size:{width: _width, height: _height},

        //     center: function() {
        //         return { x:this.origin.x + 0.5 * this.size.width, y:this.origin.y + 0.5 * this.size.height };
        //     },

    
        //     getRegionBounds: function(region) {
        //         //returns the bounds for the given region
        //         region = math.floor(region);
        //         //clamp the region to between 1 and 5.  If region < 1 then region = 1,
        //         //and if region > 5 region = 5.  Finally, subtract 1, so region is now 0 indexed
        //         region = max(min(region, 5), 1) - 1;
            
        //         var outerRegionOffset = { x: region / this.size.width, y: region / this.size.height };
                
        //         var outerRect = {
        //                 origin :  { x: this.origin.x + outerRegionOffset.x, y: this.origin.y + outerRegionOffset.y },
        //                 size : { width: outerRegionOffset.x * 2, height: outerRegionOffset.y * 2 }
        //         };
                
        //         var innerRect;
                
        //         if (region == 4) {
        //             //special case for region 5 - it has no inner region, so set innerRect to center
        //             //with width==height==0
        //             var center = this.center();
        //             innerRect = { origin: { x: center.x, y: center.y}, size:{width:0, height:0} };
                                
        //         } else {
        //             var innerRegionOffset = { x: (region + 1) / this.size.width, y: (region + 1) / this.size.height };

        //             var innerRect = {
        //                 origin :  { x: this.origin.x + innerRegionOffset.x, y: this.origin.y + innerRegionOffset.y },
        //                 size : { width: innerRegionOffset.x * 2, height: innerRegionOffset.y * 2 }
        //             }
                
        //             return { 
        //                 outer: outerRect, 
        //                 inner: innerRect,
        //                 isWithin: function(x, y) {
        //                     return  
        //                         /* First check to see if is inside the outer rectangle */
        //                          ( (x >= this.outer.origin.x && x < this.outer.origin.x + this.outer.size.width) &&
        //                            (y >= this.outer.origin.y && y < this.outer.origin.y + this.outer.size.height) ) &&
        //                         /* Second check to see if not inside the inner rectangle */
        //                         !( (x >= this.inner.origin.x && x < this.inner.origin.x + this.inner.size.width) &&
        //                            (y >= this.inner.origin.y && y < this.inner.origin.y + this.inner.size.height) );
                                   
        //                 }
        //             };
        //         }
        //     },
    
        //     regionForPoint: function(x, y) {
        //         //returns a number between 1 and 5, which represents the relative strength for
        //         //a loc.  A point right on the center will have 5, points between the center and
        //         //perifery will vary between 5 and 1, and points near the edge will be 1.
        //         for (region = 1; region <= 5; ++region) {
        //             if (this.getRegionBounds(region).isWithin(x, y))
        //                 return region;
        //         }
                
        //         //If for some reason we get here, then we are out of bounds, and thus lowest strength
        //         return 1;
        //     }                
        // };
    
        this.locs = locs;
        this.keywords = keywords;
    },

    findLOC: function(loc) {
    },


    strengthForLOC: function(loc) {
        //check to see if the loc is in this map.
                
    }

});
