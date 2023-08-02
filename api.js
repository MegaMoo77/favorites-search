// Responsible for requesting data for images like score, creation date, width, and height

// used to request data for an image
const APIURL = "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&id="

// caches API calls
var loadedAPIs = new Map()

// used to parse dates
monthDict = {
	'Jan' : '01',
	'Feb' : '02',
	'Mar' : '03',
	'Apr' : '04',
	'May' : '05',
	'Jun' : '06',
	'Jul' : '07',
	'Aug' : '08',
	'Sep' : '09',
	'Oct' : '10',
	'Nov' : '11',
	'Dec' : '12'
}

class ImageMetadata {
    constructor(id, score, tags, imageWidth, imageHeight, rating, creationDate, thumbnailImageURL, sampleImageURL, originalImageURL, deleted, lastUpdate) {
        this.id = id
        this.score = score
		this.tags = tags
        this.width = imageWidth
        this.height = imageHeight
        this.rating = rating
        this.date = creationDate
		this.thumbnailImageURL= thumbnailImageURL
		this.sampleImageURL = sampleImageURL
		this.originalImageURL = originalImageURL
		this.deleted = deleted
		this.lastUpdate = lastUpdate
    }
}

// handles failed page requests
function failedAPIRequestHandler(postID) {
	const list = document.getElementById('failedRequestList')
	// add button element to handle failed request
	const listItem = document.createElement('li')
	listItem.style.position = 'relative'

	const button = document.createElement('button')
	button.type = "button"
	button.classList.add('rerequest')
	button.classList.add('failed')
	
	const label = document.createElement('label')
	label.style = "position: absolute; padding: 4px; margin-left: 10px"
	label.textContent = `Failed to request API data for post ${postID}`

	listItem.appendChild(button)
	listItem.appendChild(label)

	list.appendChild(listItem)

	button.addEventListener('click', async evt => {
		//disallow double clicks
		if (!evt.detail || evt.detail == 1) {
			button.disabled = true
			// changes to show pending status
			button.classList.add('pending')
			button.classList.remove('failed')
			label.textContent = `Currently rerequesting API data for post ${postID}`

			// once data requested
			await getImageInfo(postID, globalAbortSignal, false).then(async data => {
				if (data == null) {
					// reset back to initial state
					button.classList.remove('pending')
					button.classList.add('failed')
					label.textContent = `Failed to rerequest API data for post ${postID}`
					button.disabled = false
				} else {
					// success!
					button.classList.remove('pending')
					button.classList.add('success')
					label.textContent = `Successfully rerequested API data for post ${postID}`

					const post = document.getElementById(''+postID)
					if (post != null) {
						post.metadata = data

						//now clear previous label and replace with new one
						displayData(post, "score")
					}
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

// Example date string "Sun Apr 02 03:28:37 +0000 2023"
// should be converted to ISO standard YYYY-MM-DDTHH:mm:ss
// then converted to milliseconds after Unix Epoch
var parseDate = (dateString) => {
	yearNumber = dateString.substring(26,30)
	monthNumber = monthDict[dateString.substring(4,7)]
	dayNumber = dateString.substring(8,10)
	time = dateString.substring(11,19)
	// website dates are two hours ahead of UTC
	ISOdateString = yearNumber + '-' + monthNumber + '-' + dayNumber + 'T' + time + '+02:00'
	return new Date(ISOdateString)
}

var parseXML = (imageID, xmlString) => {
	xmldoc = new DOMParser().parseFromString(xmlString, 'text/xml')
	post = xmldoc.getElementsByTagName('post')[0]
	if (post == undefined) {
		console.error(`API data for post ${imageID} not found`)
		return null
	}
	score = parseInt(post.getAttribute('score'))
	tags = post.getAttribute('tags')
	imageWidth = parseInt(post.getAttribute('sample_width'))
	imageHeight = parseInt(post.getAttribute('sample_height'))
	rating = post.getAttribute('rating')
	creationDate = parseDate(post.getAttribute('created_at'))
	previewURL = post.getAttribute('preview_url')
	sampleURL = post.getAttribute('sample_url')
	originalImageURL = post.getAttribute('file_url')
	postStatus = post.getAttribute('status')
	// set deleted status to true or false
	deleted = postStatus == 'active' ? false : true
	lastUpdate = parseInt(post.getAttribute('change'))

	data_obj = new ImageMetadata(imageID, score, tags, imageWidth, imageHeight, rating, creationDate, previewURL, sampleURL, originalImageURL, deleted, lastUpdate)
	return data_obj
}

var sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var getXMLResponse = async (imageID, attemptsLeft, abortSignal, main) => {
	if (attemptsLeft == 0) {
		console.error(`Too many failed attempts requesting API data for post ${imageID}`)
		// if called through main page, handle failed request
		if (main)
			failedAPIRequestHandler(imageID)
		return null
	}

	// Headers must be used to prevent API requests from being blocked on Firefox. Firefox User Agent headers blocked
	const headers = {'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'}
	xmlResponse = fetch(CORSprefix + APIURL + imageID , {headers:headers, signal:abortSignal})
		.then( (response) => {
			if (!response.ok) {
				throw new Error(`API data for post ${imageID} failed to be requested with error ${response.status}. Retrying with ${attemptsLeft-1} attempts left ...\nError description: ${response.statusText}`)
			}
			console.log(`Successfuly requested API data for post ${imageID}`)
			return response
		})
		.catch( async (error) => {
			if (error instanceof DOMException) {
				console.log(`Aborted API request for post ${imageID}`)
				return null
			}
			console.error(error.message)
			// Try again if request failed
			sleep(500)
			return await getXMLResponse(imageID, attemptsLeft - 1, main)
		})
	return xmlResponse
}

// Used to get data like score and creation date for images
// main parameter determines if it was called normally through loadPage (true), or through failed request handler (false)
var getImageInfo = async (imageID, abortSignal, main = true) => {
	// return cached data (if available)
	if (loadedAPIs.has(imageID)) {
		return loadedAPIs.get(imageID)
	}

	// otherwiser, request data
	const xmlResponse = await getXMLResponse(imageID, maxRequestAttempts, abortSignal, main)
	if (xmlResponse == null) {
		return null
	}
	const xmltext = await xmlResponse.text()
	const XML = parseXML(imageID, xmltext)

	// API request was successful, but empty data
	if (XML == null) {
		// only handle failed API if it was through main page
		if (main)
			failedAPIRequestHandler(imageID)
		return XML
	}
	
	// cache data
	loadedAPIs.set(imageID, XML)
	return XML
}


