NS('org.korsakow.domain.rule');

/* Parent class for rules
 * 
 * TODO: is this class useful?
 */
Class.register('org.korsakow.domain.Rule', org.korsakow.domain.DomainObject, {
	initialize: function($super, id, keywords, type) {
		$super(id);
		this.keywords = keywords;
		this.type = type;
	},
	execute: function(env) {
		
	}
});

/* Finds SNUs that contain this rule's keywords. SNU's scores increases for
 * each keyword that matches.
 */
Class.register('org.korsakow.domain.rule.KeywordLookup', org.korsakow.domain.Rule, {
	initialize: function($super, id, keywords, type) {
		$super(id, keywords, type);
		// TODO: assert type == org.korsakow.rule.KeywordLookup
	},
	/*
	 * @param searchResults {org.korsakow.SearchResults}
	 */
	execute: function(env, searchResults) {
		org.korsakow.log.debug('KeywordLookup: ' + this.keywords);
		
		// for each time a snu appears in a list, increase its searchResults
		// (thus, snus searchResults proportionally to the number of keywords
		// they match)
		var currentSnu = env.getCurrentSnu();

		$.each(this.keywords, function(i, keyword) {
			var dao = env.getDao();
			var snus = dao.findSnusWithKeyword(keyword.value);

			for (var j = 0; j < snus.length; ++j) {
				var snu = snus[j];
				if (snu == currentSnu || snu.lives === 0)
					continue;
				var result;
				var index = searchResults.indexOfSnu(snu);

				if ( index == -1 ) {
					result = new org.korsakow.SearchResult(snu, 0);
					searchResults.results.push(result);
				} else
					result = searchResults.results[index];
				result.score += env.getDefaultSearchResultIncrement() * snu.rating;
			}
		});
	}
});
/* Filters from the list any SNU that has any of this rule's keywords
 * 
 */
Class.register('org.korsakow.domain.rule.ExcludeKeywords', org.korsakow.domain.Rule, {
	initialize: function($super, id, keywords, type) {
		$super(id, keywords, type);
	},
	execute: function(env, searchResults) {
		jQuery.each(this.keywords, function(i, keyword) {
			var snusToExclude = env.getDao().findSnusWithKeyword(keyword.value);
			jQuery.each(snusToExclude, function(j, snu) {
				searchResults.results.splice( searchResults.indexOfSnu(snu), 1 );
			});
		});
	}
});

/* Performs a search by running a series of subrules. Results are displayed
 * in Preview widgets.
 */
Class.register('org.korsakow.domain.rule.Search', org.korsakow.domain.Rule, {
	initialize: function($super, id, keywords, type, rules, maxLinks) {
		$super(id, keywords, type);
		this.rules = rules;
		this.maxLinks = maxLinks;
	},
	execute: function(env) {
		var searchResults = this.doSearch(env);

		var map = this.findMap(env, searchResults);

		this.processSearchResults(env, searchResults, map);
	},
	/* MAPPING PLUGIN */
	findMap: function(env, searchResults) {
		if (env.currentMap != null) {
			//There is a current map. The rule is thus: If there is a current map, then preference
			//this over other maps.  So we search the existence of the current map that owns one of
			//the locs.  If none of the locs are in the current map, then we are free to choose 
			//the top rated map.
			for (var i = 0; i < searchResults.keywords.length; ++i) {
				var keyword = searchResults.keywords[i].keyword;

				if (!keyword.isLOC())
					continue;

				for (var loc in env.currentMap.locs) {
					if (loc.keyword == keyword.LOCValue()) {
						//we have a match, so return the map
						return { map: env.currentMap, loc: loc.keyword };
					}
				}			
			}
		}

		//the map to use is the one associated with the highest scored LOC/Keyword in the list of keywords
		for (var i = 0; i < searchResults.keywords.length; ++i) {
			var keyword = searchResults.keywords[i].keyword;
			if (keyword.isLOC()) {
				//this is a loc, so this is the map we will choose
				var locName = keyword.LOCValue();

				var newMap = env.getDao().find({type: "Map", loc: locName});

				if (newMap.length > 0)
					return { map: newMap[0], loc: keyword.LOCValue() };
			}
		}

		//if we reach here, there are no locs to show, so no current map
		return { map: null, loc: null };
	},
	doSearch: function(env) {
		var searchResults = new org.korsakow.SearchResults();
		$.each(this.rules, function(i, rule) {
			rule.execute(env, searchResults);
		});

		org.korsakow.log.debug('Search yielded ' + searchResults.results.length + ' results');
		
		searchResults.results.sort(function(a, b) {
			if (b.score == a.score)
				return Math.random() > 0.5 ? 1 : -1;

			return b.score - a.score;
		});

		/* sort the result allKeywords by score.  This gives us a list of the keywords used
		 * in the order of most used keywords.  We will use this later for determining which map to load in the case
		 * where we have no map.  This is also useful information if we ever need to trace back
		 */
		searchResults.keywords.sort(function(a, b) {
			if (b.score == a.score)
				return Math.random() > 0.5 ? 1 : -1;

			return b.score - a.score;
		});

		/* sort all of the keywords associated with snu's in the result.  This gives us the keywords
		 * that got us this snu, in the order of the most used keyword.  Again, useful for trackback.
		 */
		jQuery.each(searchResults.results, function(index, snu) {
			snu.keywords.sort(function(a, b) {
				if (b.score == a.score)
					return Math.random() > 0.5 ? 1 : -1;

				return b.score - a.score;
			});
		});

		return searchResults;
	},
	processSearchResults: function(env, searchResults) {
		var previews = env.getWidgetsOfType('org.korsakow.widget.SnuAutoLink');

		previews = previews.filter(function(p) {
		    return !p.getSnu();
		});
		
		var maxLinks = org.korsakow.isValue(this.maxLinks)?this.maxLinks:null;
		maxLinks = org.korsakow.isValue(env.getProject().maxLinks)?env.getProject().maxLinks:null;

		for (var i = 0; (i < searchResults.results.length) && previews.length && (maxLinks == null || i < maxLinks); ++i) {
			var snu = searchResults.results[i].snu;
			var preview = previews.shift();
			preview.setSnu(snu);
		}
	}
});
