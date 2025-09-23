let notificationPollingInterval = null;

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

async function loadNotifications() {
  try {
    if (!currentUser) return;

    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "/api/Notification")}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const apiNotifications = await response.json();
      console.log("Notifications from API:", apiNotifications);

      // Convert API notifications to our format
      notifications = apiNotifications.map((notif) => ({
        id: notif.id,
        message: notif.message,
        type: notif.type || "info",
        read: notif.read || false,
        dateCreated: notif.dateCreated,
        relatedBookId: notif.relatedBookId,
        relatedUserId: notif.relatedUserId,
      }));

      console.log("Converted notifications:", notifications);
    } else {
      console.error("Failed to load notifications:", response.status);
      // Don't clear existing data on API failure
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    // Don't clear existing data on error
  }
}

function addNotification(notification) {
  notifications.unshift(notification);
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const unreadCount = notifications.filter((notif) => !notif.read).length;
  const badge = document.getElementById("notificationBadge");
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "inline";
    } else {
      badge.style.display = "none";
    }
  }
}

function updateNotificationBadgeForSeller(sellerEmail) {
  // This function is now handled by the API notification system
  // No need to update badge for specific seller
  updateNotificationBadge();
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
      // Update local notification
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
