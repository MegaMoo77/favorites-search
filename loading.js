// Takes care of loading images

const CORSprefix = 'https://cors-anywhere2.onrender.com/'
const maxRequestAttempts = 3

// keeps track of all favorites page data requested for each user
// key is user ID and value is a map with key page number and value of page's html text
var users = new Map()

var finishedCount = 0;
var maximumConcurrentThreads = 40;

var abortController = new AbortController()

// use these on corresponding requests to abort requests
var globalAbortSignal = abortController.signal

// Try to load the previous value from the saved cookie
document.getElementById("userId").value = getCookie("userId");

// use in failed page request handler
async function requestPage(userID, pageNum, attemptsLeft, abortSignal) {
	if (attemptsLeft == 0) {
		console.error(`Too many failed attempts rerequesting page ${pageNum}`)
		return null
	}
	const requestedDoc = fetch(CORSprefix + "https://rule34.xxx/index.php?page=favorites&s=view&id=" + userID + "&pid=" + ((pageNum-1)*50), {signal:abortSignal})
		.then( async (response) => {
			if (!response.ok) {
				throw new Error(`Failed to request page ${pageNum}. Retrying with ${attemptsLeft-1} attempts left ...\nError ${response.status} description: ${response.statusText}`)
			} else {
				// when response received
				// Get the response text and cache it
				const responseText = await response.text();
				cacheResponse(userID, pageNum, responseText)
				console.log(`Successfully rerequested page ${pageNum}`)

				// Parse the document
				const parser = new DOMParser();
				let doc = parser.parseFromString(responseText, "text/html");

				return doc
			}
		})
		.catch( async (error) => {
			if (error instanceof DOMException) {
				console.log(`Aborted request for page ${pageNum}`)
				return null
			}
			console.error(error.message)
			// Try again if request failed
			sleep(500)
			return requestPage(userID, pageNum, attemptsLeft-1, abortSignal)
		})
	const output = await requestedDoc
	return output
}

// handles failed page requests
function failedPageRequestHandler(userID, pageNum) {
	const list = document.getElementById('failedRequestList')

	// add button list item element to handle failed request
	const listItem = document.createElement('li')
	listItem.style.position = 'relative'
	const button = document.createElement('button')
	button.type = "button"
	button.classList.add('rerequest')
	button.classList.add('failed')
	
	const label = document.createElement('label')
	label.style = "position: absolute; padding: 4px; margin-left: 10px"
	label.textContent = `Failed to request page ${pageNum} for user ${userID}`

	listItem.appendChild(button)
	listItem.appendChild(label)

	list.appendChild(listItem)

	button.addEventListener('click', async evt => {
		//disallow double clicks
		if (!evt.detail || evt.detail == 1) {
			button.disabled = true
			// change button class to show pending status
			button.classList.add('pending')
			button.classList.remove('failure')
			label.textContent = `Currently rerequesting page ${pageNum} for user ${userID}`

			// once doc requested
			await requestPage(userID, pageNum, maxRequestAttempts, globalAbortSignal).then(async doc => {
				if (doc == null) {
					// reset back to initial state
					button.classList.add('failure')
					button.classList.remove('pending')
					label.textContent = `Failed to rerequest page ${pageNum} for user ${userID}`
					button.disabled = false
				} else {
					// success!
					button.classList.add('success')
					button.classList.remove('pending')
					label.textContent = `Successfully rerequested page ${pageNum} for user ${userID}`

					// load entire document using currently inputted commands
					await loadContent(doc, get_commands(document.getElementById("tags").value), advancedMode.checked, globalAbortSignal)
					
					// fade out element code from https://stackoverflow.com/a/33424474
					const seconds = 2;
					listItem.style.transition = "opacity "+seconds+"s ease";
					listItem.style.opacity = 0;
					setTimeout(()=> {
						list.removeChild(listItem)
					}, seconds*1000)
				}
			})
		}
	})
}

// saves requested page to memory for easy access later
function cacheResponse(userID, pageNum, pageText) {
	if (users.has(userID)) {
		const userData = users.get(userID)
		userData.set(pageNum, pageText)
	} 
	// if user not saved
	else {
		const newUserData = new Map()
		newUserData.set(pageNum, pageText)
		users.set(userID, newUserData)
	}
}

// Loads the page
// advanced determines whether to load API data or not
async function loadPage()
{
	const advanced = advancedMode.checked
	const abortSignal = globalAbortSignal

	console.log('Loading page. Advanced mode ' + advanced)

	// Stop anything that is loading
	stopItAll();
	
	// clear failed request list
	document.getElementById('failedRequestList').innerHTML = ''

	// check all filters
	explicit.checked = true
	safe.checked = true
	questionable.checked = true

	// Show the spinner
	var spinner = document.getElementById("spinner");
	spinner.style.display = "block";

	// Get the user id and make sure it's not empty
	var userId = document.getElementById("userId").value;
	if (userId.trim().length == 0) {
		console.error('Enter a user ID')
		spinner.style.display = "none"
		return
	}

	// Add it as a cookie
	document.cookie = "userId=" + userId;
 
	// Clear the div
	var contentDiv = document.getElementById("content");
	contentDiv.innerHTML = "";

	// Show the stop button
	var stopButton = document.getElementById("stop");
	stopButton.style.display = "inline";

	// Written by UndertowTruck
	// Get tag commands
	var commands = get_commands(document.getElementById("tags").value)

	// Written by UndertowTruck
	// get command interpretation and display it to user
	var interpretation = document.getElementById("interpretation")
	var intepretation = get_command_interpretation(commands)
	console.log(intepretation)
	interpretation.innerText = get_command_interpretation(commands)

	var enteredMaxThreads = parseInt(document.getElementById("maxThreads").value);
	if (!isNaN(enteredMaxThreads))
		maximumConcurrentThreads = enteredMaxThreads;

	// conducts request for first page of favorites
	async function requestInitial(attemptsLeft) {
		if (attemptsLeft == 0) {
			console.error(`Too many failed attempts requesting initial favorites page`)

			// Remove this line if you want spinner to keep spinning forever if a request fails
			finishedCount += 1

			failedPageRequestHandler(userId, 1, advanced)

			return null
		}
		const requestedDoc = fetch(CORSprefix + "https://rule34.xxx/index.php?page=favorites&s=view&id=" + userId, {signal:abortSignal})
			.then( async (response) => {
				if (!response.ok) {
					throw new Error(`Failed to request initial favorites page. Retrying with ${attemptsLeft-1} attempts left ...\nError ${response.status} description: ${response.statusText}`)
				} else {
					// when response received
					// Get the response text and cache it
					const responseText = await response.text();

					cacheResponse(userId, 1, responseText)

					console.log(`Successfully requested first favorites page`)

					// Parse the document
					const parser = new DOMParser();
					const doc = parser.parseFromString(responseText, "text/html");

					return doc
				}
			})
			.catch( async (error) => {
				if (error instanceof DOMException) {
					console.log(`Aborted request for initial page`)
					return null
				}
				// Try again if request failed
				console.error(error.message)
				sleep(500)
				return requestInitial(attemptsLeft-1)
			})
		const output = await requestedDoc
		return output
	}

	let doc = null
	// only load page if needed
	if (!users.has(userId) || !users.get(userId).has(1)) {
		doc = await requestInitial(maxRequestAttempts)
	} else {
		doc = users.get(userId).get(1)
		doc = (new DOMParser()).parseFromString(doc, 'text/html')
		console.log('Initial page retrieved from cache')
	}

	// couldnt get data, so stop
	if (doc == null) {
		console.error('Failed to retrieve initial page from server or cache')
		document.getElementById("spinner").style.display = "none";
		return
	} else {
		const lastAs = doc.getElementsByName("lastpage");
		const lastA = lastAs[0];

		// If userID doesn't exist, or user doesn't have favorites
		if (lastA == undefined) {
			console.error(`User ${userId} does not exist, or does not have favorites`)
			document.getElementById("spinner").style.display = "none";
			return
		}
		const onclick = lastA.getAttribute('onclick');
		const countStartIndex = onclick.indexOf("pid") + 4;
		const countEndIndex = onclick.indexOf(";") - 1;
		const countStr = onclick.substring(countStartIndex, countEndIndex);
		const count = Number(countStr);

		await loadContent(doc, commands, advanced, abortSignal);

		finishedCount = 1;
		
		// get rest of pages
		loopUntilDone(count, commands, userId, 50, advanced, abortSignal);
	}
}

// Sleeps a specified amount of time
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Grabs images until there are no more
async function loopUntilDone(count, commands, userId, offset, advanced, abortSignal)
{
	// Calculate how many threads to start
	var end = Math.min(maximumConcurrentThreads, count / 50);
	for (var i  = 0; i < end; i++)
	{
		const pageNum = offset/50 + 1
		sendNext(offset, commands, advanced, abortSignal);

		offset += (50 * 1);
	}

	// Sleep until all threads finish
	while (finishedCount < end) {
		await sleep(200);
	}

	// If there no more more images to retrieve, hide the spinner and exit
	if (end < maximumConcurrentThreads)
	{
		document.getElementById("spinner").style.display = "none";
		return;
	}

	finishedCount = 0;
	loopUntilDone(count - (50 * maximumConcurrentThreads), commands, userId, offset, advanced, abortSignal);
}

// post ID from thumbnail element
function getIDfromThumb(thumb) {
	const as = thumb.getElementsByTagName("a")[0]
	id = parseInt(as.id.match(/(\d+)/)[0])
	return id
}



// Removes all thumbs in a document not matching the tag commands and returns the matching ones
function getThumbs(doc, commands)
{
	// Get all the thumbs in the document
	var thumbs = doc.getElementsByClassName("thumb");

	// Check each one for a match
	for (var i = 0; i < thumbs.length; i++)
	{
		// Get the thumb
		var thumb = thumbs[i];

		var as = thumb.getElementsByTagName("a");
		// Get the tags
		var imgs = as[0].getElementsByTagName("img");
		var tags = imgs[0].title.split(" ");
		
		// Remove the thumb if it doesn't match the tag commands
		if (!isMatch(tags, commands))
		{
			var span = doc.getElementById(as[0].id).parentNode;
			span.parentNode.removeChild(span);
			i--;
		}
	}

	return thumbs;
}

// Sends a request for the next batch of results
async function sendNext(offset, commands, advanced, abortSignal)
{	
	const pageNum = offset/50 + 1
	// Get the user id
	var userId = document.getElementById("userId").value;

	// conducts page request for next page
	async function requestNext(attemptsLeft, abortSignal) {
		if (attemptsLeft == 0) {
			console.error(`Too many failed attempts requesting page ${offset/50 + 1}`)
			failedPageRequestHandler(userId, offset/50 + 1, advanced)
			return null
		}
		const requestedDoc = fetch(CORSprefix + "https://rule34.xxx/index.php?page=favorites&s=view&id=" + userId + "&pid=" + offset, {signal:abortSignal})
			.then( async (response) => {
				if (!response.ok) {
					throw new Error(`Failed to request page ${pageNum}. Retrying with ${attemptsLeft-1} attempts left ...\nError ${response.status} description: ${response.statusText}`)
				} else {
					// when response received
					// Get the response text and cache it
					const responseText = await response.text();
					cacheResponse(userId, pageNum, responseText)
					console.log(`Successfully requested page ${offset/50 + 1}`)

					// Parse the document
					const parser = new DOMParser();
					let doc = parser.parseFromString(responseText, "text/html");

					return doc
				}
			})
			.catch( async (error) => {
				if (error instanceof DOMException) {
					console.log(`Aborted request for page ${pageNum}`)
					return null
				}
				// Try again if request failed
				console.error(error.message)
				sleep(500)
				return requestNext(attemptsLeft-1)
			})
		const output = await requestedDoc
		return output
	}

	let doc = null
	// only load page if needed
	if (!users.has(userId) || !users.get(userId).has(pageNum)) {
		doc = await requestNext(maxRequestAttempts, abortSignal)
	} else {
		doc = users.get(userId).get(pageNum)
		doc = (new DOMParser()).parseFromString(doc, 'text/html')
		console.log('Page ' + pageNum + ' retrieved from cache')
	}

	// couldnt get page, so stop
	if (doc == null) {
		console.error(`Failed to retrieve page ${pageNum} from server or cache`)
		return
	} else {
		loadContent(doc, commands, advanced, abortSignal)
	}
}

// Code from https://stackoverflow.com/a/31424853
// Used to wait for an array of promises to resolve like Promise.all, without rejecting all results if one promise fails
function reflect(promise){
    return promise.then(function(v){ return {v:v, status: "fulfilled" }},
                        function(e){ return {e:e, status: "rejected" }});
}

// Displays metadata of post
// statistic should be equal to property name in API image info object
var displayData = (thumb, statistic) => {
	const dataLabel = document.createElement('label')
	const currentLabel = thumb.getElementsByTagName('label')[0]

	if (thumb.metadata == undefined) {
		dataLabel.textContent = `API data unavailable`
	} else{
		if (statistic == "none") {
			// remove current label's text if it exists
			if (currentLabel != 'none') {
				currentLabel.textContent = ''
				return
			}
		}
		let labelText = ''
		const metadata = thumb.metadata
		switch (statistic) {
			case 'score':
				labelText = `Score: ${metadata.score}`
				break
			case 'id':
				labelText = `Post ID: ${metadata.id}`
				break
			case 'rating':
				labelText = `Rating: ${metadata.rating}`
				break
			case 'height':
				labelText = `Height: ${metadata.height}`
				break
			case 'width':
				labelText = `Width: ${metadata.width}`
				break
			case 'date':
				// convert UNIX seconds time to date
				labelText = `Date: ${metadata.date}`
				break
			case 'lastUpdate':
				labelText = `Last Updated: ${new Date(metadata.lastUpdate * 1000)}`
				break
			case 'deleted':
				labelText = `Deleted: ${metadata.deleted}`
				break
		}
		dataLabel.textContent = labelText
	}
	//label don't exist
	if (currentLabel == null) {
		// display info
		thumb.appendChild(dataLabel)
		thumb.appendChild(document.createElement('br'))
	} else {
		currentLabel.replaceWith(dataLabel)
	}
}

// Loads the page content
async function loadContent(doc, commands, advanced, abortSignal)
{
	// Get the count of total thumbs before removing
	let totalThumbsCount = doc.getElementsByClassName("thumb").length;

	if (totalThumbsCount == 0) {
		return
	}

	// Get the content div
	let contentDiv = document.getElementById("content");

	// Get all the new thumbs
	let newThumbs = getThumbs(doc, commands)
	newThumbs = Array.from(newThumbs)

	// get API data if in advanced mode
	if (advanced) {
		const promises = newThumbs.map( async (thumb) => {
			const imageID = getIDfromThumb(thumb)
			const imageInfo = await getImageInfo(imageID, abortSignal)
			if (imageInfo == null) {
				throw new Error(`Could not get API data for image ${imageID}`)
			}
			thumb.metadata = imageInfo
		})

		await Promise.all(promises.map(reflect)).then(function(results){
			for (let result of results) {
			if (result.status == 'rejected')
				console.error(result.e.message)
			}
		});
	}
	
	// Add new thumbs to document
	for (var i = 0; i < newThumbs.length; i++)
	{
		var thumb = newThumbs[i];
		thumb.id = getIDfromThumb(thumb)

		// display post ID
		const badgeContainer = document.createElement('div')
		badgeContainer.className = 'badgeContainer'
		const badgeDiv = document.createElement('div')
		badgeDiv.className = 'badge'
		badgeContainer.appendChild(badgeDiv)

		const postBadge = document.createElement('span')
		postBadge.className = 'badge'
		postBadge.textContent = thumb.id
		badgeDiv.appendChild(postBadge)
		thumb.prepend(badgeContainer)

		// Set the href
		var as = thumb.getElementsByTagName("a");
		as[0].href = "https://rule34.xxx/index.php" + as[0].search;
		as[0].onclick = "";

		var imgs = as[0].getElementsByTagName("img");
		var img = imgs[0]
		
		
		// Ensure the link opens in a new tab
		as[0].target = "_blank";

		// display stats if advanced mode enabled
		if (advanced) {
			displayData(thumb, statDisplayed.value)
		}

		// Add the link to show the original image
		addShowOriginal(thumb, img, as)


		contentDiv.insertBefore(thumb, document.getElementById("paginator"));
	}

	// Show the random button
	var randomButton = document.getElementById("random");
	randomButton.style.display = "inline";
	changeRandom();

	finishedCount++;
}

// Stops all requests
function stopItAll()
{
	window.stop();
	document.getElementById("spinner").style.display = "none";
}