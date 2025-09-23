// Main application initialization and coordination
// This file coordinates all the modular components

// Global state
let books = [];
let editingBookId = null;
let currentSearchTerm = "";
let notifications = [];
let ratings = [];
let contactedSellers = new Set(); // Track which sellers the user has contacted
let ratedBooks = new Set(); // Track which books the user has rated (format: "raterEmail-sellerEmail-bookId")
let promptedToRate = new Set(); // Track which books the user has been prompted to rate
let userEmailToIdMap = new Map(); // Cache for email to user ID mapping

// Notification polling
let notificationPollingInterval = null;

// Additional global variables from index.js
let selectedCourse = "";

// Main initialization
async function handleOnLoad() {
  console.log("Page loaded, initializing app...");

  // Update config with actual port
  await updateConfigWithPort();

  // Setup global error handling
  setupGlobalErrorHandling();

  // Check authentication status
  checkAuthStatus();

  // Update UI based on auth status
  updateAuthUI();

  // Setup event listeners
  setupAuthEventListeners();
  setupScrollBehavior();

  // Load books (will be empty if not authenticated)
  await loadBooks();

  // Render the app
  renderApp();

  // Add development helper if in development mode
  addDevelopmentHelper();

  console.log("App initialization completed");
}

// Setup scroll behavior for smooth scrolling
function setupScrollBehavior() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Search bar hide/show on scroll
  const searchContainer = document.querySelector(".search-container");
  let lastScrollTop = 0;

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down - hide search bar
      searchContainer.classList.add("hidden");
    } else {
      // Scrolling up - show search bar
      searchContainer.classList.remove("hidden");
    }

    lastScrollTop = scrollTop;
  }

  window.addEventListener("scroll", handleScroll);
  console.log("Scroll behavior setup completed");
}

// Main app rendering function
function renderApp() {
  console.log("Rendering app with books:", books);
  const app = document.getElementById("app");
  if (!app) return;

  const currentPage = localStorage.getItem("currentPage");
  console.log("Current page:", currentPage);

  if (currentPage === "myBooks") {
    renderMyBooksPage();
  } else if (currentPage === "contactedBooks") {
    renderContactedBooksPage();
  } else if (currentPage === "myRatings") {
    renderMyRatingsPage();
  } else if (currentPage === "notifications") {
    showNotifications();
  } else if (currentPage === "admin") {
    showAdminPanel();
  } else if (currentPage === "profile") {
    showProfile();
  } else {
    renderBooks();
  }
}

// Additional functions that are referenced across modules are now in auth.js

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", handleOnLoad);

// Make sure the app initializes even if DOMContentLoaded already fired
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", handleOnLoad);
} else {
  handleOnLoad();
}
