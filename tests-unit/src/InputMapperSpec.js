describe("org.korsakow.domain.InputMapper", function() {
	var ftor = org.korsakow.ftor;
	
	function i(x) {
		return {
		    id: 123,
		    x: "" + x
		};
	}
	
	function testFailure(type) {
		var mapper = new org.korsakow.domain.InputMapper();
		parser = ftor(mapper, mapper["parse" + type]);
		var input = i();
		var actual = function() { return parser(input, "test"); };
		
		expect(actual).toThrow(new Error(type + " Not found: " + mapper.getClass().qualifiedName + ".test:123"));
	}
	
	it("should parse an int", function() {
		var mapper = new org.korsakow.domain.InputMapper();
		var expected = 34;
		var input = i(34);
		var actual = mapper.parseInt(input, 'x');
		expect(actual).toEqual(expected);
	});
	it("should throw if int not found", function() {
		testFailure("Int");
	});

	it("should parse a float", function() {
		var mapper = new org.korsakow.domain.InputMapper();
		var expected = 3.4;
		var input = i(3.4);
		var actual = mapper.parseFloat(input, 'x');
		expect(actual).toEqual(expected);
	});
	it("should throw if float not found", function() {
		testFailure("Float");
	});

	it("should parse a string", function() {
		var mapper = new org.korsakow.domain.InputMapper();
		var expected = "hello";
		var input = i("hello");
		var actual = mapper.parseString(input, 'x');
		expect(actual).toEqual(expected);
	});
	it("should throw if string not found", function() {
		testFailure("String");
	});

	it("should parse a boolean", function() {
		var mapper = new org.korsakow.domain.InputMapper();
		var expected = true;
		var input = i("true");
		var actual = mapper.parseBoolean(input, 'x');
		expect(actual).toEqual(expected);
	});
	it("should throw if boolean not found", function() {
		testFailure("Boolean");
	});

	it("should parse a color in hex notation", function() {
		var mapper = new org.korsakow.domain.InputMapper();
		var expected = "#FAFAFA";
		var input = i("#FAFAFA");
		var actual = mapper.parseColor(input, 'x');
		expect(actual).toEqual(expected);
	});
	it("should throw if color not found", function() {
		testFailure("Color");
	});

});