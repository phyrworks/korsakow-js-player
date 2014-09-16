NS('org.korsakow.util');

org.korsakow.util.SubtitleException = org.korsakow.Exception;

/* Represents a single subtitle
 * 
 * @param name: String name used for debugging
 * @param time: uint the time at which the subtitle first appears
 * @param duration: uint the length of time the subtitle is shown for
 * @param subtitle: Array[String] the lines of text of the subtitle
 */
Class.register('org.korsakow.util.SubtitleCuePoint', {
	initialize: function($super, name, time, duration, subtitle) {
		$super();
		this.name = name;
		this.time = time;
		this.duration = duration;
		this.subtitle = subtitle;
	}
});

/* Parses subtitles in the SRT (http://en.wikipedia.org/wiki/SubRip) format. 
 * 
 */
Class.register('org.korsakow.util.SrtSubtitleParser', {
	initialize: function($super) {
		$super();
		this.timeLinePattern = /([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3}) --> ([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3})/;
	},
	
	/*
	 * @param lines: Array[String]
	 */
	parse: function(rawLines) {
		var cuepoints = [];
		var lines = rawLines.split( /(?:\r\n)|\n|\r/ ).map( jQuery.trim ); // the defacto standard seems to be CRLF but users have such a hard time with this so we're leanient
		var line = 0;
		var counter = 0;

		while (line < lines.length) {
			if (!lines[line].length) {
				++line;
				continue;
			}
			var ret = this.parseCuePoint( lines, line, counter );
			line = ret.offset;
			++counter;
			cuepoints.push( ret.cuepoint );
		}
		return cuepoints;
	},
	/*
	 * @param lines: Array[String] line array
	 * @param offset: uint offset into lines of the current cuepoint
	 * @param counter: uint consistency counter
	 * @return {offset:Number, cuepoint:ICuePoint}
	 */
	parseCuePoint: function(lines, offset, counter) {
		var count = parseInt( lines[offset++] );
		if ( count != counter + 1 )
			throw new org.korsakow.util.SubtitleException("inconsistant file at line #" + (offset) + " ; " + count + "!=" + (counter + 1));
		
		var line = lines[offset++];
		var match = this.timeLinePattern.exec( line );
		if (!match)
			throw new org.korsakow.util.SubtitleException("invalid time at line #" + (offset) + ': ' + line);
		var begin = this.getTime(match[1], match[2], match[3], match[4]);
		var end   = this.getTime(match[5], match[6], match[7], match[8]);

		var content = [];
		for (; offset < lines.length; ++offset) {
			if (!lines[offset].length) {
				++offset;
				break;
			}
			content.push( lines[offset] );
		}
		var name = "" + counter;
		
		return {
			offset: offset,
			cuepoint: new org.korsakow.util.SubtitleCuePoint( name, begin, end-begin, content )
		};
	},
	/*
	 * @param hh: String hours
	 * @param mm: String minutes
	 * @param ss: String seconds
	 * @param ms: String milliseconds
	 * @return uint
	 */
	getTime: function(hh, mm, ss, ms) {
	    // specify the radix to avoid octal interpretations in some browsers (e.g. PhantomJS) since we capture leading zeros
		return (parseInt(hh, 10)*60*60 + parseInt(mm, 10)*60 + parseInt(ss, 10)) * 1000 + parseInt(ms, 10);
	}
});
