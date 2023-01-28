# Search Documentation

## Introduction
 
This document will describe how to use search commands to get the images you want.
 
There are 5 basic commands that are used by this search engine. They are the **TAG, EXCLUDE, WILD, EXCLUDEWILD,** and **OR** commands.
Here is how to use each one.
 
## TAG
The **TAG** command is a basic command. It is just a single word, and it requests that an image contain this word as a tag.
If you want an image to contain multiple tags, create a bunch of tag commands and separate them with at least one space.

Example: dog red animal

This input requests that an image contains the tags "dog", "red", and "animal"
 
## EXCLUDE
The **EXCLUDE** command is like the **TAG** command. It is also a single word. However, this word is prefixed with the "-" minus symbol.
This command requests that an image NOT contain the tag.

Example: animal -dog

This input requests that the image contains animal, but not dog. If the picture contains animal and dog, then the picture is not included.
 
## WILD
The **WILD** command is a wildcard command. It is a single word, but some of the characters are '\*', which are spots where anything can go.
This command requests that an image contain a tag that matches the wildcard pattern.

Example: fl* dog

This input requests images that contain dog and also contain floor or flood or fluffy or flat, etc.

Example: \*and\*

This input requests images that contain "and", or "candy", or "hand", or "andes", etc.
 
## EXCLUDEWILD
The **EXCLUDEWILD** command is a combination of the **WILD** and **EXCLUDE** commands. It is a word prefixed with "-" minus symbol, but also contains "\*".
This command requests that an image NOT contain a tag that matches the wildcard pattern.

Example: -fl* dog

This input requests that an image contain dog, but doesn't contain any of the tags floor, flat, flood, fluffy, flat, etc.
 
## OR
The OR command is a very complex command. It consists of a pair of parantheses with commands inside, all separated by the \~ symbol.
There must be spaces between the \~ and the commands, and also there must be space between the commands and the parantheses.

INVALID: (dog\~cat)

INVALID: ( dog\~cat )

INVALID: ( dog\~ cat )

VALID: ( dog \~ cat )

Additionally, if you want to use more than one or command, make sure they are separated by spaces.

INVALID: ( dog ~ cat )( red ~ blue ~ green )

VALID: ( dog ~ cat ) ( red ~ blue ~ green )

Note that prefixing an **OR** command with a "-" minus symbol does nothing.
-( dog ~ cat ) means the same as ( dog ~ cat ).

This command requests that AT LEAST ONE of the commands contained in the or command is true.

Example: ( blu* ~ -big* ~ -dog ~ kind ) log

This command requests that an image contains log, and that it also contains a tag matching blu* (like blue or bluer), or doesn't contain a tag matching big* (like big or bigger), or doesn't contain dog, or contains kind.
 
## Usage Notes
Since '*' is used to specify commands, requesting images with tags that contain these special characters is unlikely to work.

Any input is lowercased since all tags on this site are lowercase. So, "RaDi0" will be interpreted as "radi0".
