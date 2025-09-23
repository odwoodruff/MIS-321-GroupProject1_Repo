// Rating Functions
async function loadRatings() {
  try {
    if (!currentUser) return;

    if (isAdmin()) {
      await loadAllRatings();
    } else {
      // Load user-specific ratings for regular users
      await loadMyRatings();
    }
  } catch (error) {
    console.error("Error loading ratings:", error);
    ratings = [];
  }
}

async function loadMyRatings() {
  try {
    const response = await fetch(
      `${CONFIG.RATING_API_URL}/ratings/ratings-for-me`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const myRatings = await response.json();
      console.log("My ratings from API:", myRatings); // Debug log
      console.log("First rating structure:", myRatings[0]); // Debug log

      // Set ratings to user's ratings
      ratings = myRatings || [];
      console.log("User: Loaded my ratings", myRatings.length);
      console.log("Current ratings array:", ratings); // Debug log

      // Populate rated books from existing ratings
      if (currentUser && myRatings) {
        console.log("Populating rated books from existing ratings:", myRatings);
        myRatings.forEach((rating) => {
          // Find the book to get seller email
          const book = books.find((b) => b.id === rating.bookId);
          if (book) {
            const ratingKey = `${currentUser.email}-${book.sellerEmail}-${rating.bookId}`;
            console.log("Adding rating key:", ratingKey);
            ratedBooks.add(ratingKey);
          }
        });
        saveRatedBooks();
        console.log("Current rated books set:", Array.from(ratedBooks));
      }
    } else {
      console.error(
        "Failed to load my ratings:",
        response.status,
        response.statusText
      );
      ratings = []; // Set empty array if API fails
      showAlert("Failed to load my ratings", "danger");
    }
  } catch (error) {
    console.error("Error loading my ratings:", error);
    ratings = []; // Set empty array if error occurs
    showAlert("Error loading my ratings", "danger");
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

async function loadRatedBooks() {
  if (!currentUser) {
    console.log("No current user, skipping loadRatedBooks");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/rated-books`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const ratedBooksList = await response.json();
      ratedBooks = new Set(ratedBooksList);
      console.log("Loaded rated books from API:", ratedBooks);
    } else {
      console.error("Failed to load rated books:", response.status);
      // Don't clear existing data on API failure
      console.log("Preserving existing rated books:", ratedBooks);
    }
  } catch (error) {
    console.error("Error loading rated books:", error);
    // Don't clear existing data on API failure
    console.log("Preserving existing rated books:", ratedBooks);
  }
}

async function saveRatedBooks() {
  if (!currentUser) return;

  // This function is now handled by the rating creation API call
  // No need to save to localStorage anymore
}

async function loadPromptedToRate() {
  if (!currentUser) return;

  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/prompted-to-rate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const promptedToRateList = await response.json();
      promptedToRate = new Set(promptedToRateList);
      console.log("Loaded prompted to rate from API:", promptedToRate);
    } else {
      console.error("Failed to load prompted to rate:", response.status);
      // Don't clear existing data on API failure
      console.log("Preserving existing prompted to rate:", promptedToRate);
    }
  } catch (error) {
    console.error("Error loading prompted to rate:", error);
    // Don't clear existing data on API failure
    console.log("Preserving existing prompted to rate:", promptedToRate);
  }
}

async function savePromptedToRate() {
  if (!currentUser) return;

  // This function is now handled by the addPromptedToRate API call
  // No need to save to localStorage anymore
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

    // Track this specific rating combination using emails
    const book = books.find((b) => b.id === bookId);
    if (book) {
      const ratingKey = `${currentUser.email}-${book.sellerEmail}-${bookId}`;
      console.log("Adding rating key after submission:", ratingKey);
      ratedBooks.add(ratingKey);
      saveRatedBooks();
      console.log("Updated rated books set:", Array.from(ratedBooks));
    }

    // Reload ratings to update the My Ratings page
    await loadRatings();

    return rating;
  } catch (error) {
    console.error("Error submitting rating:", error);
    showAlert("Failed to submit rating: " + error.message, "danger");
    return null;
  }
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

    // Refresh the UI to show the "Rated" button
    const currentPage = localStorage.getItem("currentPage");
    if (currentPage === "contactedBooks") {
      renderContactedBooksPage();
    } else {
      renderApp();
    }
  }
}

// Admin Rating Management Functions
async function updateRating(ratingId, score, comment = "") {
  try {
    const response = await fetch(
      `${CONFIG.RATING_API_URL}/ratings/${ratingId}`,
      {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
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
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    showAlert("Rating deleted successfully!", "success");
    await loadRatings(); // Reload ratings

    // Also refresh the my ratings tab if it's currently displayed
    const currentPage = localStorage.getItem("currentPage");
    if (currentPage === "my-ratings") {
      renderMyRatings();
    }

    return true;
  } catch (error) {
    console.error("Error deleting rating:", error);
    showAlert("Failed to delete rating: " + error.message, "danger");
    return false;
  }
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

async function contactSeller(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (book) {
    // Check if user is logged in
    const isAuthenticated = await authCheck();
    if (!isAuthenticated) return;

    // Add seller to contacted list via API
    try {
      const contactResponse = await fetch(
        `${CONFIG.DEV_API_URL}/contacted-sellers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sellerEmail: book.sellerEmail,
            bookId: book.id,
          }),
        }
      );

      if (contactResponse.ok) {
        contactedSellers.add(
          `${currentUser.email}-${book.sellerEmail}-${book.id}`
        );
        // Save to localStorage as backup
        localStorage.setItem(
          "contactedSellers",
          JSON.stringify(Array.from(contactedSellers))
        );
        console.log("Added seller to contacted list via API");
      } else {
        console.warn("Failed to add seller to contacted list via API");
        // Fallback to local set
        contactedSellers.add(
          `${currentUser.email}-${book.sellerEmail}-${book.id}`
        );
        // Save to localStorage as backup
        localStorage.setItem(
          "contactedSellers",
          JSON.stringify(Array.from(contactedSellers))
        );
      }
    } catch (error) {
      console.error("Error adding seller to contacted list:", error);
      // Fallback to local set
      contactedSellers.add(
        `${currentUser.email}-${book.sellerEmail}-${book.id}`
      );
      // Save to localStorage as backup
      localStorage.setItem(
        "contactedSellers",
        JSON.stringify(Array.from(contactedSellers))
      );
    }

    // Create notification for the seller via API
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL.replace("/api/Book", "/api/Notification")}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id, // For demo purposes, create notification for current user
            message: `📚 You contacted ${book.sellerName} about '${book.title}' textbook`,
            type: "info",
            relatedBookId: book.id,
            relatedUserId: currentUser.id,
          }),
        }
      );

      if (response.ok) {
        console.log("Notification created via API");
        // Reload notifications to update the UI
        await loadNotifications();
        updateNotificationBadge();
      } else {
        console.warn(
          "Failed to create notification via API, falling back to localStorage"
        );
        // Fallback to localStorage
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
        addNotification(notification);
        updateNotificationBadgeForSeller(book.sellerEmail);
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      // Fallback to localStorage
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
      addNotification(notification);
      updateNotificationBadgeForSeller(book.sellerEmail);
    }

    // Show thank you popup and ask if they want to rate
    showRatingPromptModal(book);

    // Refresh the UI to show the book in contacted books
    renderApp();
  }
}
