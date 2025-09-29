// Global state
let books = [];
let editingBookId = null;
let currentSearchTerm = "";
let currentUser = null;
let authToken = null; // JWT token for authentication
let notifications = [];
let ratings = [];
let contactedSellers = new Set(); // Track which sellers the user has contacted
let ratedBooks = new Set(); // Track which books the user has rated (format: "raterEmail-sellerEmail-bookId")
let promptedToRate = new Set(); // Track which books the user has been prompted to rate
let userEmailToIdMap = new Map(); // Cache for email to user ID mapping

// Global 401 error handler
function setupGlobalErrorHandling() {
  // Override fetch to catch 401 errors globally
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    if (response.status === 401) {
      console.log("401 Unauthorized detected, logging out user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      showAlert("Session expired. Please sign in again.", "warning");
      showLoginForm();
    }

    return response;
  };
}

async function handleOnLoad() {
  console.log("Page loaded, initializing app...");
  try {
    // Setup global error handling
    setupGlobalErrorHandling();

    // Update config with actual port first
    await updateConfigWithPort();

    // Check authentication status
    checkAuthStatus();

    // If user appears to be logged in, validate their session
    if (currentUser) {
      const isAuthenticated = await authCheck(false); // Don't show alert on page load
      if (!isAuthenticated) {
        return; // authCheck will handle logout and redirect
      }
    }
    await loadBooks();
    await loadRatings();
    await loadContactedSellers();
    await loadRatedBooks();
    await loadPromptedToRate();
    await loadNotifications();

    // Check if we're currently viewing a specific page
    const currentPage = localStorage.getItem("currentPage");

    if (currentPage === "notifications") {
      // If viewing notifications, just update auth UI but don't render main app
      updateAuthUI();
      await loadNotifications();
      updateNavigationState("notifications");
      renderNotificationsPage();
    } else if (currentPage === "myBooks") {
      // If viewing my books
      updateAuthUI();
      updateNavigationState("myBooks");
      renderMyBooksPage();
    } else if (currentPage === "contactedBooks") {
      // If viewing contacted books
      updateAuthUI();
      updateNavigationState("contactedBooks");
      // Ensure data is loaded before rendering
      await loadContactedSellers();
      await loadRatedBooks();
      await loadPromptedToRate();
      renderContactedBooksPage();
    } else if (currentPage === "myRatings") {
      // If viewing my ratings
      updateAuthUI();
      await loadMyRatings();
      updateNavigationState("myRatings");
      renderMyRatingsPage();
    } else if (currentPage === "profile") {
      // If viewing profile page
      updateAuthUI();
      updateNavigationState("profile");
      renderProfilePage();
    } else if (currentPage === "adminPanel") {
      // If viewing admin panel
      updateAuthUI();
      updateNavigationState("admin");
      renderAdminPanel();
    } else {
      // Normal behavior - render main app
      renderApp();
      updateAuthUI();
      updateNavigationState("home");
    }

    // Create login modal before setting up event listeners
    createLoginModal();
    setupAuthEventListeners();
    // Don't start polling until user is fully authenticated

    // Add development helper if in development mode
    console.log("Current hostname:", window.location.hostname);
    console.log("Current protocol:", window.location.protocol);
    // HIDDEN FOR COLIN'S UI BRANCH - Dev helper disabled
    // if (
    //   window.location.hostname === "localhost" ||
    //   window.location.hostname === "127.0.0.1" ||
    //   window.location.protocol === "file:"
    // ) {
    //   console.log("Adding development helper...");
    //   addDevelopmentHelper();
    // } else {
    //   console.log("Not in development mode, skipping development helper");
    // }
  } catch (error) {
    console.error("Error during initialization:", error);
    // Render app even if books fail to load
    renderApp();
    // Update auth UI after rendering to ensure it persists
    updateAuthUI();
    // Create login modal before setting up event listeners
    createLoginModal();
    setupAuthEventListeners();
  }
}

// Initialize the app when the page loads
window.addEventListener("DOMContentLoaded", handleOnLoad);

// Theme management
let currentTheme = localStorage.getItem("theme") || "light";

// Initialize theme on page load
document.addEventListener("DOMContentLoaded", function () {
  initializeTheme();
});

function initializeTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  localStorage.setItem("theme", currentTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    if (currentTheme === "light") {
      themeIcon.className = "bi bi-moon";
    } else {
      themeIcon.className = "bi bi-sun";
    }
  }
}

// Mark book as sold function
async function markAsSold(bookId, bookTitle) {
  if (
    confirm(
      `Are you sure you want to mark "${bookTitle}" as sold? This will remove it from the marketplace.`
    )
  ) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/${bookId}/sold`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        // Update the book in the local array
        const bookIndex = books.findIndex((book) => book.id === bookId);
        if (bookIndex !== -1) {
          books[bookIndex].isAvailable = false;
        }

        // Refresh the My Books page
        renderMyBooksPage();

        if (typeof showAlert === "function") {
          showAlert(`"${bookTitle}" has been marked as sold!`, "success");
        }
      } else {
        const errorData = await response.json();
        if (typeof showAlert === "function") {
          showAlert(
            `Error: ${errorData.message || "Failed to mark book as sold"}`,
            "danger"
          );
        }
      }
    } catch (error) {
      console.error("Error marking book as sold:", error);
      if (typeof showAlert === "function") {
        showAlert("Error marking book as sold. Please try again.", "danger");
      }
    }
  }
}

// Development menu function
function showDevMenu() {
  const modalHtml = `
    <div class="modal fade" id="devMenuModal" tabindex="-1" aria-labelledby="devMenuModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="devMenuModalLabel">
              <i class="bi bi-tools"></i> Development Tools
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6><i class="bi bi-database"></i> Database Management</h6>
                <div class="d-grid gap-2">
                  <button class="btn btn-warning" onclick="executeDevAction('force-remigrate')">
                    <i class="bi bi-arrow-clockwise"></i> Force Re-migrate Database
                  </button>
                  <button class="btn btn-info" onclick="executeDevAction('seed-database')">
                    <i class="bi bi-seed"></i> Seed Database
                  </button>
                  <button class="btn btn-success" onclick="executeDevAction('force-alex-data')">
                    <i class="bi bi-person-check"></i> Force Alex Johnson Data
                  </button>
                  <button class="btn btn-primary" onclick="executeDevAction('create-support-tickets-table')">
                    <i class="bi bi-ticket"></i> Create Support Tickets Table
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <h6><i class="bi bi-trash"></i> Data Cleanup</h6>
                <div class="d-grid gap-2">
                  <button class="btn btn-danger" onclick="executeDevAction('clear-all-books')">
                    <i class="bi bi-trash"></i> Clear All Books
                  </button>
                  <button class="btn btn-danger" onclick="executeDevAction('clear-all-ratings')">
                    <i class="bi bi-star"></i> Clear All Ratings
                  </button>
                </div>
              </div>
            </div>
            <div class="mt-3">
              <h6><i class="bi bi-info-circle"></i> Information</h6>
              <div class="alert alert-info">
                <small>
                  <strong>Force Re-migrate:</strong> Clears all data and recreates with new structure including sold books<br>
                  <strong>Seed Database:</strong> Adds sample data with mixed sold/available books<br>
                  <strong>Force Alex Data:</strong> Recreates Alex Johnson's demo data with sold books<br>
                  <strong>Clear All:</strong> Removes all books or ratings from database
                </small>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if it exists
  const existingModal = document.getElementById("devMenuModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("devMenuModal"));
  modal.show();
}

// Execute development actions
async function executeDevAction(action) {
  const actionMap = {
    "force-remigrate": {
      url: "/api/dev/force-remigrate",
      method: "POST",
      name: "Force Re-migrate",
    },
    "seed-database": {
      url: "/api/dev/seed-database",
      method: "POST",
      name: "Seed Database",
    },
    "force-alex-data": {
      url: "/api/dev/force-alex-data",
      method: "POST",
      name: "Force Alex Data",
    },
    "create-support-tickets-table": {
      url: "/api/dev/create-support-tickets-table",
      method: "POST",
      name: "Create Support Tickets Table",
    },
    "clear-all-books": {
      url: "/api/dev/clear-all-books",
      method: "POST",
      name: "Clear All Books",
    },
    "clear-all-ratings": {
      url: "/api/dev/clear-all-ratings",
      method: "POST",
      name: "Clear All Ratings",
    },
  };

  const actionConfig = actionMap[action];
  if (!actionConfig) {
    showAlert("Unknown action", "danger");
    return;
  }

  if (
    confirm(
      `Are you sure you want to ${actionConfig.name.toLowerCase()}? This action cannot be undone.`
    )
  ) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL.replace("/api/Book", "")}${actionConfig.url}`,
        {
          method: actionConfig.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        showAlert(`${actionConfig.name} completed successfully!`, "success");

        // Close the modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("devMenuModal")
        );
        if (modal) {
          modal.hide();
        }

        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        showAlert(`Error: ${errorData.message || "Action failed"}`, "danger");
      }
    } catch (error) {
      console.error(`Error executing ${actionConfig.name}:`, error);
      showAlert(
        `Error executing ${actionConfig.name}. Please try again.`,
        "danger"
      );
    }
  }
}

// Temporary function to test dark mode notification (remove this later)
function testDarkModeNotification() {
  localStorage.removeItem("darkModeSuggestionShown");
  if (typeof showDarkModeSuggestion === "function") {
    showDarkModeSuggestion();
  } else {
    console.error("showDarkModeSuggestion function not found");
  }
}
