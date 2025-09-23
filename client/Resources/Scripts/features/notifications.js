// Notification-related functions

function addNotification(notification) {
  // This function is deprecated - notifications are now stored in SQL database
  console.warn("addNotification is deprecated - use API instead");
}

async function updateNotificationBadgeForSeller(sellerEmail) {
  // Check if the seller is currently logged in
  if (currentUser && currentUser.email === sellerEmail) {
    // Update the notification badge for the seller
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
      // Update local notifications
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
      updateNotificationBadge();
    } else {
      console.error("Failed to mark notification as read:", response.status);
    }
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
      notifications = apiNotifications;
    } else {
      console.error("Failed to load notifications:", response.status);
      console.log("Preserving existing notifications:", notifications);
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    console.log("Preserving existing notifications:", notifications);
  }
}

function updateNotificationBadge() {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const badge = document.getElementById("notification-badge");
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "inline";
    } else {
      badge.style.display = "none";
    }
  }
}

// showNotifications is defined in navigation.js

function renderNotificationsPage() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Notifications</h2>
            <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          
          <div class="notifications-list">
            ${
              notifications.length === 0
                ? `
              <div class="text-center mt-5">
                <h4>No notifications yet</h4>
                <p>You'll see notifications here when someone contacts you about your books.</p>
              </div>
            `
                : notifications
                    .map(
                      (notification) => `
              <div class="notification-item ${
                notification.read ? "read" : "unread"
              }">
                <div class="notification-content">
                  <h6 class="notification-title">${escapeHtml(
                    notification.title || "New Message"
                  )}</h6>
                  <p class="notification-message">${escapeHtml(
                    notification.message || "You have a new notification"
                  )}</p>
                  <small class="notification-time text-muted">
                    ${new Date(notification.dateCreated).toLocaleString()}
                  </small>
                </div>
                <div class="notification-actions">
                  ${
                    !notification.read
                      ? `
                    <button class="btn btn-sm btn-outline-primary" onclick="markNotificationAsRead(${notification.id})">
                      Mark as Read
                    </button>
                  `
                      : ""
                  }
                </div>
              </div>
            `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    </div>
  `;

  updateNavigationState("notifications");
}

// Notification polling setup
function setupNotificationPolling() {
  // Clear any existing polling interval
  if (notificationPollingInterval) {
    clearInterval(notificationPollingInterval);
    notificationPollingInterval = null;
  }

  // Check for new notifications every 5 seconds when user is logged in
  if (currentUser && authToken) {
    notificationPollingInterval = setInterval(async () => {
      const currentPage = localStorage.getItem("currentPage");
      // Only poll if user is on home page (not on notifications or admin page)
      // and no modals are open and user has a valid token
      if ((!currentPage || currentPage === "") && !isModalOpen() && authToken) {
        try {
          await loadNotifications();
          updateNotificationBadge();
        } catch (error) {
          console.warn("Notification polling failed:", error);
        }
      }
    }, 5000);
  }
}
