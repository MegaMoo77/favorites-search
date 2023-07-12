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
sortOptions.addEventListener('change', evt => {
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
// if changed from ascending to descending or vice versa, resort images
sortDescendingOption.addEventListener('change', evt => {
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
function addFilterListener(filterName, filterValue, filterElement) {
	filterElement.addEventListener('change', evt => {
		const allImages = document.getElementsByClassName('thumb')
		// explicit allowed
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
	})
}
addFilterListener('explicit', 'e', explicit)
addFilterListener('safe', 's', safe)
addFilterListener('questionable', 'q', questionable)

// by UndertowTruck
// minimizes UI
disableUI.addEventListener('change', evt => {
	if (disableUI.checked) {
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

