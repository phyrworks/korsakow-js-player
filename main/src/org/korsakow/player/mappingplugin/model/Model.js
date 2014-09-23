NS('org.korsakow.mappingplugin.domain');
NS('org.korsakow.domain');

Class.register('org.korsakow.mappingplugin.domain.LOC', org.korsakow.Object, {
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

    keywordValue: function() {
        return '♦' + this.keyword;
    },
    
    equals: function(loc) {
        //Two locs are considered equivalent if their kind and keyword are the same.  
        return this.kind == loc.kind && this.keyword == loc.keyword;
    },
    
    sameAs: function(loc) {
        //Two locs are the same if all their keywords are equal
        return this.equals(loc) && this.x == x && this.y == y;
    },
        
    toString: function() {
        return "[" + this.kind + "LOC x='" + this.x + "'; y='" + this.y + "'; keyword='" + this.keyword + "';]";   
    }
});

Class.register('org.korsakow.mappingplugin.domain.MapRep', org.korsakow.Object, {
    initialize: function($super, mapKind) {
        $super(null);
        this.kind = mapKind;
    }
});

Class.register('org.korsakow.mappingplugin.domain.ImageMapRep', org.korsakow.mappingplugin.domain.MapRep, {
    initialize: function($super, image) {
        $super("image");
        this.image = image;
    }
});

Class.register('org.korsakow.mappingplugin.domain.GoogleMapRep', org.korsakow.mappingplugin.domain.MapRep, {
    initialize: function($super, mapURL) {
        $super("google");
        this.url = mapURL;
    }
});


Class.register('org.korsakow.mappingplugin.domain.Map', org.korsakow.domain.DomainObject, {
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

    lookupSnus: function(env, currentLOCName) {        
        // NOTE: The way LOCs are dealt with is different in a Map than in a Snu.
        //       There can only be one LOC with a given keyword in each Map, so
        //       we ultimately want to return a mapping of LOCs to their associated
        //       Snus.
        var currentSnu = env.getCurrentSnu();

        var locToSnusMap = [];

        $.each(this.locs, function(i, loc) {
            var dao = env.getDao();
            var snus = dao.findSnusWithKeyword(loc.keywordValue());

            org.korsakow.log.info("\tloc : ", loc);
            org.korsakow.log.info("\tsnus : ", snus);

            var snusForLoc = [];

            for (var j = 0; j < snus.length; ++j) {
                var snu = snus[j];
                if (snu == currentSnu || snu.lives === 0)
                    continue;

                var result;

                var index = -1;

                for (var k = 0; k < snusForLoc.length; ++k) {
                    if (snusForLoc[k].snu.id == snu.id) {
                        index = k;
                        break;
                    }
                }

                if ( index == -1 ) {
                    result = {"snu" : snu, "score" : 0};
                    snusForLoc.push(result);
                } else {
                    result = searchResults.results[index];
                }
                result.score += env.getDefaultSearchResultIncrement() * snu.rating;
            }

             org.korsakow.log.info("snusForLoc : ", snusForLoc);

            if (snusForLoc.length > 0) {

                //sort snus by highest score to lowest score
                snusForLoc.sort(function(a, b) {
                    if (b.score == a.score)
                        return Math.random() > 0.5 ? 1 : -1;

                    return b.score - a.score;
                });

                locToSnusMap.push({"loc" : loc, "snus" : snusForLoc});
            }


        });

        org.korsakow.log.info("locToSnusMap : ", locToSnusMap);

        //sort the locs by distance from the currentLOCName
        var currentLOC = this.findLOC(currentLOCName);

       org.korsakow.log.info("currentLOC : ", currentLOC);

        locToSnusMap.sort(function(a, b) {
            return a.loc.distance(b.loc);
        });

        var snuToLocMap = [];

        //Now we go through the list in order, pick the top Snu from each loc.  Each Snu chosen
        //must then be checked against the already selected Snus so that we don't repeat.  
        jQuery.each(locToSnusMap, function(index, v) {
            //check that the snu isn't already in the list somewhere.  Use array.every, returns
            //false if there is a matching snu, and true otherwise. If the top snu is already
            //used, then go through the list of snus for this loc until we either find
            //one that isn't yet used, or we finish the list.
            var snuToUse = null;
            for (var index = 0; index < v.snus.length; ++index) {
                var doesNotHaveSnu = snuToLocMap.every(function(u) {
                    if (u.snu.id == this.id)
                        return false;

                    return true;
                }, v.snus[index]);

                if (doesNotHaveSnu)
                    snuToUse = v.snus[index].snu;
            }


            if (snuToUse != null) {
                //add it to the list
                snuToLocMap.push({'snu' : snuToUse, 'loc' : v.loc });
            }



        });


        return snuToLocMap;
    },

    findLOC: function(locName) {
        for (var i = 0; i < this.locs.length; ++i) {
            if (this.locs[i].keyword == locName)
                return this.locs[i];
        }
    },


    strengthForLOC: function(loc) {
        //check to see if the loc is in this map.
                
    }

});
