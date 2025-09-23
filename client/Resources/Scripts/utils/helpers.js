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
  // Check cache first
  if (userEmailToIdMap.has(email)) {
    return userEmailToIdMap.get(email);
  }

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

    // Cache the result
    if (user) {
      userEmailToIdMap.set(email, user.id);
      return user.id;
    }

    return null;
  } catch (error) {
    console.error("Error looking up user by email:", error);
    return null;
  }
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

// Helper function to validate professor name
function isValidProfessorName(name) {
  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    return false;
  }

  // Check if name contains only letters, spaces, hyphens, apostrophes, and periods
  const validNameRegex = /^[a-zA-Z\s\-'.]+$/;
  return validNameRegex.test(name);
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

function isModalOpen() {
  // Check if any Bootstrap modals are open
  const openModals = document.querySelectorAll(".modal.show");
  if (openModals.length > 0) return true;

  // Check if any alerts are showing (Bootstrap alerts)
  const openAlerts = document.querySelectorAll(
    ".alert.show, .alert:not(.d-none)"
  );
  if (openAlerts.length > 0) return true;

  // Check if dev panel is visible and user might be interacting with it
  const devPanel = document.getElementById("dev-panel");
  if (devPanel && devPanel.style.display !== "none") return true;

  // Check if dev modal is open
  const devModal = document.getElementById("dev-modal");
  if (devModal && devModal.classList.contains("show")) return true;

  return false;
}

async function loadContactedSellers() {
  if (!currentUser) return;

  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/contacted-sellers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const contactedSellersList = await response.json();
      contactedSellers = new Set(contactedSellersList);
      console.log("Loaded contacted sellers from API:", contactedSellers);
    } else {
      console.error("Failed to load contacted sellers:", response.status);
      // Don't clear existing data on API failure
      console.log("Preserving existing contacted sellers:", contactedSellers);
    }
  } catch (error) {
    console.error("Error loading contacted sellers:", error);
    // Don't clear existing data on API failure
    console.log("Preserving existing contacted sellers:", contactedSellers);
  }
}

async function saveContactedSellers() {
  if (!currentUser) return;

  // This function is now handled by the contactSeller API call
  // No need to save to localStorage anymore
}

// Text-delimited storage functions (DEPRECATED - now using API)

async function updateNotificationBadgeForSeller(sellerEmail) {
  // Check if the seller is currently logged in
  if (currentUser && currentUser.email === sellerEmail) {
    // Reload notifications and update badge for the seller
    await loadNotifications();
    updateNotificationBadge();
  }
}

function getNotificationsForUser(userEmail) {
  // This function is deprecated - notifications are now loaded from API
  console.warn("getNotificationsForUser is deprecated - use API instead");
  return [];
}

async function markNotificationAsRead(notificationId) {
  try {
    // First try to mark as read via API
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        "/api/Notification"
      )}/${notificationId}/mark-read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      console.log("Notification marked as read via API");
    } else {
      console.warn(
        "Failed to mark notification as read via API, falling back to localStorage"
      );
      // Fallback to localStorage
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
    }

    // Reload notifications and refresh the page
    await loadNotifications();
    updateNotificationBadge();
    renderNotificationsPage();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

async function loadNotifications() {
  console.log(
    "loadNotifications called - currentUser:",
    !!currentUser,
    "authToken:",
    !!authToken
  );
  console.log("loadNotifications: Current user ID:", currentUser?.id);
  console.log("loadNotifications: Current user email:", currentUser?.email);

  if (!currentUser || !authToken) {
    console.log(
      "loadNotifications: Missing user or token, returning empty array"
    );
    notifications = [];
    return;
  }

  try {
    console.log(
      "loadNotifications: Making API call with token:",
      authToken.substring(0, 20) + "..."
    );
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "/api/Notification")}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("loadNotifications: Response status:", response.status);

    if (response.ok) {
      const apiNotifications = await response.json();
      console.log("Notifications from API:", apiNotifications);
      console.log("Number of notifications from API:", apiNotifications.length);

      // Convert API notifications to the expected format
      notifications = apiNotifications.map((notif) => ({
        id: notif.id,
        message: notif.message,
        type: notif.type,
        read: notif.isRead,
        dateCreated: notif.dateCreated,
        relatedBookId: notif.relatedBookId,
        relatedUserId: notif.relatedUserId,
      }));

      console.log("Converted notifications:", notifications);
      console.log("Final notifications count:", notifications.length);
    } else {
      console.error("Failed to load notifications:", response.status);
      // Don't clear existing data on API failure
      console.log("Preserving existing notifications:", notifications);
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    // Don't clear existing data on API failure
    console.log("Preserving existing notifications:", notifications);
  }

  updateNotificationBadge();
}

function updateNotificationBadge() {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const notificationLink = document.querySelector(
    'a[onclick="showNotifications()"]'
  );

  if (notificationLink) {
    if (unreadCount > 0) {
      notificationLink.innerHTML = `<i class="bi bi-bell-fill"></i> Notifications <span class="badge bg-danger">${unreadCount}</span>`;
    } else {
      notificationLink.innerHTML = `<i class="bi bi-bell"></i> Notifications`;
    }
  }
}

async function showNotifications() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Set page state and render notifications page
  localStorage.setItem("currentPage", "notifications");
  updateNavigationState("notifications");
  renderNotificationsPage();
}

async function showMyBooks() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Set page state and render my books page
  localStorage.setItem("currentPage", "myBooks");
  updateNavigationState("myBooks");
  renderMyBooksPage();
}

async function showContactedBooks() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Set page state and render contacted books page
  localStorage.setItem("currentPage", "contactedBooks");
  updateNavigationState("contactedBooks");

  // Ensure data is loaded before rendering
  await loadContactedSellers();
  await loadRatedBooks();
  await loadPromptedToRate();
  renderContactedBooksPage();
}

async function showMyRatings() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Set page state and render my ratings page
  localStorage.setItem("currentPage", "myRatings");
  updateNavigationState("myRatings");

  // Load ratings before rendering
  await loadMyRatings();
  renderMyRatingsPage();
}

function goBackToBooks() {
  localStorage.removeItem("currentPage");
  updateNavigationState("home");
  renderApp();
}

// Development function to clear contacted sellers for current user
function clearContactedSellers() {
  if (!currentUser) {
    showAlert("No user logged in", "warning");
    return;
  }

  contactedSellers.clear();
  saveContactedSellers();
  showAlert(`Cleared contacted sellers for ${currentUser.email}`, "success");
  renderApp();
}

async function showAdminPanel() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  // Set page state and render admin panel
  localStorage.setItem("currentPage", "adminPanel");
  updateNavigationState("admin");
  renderAdminPanel();
}

async function showProfile() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Set page state and render profile page
  localStorage.setItem("currentPage", "profile");
  updateNavigationState("profile");
  renderProfilePage();
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
