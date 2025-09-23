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

// loadNotifications() function moved to utils/helpers.js to consolidate duplicates

function addNotification(notification) {
  notifications.unshift(notification);
  updateNotificationBadge();
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
