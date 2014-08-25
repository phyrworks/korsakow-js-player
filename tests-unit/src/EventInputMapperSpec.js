(function () {
	JsMockito.Integration.importTo(window);

	describe("org.korsakow.domain.EventInputMapper", function() {
		it("should map data to an Event object", function specEventMap () {
			var data = createExampleEvent();
			var dao = mock(org.korsakow.domain.Dao.create);
			var mapper = new org.korsakow.domain.EventInputMapper(dao);

			var event_id = 35;

			var pred = {id: 254};
			var trigger = new org.korsakow.domain.trigger.SnuTime(253, 20);
			var rule = new org.korsakow.domain.rule.KeywordLookup(118, ['couple'], 'org.korsakow.domain.rule.KeywordLookup');

			when(dao).map(findMatcher(253, 'Trigger')).thenReturn(trigger);
			when(dao).map(findMatcher(118, 'Rule')).thenReturn(rule);
			when(dao).map(findMatcher(254, 'Predicate')).thenReturn(pred);

			var event = mapper.map(data);

			expect(event.id).toEqual(event_id);
			expect(event.trigger.id).toEqual(trigger.id);
			expect(event.predicate.id).toEqual(pred.id);
			expect(event.rule.id).toEqual(rule.id);
		});
	});

	describe("org.korsakow.domain.TriggerInputMapper", function() {
		it("should map data node to an Trigger object", function specEventMap () {
			var data = createExampleTrigger();
			var dao = mock(org.korsakow.domain.Dao.create);
			var mapper = new org.korsakow.domain.TriggerInputMapper(dao);

			var trigger = mapper.map(data);
			expect(trigger.id).toEqual(253);
			// This checks to see that the factory converted it properly.
			expect(trigger.time).toEqual(20);
		});
	});

	describe("org.korsakow.domain.RuleInputMapper", function() {
		it("should map data node to an Rule object", function specEventMap () {
			var data = createExampleRule();
			var dao = mock(org.korsakow.domain.Dao.create);
			var mapper = new org.korsakow.domain.RuleInputMapper(dao);
			var subrule = new org.korsakow.domain.rule.KeywordLookup(120, ['couple'], 'org.korsakow.rule.KeywordLookup');
			when(dao).map(findMatcher(118, 'Rule'))
				.thenReturn(subrule);
            when(dao).mapAll().thenReturn([subrule]);

			var rule = mapper.map(data);
			expect(rule.id).toEqual(118);
			expect(rule.type).toEqual('org.korsakow.rule.Search');
			expect(rule.rules[0].id).toEqual(120);
			expect(rule.rules[0].type).toEqual('org.korsakow.rule.KeywordLookup');
		});
	});

	function createExampleRule() {
	    return {
            id: 118,
	        className: 'Rule',
	        type: 'org.korsakow.rule.Search',
	        rules: [
                {
                    id: 120,
                    className: 'Rule',
                    type: 'org.korsakow.rule.KeywordLookup'
                }
            ]
	    };
	}

	function createExamplePredicate() {
	    return {
	        id: 254,
	        className: 'Predicate'
	    };
	}

	function createExampleTrigger() {
	    return {
	        id: 253,
	        className: 'Trigger',
            type: 'org.korsakow.trigger.SnuTime',
            time: 20
	    };
	}

	function createExampleEvent() {
	    return {
	        id: 35,
	        className: 'Event',
	        Trigger: createExampleTrigger(),
	        Predicate: createExamplePredicate(),
	        Rule: createExampleRule()
	    };
	}

	function findMatcher(id, className) {
		return new JsHamcrest.SimpleMatcher({
			matches: function (obj) {
				var result = (obj.id == id) && (obj.className == className);
				return result;
			},
			describeTo: function (description) {
				description.append('matcher for dao');
			}
		});
	}

})();
