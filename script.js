// ============================================================================
// DOM ELEMENT REFERENCES - Getting HTML elements by their IDs
// ============================================================================
const bookmarkName = document.getElementById('bookmark-id');      // Name input field
const bookmarkTags = document.getElementById('bookmark-tags');    // Tags input field
const bookmarkURL = document.getElementById('bookmark-url');      // URL input field
const addBookmarkBtn = document.getElementById('add-bookmark');   // "Add Bookmark" button
const bookmarkList = document.getElementById('bookmark-list');    // UL container that holds all bookmarks
const searchBar = document.getElementById('search-bar');          // Search input field
const sortContainer = document.querySelector('.sort-container');  // Container for sort buttons
let currentSort = 'date-newest';                                  // Track current sort method

// ============================================================================
// INITIALIZATION - Runs when page loads
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();       // Load saved bookmarks from localStorage
    setupSortButtons();    // Setup click handlers for sort buttons
});

// ============================================================================
// ADD BOOKMARK FUNCTIONALITY
// ============================================================================
addBookmarkBtn.addEventListener('click', function() {
    // Get and clean input values
    const name = bookmarkName.value.trim();
    const url = bookmarkURL.value.trim();
    const tags = bookmarkTags.value.trim();

    // Validation checks
    if (!name || !url) return alert('Fill in name and URL');     // Require name and URL
    if (!url.startsWith('http')) return alert('Valid URL required'); // URL must start with http/https

    // Save to storage and then render the created bookmark (ensures ID is available)
    const created = saveBookmark(name, url, tags); // Save to localStorage and get created object
    renderBookmark(created.name, created.url, created.tags, false, null, created.id);  // Display on page with ID

    // Clear input fields after adding
    bookmarkName.value = '';
    bookmarkURL.value = '';
    bookmarkTags.value = '';
});

// ============================================================================
// SORTING FUNCTIONALITY
// ============================================================================
function setupSortButtons() {
    if (!sortContainer) return; // Exit if no sort container found
    
    // Add click event listener to sort container (event delegation)
    sortContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('sort-btn')) {
            const sortType = e.target.dataset.sort; // Get sort type from button's data attribute
            
            // Update active button visual state
            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.classList.remove('active'); // Remove active class from all buttons
            });
            e.target.classList.add('active'); // Add active class to clicked button
            
            // Apply the selected sorting
            sortBookmarks(sortType);
            currentSort = sortType; // Remember current sort method
        }
    });
    
    // Set default active button (newest first)
    const defaultBtn = document.querySelector('[data-sort="date-newest"]');
    if (defaultBtn) defaultBtn.classList.add('active');
}

function sortBookmarks(sortType) {
    // Get current bookmarks from localStorage
    let bookmarks = getBookmarksFromStorage();
    
    if (bookmarks.length === 0) return; // Exit if no bookmarks
    
    // Apply different sorting algorithms based on selected type
    switch(sortType) {
        case 'name-asc': // Sort by name A-Z
            bookmarks.sort((a, b) => a.name.localeCompare(b.name));
            break;
            
        case 'name-desc': // Sort by name Z-A
            bookmarks.sort((a, b) => b.name.localeCompare(a.name));
            break;
            
        case 'date-newest': // Newest first (default - already in this order)
            bookmarks.sort((a, b) => b.dateAdded - a.dateAdded);
            break;
            
        case 'date-oldest': // Oldest first
            bookmarks.sort((a, b) => a.dateAdded - b.dateAdded);
            break;
            
        case 'tags': // Sort by tags alphabetically
            bookmarks.sort((a, b) => {
                const tagsA = a.tags || ''; // Handle empty tags
                const tagsB = b.tags || '';
                return tagsA.localeCompare(tagsB); // Compare tag strings
            });
            break;
    }
    
    // Save sorted bookmarks back to localStorage
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    
    // Clear the display and re-render with sorted order
    while (bookmarkList.firstChild) {
        bookmarkList.removeChild(bookmarkList.firstChild);
    }
    bookmarks.forEach(b => renderBookmark(b.name, b.url, b.tags, false, null, b.id)); // Re-add in sorted order
    currentSort = sortType; // Update current sort method
}

// ============================================================================
// BOOKMARK RENDERING - Creates HTML elements for bookmarks
// ============================================================================
function renderBookmark(name, url, tags, isEditing = false, insertBefore = null, id = null) {
    // ========== EDITING MODE ==========
    // If isEditing is true, show edit form instead of bookmark
    if (isEditing) {
        const li = document.createElement('li');
        li.className = 'editing';
        if (id) li.setAttribute('data-id', id);
        
        // Create edit form HTML structure

        // Build edit form using DOM methods (avoid raw HTML strings)
        const form = document.createElement('div');
        form.className = 'edit-form';

        const inputName = document.createElement('input');
        inputName.type = 'text';
        inputName.value = name || '';
        inputName.className = 'edit-name';
        inputName.placeholder = 'Bookmark Name';

        const inputURL = document.createElement('input');
        inputURL.type = 'text';
        inputURL.value = url || '';
        inputURL.className = 'edit-url';
        inputURL.placeholder = 'URL';

        const inputTags = document.createElement('input');
        inputTags.type = 'text';
        inputTags.value = tags || '';
        inputTags.className = 'edit-tags';
        inputTags.placeholder = 'Tags (comma separated)';

        const btnWrap = document.createElement('div');
        btnWrap.className = 'edit-buttons';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-edit';
        saveBtn.textContent = 'Save';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-edit';
        cancelBtn.textContent = 'Cancel';

        btnWrap.appendChild(saveBtn);
        btnWrap.appendChild(cancelBtn);

        form.appendChild(inputName);
        form.appendChild(inputURL);
        form.appendChild(inputTags);
        form.appendChild(btnWrap);

        li.appendChild(form);
        
        // Insert edit form at the saved position or append to end
        if (insertBefore) {
            bookmarkList.insertBefore(li, insertBefore);
        } else {
            bookmarkList.appendChild(li);
        }
        
        // Save button handler
        li.querySelector('.save-edit').addEventListener('click', function() {
            const newName = li.querySelector('.edit-name').value.trim();
            const newURL = li.querySelector('.edit-url').value.trim();
            const newTags = li.querySelector('.edit-tags').value.trim();
            
            // Validate inputs
            if (!newName || !newURL) return alert('Fill in name and URL');
            if (!newURL.startsWith('http')) return alert('Valid URL required');
            
            // Update in localStorage (use id if available)
            updateBookmark(id, newName, newURL, newTags);
            
            // Capture position before removing
            const nextNode = li.nextSibling;
            // Remove edit form and render updated bookmark at same position
            li.remove(); // Remove edit form
            renderBookmark(newName, newURL, newTags, false, nextNode, id); // Show updated bookmark at same position
        });
        
        // Cancel button handler
        li.querySelector('.cancel-edit').addEventListener('click', function() {
            // Capture position before removing
            const nextNode = li.nextSibling;
            li.remove(); // Remove edit form
            
            // Only re-render original if we have values (not for cancelled new adds)
            if (name && url) {
                renderBookmark(name, url, tags, false, nextNode, id); // Show original bookmark at same position
            }
        });
        
        return; // Exit function - we're done with edit mode
    }
    
    // ========== NORMAL BOOKMARK RENDERING ==========
    // Create list item container for the bookmark
    const li = document.createElement('li');
    li.draggable = true; // Enable drag and drop
    li.setAttribute('data-id', id || Date.now()); // Give unique ID (preserve provided id)
    
    // Create clickable link
    const a = document.createElement('a');
    a.href = url; // Link URL
    a.textContent = name; // Link text (bookmark name)
    a.target = '_blank'; // Open in new tab
    
    li.appendChild(a); // Add link to list item

    // ========== TAGS SECTION ==========
    // Create tag display if tags exist
    if (tags) {
        const span = document.createElement('span');
        span.textContent = tags; // Tag text
        span.className = 'tag-badge'; // CSS class for styling
        li.appendChild(span); // Add tag to list item
    }

    // ========== MENU BUTTON (☰) ==========
    // Create the menu button
    const menuBtn = document.createElement('div');
    menuBtn.className = 'menuBtn';
    menuBtn.textContent = '☰'; // Hamburger menu icon

    // Create menu content container
    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';

    // Create Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'editBtn';

    // Create Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'deleteBtn';

    // ========== MENU FUNCTIONALITY ==========
    // Menu button click - show/hide menu
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling up
        
        const isActive = menuBtn.classList.contains('active'); // Check if already open
        
        // Close all other open menus first
        document.querySelectorAll('.menuBtn').forEach(m => {
            m.classList.remove('active');
        });
        
        // Open this menu if it wasn't already open
        if (!isActive) menuBtn.classList.add('active');
    });

    // Delete button functionality
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent menu from closing immediately
        li.remove(); // Remove from DOM
        const bid = li.getAttribute('data-id');
        deleteBookmark(bid); // Remove from localStorage
    });

    // Edit button functionality
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent menu from closing immediately
        menuBtn.classList.remove('active'); // Close menu
        
        // Replace bookmark with edit form
        const nextSibling = li.nextSibling; // Save position before removing
        li.remove(); // Remove current bookmark display
        renderBookmark(name, url, tags, true, nextSibling, id); // Re-render in edit mode at same position
    });

    // ========== ASSEMBLE BOOKMARK ==========
    // Set up drag and drop events
    setupDragEvents(li);

    // Add buttons to menu, menu to button, button to bookmark
    menuContent.appendChild(editBtn);
    menuContent.appendChild(deleteBtn);
    menuBtn.appendChild(menuContent);
    li.appendChild(menuBtn);
    
    // Add completed bookmark to the page at correct position
    if (insertBefore) {
        bookmarkList.insertBefore(li, insertBefore);
    } else {
        bookmarkList.appendChild(li);
    }
}

// ============================================================================
// MENU MANAGEMENT
// ============================================================================
// Close all menus when clicking anywhere on the page
document.addEventListener('click', () => {
    document.querySelectorAll('.menuBtn').forEach(m => {
        m.classList.remove('active'); // Close all open menus
    });
});

// ============================================================================
// DRAG AND DROP FUNCTIONALITY
// ============================================================================
let draggedItem = null; // Track which item is being dragged

function setupDragEvents(item) {
    // ========== DRAG START ==========
    // When user starts dragging an item
    item.addEventListener('dragstart', function(e) {
        draggedItem = this; // Remember which item is being dragged
        
        // Make item semi-transparent (setTimeout ensures it shows)
        setTimeout(() => {
            this.style.opacity = '0.4';
        }, 0);
     });

     // ========== DRAG OVER ==========
     // When dragged item is over another item
     item.addEventListener('dragover', function(e) {
        e.preventDefault(); // Required to allow drop
        this.style.backgroundColor = 'rgba(255, 105, 180, 0.1)'; // Highlight drop target
     });

     // ========== DRAG LEAVE ==========
     // When dragged item leaves another item
     item.addEventListener('dragleave', function(e) {
        this.style.backgroundColor = ''; // Remove highlight
     });

     // ========== DROP ==========
     // When item is dropped on another item
     item.addEventListener('drop', function(e) {
        e.preventDefault(); // Required for drop to work
        this.style.backgroundColor = ''; // Remove highlight

        // Only proceed if dropping on a different item
        if (draggedItem !== this) {
            // Get all bookmarks as an array
            const items = [...bookmarkList.children];
            const draggedIndex = items.indexOf(draggedItem); // Position of dragged item
            const targetIndex = items.indexOf(this); // Position of drop target

            // ========== POSITION CALCULATION ==========
            // Determine where to insert based on direction of drag
            if (draggedIndex < targetIndex) {
                // Dragging DOWN: Insert AFTER target
                bookmarkList.insertBefore(draggedItem, this.nextSibling);
            } else {
                // Dragging UP: Insert BEFORE target
                bookmarkList.insertBefore(draggedItem, this);
            }

            // Save the new order to localStorage
            saveBookmarkOrder();
        }
     });

     // ========== DRAG END ==========
     // When dragging finishes
    item.addEventListener('dragend', function() {
        this.style.opacity = '1'; // Make opaque again
        this.style.backgroundColor = ''; // Clear any highlight
        draggedItem = null; // Reset dragged item
        
        // Clear highlights from all items
        document.querySelectorAll('#bookmark-list li').forEach(li => {
            li.style.backgroundColor = '';
        });
    });
}

// ============================================================================
// SAVE DRAG & DROP ORDER
// ============================================================================
function saveBookmarkOrder() {
    // Get current DOM order of bookmarks
    const items = [...bookmarkList.children];
    const bookmarks = getBookmarksFromStorage(); // Get data from localStorage

    // Create new array in current DOM order, preserving dateAdded
    const orderedBookmarks = items.map(item => {
        const link = item.querySelector('a'); // Get link element
        const tagSpan = item.querySelector('.tag-badge'); // Get tag element
        const name = link.textContent;
        const url = link.href;
        const tags = tagSpan ? tagSpan.textContent : '';
        const bid = item.getAttribute('data-id');
        
        // Find original bookmark to preserve dateAdded and id
        const original = bookmarks.find(b => String(b.id) === String(bid));

        return {
            id: bid,
            name: name, // Bookmark name
            url: url, // Bookmark URL
            tags: tags, // Tags or empty string
            dateAdded: original ? original.dateAdded : Date.now() // Preserve original date or use current
        };
    });

    // Save reordered bookmarks to localStorage
    localStorage.setItem('bookmarks', JSON.stringify(orderedBookmarks));
}

// ============================================================================
// LOCALSTORAGE FUNCTIONS - CRUD Operations
// ============================================================================

// UPDATE - Modify existing bookmark
function updateBookmark(id, newName, newURL, newTags) {
    let bookmarks = getBookmarksFromStorage();
    const index = bookmarks.findIndex(b => String(b.id) === String(id));
    
    if (index !== -1) { // If found
        bookmarks[index] = { // Update (preserve id and date)
            id: bookmarks[index].id,
            name: newName, 
            url: newURL, 
            tags: newTags,
            dateAdded: bookmarks[index].dateAdded // Keep original date
        };
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks)); // Save
    }
}

// CREATE - Save new bookmark
function saveBookmark(name, url, tags) {
    const bookmarks = getBookmarksFromStorage(); //Get array of bookmarks
    const id = Date.now().toString();
    const created = { 
        id,
        name, 
        url, 
        tags, 
        dateAdded: Date.now() // Add bookmark with timestamp
    };
    bookmarks.push(created);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks)); //Save bookmarks to local storage
    return created;
}

// READ - Load all bookmarks on page load
function loadBookmarks() {
    const bookmarks = getBookmarksFromStorage();
    // Sort by newest first when loading
    bookmarks.sort((a, b) => b.dateAdded - a.dateAdded);
    bookmarks.forEach(b => renderBookmark(b.name, b.url, b.tags, false, null, b.id));
}

// READ - Helper to get bookmarks from localStorage
function getBookmarksFromStorage() {
    const data = localStorage.getItem('bookmarks'); // Get raw string
    return data ? JSON.parse(data) : []; // Parse to array or return empty array
}

// DELETE - Remove bookmark
function deleteBookmark(id) {
    let bookmarks = getBookmarksFromStorage();
    // Filter out the bookmark to delete by id
    bookmarks = bookmarks.filter(b => String(b.id) !== String(id));
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks)); // Save updated list
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================
if (searchBar) {
    searchBar.addEventListener('keyup', function(e) {
        const term = e.target.value.toLowerCase(); // Get search term in lowercase
        const bookmarks = bookmarkList.getElementsByTagName('li'); // Get all bookmarks

        // Check each bookmark against search term
        Array.from(bookmarks).forEach(function(bookmark) {
            // Get text from name and tags
            const name = bookmark.querySelector('a') ? bookmark.querySelector('a').textContent : '';
            const tags = bookmark.querySelector('.tag-badge') ? bookmark.querySelector('.tag-badge').textContent : '';
            
            // Combine name and tags for searching
            const combinedText = (name + tags).toLowerCase();

            // Show/hide based on search match
            if (combinedText.indexOf(term) !== -1) {
                bookmark.style.display = 'flex'; // Show if matches
            } else {
                bookmark.style.display = 'none'; // Hide if no match
            }
        });
    });
}