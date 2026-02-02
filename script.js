const bookmarkName = document.getElementById('bookmark-id');
const bookmarkTags = document.getElementById('bookmark-tags');
const bookmarkURL = document.getElementById('bookmark-url');
const addBookmarkBtn = document.getElementById('add-bookmark');
const bookmarkList = document.getElementById('bookmark-list');

document.addEventListener('DOMContentLoaded', loadBookmarks);

addBookmarkBtn.addEventListener('click', function() {
    const name = bookmarkName.value.trim();
    const url = bookmarkURL.value.trim();
    const tags = bookmarkTags.value.trim();

    if (!name || !url) return alert('Fill in name and URL');
    if (!url.startsWith('http')) return alert('Valid URL required');

    renderBookmark(name, url, tags);
    saveBookmark(name, url, tags);

    bookmarkName.value = '';
    bookmarkURL.value = '';
    bookmarkTags.value = '';
});

function renderBookmark(name, url, tags, isEditing = false) {
     // If editing mode, show edit form directly
    if (isEditing) {
        const li = document.createElement('li');
        li.className = 'editing';
        li.innerHTML = `
            <div class="edit-form">
                <input type="text" value="${name}" class="edit-name" placeholder="Bookmark Name">
                <input type="text" value="${url}" class="edit-url" placeholder="URL">
                <input type="text" value="${tags}" class="edit-tags" placeholder="Tags (comma separated)">
                <div class="edit-buttons">
                    <button class="save-edit">Save</button>
                    <button class="cancel-edit">Cancel</button>
                </div>
            </div>
        `;
        
        bookmarkList.appendChild(li);
        
        // Save button handler
        li.querySelector('.save-edit').addEventListener('click', function() {
            const newName = li.querySelector('.edit-name').value.trim();
            const newURL = li.querySelector('.edit-url').value.trim();
            const newTags = li.querySelector('.edit-tags').value.trim();
            
            if (!newName || !newURL) return alert('Fill in name and URL');
            if (!newURL.startsWith('http')) return alert('Valid URL required');
            
            // Update in localStorage
            updateBookmark(name, url, newName, newURL, newTags);
            
            // Remove edit form and render updated bookmark
            li.remove();
            renderBookmark(newName, newURL, newTags);
        });
        
        // Cancel button handler
        li.querySelector('.cancel-edit').addEventListener('click', function() {
            li.remove();
            // Only re-render if we have original values (not for new edits)
            if (name && url) {
                renderBookmark(name, url, tags);
            }
        });
        
        return;
    }
    
    // NORMAL BOOKMARK RENDERING (Your original code with fixes)
    const li = document.createElement('li');
    li.draggable = true;
    li.setAttribute('data-id', Date.now());
    const a = document.createElement('a');
    a.href = url;
    a.textContent = name;
    a.target = '_blank';
    
    li.appendChild(a);

    // Optional Tags - FIXED: Added sub-header style
    if (tags) {
        const span = document.createElement('span');
        span.textContent = tags;
        span.className = 'tag-badge'; 
        li.appendChild(span);
    }

    // Menu Button ☰
    const menuBtn = document.createElement('div');
    menuBtn.className = 'menuBtn';
    menuBtn.textContent = '☰';

    // Menu Box
    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'editBtn';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'deleteBtn';

    // Menu Button Functionality
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isActive = menuBtn.classList.contains('active');
        
        document.querySelectorAll('.menuBtn').forEach(m => m.classList.remove('active'));
        
        if (!isActive) menuBtn.classList.add('active');
    });

    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        li.remove();
        deleteBookmark(name, url);
    });

    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        menuBtn.classList.remove('active');
        
        // Replace entire bookmark with edit form
        li.remove();
        renderBookmark(name, url, tags, true); // true = editing mode
    });

    setupDragEvents(li);

    menuContent.appendChild(editBtn);
    menuContent.appendChild(deleteBtn);
    menuBtn.appendChild(menuContent);
    li.appendChild(menuBtn);
    bookmarkList.appendChild(li);
}

// Close menus when clicking background
document.addEventListener('click', () => {
    document.querySelectorAll('.menuBtn').forEach(m => m.classList.remove('active'));
});

//FOR DRAG AND DROP
let draggedItem = null;

function setupDragEvents(item) {

    //When dragging starts
    item.addEventListener('dragstart', function(e) {
        draggedItem = this;
        setTimeout(() => {
            this.style.opacity = '0.4';
        }, 0);
     });

     //When dragging over another item
     item.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.backgroundColor = 'rgba(255, 105, 180, 0.1)';
     });

     //When leaving another item
     item.addEventListener('dragleave', function(e) {
        this.style.backgroundColor = '';
     });

     //When dropping on another item
     item.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.backgroundColor = '';

        if (draggedItem !== this) {
            // Get all bookmarks
            const items = [...bookmarkList.children];
            const draggedIndex = items.indexOf(draggedItem);
            const targetIndex = items.indexOf(this);

            //Swap positions
            if (draggedIndex < targetIndex) {
                bookmarkList.insertBefore(draggedItem, this.nextSibling);
            } else {
                bookmarkList.insertBefore(draggedItem, this);
            }

            //Save new order to localStorage
            saveBookmarkOrder();
        }
     });

      // When drag ends
    item.addEventListener('dragend', function() {
        this.style.opacity = '1';
        this.style.backgroundColor = '';
        draggedItem = null;
        
        // Remove hover effects from all items
        document.querySelectorAll('#bookmark-list li').forEach(li => {
            li.style.backgroundColor = '';
        });
    });
}

function saveBookmarkOrder() {
    const items = [...bookmarkList.children];
    const bookmarks = getBookmarksFromStorage();

    const orderedBookmarks = items.map(item => {
        const link = item.querySelector('a');
        const tagSpan = item.querySelector('.tag-badge');   

        return {
            name: link.textContent,
            url: link.href,
            tags: tagSpan ? tagSpan.textContent : ''
        };
    });

    localStorage.setItem('bookmarks', JSON.stringify(orderedBookmarks));
}

function updateBookmark(oldName, oldURL, newName, newURL, newTags) {
    let bookmarks = getBookmarksFromStorage();
    const index = bookmarks.findIndex(b => b.name === oldName && b.url === oldURL);
    if (index !== -1) {
        bookmarks[index] = { name: newName, url: newURL, tags: newTags };
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
}

function saveBookmark(name, url, tags) {
    const bookmarks = getBookmarksFromStorage();
    bookmarks.push({ name, url, tags });
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

function loadBookmarks() {
    const bookmarks = getBookmarksFromStorage();
    bookmarks.forEach(b => renderBookmark(b.name, b.url, b.tags));
}

function getBookmarksFromStorage() {
    const data = localStorage.getItem('bookmarks');
    return data ? JSON.parse(data) : [];
}

function deleteBookmark(name, url) {
    let bookmarks = getBookmarksFromStorage();
    bookmarks = bookmarks.filter(b => b.name !== name || b.url !== url);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}