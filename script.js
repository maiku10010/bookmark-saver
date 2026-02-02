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

function renderBookmark(name, url, tags) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.textContent = name;
    a.target = '_blank';
    
    li.appendChild(a);

    // Optional Tags
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
    
    // Toggle only this menu and close others
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevents document click from closing it immediately
        const isActive = menuBtn.classList.contains('active');
        
        // Close all other menus first
        document.querySelectorAll('.menuBtn').forEach(m => m.classList.remove('active'));
        
        // Open this one if it wasn't already
        if (!isActive) menuBtn.classList.add('active');
    });

    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        li.remove();
        deleteBookmark(name, url);
    });

    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // Placeholder for edit
        menuBtn.classList.remove('active');
    });


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