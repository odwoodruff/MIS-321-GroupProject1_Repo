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
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.protocol === "file:"
    ) {
      console.log("Adding development helper...");
      addDevelopmentHelper();
    } else {
      console.log("Not in development mode, skipping development helper");
    }
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
