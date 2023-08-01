// Set up event listeners for submit & stop buttons
const submitButton = document.getElementById('submit')
const stopButton = document.getElementById('stop')


var resetSignal = () => {
	abortController = new AbortController()
	globalAbortSignal = abortController.signal
}

submitButton.addEventListener('click', evt => {
	// Clear any ongoing requests, then load page
	abortController.abort()
	// create new signals
	resetSignal()

	loadPage()
})

stopButton.addEventListener('click', async (evt) => {
	// Clear any ongoing requests, then stop loading of images
	abortController.abort()

	// create new signals
	resetSignal()
	stopItAll()
})

// by UndertowTruck
// sorts all images displayed (related functions in misc.js)
sortButton.addEventListener('click', evt => {
	const allImages = document.getElementsByClassName('thumb')
	const sortFunction = getSortFunction()
	if (sortFunction == 'undefined') {
		console.log('Choose sort criteria')
		return
	}
    const sortedImages = Array.from(allImages).sort(sortFunction)
	const contentDiv = document.getElementById('content')
    sortedImages.forEach(thumb => {
        contentDiv.appendChild(thumb)
    })
})

// by UndertowTruck
// filters images based on rating
function ratingFilter(filterName, filterValue, filterElement) {
	const allImages = document.getElementsByClassName('thumb')
	// rating allowed
	if (filterElement.checked) {
		console.log(`Including ${filterName} posts`)
		for (image of allImages) {
			// display image if API data unavailable
			if (image.metadata == undefined) {
				image.style.display = 'inline-block'
				return
			}
			if (image.metadata.rating == filterValue) {
				image.style.display = 'inline-block'
			}
		}
	} else {
		console.log(`Excluding ${filterName} posts`)
		for (image of allImages) {
			// display image if API data unavailable
			if (image.metadata == undefined) {
				image.style.display = 'inline-block'
				return
			}
			if (image.metadata.rating == filterValue) {
				image.style.display = 'none'
			}
		}
	}
}

applyFilters.addEventListener('click', evt => {
	ratingFilter('explicit', 'e', explicit)
	ratingFilter('safe', 's', safe)
	ratingFilter('questionable', 'q', questionable)
})

// by UndertowTruck
// expands UI
expandUI.addEventListener('change', evt => {
	if (!expandUI.checked) {
		subUI.style.display = 'none'
	} else {
		//back to normal
		subUI.style = ''
	}
})

advancedMode.addEventListener('change', evt => {
	if (advancedMode.checked) {
		//back to normal
		settings.style = ''
	} else {
		settings.style.display = 'none'
	}
})

// by UndertowTruck
statDisplayed.addEventListener('change', evt => {
    const allImages = document.getElementsByClassName('thumb')
	for (image of allImages) {
		// only process if image has label to add value to
		if (image.getElementsByTagName('label')[0] != null) {
			displayData(image, statDisplayed.value)
		}
	}
})

