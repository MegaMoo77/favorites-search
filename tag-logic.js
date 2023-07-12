// Responsible for interpreting user filtering instructions for images

// Written by UndertowTruck
/**
* Finds all indices where one string occurs in another
* @param {String} original The string you want to look inside
* @param {String} match_str The string that you're looking for in the original string
* @returns {Array.<string>} A list of indices where the string occurs
*/
function find_locations(original, match_str) {
	var output = [];
	for (let i = 0; i < original.length + 1 - match_str.length; i++) {
		if (original.substring(i, i+match_str.length) == match_str) {
			output.push(i);
		}
	}
	return output;
  }

// Written by UndertowTruck
/**
* Preprocesses input before extracting tag search commands from input
* @param {String} input Tag command string that user inputted
* @returns {String} Modified string
*/
function preprocess_input(input) {
	// make sure input ends with single space (helps find or clauses )
	return input.toLowerCase().trim() + " ";
}

// Code adapted for JavaScript from https://www.tutorialspoint.com/wildcard-matching-in-python
/**
* Determines if a string matches a wildcard pattern where '*' is a wildcard
* @param {String} s Input string
* @param {String} p Wildcard pattern to match against
* @return {Boolean} Whether the string matches wildcard or not
*/
function match(s, p) {
	var sl = s.length;
	var pl = p.length;
	var dp = [];
	for (let j = 0; j < sl + 1; j++) {
    	var row = [];
		for (let i = 0; i < pl+1; i++) {
			row.push(false);
		}
		dp.push(row);
	}
	s = " " + s;
	p = " " + p;
	dp[0][0] = true;
	for (let i = 1; i < pl + 1; i++) {
		if (p.charAt(i) == "*") {
			dp[0][i] = dp[0][i-1];
		}
	}
	for (let i = 1; i < sl + 1; i++) {
		for (let j = 1; j < pl + 1; j++) {
			if (s[i] == p[j]) {
				dp[i][j] = dp[i-1][j-1];
			} else if (p.charAt(j) == "*") {
				dp[i][j] = Math.max(dp[i-1][j],dp[i][j-1]);
			}
		}
	}
	return dp[sl][pl];
 }

// Written by UndertowTruck
/**
* Makes sure tag isn't empty or consists only of whitespace
* @param {String} tag 
* @returns {Boolean}
*/
function is_not_empty(tag) {
	let removed_space = tag.trim();
	if (removed_space.length == 0) {
		return false;
	}
	return true;
}

// Written by UndertowTruck
/**
* Any expression contained between '( ' and ' )' including the parantheses is considered an OR clause
* @param {String} input Tag command string that user inputted after modification by preprocess input
* @returns {Array} An array containing an array of or clause commands and the remaining string after OR clauses extracted
*/
function get_or_clauses(input) {
	var lowercase = input.toLowerCase();
	// array of or commands
	var commands = [];
	// locations of start/end parantheses to help find or clauses
	var or_starts = find_locations(lowercase, "( ");
	var or_ends = find_locations(lowercase, " ) ");
	// check if first '(' location comes before first ')' location. Extract or clause if true
	// also make sure that neither location list runs out
	while (or_starts.length*or_ends.length > 0 && or_starts[0] < or_ends[0] ) {
		// create a command tuple by extracting parantheses and text between them
		var or_clause = lowercase.substring(or_starts[0], or_ends[0] + 2);
		var command = ['OR', or_clause];
		commands.push(command);
		// remove extracted text from string and update location lists
		lowercase = lowercase.replace(or_clause, "");
		or_starts.shift();
		or_ends.shift();
		// make sure parantheses pairs didn't run out
		if (or_starts.length*or_ends.length == 0) {
			break;
		} else {
			// update paranthese locations now that string has changed
			or_starts = find_locations(lowercase, "( ");
			or_ends = find_locations(lowercase, " ) ");
		}
	}
	return [commands, lowercase];
}

/**
* Gets list of tags in or clause
* @param {String} or_clause String expression that starts with an '(' and ends with an ')' with tags separated by ' ~ '
* @returns {Array} An array of tags found in or clause
*/
function get_or_tags(or_clause) {
	// get rid of surrounding parantheses
	let mod_or_clause = or_clause.slice(1,-1);
	var or_tags;
	if (mod_or_clause.includes("~")) {
		or_tags = mod_or_clause.split(' ~ ');
		or_tags = or_tags.map(x => x.trim());
	} else {
		// don't return empty tag
		var output = mod_or_clause.strip();
		if (!is_not_empty(output) || output.length == 0)
			return [];
		return [output];
	}
	// don't return empty tags
	or_tags = or_tags.filter(is_not_empty);
	return or_tags;
}

// Written by UndertowTruck
/**
* After extracting or clauses, find remaining tag commands
* Each tag command has space between others
* @param {String} input String to extract tag commands from (must have or clauses extracted beforehand)
* @returns {Array<String>} List of tag commands. A tag command has a command type and details. Example: ["EXCLUDE", "dog"]
*/
function get_remaining_tags(input) {
	var tags = input.split(" ");
	var commands = [];

	for (let i = 0; i < tags.length; i++) {
		let tag = tags[i];
		// if tags starts with '-' it is an exclude command
		if (tag.charAt(0) == "-") {
			let mod_tag = tag.substring(1);
			// if tag includes a '*', it is an exclude wildcard command
			if (mod_tag.includes("*")) {
				commands.push(["EXCLUDEWILD", mod_tag]);
			} else {
				// remove empty tags
				if (!is_not_empty(mod_tag)|| mod_tag.length == 0)
					continue;
				commands.push(['EXCLUDE', mod_tag]);
			}
		} else {
			// if tag includes a '*', it is a wildcard command
			if (tag.includes("*")) {
				commands.push(["WILD", tag]);
			} else {
				// remove empty tags
				if (!is_not_empty(tag)|| tag.length == 0)
					continue;
				commands.push(['TAG', tag]);
			}
		}
	}

	return commands;
}

// Written by UndertowTruck
/**
* Creates list of tag commands to help filter images
* Command list used by functions isMatch and get_command_interpretation
* @param {String} input 
* @returns {Array}
*/
function get_commands(input) {
	var mod_input = preprocess_input(input);
	// get OR commands and remaining string after or clauses extracted
	var [or_commands, remaining_str] = get_or_clauses(mod_input);
	// get remaining commands like EXCLUDE or TAG
	var remaining_commands = get_remaining_tags(remaining_str);
	// combines commands. Remaining commands go first since they are easiest to process
	return remaining_commands.concat(or_commands);
  }

// Written by UndertowTruck
/**
* Creates a string representing instructions that will be run for user convenience
* @param {Array} commands List of commands to translate into English words
* @returns {String} A human readable string of the commands used to filter out images
*/
function get_command_interpretation(commands) {
	var output = "";
	for (let command of commands) {
		var addition = "[ ";
		let command_type = command[0];
		let command_details = command[1];
		if (command_type == "TAG")
			addition += ("INCLUDES " + command_details);
		if (command_type == "EXCLUDE")
			addition += ("EXCLUDES " + command_details);
		if (command_type == "WILD")
			addition += ("INCLUDES TAGS MATCHING " + command_details);
		if (command_type == "EXCLUDEWILD")
			addition += ("EXCLUDES TAGS MATCHING " + command_details);
		if (command_type == "OR") {
			let or_tags = get_or_tags(command_details);
			for (let[i, tag] of or_tags.entries()) {
				// only end phrase with or if not at end
				var include_or = "";
				if (i < or_tags.length -1)
					include_or = " OR ";

				// is tag a wildcard
				if (tag.includes("*")) {
					if (tag.charAt(0) == "-") {
						addition += ("EXCLUDES TAGS MATCHING " + tag.substring(1) + include_or);
					//tag is regular wild card 
					} else {
						addition += ("INCLUDES TAGS MATCHING " + tag + include_or);
					}
				}
				// not wildcard, but is exclude tag
				else if (tag.charAt(0) == "-") {
					addition += ("EXCLUDES " + tag.substring(1) + include_or);
				} else {
					addition += ("INCLUDES " + tag + include_or);
				}
			}
		}
		addition += " ] ";
		output += addition;
	}
	return output;
}

// Written by UndertowTruck
/**
* Uses image tags and list of commands to determine if image should be included according to commands
* @param {Array} image_tags Array of strings representing tags of image
* @param {Array} commands Array of commands specifying what images should/shouldn't be included
* @returns {Boolean} Whether image should be included according to commands
*/
function isMatch(image_tags, commands) {
	let startTime = performance.now()
	for (let command of commands) {
		// if command is TAG, make sure that tag exists in image
		if (command[0] == "TAG") {
			let desired_tag = command[1];
			if (!image_tags.includes(desired_tag))
				return false;
		}
		// if command is EXCLUDE, make sure tag isn't in image
		if (command[0] == "EXCLUDE") {
			let unwanted_tag = command[1];
			if (image_tags.includes(unwanted_tag))
				return false;
		}
		// if command is WILD, make sure there is a tag that matches wildcard
		if (command[0] == "WILD") {
			var matched = false;
			for (let tag of image_tags)
				if (match(tag, command[1]))
					matched = true;
			if (!matched)
				return false;
		}
		// if command is EXCLUDEWILD, make sure there ISN'T a tag that matches wildcard
		if (command[0] == "EXCLUDEWILD")
			for (let tag of image_tags)
				if (match(tag, command[1]))
					return false;
		// if command is OR, make sure that at least one of the conditions listed in the or command is true
		if (command[0] == "OR") {
			var or_tags = get_or_tags(command[1]);
			// make sure at least one of these tag conditions is true
			var or_matched = false;
			for (let or_tag of or_tags) {
				//is tag a wildcard
				if (or_tag.includes("*")) {
					var tag_condition = false;
					//exclude wildcard
	                if (or_tag.charAt(0) == "-") {
                        for (let image_tag of image_tags)
                            if (match(image_tag, or_tag))
                                tag_condition = true;
                        if (!tag_condition)
                            or_matched = true;
                    //tag is regular wild card 
                    } else {
                        for (let image_tag of image_tags)
                            if (match(image_tag, or_tag))
                                or_matched = true;
                    }
                }
                // not wildcard, but is exclude tag
                else if (or_tag.charAt(0) == "-") {
                    if (!image_tags.includes(or_tag.substring(1)))
                        or_matched = true;
                } else {
                    if (image_tags.includes(or_tag))
                        or_matched = true;
                }
            }
            if (!or_matched)
                return false;
        }
    }
    return true;
}