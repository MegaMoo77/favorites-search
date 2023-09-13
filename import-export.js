// Responsible for importing/exporting favorites data into the application

class ThumbElementData {
    /**
     * Keeps track of all portions of data that a thumb element should have
     * @param {Number} id Number representing post ID
     * @param {String} imageThumbSrc String representing thumbnail image source of post
     * @param {String} tags String listing all tags of post
     * @param {ImageMetadata} metadata Tracks API data for post (if available)
     */
    constructor(id, imageThumbSrc, tags, metadata) {
        if (typeof id != "number") {
            throw new Error(`${id} is not a valid ID for a ThumbElementData object`)
        }
        this.id = id;
        this.imageThumbSrc = imageThumbSrc;
        this.tags = tags;
        this.metadata = metadata
    }

    /**
     * Creates a ThumbElementData object from a thumb element
     * @param {HTMLSpanElement} thumb 
     */
    static fromThumb(thumb) {
        let id = null;
        // Thumb elements straight from site don't have ID attribute, but displayed thumbs usually do
        if (thumb.hasAttribute("id")) {
            id = thumb.id;
        } else {
            id = getIDfromThumb(thumb);
        }
        const imageElement = thumb.getElementsByTagName("img")[0];
        const imageSrc = imageElement.src;
        const tags = imageElement.title;
        const metadata = thumb.metadata
        return new ThumbElementData(id, imageSrc, tags, metadata)
    }

	/**
	 * Creates an HTML element from the data provided
	 */
	toHTMLelement() {
		const postSourcePrefix = "https://rule34.xxx/index.php?page=post&s=view&id=";
		const id = this.id;
		const tags = this.tags;
		const thumbnailSrc = this.imageThumbSrc;
		const metadata = this.metadata;
		// create thumb element to add to document
		const thumbElement = document.createElement("span");
		thumbElement.classList = "thumb";
		thumbElement.id = id;
		thumbElement.innerHTML = `
			<div class="badgeContainer">
				<div class="badge">
					<span class="badge">${id}</span>
				</div>
			</div>
			<a href="${postSourcePrefix}${id}" id="p${id}" target="_blank">
				<img src="${thumbnailSrc}" title="${tags}" border="0" alt="image_thumb">
			</a>
		`;   
		thumbElement.metadata = metadata;
		// display stats if metadata available
		if (metadata != undefined) {
			displayData(thumbElement, statDisplayed.value);
		}
		thumbElement.innerHTML += 
		`<button class="del">X</button>
		<a class="org" href="showOriginalRedirect.html?id=${id}" target="_blank">Original Image</a>`;

		return thumbElement;
	}
}

// Stores data of imported file (the file's name and array of ThumbElementData objects)
class ImportedFile {
    constructor(fileName, fileData) {
        this.name = fileName;
        this.posts = fileData;
    }
}

// Takes all loaded <span class=thumb> elements and gathers data into a JSON string
function createFavoritesData () {
    let output = [];
    for (const thumb of document.getElementsByClassName('thumb')) {
        // if thumb is not visible, don't include it
        if (thumb.style.display == "none") {
            continue
        }
        const id = parseInt(thumb.getAttribute("id"));
        const imageElement = thumb.getElementsByTagName('img')[0];
        const imageSrc = imageElement.getAttribute("src");
        const tags = imageElement.getAttribute("title");
        const dataObj = new ThumbElementData(id, imageSrc, tags, thumb.metadata);
        output.push(dataObj);
    }
    return JSON.stringify(output);
}

// Saves favorites data to file
function exportFavoritesFile() {
    // link to download file
    const link = document.createElement("a");

    // BLOB object with JSON data
    const file = new Blob([createFavoritesData()], { type: 'text/plain' });

    // link leads to file
    link.href = URL.createObjectURL(file);

    // filename
    link.download = "export.txt";

    // click event to save file, then remove URL
    link.click();
    URL.revokeObjectURL(link.href);
}

// Imports favorites data from file
// Code based on https://stackoverflow.com/a/40971885
async function importFavoritesFile(fileObj) {
    await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(fileObj, 'UTF-8');
        reader.onload = (evt) => {
            try {
                let thumbsData = JSON.parse(evt.target.result);
                thumbsData = thumbsData.map(x => {
                    let obj = null;
                    try {
                        obj = new ThumbElementData(x.id, x.imageThumbSrc, x.tags, x.metadata);
                    } catch (error) {
                        // Do not combine x with string, or it will print [object Object] instead
                        console.error("Unable to create a ThumbElementData object from given object", x);
                    }
                    return obj;
                });
                //filter out falsey values (including null, 0, and "")
                thumbsData = thumbsData.filter(x => x);

                const fileName = fileObj.name;
                const file = new ImportedFile(fileName, thumbsData);
                importedFiles.push(file);
                resolve();
            } catch (error) {
                reject(error);
            }
        }
    });
}


function displayImportedFile(importedFile) {
    /**
     * Displays imported images in an ImportedFile object
     * @param {ImportedFile} importedFile 
     * @param {String[]} command Represents array of strings representing tag filtering commands
     */
    const contentDiv = document.getElementById("content");
    for (const post of importedFile.posts) {
        const element = post.toHTMLelement();
        // include reference to file, which allows the program to see which file an imported post came from, and get rid of posts if the imported file is removed
        element.file = importedFile;
        contentDiv.insertBefore(element, document.getElementById("paginator"));
    }
}

function removeImportedFileAndThumbnails(importedFile) {
    /**
     * Removes imported file from list of imported files, and removes thumbnails from that file
     * @param {ImportedFile} importedFile
     */

    // remove imported file from currently imported files list
    for (let i = 0; i < importedFiles.length; i++) {
        const file = importedFiles[i];
        if (file === importedFile) {
            console.log(`File ${importedFile.name} removed`);
            importedFiles.splice(i,1);
            break;
        }
    }

    const contentDiv = document.getElementById("content");
    // remove all thumbnails with reference to imported file
    for (const thumb of Array.from(document.getElementsByClassName("thumb"))) {
        if (thumb?.file === importedFile) {
            contentDiv.removeChild(thumb);
        }
    }
}


