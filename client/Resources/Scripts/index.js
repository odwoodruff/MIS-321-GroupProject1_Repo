// Configuration - Dynamic port detection
let CONFIG = {
  API_BASE_URL: "http://localhost:5032/api/Book",
  USER_API_URL: "http://localhost:5032/api/User",
  RATING_API_URL: "http://localhost:5032/api/Book",
  AUTH_API_URL: "http://localhost:5032/api/Auth",
  DEV_API_URL: "http://localhost:5032/api/Dev",
};

// Function to update config with actual port
async function updateConfigWithPort() {
  try {
    // Try to get port from API, fallback to 5032
    const response = await fetch("http://localhost:5032/api/config/port");
    if (response.ok) {
      const data = await response.json();
      const port = data.port;
      CONFIG.API_BASE_URL = `http://localhost:${port}/api/Book`;
      CONFIG.USER_API_URL = `http://localhost:${port}/api/User`;
      CONFIG.RATING_API_URL = `http://localhost:${port}/api/Book`;
      CONFIG.AUTH_API_URL = `http://localhost:${port}/api/Auth`;
      CONFIG.DEV_API_URL = `http://localhost:${port}/api/Dev`;
      console.log(`Updated API URLs to use port: ${port}`);
    }
  } catch (error) {
    console.log("Using default port 5032");
  }
}

// Helper function to get headers with JWT token
function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
}

// Helper function to get user ID by email
async function getUserIdByEmail(email) {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/existing-users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error("Failed to fetch users");
      return null;
    }

    const users = await response.json();
    const user = users.find((u) => u.email === email);
    return user ? user.id : null;
  } catch (error) {
    console.error("Error looking up user by email:", error);
    return null;
  }
}

// Global state
let books = [];
let editingBookId = null;
let currentSearchTerm = "";
let currentUser = null;
let authToken = null; // JWT token for authentication
let notifications = [];
let ratings = [];
let contactedSellers = new Set(); // Track which sellers the user has contacted

// Main initialization
async function handleOnLoad() {
  console.log("Page loaded, initializing app...");
  try {
    // Update config with actual port first
    await updateConfigWithPort();

    // Check if user is logged in
    checkAuthStatus();
    await loadBooks();
    await loadRatings();
    loadContactedSellers();

    // Check if we're currently viewing a specific page
    const currentPage = localStorage.getItem("currentPage");

    if (currentPage === "notifications") {
      // If viewing notifications, just update auth UI but don't render main app
      updateAuthUI();
      loadNotifications();
      renderNotificationsPage();
    } else if (currentPage === "adminPanel") {
      // If viewing admin panel
      updateAuthUI();
      renderAdminPanel();
    } else {
      // Normal behavior - render main app
      renderApp();
      updateAuthUI();
    }

    setupAuthEventListeners();
    setupScrollBehavior();

    // Add development helper if in development mode
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      addDevelopmentHelper();
    }
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
  const savedToken = localStorage.getItem("authToken");

  if (savedUser && savedToken) {
    currentUser = JSON.parse(savedUser);
    authToken = savedToken;
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userMenu = document.getElementById("user-menu");
  const userName = document.getElementById("user-name");
  const adminPanelLink = document.getElementById("admin-panel-link");

  if (currentUser) {
    if (authButtons) authButtons.classList.add("d-none");
    if (userMenu) userMenu.classList.remove("d-none");
    if (userName) userName.textContent = currentUser.firstName;

    // Show admin menu items for admin users
    if (isAdmin() && adminPanelLink) {
      adminPanelLink.classList.remove("d-none");
    } else if (adminPanelLink) {
      adminPanelLink.classList.add("d-none");
    }
  } else {
    if (authButtons) authButtons.classList.remove("d-none");
    if (userMenu) userMenu.classList.add("d-none");
    if (adminPanelLink) adminPanelLink.classList.add("d-none");
  }
}

function setupAuthEventListeners() {
  // Login form submission
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission
    handleLogin();
  });

  // Login button (backup)
  document.getElementById("loginBtn").addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default button behavior
    handleLogin();
  });

  // Logout button
  document
    .getElementById("logout-link")
    .addEventListener("click", handleLogout);
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
    // Send verification code
    const response = await fetch(`${CONFIG.AUTH_API_URL}/send-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      showVerificationModal(email, result.verificationCode);
      showAlert("Verification code sent to your email", "success");
    } else {
      showAlert(result.message || "Failed to send verification code", "danger");
    }
  } catch (error) {
    console.error("Login error:", error);
    showAlert("Login failed. Please try again.", "danger");
  }
}

function showVerificationModal(email, verificationCode = null) {
  // Hide login modal
  bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();

  // Create verification modal
  const modalHtml = `
    <div class="modal fade" id="verificationModal" tabindex="-1" aria-labelledby="verificationModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="verificationModalLabel">Verify Your Email</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>We've sent a 6-digit verification code to <strong>${email}</strong></p>
            ${
              verificationCode
                ? `
              <div class="alert alert-info">
                <strong>Development Mode:</strong> Your verification code is <code>${verificationCode}</code>
              </div>
            `
                : ""
            }
              <div class="mb-3">
                <label for="verificationCode" class="form-label">Verification Code</label>
                <input type="text" class="form-control" id="verificationCode" 
                       placeholder="Enter 6-digit code" maxlength="6" pattern="[0-9]{6}">
              </div>
            <div class="text-center">
              <button type="button" class="btn btn-outline-secondary" onclick="resendVerificationCode('${email}')">
                Resend Code
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="verifyEmailCode('${email}')">Verify</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("verificationModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("verificationModal")
  );
  modal.show();
}

async function resendVerificationCode(email) {
  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/send-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      showAlert("Verification code resent", "success");
    } else {
      showAlert(
        result.message || "Failed to resend verification code",
        "danger"
      );
    }
  } catch (error) {
    console.error("Resend error:", error);
    showAlert("Failed to resend verification code", "danger");
  }
}

async function verifyEmailCode(email) {
  const code = document.getElementById("verificationCode").value.trim();

  if (!code || code.length !== 6) {
    showAlert("Please enter a valid 6-digit verification code", "warning");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();

    if (response.ok) {
      // Store user data and JWT token
      currentUser = result.user;
      authToken = result.token;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("authToken", authToken);

      // Update UI
      updateAuthUI();
      loadNotifications();
      loadContactedSellers();
      await loadBooks();
      renderApp();

      // Hide verification modal
      bootstrap.Modal.getInstance(
        document.getElementById("verificationModal")
      ).hide();

      showAlert("Email verified! Welcome to Roll Tide Books!", "success");

      // Refresh the page after successful verification
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showAlert(result.message || "Invalid verification code", "danger");
    }
  } catch (error) {
    console.error("Verification error:", error);
    showAlert("Verification failed. Please try again.", "danger");
  }
}

function handleLogout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("authToken");
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
  // Don't load books if user is not authenticated
  if (!authToken) {
    books = [];
    return;
  }

  try {
    console.log("Loading books from:", CONFIG.API_BASE_URL);
    const url = currentSearchTerm
      ? `${CONFIG.API_BASE_URL}?search=${encodeURIComponent(currentSearchTerm)}`
      : CONFIG.API_BASE_URL;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        "API Error:",
        response.status,
        response.statusText,
        "URL:",
        url
      );
      throw new Error(
        `Failed to load books: ${response.status} ${response.statusText}`
      );
    }
    books = await response.json();
    console.log("Books loaded:", books);
  } catch (error) {
    console.error("Error loading books:", error);
    books = [];
    showAlert(
      "Failed to load books. Please check if the API server is running.",
      "danger"
    );
  }
}

async function addBook(bookData) {
  try {
    const response = await fetch(CONFIG.API_BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        showAlert("Please sign in to add a book", "warning");
        return;
      }
      throw new Error("Failed to add book");
    }
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
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        showAlert("Please sign in to update a book", "warning");
        return;
      }
      throw new Error("Failed to update book");
    }
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
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        showAlert("Please sign in to delete a book", "warning");
        return;
      }
      throw new Error("Failed to delete book");
    }
    await loadBooks();
    renderApp();
    showAlert("Book deleted successfully!", "success");
  } catch (error) {
    console.error("Error deleting book:", error);
    showAlert("Failed to delete book", "danger");
  }
}

// Rating Functions
async function loadRatings() {
  try {
    if (!currentUser) return;

    // For now, skip loading user-specific ratings since we don't have proper user IDs
    // Just load all ratings if admin
    if (isAdmin()) {
      await loadAllRatings();
    } else {
      // For regular users, just initialize empty ratings array
      ratings = [];
    }
  } catch (error) {
    console.error("Error loading ratings:", error);
    ratings = [];
  }
}

async function loadAllRatings() {
  try {
    const response = await fetch(`${CONFIG.RATING_API_URL}/ratings/all`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const allRatings = await response.json();
      console.log("Raw ratings from API:", allRatings); // Debug log

      // Replace existing ratings with all ratings for admin
      ratings = allRatings || [];
      console.log("Admin: Loaded all ratings", allRatings.length);
      console.log("Current ratings array:", ratings); // Debug log

      // Update the ratings list in the admin panel
      renderRatingsInAdminPanel();
    } else {
      console.error(
        "Failed to load ratings:",
        response.status,
        response.statusText
      );
      ratings = []; // Set empty array if API fails
      showAlert("Failed to load ratings", "danger");
    }
  } catch (error) {
    console.error("Error loading all ratings:", error);
    ratings = []; // Set empty array if error occurs
    showAlert("Error loading ratings", "danger");
  }
}

function renderRatingsInAdminPanel() {
  const ratingsList = document.getElementById("ratingsList");
  if (!ratingsList) return;

  if (ratings.length === 0) {
    ratingsList.innerHTML = '<p class="text-muted">No ratings found</p>';
    return;
  }

  const ratingListHTML = ratings
    .map(
      (rating) => `
    <div class="rating-item">
      <div class="rating-content">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-2">
              <strong>Rating ID: ${rating.id}</strong>
              <span class="badge bg-primary ms-2">${rating.score}/5 stars</span>
            </div>
            <div class="rating-details">
              <p class="mb-1"><strong>Rater:</strong> User ID ${
                rating.raterId
              }</p>
              <p class="mb-1"><strong>Rated User:</strong> User ID ${
                rating.ratedUserId
              }</p>
              <p class="mb-1"><strong>Book ID:</strong> ${rating.bookId}</p>
              <p class="mb-1"><strong>Date:</strong> ${new Date(
                rating.dateCreated
              ).toLocaleString()}</p>
              ${
                rating.comment
                  ? `<p class="mb-1"><strong>Comment:</strong> ${escapeHtml(
                      rating.comment
                    )}</p>`
                  : ""
              }
            </div>
            <div class="rating-stars mb-2">
              ${renderStarRating(rating.score)}
            </div>
          </div>
          <div class="rating-actions">
            <button class="btn btn-outline-primary btn-sm" onclick="editRating(${
              rating.id
            })">
              <i class="bi bi-pencil"></i> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  ratingsList.innerHTML = ratingListHTML;
}

function loadContactedSellers() {
  if (!currentUser) return;

  const contactedData = localStorage.getItem(
    `contactedSellers_${currentUser.email}`
  );
  if (contactedData) {
    contactedSellers = new Set(JSON.parse(contactedData));
  }
}

function saveContactedSellers() {
  if (!currentUser) return;

  localStorage.setItem(
    `contactedSellers_${currentUser.email}`,
    JSON.stringify([...contactedSellers])
  );
}

async function submitRating(ratedUserId, bookId, score, comment = "") {
  try {
    console.log("Rating request:", {
      ratedUserId,
      bookId,
      score,
      comment,
      currentUser: currentUser,
    });

    const response = await fetch(`${CONFIG.RATING_API_URL}/rate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        RatedUserId: ratedUserId,
        BookId: bookId,
        Score: score,
        Comment: comment,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const rating = await response.json();
    showAlert("Rating submitted successfully!", "success");
    return rating;
  } catch (error) {
    console.error("Error submitting rating:", error);
    showAlert("Failed to submit rating: " + error.message, "danger");
    return null;
  }
}

async function showRatingModal(bookId, sellerName, sellerEmail) {
  if (!currentUser) {
    showAlert("Please sign in to rate a seller", "warning");
    return;
  }

  // Check if user has contacted this seller
  if (!contactedSellers.has(sellerEmail)) {
    showAlert(
      "You must contact the seller first before you can rate them",
      "warning"
    );
    return;
  }

  // Get the seller's user ID by looking up their email
  const sellerUserId = await getUserIdByEmail(sellerEmail);

  if (!sellerUserId) {
    showAlert("Cannot rate this seller - seller account not found", "warning");
    return;
  }

  const modalHTML = `
    <div class="modal fade" id="ratingModal" tabindex="-1" aria-labelledby="ratingModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ratingModalLabel">Rate ${sellerName}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="ratingForm">
              <div class="mb-3">
                <label class="form-label">Rating (1-5 stars)</label>
                <div class="rating-input">
                  <div class="star-rating" id="starRating">
                    <i class="bi bi-star" data-rating="1"></i>
                    <i class="bi bi-star" data-rating="2"></i>
                    <i class="bi bi-star" data-rating="3"></i>
                    <i class="bi bi-star" data-rating="4"></i>
                    <i class="bi bi-star" data-rating="5"></i>
                  </div>
                  <input type="hidden" id="ratingScore" value="0">
                </div>
              </div>
              <div class="mb-3">
                <label for="ratingComment" class="form-label">Comment (optional)</label>
                <textarea class="form-control" id="ratingComment" rows="3" placeholder="Share your experience..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="handleRatingSubmit(${bookId}, ${sellerUserId})">Submit Rating</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("ratingModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("ratingModal"));
  modal.show();

  // Setup star rating interaction
  setupStarRating();
}

function setupStarRating() {
  const stars = document.querySelectorAll("#starRating .bi-star");
  const scoreInput = document.getElementById("ratingScore");

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const rating = index + 1;
      scoreInput.value = rating;

      // Update star display
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });

    star.addEventListener("mouseenter", () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });
  });

  // Reset on mouse leave
  document.getElementById("starRating").addEventListener("mouseleave", () => {
    const currentRating = parseInt(scoreInput.value) || 0;
    stars.forEach((s, i) => {
      if (i < currentRating) {
        s.className = "bi bi-star-fill text-warning";
      } else {
        s.className = "bi bi-star text-muted";
      }
    });
  });
}

async function handleRatingSubmit(bookId, sellerUserId) {
  const score = parseInt(document.getElementById("ratingScore").value);
  const comment = document.getElementById("ratingComment").value.trim();

  if (score < 1 || score > 5) {
    showAlert("Please select a rating between 1 and 5 stars", "warning");
    return;
  }

  // Check if user is trying to rate themselves
  if (currentUser && currentUser.id === sellerUserId) {
    showAlert("You cannot rate yourself", "warning");
    return;
  }

  const rating = await submitRating(sellerUserId, bookId, score, comment);

  if (rating) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("ratingModal")
    );
    modal.hide();

    // Remove modal from DOM
    document.getElementById("ratingModal").remove();
  }
}

function renderStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHTML = "";

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="bi bi-star-fill text-warning"></i>';
  }

  // Half star
  if (hasHalfStar) {
    starsHTML += '<i class="bi bi-star-half text-warning"></i>';
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="bi bi-star text-muted"></i>';
  }

  return starsHTML;
}

// Admin Rating Management Functions
async function updateRating(ratingId, score, comment = "") {
  try {
    const response = await fetch(
      `${CONFIG.RATING_API_URL}/ratings/${ratingId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: score,
          comment: comment,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    showAlert("Rating updated successfully!", "success");
    await loadRatings(); // Reload ratings
    return true;
  } catch (error) {
    console.error("Error updating rating:", error);
    showAlert("Failed to update rating: " + error.message, "danger");
    return false;
  }
}

async function deleteRating(ratingId) {
  try {
    const response = await fetch(
      `${CONFIG.RATING_API_URL}/ratings/${ratingId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    showAlert("Rating deleted successfully!", "success");
    await loadRatings(); // Reload ratings
    return true;
  } catch (error) {
    console.error("Error deleting rating:", error);
    showAlert("Failed to delete rating: " + error.message, "danger");
    return false;
  }
}

function showAdminRatingModal(rating) {
  console.log("showAdminRatingModal called with:", rating); // Debug log

  // Ensure we have valid rating data
  const safeRating = {
    id: rating.id || 0,
    score: rating.score || 1,
    comment: rating.comment || "",
    raterId: rating.raterId || 0,
    ratedUserId: rating.ratedUserId || 0,
    bookId: rating.bookId || 0,
    dateCreated: rating.dateCreated || new Date().toISOString(),
  };

  console.log("Safe rating data:", safeRating); // Debug log

  const modalHTML = `
    <div class="modal fade" id="adminRatingModal" tabindex="-1" aria-labelledby="adminRatingModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="adminRatingModalLabel">Edit Rating (Admin)</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="adminRatingForm">
              <div class="mb-3">
                <label class="form-label">Rating (1-5 stars)</label>
                <div class="rating-input">
                  <div class="star-rating" id="adminStarRating">
                    <i class="bi bi-star" data-rating="1"></i>
                    <i class="bi bi-star" data-rating="2"></i>
                    <i class="bi bi-star" data-rating="3"></i>
                    <i class="bi bi-star" data-rating="4"></i>
                    <i class="bi bi-star" data-rating="5"></i>
                  </div>
                  <input type="hidden" id="adminRatingScore" value="${
                    safeRating.score
                  }">
                </div>
              </div>
              <div class="mb-3">
                <label for="adminRatingComment" class="form-label">Comment</label>
                <textarea class="form-control" id="adminRatingComment" rows="3">${
                  safeRating.comment
                }</textarea>
              </div>
              <div class="mb-3">
                <small class="text-muted">
                  <strong>Rater:</strong> User ID ${safeRating.raterId}<br>
                  <strong>Rated User:</strong> User ID ${
                    safeRating.ratedUserId
                  }<br>
                  <strong>Book ID:</strong> ${safeRating.bookId}<br>
                  <strong>Date:</strong> ${new Date(
                    safeRating.dateCreated
                  ).toLocaleString()}
                </small>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-danger" onclick="confirmDeleteRating(${
              safeRating.id
            })">
              <i class="bi bi-trash"></i> Delete Rating
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="handleAdminRatingSubmit(${
              safeRating.id
            })">Update Rating</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("adminRatingModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("adminRatingModal")
  );
  modal.show();

  // Setup star rating interaction
  setupAdminStarRating(safeRating.score);
}

function setupAdminStarRating(currentScore) {
  const stars = document.querySelectorAll("#adminStarRating .bi-star");
  const scoreInput = document.getElementById("adminRatingScore");

  // Set initial rating
  stars.forEach((s, i) => {
    if (i < currentScore) {
      s.className = "bi bi-star-fill text-warning";
    } else {
      s.className = "bi bi-star text-muted";
    }
  });

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const rating = index + 1;
      scoreInput.value = rating;

      // Update star display
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });

    star.addEventListener("mouseenter", () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });
  });

  // Reset on mouse leave
  document
    .getElementById("adminStarRating")
    .addEventListener("mouseleave", () => {
      const currentRating = parseInt(scoreInput.value) || 0;
      stars.forEach((s, i) => {
        if (i < currentRating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });
}

async function handleAdminRatingSubmit(ratingId) {
  const score = parseInt(document.getElementById("adminRatingScore").value);
  const comment = document.getElementById("adminRatingComment").value.trim();

  if (score < 1 || score > 5) {
    showAlert("Please select a rating between 1 and 5 stars", "warning");
    return;
  }

  const success = await updateRating(ratingId, score, comment);

  if (success) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("adminRatingModal")
    );
    modal.hide();

    // Remove modal from DOM
    document.getElementById("adminRatingModal").remove();
  }
}

function editRating(ratingId) {
  const rating = ratings.find((r) => r.id === ratingId);
  if (rating) {
    console.log("Editing rating:", rating); // Debug log
    showAdminRatingModal(rating);
  } else {
    showAlert("Rating not found", "danger");
  }
}

function confirmDeleteRating(ratingId) {
  if (
    confirm(
      "Are you sure you want to delete this rating? This action cannot be undone."
    )
  ) {
    deleteRating(ratingId);

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("adminRatingModal")
    );
    modal.hide();

    // Remove modal from DOM
    document.getElementById("adminRatingModal").remove();
  }
}

async function createSampleRatings() {
  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  try {
    // First, clear all existing ratings to avoid conflicts
    const clearResponse = await fetch(
      `${CONFIG.API_BASE_URL}/Dev/clear-all-ratings`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );

    if (!clearResponse.ok) {
      console.warn("Could not clear existing ratings, continuing anyway...");
    }

    // Using dummy user IDs (1000-1999 range) to avoid conflicts with real users

    // Create dummy users and get their actual assigned IDs
    const dummyUserData = [
      {
        username: "dummy_user_1",
        email: "dummy1@example.com",
        firstName: "Dummy",
        lastName: "User1",
      },
      {
        username: "dummy_user_2",
        email: "dummy2@example.com",
        firstName: "Dummy",
        lastName: "User2",
      },
      {
        username: "dummy_user_3",
        email: "dummy3@example.com",
        firstName: "Dummy",
        lastName: "User3",
      },
      {
        username: "dummy_user_4",
        email: "dummy4@example.com",
        firstName: "Dummy",
        lastName: "User4",
      },
      {
        username: "dummy_user_5",
        email: "dummy5@example.com",
        firstName: "Dummy",
        lastName: "User5",
      },
    ];

    const dummyUserIds = [];

    // Create dummy users and collect their actual IDs
    for (const userData of dummyUserData) {
      const createUserResponse = await fetch(
        `${CONFIG.API_BASE_URL}/Dev/create-dummy-user`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(userData),
        }
      );

      if (createUserResponse.ok) {
        const result = await createUserResponse.json();
        dummyUserIds.push(result.userId);
        console.log(
          `Created dummy user: ${userData.username} with ID ${result.userId}`
        );
      } else {
        console.warn(
          `Could not create dummy user ${userData.username}, continuing...`
        );
      }
    }

    if (dummyUserIds.length < 2) {
      showAlert(
        "Could not create enough dummy users for sample ratings",
        "warning"
      );
      return;
    }
    const sampleRatings = [];
    const usedCombinations = new Set();

    // Generate 6 random ratings between dummy users
    for (let i = 0; i < 6; i++) {
      let raterId, ratedUserId, bookId;
      let combination;

      // Ensure we don't create duplicate combinations
      do {
        raterId = dummyUserIds[Math.floor(Math.random() * dummyUserIds.length)];
        ratedUserId =
          dummyUserIds[Math.floor(Math.random() * dummyUserIds.length)];
        bookId = Math.floor(Math.random() * 5) + 1; // Books 1-5
        combination = `${raterId}-${ratedUserId}-${bookId}`;
      } while (raterId === ratedUserId || usedCombinations.has(combination));

      usedCombinations.add(combination);

      sampleRatings.push({
        ratedUserId: ratedUserId,
        bookId: bookId,
        score: Math.floor(Math.random() * 5) + 1, // 1-5 stars
        comment: [
          "Great seller, book was in excellent condition!",
          "Fast response and easy transaction.",
          "Book was okay, some highlighting as described.",
          "Perfect condition, would buy again!",
          "Good communication, book as described.",
          "Quick delivery, satisfied with purchase.",
        ][Math.floor(Math.random() * 6)],
      });
    }

    // Submit all sample ratings
    for (const ratingData of sampleRatings) {
      await submitRating(
        ratingData.ratedUserId,
        ratingData.bookId,
        ratingData.score,
        ratingData.comment
      );
    }

    // Reload ratings and refresh the page
    await loadAllRatings();
    renderAdminRatingManagement();
    showAlert("Sample ratings created successfully!", "success");
  } catch (error) {
    console.error("Error creating sample ratings:", error);
    showAlert("Failed to create sample ratings", "danger");
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

  // Initialize tooltips after rendering
  setTimeout(initializeTooltips, 100);
}

function renderBooks() {
  // Check if user is authenticated
  if (!authToken) {
    return `
      <div class="text-center py-5">
        <i class="bi bi-lock display-1 text-muted"></i>
        <h3 class="text-muted mt-3">Please Sign In</h3>
        <p class="text-muted">You need to sign in to view and buy books</p>
        <button class="btn btn-crimson" data-bs-toggle="modal" data-bs-target="#loginModal">
          <i class="bi bi-box-arrow-in-right"></i> Sign In
        </button>
      </div>
    `;
  }

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

  // Create array with ads inserted at intervals
  const itemsWithAds = [];
  books.forEach((book, index) => {
    // Add book
    itemsWithAds.push(renderBookCard(book));

    // Insert ads after every 3 books
    if ((index + 1) % 3 === 0 && index < books.length - 1) {
      itemsWithAds.push(renderAdCard(index === 2 ? 1 : 2)); // Alternate between ads
    }
  });

  return `
    <div class="container-fluid px-0">
      ${itemsWithAds.join("")}
    </div>
  `;
}

function renderBookCard(book) {
  const conditionInfo = getConditionInfo(book.condition);
  return `
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
            ${
              book.sellerRating && book.sellerRating > 0
                ? `
              <span><i class="bi bi-star-fill text-warning"></i> ${book.sellerRating.toFixed(
                1
              )} (${book.sellerRatingCount} reviews)</span>
            `
                : ""
            }
            ${
              currentUser &&
              book.sellerEmail !== currentUser.email &&
              contactedSellers.has(book.sellerEmail)
                ? `<span class="badge bg-success ms-2"><i class="bi bi-check-circle"></i> Can Rate</span>`
                : ""
            }
          </div>
        </div>
        <div class="book-price">$${(book.price || 0).toFixed(2)}</div>
        <div class="book-condition ${conditionInfo.class}" 
             data-bs-toggle="tooltip" 
             data-bs-placement="top" 
             title="${conditionInfo.description}">
          <i class="bi ${conditionInfo.icon}"></i> ${
    book.condition || "Unknown"
  }
        </div>
        <div class="book-actions">
          <button class="btn btn-crimson btn-sm" onclick="contactSeller(${
            book.id
          })">
            <i class="bi bi-envelope"></i> Contact
          </button>
          ${
            currentUser &&
            book.sellerEmail !== currentUser.email &&
            contactedSellers.has(book.sellerEmail)
              ? `
            <button class="btn btn-outline-warning btn-sm" onclick="showRatingModal(${
              book.id
            }, '${escapeHtml(book.sellerName)}', '${escapeHtml(
                  book.sellerEmail
                )}')">
              <i class="bi bi-star"></i> Rate
            </button>
          `
              : ""
          }
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
  `;
}

function renderAdCard(adNumber) {
  const adImage = adNumber === 1 ? "ad1.jpg" : "ad2.jpg";
  const adData =
    adNumber === 1
      ? {
          title: "Adventure Awaits Wilderness Tours",
          description:
            "Experience breathtaking nature with our guided wilderness tours. From scenic river adventures to forest hiking expeditions, discover the great outdoors like never before.",
          cta: "Call Today!",
        }
      : {
          title: "Need Code? Call Monroe!",
          description:
            "Professional coding services for all your development needs. From web applications to mobile apps, get expert programming solutions delivered fast and efficiently.",
          cta: "Get Started Now!",
        };

  return `
    <div class="ad-card">
      <div class="ad-content">
        <img src="./Resources/Images/${adImage}" alt="Advertisement" class="ad-image" />
        <div class="ad-text-content">
          <h4 class="ad-title">${adData.title}</h4>
          <p class="ad-description">${adData.description}</p>
          <div class="ad-cta" onclick="handleAdClick(${adNumber})">${adData.cta}</div>
        </div>
        <div class="ad-label">Advertisement</div>
      </div>
    </div>
  `;
}

function handleAdClick(adNumber) {
  console.log("Ad clicked:", adNumber);

  if (adNumber === 1) {
    // Wilderness Tours ad - show phone number
    showCustomAlert("Wilderness Tours", "📞 Call us at: 867-5309");
  } else {
    // Monroe coding ad - show joke message
    showCustomAlert(
      "Monroe Coding Services",
      "😄 Don't actually call Monroe please! He will probably mess up your code!"
    );
  }
}

function showCustomAlert(title, message) {
  // Create custom modal
  const modal = document.createElement("div");
  modal.className = "modal fade show";
  modal.style.display = "block";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
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
                }>⭐ Excellent - Like new, minimal wear</option>
                <option value="Very Good" ${
                  book && book.condition === "Very Good"
                    ? "selected"
                    : !book
                    ? "selected"
                    : ""
                }>🌟 Very Good - Minor wear, clean pages</option>
                <option value="Good" ${
                  book && book.condition === "Good" ? "selected" : ""
                }>✅ Good - Light wear, some highlighting</option>
                <option value="Fair" ${
                  book && book.condition === "Fair" ? "selected" : ""
                }>⚠️ Fair - Moderate wear, significant highlighting</option>
                <option value="Poor" ${
                  book && book.condition === "Poor" ? "selected" : ""
                }>❌ Poor - Heavy wear, extensive damage</option>
              </select>
              <div class="form-text">
                <small class="text-muted">Choose the condition that best describes your book's state</small>
              </div>
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
  console.log("editBook called with id:", id);
  console.log("Current books:", books);

  const book = books.find((b) => b.id === id);
  console.log("Found book to edit:", book);

  if (!book) {
    console.error("Book not found with id:", id);
    showAlert("Book not found", "danger");
    return;
  }

  editingBookId = id;

  // Re-render the form with the book data
  const formContainer = document.getElementById("book-form-container");
  if (formContainer) {
    formContainer.innerHTML = renderBookForm();
    formContainer.style.display = "block";
  }

  // Ensure the form is populated with the book data (backup method)
  setTimeout(() => {
    const titleField = document.getElementById("book-title");
    const authorField = document.getElementById("book-author");
    const priceField = document.getElementById("book-price");
    const conditionField = document.getElementById("book-condition");
    const yearField = document.getElementById("book-year");
    const courseField = document.getElementById("book-course");
    const professorField = document.getElementById("book-professor");
    const descriptionField = document.getElementById("book-description");

    if (titleField) titleField.value = book.title || "";
    if (authorField) authorField.value = book.author || "";
    if (priceField) priceField.value = book.price || "";
    if (conditionField) conditionField.value = book.condition || "Good";
    if (yearField) yearField.value = book.year || "";
    if (courseField) courseField.value = book.courseCode || "";
    if (professorField) professorField.value = book.professor || "";
    if (descriptionField) descriptionField.value = book.description || "";

    console.log("Form populated with book data");
    if (titleField) titleField.focus();
  }, 100);
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
    book: {
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
    },
  };

  if (editingBookId) {
    // For updates, send the book object directly (not wrapped in 'book' property)
    await updateBook(editingBookId, bookData.book);
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

    // Add seller to contacted list
    contactedSellers.add(book.sellerEmail);
    saveContactedSellers();

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
      `Interest sent to ${book.sellerName}! They'll be notified about your interest in "${book.title}". You can now rate them after your interaction.`,
      "success"
    );

    // Re-render to show the rate button if applicable
    renderApp();
  }
}

// Utility Functions
function isAdmin() {
  return currentUser && currentUser.email === "ccsmith33@crimson.ua.edu";
}

function canEditBook(book) {
  // If no user is logged in, they can't edit any book
  if (!currentUser) {
    console.log("No current user, cannot edit book");
    return false;
  }

  console.log("Checking if user can edit book:", {
    currentUser: currentUser,
    bookSellerEmail: book.sellerEmail,
    isAdmin: isAdmin(),
  });

  // Admin user can edit any book
  if (isAdmin()) {
    console.log("Admin user, can edit any book");
    return true;
  }

  // Regular users can only edit books they created
  const canEdit = book.sellerEmail === currentUser.email;
  console.log("Regular user can edit:", canEdit);
  return canEdit;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getConditionInfo(condition) {
  const conditions = {
    Excellent: {
      class: "condition-excellent",
      icon: "bi-star-fill",
      description:
        "Like new - minimal wear, clean pages, no markings or highlighting",
    },
    "Very Good": {
      class: "condition-very-good",
      icon: "bi-star",
      description: "Minor wear - clean pages, minimal highlighting or notes",
    },
    Good: {
      class: "condition-good",
      icon: "bi-check-circle-fill",
      description:
        "Light wear - some highlighting or notes, minor cover wear, pages intact",
    },
    Fair: {
      class: "condition-fair",
      icon: "bi-exclamation-triangle-fill",
      description:
        "Moderate wear - significant highlighting, cover damage, but readable",
    },
    Poor: {
      class: "condition-poor",
      icon: "bi-exclamation-circle-fill",
      description:
        "Heavy wear - extensive damage, missing pages, or difficult to read",
    },
  };

  return (
    conditions[condition] || {
      class: "condition-unknown",
      icon: "bi-question-circle-fill",
      description: "Condition not specified",
    }
  );
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

function showAdminPanel() {
  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  // Set page state and render admin panel
  localStorage.setItem("currentPage", "adminPanel");
  renderAdminPanel();
}

function renderAdminPanel() {
  const app = document.getElementById("app");
  if (!app) return;

  // Create comprehensive admin panel
  const adminPanelHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-gear"></i> Admin Panel</h2>
            <button class="btn btn-outline-primary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          
          <!-- Admin Navigation Tabs -->
          <ul class="nav nav-tabs mb-4" id="adminTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="users-tab" data-bs-toggle="tab" data-bs-target="#users" type="button" role="tab">
                <i class="bi bi-people"></i> Users
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="ratings-tab" data-bs-toggle="tab" data-bs-target="#ratings" type="button" role="tab">
                <i class="bi bi-star-half"></i> Ratings
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="rate-limits-tab" data-bs-toggle="tab" data-bs-target="#rate-limits" type="button" role="tab">
                <i class="bi bi-speedometer2"></i> Rate Limits
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="backup-tab" data-bs-toggle="tab" data-bs-target="#backup" type="button" role="tab">
                <i class="bi bi-download"></i> Backup
              </button>
            </li>
          </ul>

          <!-- Tab Content -->
          <div class="tab-content" id="adminTabContent">
            <!-- Users Tab -->
            <div class="tab-pane fade show active" id="users" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-people"></i> User Management</h5>
                </div>
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <button class="btn btn-primary" onclick="loadAllUsers()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh Users
                      </button>
                    </div>
                    <div class="col-md-6">
                      <div class="input-group">
                        <input type="text" class="form-control" id="usernameSearch" placeholder="Search by username...">
                        <button class="btn btn-outline-secondary" onclick="searchUserByUsername()">
                          <i class="bi bi-search"></i> Search
                        </button>
                      </div>
                    </div>
                  </div>
                  <div id="usersList" class="table-responsive">
                    <p class="text-muted">Click "Refresh Users" to load user list</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ratings Tab -->
            <div class="tab-pane fade" id="ratings" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-star-half"></i> Rating Management</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <button class="btn btn-primary" onclick="loadAllRatings()">
                      <i class="bi bi-arrow-clockwise"></i> Refresh Ratings
                    </button>
                  </div>
                  <div id="ratingsList" class="admin-ratings-container">
                    <p class="text-muted">Click "Refresh Ratings" to load ratings</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rate Limits Tab -->
            <div class="tab-pane fade" id="rate-limits" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-speedometer2"></i> Rate Limit Management</h5>
                </div>
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <div class="input-group">
                        <input type="text" class="form-control" id="rateLimitIdentifier" placeholder="User identifier (email/IP)">
                        <button class="btn btn-outline-secondary" onclick="checkRateLimit()">
                          <i class="bi bi-search"></i> Check Status
                        </button>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <button class="btn btn-warning" onclick="resetRateLimit()">
                        <i class="bi bi-arrow-clockwise"></i> Reset Rate Limit
                      </button>
                    </div>
                  </div>
                  <div id="rateLimitStatus" class="alert alert-info">
                    <p class="mb-0">Enter an identifier above to check rate limit status</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Backup Tab -->
            <div class="tab-pane fade" id="backup" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-download"></i> Backup Management</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <button class="btn btn-success" onclick="createBackup()">
                      <i class="bi bi-plus"></i> Create Backup
                    </button>
                    <button class="btn btn-primary" onclick="loadBackups()">
                      <i class="bi bi-arrow-clockwise"></i> Refresh Backups
                    </button>
                  </div>
                  <div id="backupsList">
                    <p class="text-muted">Click "Refresh Backups" to load backup list</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = adminPanelHTML;
}

// Admin Panel Functions
async function loadAllUsers() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Admin/users`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const usersList = document.getElementById("usersList");

    if (data.users && data.users.length > 0) {
      const usersTable = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Name</th>
              <th>Rating</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            ${data.users
              .map(
                (user) => `
              <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.averageRating.toFixed(1)} (${user.ratingCount})</td>
                <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p class="text-muted">Total users: ${data.totalCount}</p>
      `;
      usersList.innerHTML = usersTable;
    } else {
      usersList.innerHTML = '<p class="text-muted">No users found</p>';
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("Failed to load users", "danger");
  }
}

async function searchUserByUsername() {
  const username = document.getElementById("usernameSearch").value.trim();
  if (!username) {
    showAlert("Please enter a username to search", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/user-by-username/${encodeURIComponent(username)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        showAlert("User not found", "warning");
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user = await response.json();
    const usersList = document.getElementById("usersList");

    const userTable = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Name</th>
            <th>Rating</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.averageRating.toFixed(1)} (${user.ratingCount})</td>
            <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
          </tr>
        </tbody>
      </table>
    `;
    usersList.innerHTML = userTable;
  } catch (error) {
    console.error("Error searching user:", error);
    showAlert("Failed to search user", "danger");
  }
}

async function checkRateLimit() {
  const identifier = document
    .getElementById("rateLimitIdentifier")
    .value.trim();
  if (!identifier) {
    showAlert("Please enter an identifier to check", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/rate-limit-status/${encodeURIComponent(identifier)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const statusDiv = document.getElementById("rateLimitStatus");

    const alertClass = data.isRateLimited ? "alert-danger" : "alert-success";
    statusDiv.className = `alert ${alertClass}`;
    statusDiv.innerHTML = `
      <h6>Rate Limit Status for: ${data.identifier}</h6>
      <p><strong>Is Rate Limited:</strong> ${
        data.isRateLimited ? "Yes" : "No"
      }</p>
      <p><strong>Remaining Requests:</strong> ${data.remainingRequests}</p>
    `;
  } catch (error) {
    console.error("Error checking rate limit:", error);
    showAlert("Failed to check rate limit status", "danger");
  }
}

async function resetRateLimit() {
  const identifier = document
    .getElementById("rateLimitIdentifier")
    .value.trim();
  if (!identifier) {
    showAlert("Please enter an identifier to reset", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/reset-rate-limit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier,
          actionType: "general",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the rate limit status
    await checkRateLimit();
  } catch (error) {
    console.error("Error resetting rate limit:", error);
    showAlert("Failed to reset rate limit", "danger");
  }
}

async function createBackup() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Backup/create`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the backup list
    await loadBackups();
  } catch (error) {
    console.error("Error creating backup:", error);
    showAlert("Failed to create backup", "danger");
  }
}

async function loadBackups() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Backup/list`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const backupsList = document.getElementById("backupsList");

    if (data && data.length > 0) {
      const backupsTable = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Created Date</th>
              <th>File Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (backup) => `
              <tr>
                <td>${backup.fileName}</td>
                <td>${new Date(backup.createdDate).toLocaleString()}</td>
                <td>${(backup.fileSize / 1024).toFixed(1)} KB</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" onclick="downloadBackup('${
                    backup.fileName
                  }')">
                    <i class="bi bi-download"></i> Download
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteBackup('${
                    backup.fileName
                  }')">
                    <i class="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      backupsList.innerHTML = backupsTable;
    } else {
      backupsList.innerHTML = '<p class="text-muted">No backups found</p>';
    }
  } catch (error) {
    console.error("Error loading backups:", error);
    showAlert("Failed to load backups", "danger");
  }
}

async function downloadBackup(fileName) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Backup/download/${fileName}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading backup:", error);
    showAlert("Failed to download backup", "danger");
  }
}

async function deleteBackup(fileName) {
  if (!confirm(`Are you sure you want to delete backup "${fileName}"?`)) {
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Backup/delete/${fileName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the backup list
    await loadBackups();
  } catch (error) {
    console.error("Error deleting backup:", error);
    showAlert("Failed to delete backup", "danger");
  }
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

function initializeTooltips() {
  // Initialize Bootstrap tooltips for condition badges
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Development Helper Functions
function addDevelopmentHelper() {
  // Add development panel to the page
  const devPanel = document.createElement("div");
  devPanel.id = "dev-panel";
  devPanel.innerHTML = `
    <div style="position: fixed; top: 10px; right: 10px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 10px; z-index: 9999; font-size: 12px; max-width: 300px;">
      <h6 style="margin: 0 0 10px 0; color: #495057;">🔧 Development Helper</h6>
      <div style="margin-bottom: 10px;">
        <button onclick="verifyAllExistingUsers()" class="btn btn-sm btn-primary" style="margin-right: 5px;">Verify All Users</button>
        <button onclick="showExistingUsers()" class="btn btn-sm btn-info" style="margin-right: 5px;">Show Users</button>
        <button onclick="forceRemigrateData()" class="btn btn-sm btn-warning">Force Remigrate</button>
      </div>
      <div style="margin-bottom: 10px;">
        <input type="email" id="dev-email" placeholder="Enter email to verify" style="width: 100%; margin-bottom: 5px; padding: 2px 5px; font-size: 11px;">
        <button onclick="verifySingleUser()" class="btn btn-sm btn-success" style="width: 100%;">Verify This User</button>
      </div>
      <div style="font-size: 10px; color: #6c757d;">
        <strong>Existing Users:</strong><br>
        • admin@crimson.ua.edu<br>
        • alex.johnson@ua.edu<br>
        • sarah.williams@ua.edu
      </div>
    </div>
  `;

  document.body.appendChild(devPanel);
}

async function verifyAllExistingUsers() {
  try {
    const response = await fetch(
      `${CONFIG.DEV_API_URL}/verify-all-existing-users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (response.ok) {
      showAlert(`✅ ${result.message}`, "success");
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error verifying all users:", error);
    showAlert("❌ Failed to verify users", "danger");
  }
}

async function verifySingleUser() {
  const email = document.getElementById("dev-email").value.trim();

  if (!email) {
    showAlert("Please enter an email address", "warning");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/verify-existing-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(`✅ User ${email} verified successfully`, "success");
      document.getElementById("dev-email").value = "";
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error verifying user:", error);
    showAlert("❌ Failed to verify user", "danger");
  }
}

async function showExistingUsers() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/existing-users`);
    const users = await response.json();

    if (response.ok) {
      const userList = users
        .map((u) => `${u.email} (${u.firstName} ${u.lastName})`)
        .join("<br>");
      showAlert(`<strong>Existing Users:</strong><br>${userList}`, "info");
    } else {
      showAlert("❌ Failed to load users", "danger");
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("❌ Failed to load users", "danger");
  }
}

async function forceRemigrateData() {
  if (!confirm("This will delete ALL data and recreate it. Are you sure?")) {
    return;
  }

  try {
    showAlert("🔄 Force remigrating data...", "info");

    const response = await fetch(`${CONFIG.DEV_API_URL}/force-remigrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(`✅ ${result.message}`, "success");
      // Refresh the page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error force remigrating:", error);
    showAlert("❌ Failed to force remigrate data", "danger");
  }
}
