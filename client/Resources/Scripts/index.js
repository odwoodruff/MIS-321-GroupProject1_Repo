// Configuration - Easy to change for production
const CONFIG = {
  API_BASE_URL: "http://localhost:5032/api/Book",
  USER_API_URL: "http://localhost:5032/api/User",
};

// Global state
let books = [];
let editingBookId = null;
let currentSearchTerm = "";
let currentUser = null;
let notifications = [];

// Main initialization
async function handleOnLoad() {
  console.log("Page loaded, initializing app...");
  try {
    // Check if user is logged in
    checkAuthStatus();
    await loadBooks();

    // Check if we're currently viewing notifications page
    const isViewingNotifications =
      localStorage.getItem("currentPage") === "notifications";

    if (isViewingNotifications) {
      // If viewing notifications, just update auth UI but don't render main app
      updateAuthUI();
      loadNotifications();
      renderNotificationsPage();
    } else {
      // Normal behavior - render main app
      renderApp();
      updateAuthUI();
    }

    setupAuthEventListeners();
    setupScrollBehavior();
  } catch (error) {
    console.error("Error during initialization:", error);
    // Render app even if books fail to load
    renderApp();
    // Update auth UI after rendering to ensure it persists
    updateAuthUI();
    setupAuthEventListeners();
    setupScrollBehavior();
  }
}

// Authentication Functions
function checkAuthStatus() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userMenu = document.getElementById("user-menu");
  const userName = document.getElementById("user-name");

  if (currentUser) {
    if (authButtons) authButtons.classList.add("d-none");
    if (userMenu) userMenu.classList.remove("d-none");
    if (userName) userName.textContent = currentUser.firstName;
  } else {
    if (authButtons) authButtons.classList.remove("d-none");
    if (userMenu) userMenu.classList.add("d-none");
  }
}

function setupAuthEventListeners() {
  // Login button
  document.getElementById("loginBtn").addEventListener("click", handleLogin);

  // Logout button
  document
    .getElementById("logout-link")
    .addEventListener("click", handleLogout);

  // Enter key handler
  document.getElementById("loginEmail").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });
}

function setupScrollBehavior() {
  let lastScrollTop = 0;
  const searchContainer = document.querySelector(".search-container");

  if (!searchContainer) return;

  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down - hide search bar
      searchContainer.classList.add("hidden");
    } else {
      // Scrolling up - show search bar
      searchContainer.classList.remove("hidden");
    }

    lastScrollTop = scrollTop;
  });
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();

  if (!email) {
    showAlert("Please enter your university email", "warning");
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    return;
  }

  // Validate email domain
  if (!email.endsWith("@crimson.ua.edu") && !email.endsWith("@ua.edu")) {
    showAlert(
      "Please use a valid University of Alabama email address (@crimson.ua.edu or @ua.edu)",
      "warning"
    );
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    return;
  }

  try {
    // For now, we'll create a simple user object based on the email
    // In a real app, you'd validate this with your backend
    const emailParts = email.split("@")[0];
    const firstName = emailParts.split(".")[0] || emailParts;

    currentUser = {
      id: Date.now(), // Simple ID generation
      firstName: firstName,
      lastName: "Student", // Default last name
      email: email,
      username: emailParts,
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    updateAuthUI();
    // Load notifications for the user
    loadNotifications();
    // Re-render the app to show edit/delete buttons for admin
    renderApp();
    showAlert("Login successful! Welcome to Roll Tide Books!", "success");
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    document.getElementById("loginForm").reset();
  } catch (error) {
    console.error("Login error:", error);
    showAlert("Login failed. Please try again.", "danger");
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  updateAuthUI();
  // Re-render the app to hide edit/delete buttons
  renderApp();
  showAlert("Logged out successfully", "info");
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer");
  const alertId = "alert-" + Date.now();

  const alertHTML = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  alertContainer.insertAdjacentHTML("beforeend", alertHTML);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
      alertElement.remove();
    }
  }, 5000);
}

// API Functions
async function loadBooks() {
  try {
    console.log("Loading books from:", CONFIG.API_BASE_URL);
    const url = currentSearchTerm
      ? `${CONFIG.API_BASE_URL}?search=${encodeURIComponent(currentSearchTerm)}`
      : CONFIG.API_BASE_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load books");
    books = await response.json();
    console.log("Books loaded:", books);
  } catch (error) {
    console.error("Error loading books:", error);
    // Set some sample data if API is not available
    books = [
      {
        id: 1,
        title: "Sample Book",
        author: "Sample Author",
        genre: "Fiction",
        year: 2023,
        description: "A sample book for testing",
        price: 25.0,
        condition: "Good",
        sellerName: "Sample Seller",
        sellerEmail: "sample@crimson.ua.edu",
        courseCode: "SAMPLE 101",
        professor: "Dr. Sample",
        isAvailable: true,
        datePosted: new Date().toISOString(),
      },
    ];
    showAlert(
      "API not available - showing sample data. Please start the API server.",
      "warning"
    );
  }
}

async function addBook(bookData) {
  try {
    const response = await fetch(CONFIG.API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookData),
    });

    if (!response.ok) throw new Error("Failed to add book");
    await loadBooks();
    renderApp();
    showAlert("Book added successfully!", "success");
  } catch (error) {
    console.error("Error adding book:", error);
    showAlert("Failed to add book", "danger");
  }
}

async function updateBook(id, bookData) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookData),
    });

    if (!response.ok) throw new Error("Failed to update book");
    await loadBooks();
    renderApp();
    showAlert("Book updated successfully!", "success");
  } catch (error) {
    console.error("Error updating book:", error);
    showAlert("Failed to update book", "danger");
  }
}

async function deleteBook(id) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete book");
    await loadBooks();
    renderApp();
    showAlert("Book deleted successfully!", "success");
  } catch (error) {
    console.error("Error deleting book:", error);
    showAlert("Failed to delete book", "danger");
  }
}

// UI Functions
function renderApp() {
  console.log("Rendering app with books:", books);
  const app = document.getElementById("app");
  if (!app) {
    console.error("App element not found!");
    return;
  }

  app.innerHTML = `
    <div class="container mt-4">
      <!-- Search and Filter -->
      <div class="search-container">
        <div class="row">
          <div class="col-md-8">
            <div class="input-group">
              <input type="text" class="form-control search-input" id="search-input" 
                     placeholder="Search by title, author, course, or professor..." 
                     value="${escapeHtml(currentSearchTerm)}"
                     onkeyup="handleSearch(event)">
              <button class="btn search-btn" onclick="handleSearch(event)">
                <i class="bi bi-search"></i> Search
              </button>
            </div>
          </div>
          <div class="col-md-4">
            <div class="d-flex gap-2">
              <select class="form-control" id="course-filter" onchange="filterByCourse()">
                <option value="">All Courses</option>
                ${getUniqueCourses()
                  .map(
                    (course) => `<option value="${course}">${course}</option>`
                  )
                  .join("")}
              </select>
              <button class="btn btn-outline-crimson" onclick="showAddBookForm()">
                <i class="bi bi-plus-circle"></i> Sell Book
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div id="alert-container"></div>
      
      <div id="book-form-container" class="mb-4" style="display: none;">
        ${renderBookForm()}
      </div>
      
      <div id="books-container">
        ${renderBooks()}
      </div>
    </div>
  `;
}

function renderBooks() {
  if (books.length === 0) {
    return `
      <div class="text-center py-5">
        <i class="bi bi-book display-1 text-muted"></i>
        <h3 class="text-muted mt-3">No books found</h3>
        <p class="text-muted">${
          currentSearchTerm ? "Try a different search term or " : ""
        }Be the first to sell a book!</p>
      </div>
    `;
  }

  return `
    <div class="container-fluid px-0">
      ${books
        .map(
          (book) => `
        <div class="book-card">
          <div class="book-icon"></div>
          <div class="book-info">
            <div class="book-details">
              <h5 class="book-title">${escapeHtml(book.title)}</h5>
              <p class="book-author">
                <i class="bi bi-pencil"></i> <strong>Author:</strong> ${escapeHtml(
                  book.author
                )}
              </p>
              <div class="book-meta">
                <span><i class="bi bi-bookmark"></i> ${
                  book.courseCode || "N/A"
                }</span>
                <span><i class="bi bi-person-badge"></i> ${escapeHtml(
                  book.professor || "N/A"
                )}</span>
                <span><i class="bi bi-person-circle"></i> <strong>Sold by:</strong> ${escapeHtml(
                  book.sellerName || "Unknown"
                )}</span>
              </div>
            </div>
            <div class="book-price">$${(book.price || 0).toFixed(2)}</div>
            <div class="book-condition">${book.condition || "Unknown"}</div>
            <div class="book-actions">
              <button class="btn btn-crimson btn-sm" onclick="contactSeller(${
                book.id
              })">
                <i class="bi bi-envelope"></i> Contact
              </button>
              ${
                canEditBook(book)
                  ? `
                <button class="btn btn-outline-crimson btn-sm" onclick="editBook(${
                  book.id
                })">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="confirmDelete(${
                  book.id
                }, '${escapeHtml(book.title)}')">
                  <i class="bi bi-trash"></i>
                </button>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function renderBookForm() {
  const book = editingBookId ? books.find((b) => b.id === editingBookId) : null;

  return `
    <div class="form-container">
      <div class="form-header">
        <h5 class="mb-0">
          <i class="bi bi-${editingBookId ? "pencil" : "plus-circle"}"></i>
          ${editingBookId ? "Edit Book Listing" : "Sell Your Book"}
        </h5>
      </div>
      <div class="card-body">
        <form id="book-form" onsubmit="handleBookSubmit(event)">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="book-title" class="form-label">Book Title *</label>
              <input type="text" class="form-control" id="book-title" required 
                     value="${book ? escapeHtml(book.title) : ""}">
            </div>
            <div class="col-md-6 mb-3">
              <label for="book-author" class="form-label">Author *</label>
              <input type="text" class="form-control" id="book-author" required 
                     value="${book ? escapeHtml(book.author) : ""}">
            </div>
          </div>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label for="book-price" class="form-label">Price ($) *</label>
              <input type="number" class="form-control" id="book-price" step="0.01" min="0" required
                     value="${book ? book.price : ""}">
            </div>
            <div class="col-md-4 mb-3">
              <label for="book-condition" class="form-label">Condition *</label>
              <select class="form-control" id="book-condition" required>
                <option value="Excellent" ${
                  book && book.condition === "Excellent" ? "selected" : ""
                }>Excellent</option>
                <option value="Good" ${
                  book && book.condition === "Good" ? "selected" : ""
                }>Good</option>
                <option value="Fair" ${
                  book && book.condition === "Fair" ? "selected" : ""
                }>Fair</option>
                <option value="Poor" ${
                  book && book.condition === "Poor" ? "selected" : ""
                }>Poor</option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label for="book-year" class="form-label">Year</label>
              <input type="number" class="form-control" id="book-year" min="1000" max="2025"
                     value="${book ? book.year : ""}">
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="book-course" class="form-label">Course Code</label>
              <input type="text" class="form-control" id="book-course" placeholder="e.g., MATH 125"
                     value="${book ? escapeHtml(book.courseCode) : ""}">
            </div>
            <div class="col-md-6 mb-3">
              <label for="book-professor" class="form-label">Professor</label>
              <input type="text" class="form-control" id="book-professor" placeholder="e.g., Dr. Smith"
                     value="${book ? escapeHtml(book.professor) : ""}">
            </div>
          </div>
          <div class="mb-3">
            <label for="book-description" class="form-label">Description</label>
            <textarea class="form-control" id="book-description" rows="3" 
                      placeholder="Describe the book's condition, any notes, etc.">${
                        book ? escapeHtml(book.description) : ""
                      }</textarea>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-crimson">
              <i class="bi bi-check-circle"></i> ${
                editingBookId ? "Update Listing" : "List Book"
              }
            </button>
            <button type="button" class="btn btn-outline-crimson" onclick="hideBookForm()">
              <i class="bi bi-x-circle"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Event Handlers
function showAddBookForm() {
  editingBookId = null;
  document.getElementById("book-form-container").style.display = "block";
  document.getElementById("book-title").focus();
}

function editBook(id) {
  editingBookId = id;
  document.getElementById("book-form-container").style.display = "block";
  document.getElementById("book-title").focus();
}

function hideBookForm() {
  editingBookId = null;
  document.getElementById("book-form-container").style.display = "none";
  document.getElementById("book-form").reset();
}

async function handleBookSubmit(event) {
  event.preventDefault();

  // Check if user is logged in
  if (!currentUser) {
    showAlert("Please sign in to list a book", "warning");
    return;
  }

  const title = document.getElementById("book-title").value.trim();
  const author = document.getElementById("book-author").value.trim();
  const price = parseFloat(document.getElementById("book-price").value) || 0;
  const condition = document.getElementById("book-condition").value;
  const year =
    parseInt(document.getElementById("book-year").value) ||
    new Date().getFullYear();
  const courseCode = document.getElementById("book-course").value.trim();
  const professor = document.getElementById("book-professor").value.trim();
  const description = document.getElementById("book-description").value.trim();

  if (!title || !author || !price || !condition) {
    showAlert("Please fill in all required fields", "warning");
    return;
  }

  // Use current user's information
  const sellerName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "Unknown";
  const sellerEmail = currentUser ? currentUser.email : "";

  const bookData = {
    title,
    author,
    price,
    condition,
    year,
    courseCode,
    professor,
    sellerName,
    sellerEmail,
    description,
    genre: "Textbook",
    isAvailable: true,
    datePosted: new Date().toISOString(),
  };

  if (editingBookId) {
    await updateBook(editingBookId, bookData);
  } else {
    await addBook(bookData);
  }

  hideBookForm();
  renderApp();
}

function confirmDelete(id, title) {
  if (confirm(`Are you sure you want to delete "${title}"?`)) {
    deleteBook(id);
  }
}

async function handleSearch(event) {
  if (event.key === "Enter" || event.type === "click") {
    currentSearchTerm = document.getElementById("search-input").value.trim();
    await loadBooks();
    renderApp();
  }
}

async function clearSearch() {
  currentSearchTerm = "";
  document.getElementById("search-input").value = "";
  await loadBooks();
  renderApp();
}

function filterByCourse() {
  const courseFilter = document.getElementById("course-filter").value;
  if (courseFilter) {
    const filteredBooks = books.filter(
      (book) => book.courseCode === courseFilter
    );
    books.splice(0, books.length, ...filteredBooks);
  } else {
    loadBooks();
  }
  renderApp();
}

function getUniqueCourses() {
  return [
    ...new Set(books.map((book) => book.courseCode).filter((code) => code)),
  ];
}

function getConditionColor(condition) {
  if (!condition) return "secondary";

  switch (condition.toLowerCase()) {
    case "excellent":
      return "success";
    case "good":
      return "primary";
    case "fair":
      return "warning";
    case "poor":
      return "danger";
    default:
      return "secondary";
  }
}

function contactSeller(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (book) {
    // Check if user is logged in
    if (!currentUser) {
      showAlert("Please sign in to contact the seller", "warning");
      return;
    }

    // Create notification for the seller
    const notification = {
      id: Date.now(),
      sellerEmail: book.sellerEmail,
      buyerName: currentUser.firstName,
      buyerEmail: currentUser.email,
      bookTitle: book.title,
      bookPrice: book.price,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Store notification using text-delimited storage
    addNotification(notification);

    // Show confirmation to buyer
    showAlert(
      `Interest sent to ${book.sellerName}! They'll be notified about your interest in "${book.title}".`,
      "success"
    );
  }
}

// Utility Functions
function canEditBook(book) {
  // If no user is logged in, they can't edit any book
  if (!currentUser) {
    return false;
  }

  // Admin user can edit any book
  if (currentUser.email === "ccsmith33@crimson.ua.edu") {
    return true;
  }

  // Regular users can only edit books they created
  return book.sellerEmail === currentUser.email;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) {
    console.warn("Alert container not found, cannot show alert:", message);
    return;
  }

  const alertId = "alert-" + Date.now();

  alertContainer.innerHTML = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 5000);
}

// Text-delimited storage functions
function addNotification(notification) {
  const notificationLine = `${notification.id}|${notification.sellerEmail}|${notification.buyerName}|${notification.buyerEmail}|${notification.bookTitle}|${notification.bookPrice}|${notification.timestamp}|${notification.read}`;

  // Get existing notifications
  const existingData = localStorage.getItem("notifications_data") || "";
  const newData = existingData
    ? existingData + "\n" + notificationLine
    : notificationLine;

  localStorage.setItem("notifications_data", newData);
}

function getNotificationsForUser(userEmail) {
  const data = localStorage.getItem("notifications_data") || "";
  if (!data) return [];

  const lines = data.split("\n").filter((line) => line.trim());
  const notifications = [];

  for (const line of lines) {
    const parts = line.split("|");
    if (parts.length >= 8 && parts[1] === userEmail) {
      notifications.push({
        id: parseInt(parts[0]),
        sellerEmail: parts[1],
        buyerName: parts[2],
        buyerEmail: parts[3],
        bookTitle: parts[4],
        bookPrice: parseFloat(parts[5]),
        timestamp: parts[6],
        read: parts[7] === "true",
      });
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function markNotificationAsRead(notificationId) {
  const data = localStorage.getItem("notifications_data") || "";
  if (!data) return;

  const lines = data.split("\n");
  const updatedLines = lines.map((line) => {
    const parts = line.split("|");
    if (parts.length >= 8 && parseInt(parts[0]) === notificationId) {
      parts[7] = "true";
      return parts.join("|");
    }
    return line;
  });

  localStorage.setItem("notifications_data", updatedLines.join("\n"));

  // Reload notifications and refresh the page
  loadNotifications();
  renderNotificationsPage();
}

function loadNotifications() {
  if (!currentUser) {
    notifications = [];
    return;
  }

  notifications = getNotificationsForUser(currentUser.email);
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const notificationLink = document.querySelector('a[href="#"]:has(.bi-bell)');

  if (notificationLink) {
    if (unreadCount > 0) {
      notificationLink.innerHTML = `<i class="bi bi-bell-fill"></i> Notifications <span class="badge bg-danger">${unreadCount}</span>`;
    } else {
      notificationLink.innerHTML = `<i class="bi bi-bell"></i> Notifications`;
    }
  }
}

function showNotifications() {
  if (!currentUser) {
    showAlert("Please sign in to view notifications", "warning");
    return;
  }

  // Set page state and render notifications page
  localStorage.setItem("currentPage", "notifications");
  renderNotificationsPage();
}

function goBackToBooks() {
  localStorage.removeItem("currentPage");
  renderApp();
}

function renderNotificationsPage() {
  const app = document.getElementById("app");
  if (!app) return;

  if (notifications.length === 0) {
    app.innerHTML = `
      <div class="container mt-4">
        <div class="row">
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-bell display-1 text-muted"></i>
              <h3 class="text-muted mt-3">No notifications yet</h3>
              <p class="text-muted">When someone shows interest in your books, you'll see notifications here.</p>
              <button class="btn btn-crimson" onclick="renderApp()">
                <i class="bi bi-arrow-left"></i> Back to Books
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const notificationList = notifications
    .map(
      (notification) => `
    <div class="notification-item ${
      notification.read ? "read" : "unread"
    }" onclick="markNotificationAsRead(${notification.id})">
      <div class="notification-content">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>${
              notification.buyerName
            }</strong> is interested in your book "<strong>${
        notification.bookTitle
      }</strong>" ($${notification.bookPrice})
            <br>
            <small class="text-muted">Contact them at: ${
              notification.buyerEmail
            }</small>
            <br>
            <small class="text-muted">${new Date(
              notification.timestamp
            ).toLocaleString()}</small>
          </div>
          <div>
            ${
              !notification.read
                ? '<span class="badge bg-danger">New</span>'
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-bell"></i> Your Notifications</h2>
            <button class="btn btn-outline-crimson" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          <div class="notifications-container">
            ${notificationList}
          </div>
        </div>
      </div>
    </div>
  `;
}
