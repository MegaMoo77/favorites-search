// Handles user made page requests

class CustomPageRequest {
    /**
     * Keeps track of all portions of data that a custom page request should have
     * @param {Number} userID Number representing user ID of page request
     * @param {Number} pageNum Number representing page number of page request
     * @param {ThumbElementData[]} posts Array representing data of each post inside page
     */
    constructor(userID, pageNum, posts) {
        this.userID = userID
        this.pageNumber = pageNum
        this.posts = posts
    }
    
}

// Changes button state and adds button to remove custom page request from display (Used in customPageRequestHandler)
async function afterCustomPageReceived(doc, userID, pageNum, button, listItem, label) {
    const list = document.getElementById('customRequestList');
    if (doc == null) {
        // set to failure state
        button.classList.add('failure');
        button.classList.remove('pending');
        label.textContent = `Failed to request page ${pageNum} for user ${userID}`;
        button.disabled = false;
    } else {
        button.classList.add('success');
        button.classList.remove('pending');
        label.textContent = `Successfully requested page ${pageNum} for user ${userID}`;

        const postsData = extractPagePostData(doc);
        // Create custom request object and save it
        const customRequest = new CustomPageRequest(userID, pageNum, postsData);
        customRequests.push(customRequest);
        // Now load in posts
        displayCustomRequest(customRequest);
        
        // fade out element code from https://stackoverflow.com/a/33424474
        const seconds = 2;
        listItem.style.transition = "opacity "+seconds+"s ease";
        listItem.style.opacity = 0;
        setTimeout(()=> {
            list.removeChild(listItem)
        }, seconds*1000)
        
        // Now add element to remove page
        // add delete list item element
        const deleteListItem = document.createElement('li')
        deleteListItem.style.position = 'relative'
        const deleteButton = document.createElement('button')
        deleteButton.type = "button"
        deleteButton.textContent = "X"
        deleteButton.classList.add('remove')


        const deleteLabel = document.createElement('label')
        deleteLabel.style = "position: absolute; padding: 4px; margin-left: 10px"
        deleteLabel.textContent = `Page ${pageNum} for user ${userID}`

        deleteListItem.appendChild(deleteButton)
        deleteListItem.appendChild(deleteLabel)

        list.appendChild(deleteListItem)

        deleteButton.addEventListener('click', async evt => {
            removeCustomRequestAndThumbnails(customRequest);
            list.removeChild(deleteListItem);
        })
    }
}

// handles custom page requests (based on failedPageRequestHandler)
async function customPageRequestHandler(userID, pageNum) {
	const list = document.getElementById('customRequestList')

	// add button list item element to handle custom request
	const listItem = document.createElement('li')
	listItem.style.position = 'relative'

	const button = document.createElement('button')
	button.type = "button"
	button.classList.add('rerequest')
	// should be pending since request has just been made and didn't fail yet
	button.classList.add('pending')
	button.disabled = true
	
	const label = document.createElement('label')
	label.style = "position: absolute; padding: 4px; margin-left: 10px"
	label.textContent = `Currently requesting page ${pageNum} for user ${userID}`

	listItem.appendChild(button)
	listItem.appendChild(label)

	list.appendChild(listItem)

	// now wait for response
	// once doc requested
    // only request page if needed
	if (!users.has(userID) || !users.get(userID).has(pageNum)) {
		await requestPage(userID, pageNum, maxRequestAttempts, globalAbortSignal).then(async doc => {
            afterCustomPageReceived(doc, userID, pageNum, button, listItem, label)
        })
	} else {
        let doc = users.get(userID).get(pageNum);
		doc = (new DOMParser()).parseFromString(doc, 'text/html');
		console.log(`Page ${pageNum} for user ${userID} retrieved from cache`);
        afterCustomPageReceived(doc, userID, pageNum, button, listItem, label)
	}

    // If previous doc request failed, add ability to retry request to button
	button.addEventListener('click', async evt => {
		//disallow double clicks
		if (!evt.detail || evt.detail == 1) {
			button.disabled = true
			// change button class to show pending status
			button.classList.add('pending')
			button.classList.remove('failure')
			label.textContent = `Currently requesting page ${pageNum} for user ${userID}`
			if (!users.has(userID) || !users.get(userID).has(pageNum)) {
                await requestPage(userID, pageNum, maxRequestAttempts, globalAbortSignal).then(async doc => {
                    afterCustomPageReceived(doc, userID, pageNum, button, listItem, label)
                })
            } else {
                let doc = users.get(userID).get(pageNum);
                doc = (new DOMParser()).parseFromString(doc, 'text/html');
                console.log(`Page ${pageNum} for user ${userID} retrieved from cache`);
                afterCustomPageReceived(doc, userID, pageNum, button, listItem, label)
            }
		}
	})
}

function displayCustomRequest(customRequest) {
    /**
     * Displays posts in a CustomPageRequest object
     * @param {CustomPageRequest} importedFile 
     */
    const contentDiv = document.getElementById("content");
    for (const post of customRequest.posts) {
        const element = post.toHTMLelement();
        // include reference to custom request, which allows the program to see which request a post came from, and get rid of posts if the request is removed
        element.request = customRequest;
        contentDiv.insertBefore(element, document.getElementById("paginator"));
    }
}

function removeCustomRequestAndThumbnails(customRequest) {
    /**
     * Removes custom request from list of custom requests, and removes thumbnails from it
     * @param {CustomPageRequest} customRequest
     */

    // remove imported file from currently imported files list
    for (let i = 0; i < customRequests.length; i++) {
        const request = customRequests[i];
        if (request === customRequest) {
            console.log(`Custom request for page ${customRequest.pageNumber} for user ${customRequest.userID} removed`);
            customRequests.splice(i,1);
            break;
        }
    }

    const contentDiv = document.getElementById("content");
    // remove all thumbnails with reference to request
    for (const thumb of Array.from(document.getElementsByClassName("thumb"))) {
        if (thumb?.request === customRequest) {
            contentDiv.removeChild(thumb);
        }
    }
}