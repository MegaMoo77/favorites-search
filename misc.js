// Takes care of miscellaneous tasks and utilities

// Changes the image linked by the Random button
var changeRandom = () =>
{
	// Get the thumbs
	var thumbs = document.getElementsByClassName("thumb");
	if (thumbs == null || thumbs.length == 0)
		return;

	// Get a random thumb
	var n = thumbs.length;
	var rand = Math.floor(Math.random() * n);	
	var thumb = thumbs[rand];

	// Get its id
	var as = thumb.getElementsByTagName("a");
	var id = new URLSearchParams(as[0].search).get("id");

	// Set the href to the thumb's image
	var random = document.getElementById("random");
	random.href = "showOriginalRedirect.html?id=" + id;
}

// Deletes the "Show/Hide" content from the page
var deleteShowHide = (testDiv) =>
{
	var allChildren = testDiv.childNodes;
	for (var i = 0; i < allChildren.length; i++)
	{
		if (0 != allChildren[i].childNodes.length && allChildren[i].childNodes[0].tagName == "B")
		{			
			allChildren[i].parentNode.removeChild(allChildren[i]);
			return;
		}
	}
}

// Gets the value of a specific cookie
var getCookie = (name) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
	return "";
}

// Adds the "original image" link
var addShowOriginal = (thumb, img, as) =>
{
	let href = ''

	// if API data successfully loaded, get original image link from there
	if (thumb.metadata != undefined) {
		href = thumb.metadata.originalImageURL
	} else {
		// Get the id from thumb
		var id = thumb.id
		href = "showOriginalRedirect.html?id=" + id;
	}

	// Create the "remove" button
	var removeButton = document.createElement("button");
	removeButton.setAttribute("class", "del");
	removeButton.innerHTML = "X";
	removeButton.addEventListener('click', function(){
		removeImage(thumb, id);
	});
	thumb.appendChild(removeButton);
	
	// Create the "original image" link
	var showOriginalLink = document.createElement("a");
	showOriginalLink.setAttribute("class", "org");
	showOriginalLink.text = "Original Image";

	showOriginalLink.href = href
	showOriginalLink.target = "_blank";

	thumb.appendChild(showOriginalLink);
}


// Removes an image from favorites
var removeImage = (thumb, id) =>
{
	// Confirm the removal
	var answer = confirm("Remove this image?");
	if (answer == true)
	{
		// Remove the image
		thumb.parentNode.removeChild(thumb);
		window.open("https://rule34.xxx/index.php?page=favorites&s=delete&id=" + id, "_blank");
		window.focus();
	}
}

// returns 1 if ascending sort, -1 if descending
function getAscending() {
	if (sortDescendingOption.checked) {
		return -1
	} else {
		return 1
	}
}

function compareNumbers (a, b) {
	if (a < b) {
		return -1
	} else if (a>b) {
		return 1
	} else {
		return 0
	}
}
function createSortFunction (sortCriteria) {
	const functionString =
	// make sure posts without API data appear at TOP
	'let valueA = Number.MAX_SAFE_INTEGER*getAscending();'
	+'let valueB = Number.MAX_SAFE_INTEGER*getAscending();'
	+'try {'
	+`valueA = thumbA.metadata.${sortCriteria}`
	+'} catch (error) {' 
	+''
	+'}'
	+'try {'
	+`valueB = thumbB.metadata.${sortCriteria}`
	+'} catch (error) {' 
	+''
	+'}'
	+'return compareNumbers(valueA, valueB)*getAscending()'
	const sortFunction = Function('thumbA', 'thumbB', functionString)
	return sortFunction
}

//gets sort function to use
function getSortFunction () {
	const sortCriteria = sortOptions.value
	if (sortCriteria == 'none') {
		return
	} else {
		return createSortFunction(sortCriteria)
	}
}

