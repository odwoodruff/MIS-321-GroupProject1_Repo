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
    console.log("Adding book with data:", bookData);
    console.log("Current auth token:", authToken);
    console.log("Current user:", currentUser);
    console.log("Auth headers:", getAuthHeaders());

    const response = await fetch(CONFIG.API_BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bookData),
    });

    console.log("Add book response status:", response.status);

    if (!response.ok) {
      if (response.status === 401) {
        showAlert("Please sign in to add a book", "warning");
        return;
      }
      const errorText = await response.text();
      console.error("Add book error response:", errorText);

      // Show specific validation errors to user
      if (response.status === 400 && errorText.includes("Validation errors:")) {
        const errorMessage = errorText.replace("Validation errors: ", "");
        showAlert(`Please fix the following issues: ${errorMessage}`, "danger");
        return; // Don't close the form, let user fix the errors
      }

      // Handle other 400 errors (like validation errors from backend)
      if (response.status === 400) {
        let errorMessage = "Please check your input and try again.";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If not JSON, use the raw text
          if (errorText && errorText.trim()) {
            errorMessage = errorText;
          }
        }
        showAlert(errorMessage, "danger");
        return; // Don't close the form, let user fix the errors
      }

      throw new Error("Failed to add book");
    }

    const result = await response.json();
    console.log("Add book success:", result);

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
      const errorText = await response.text();
      console.error("Update book error response:", errorText);

      // Show specific validation errors to user
      if (response.status === 400 && errorText.includes("Validation errors:")) {
        const errorMessage = errorText.replace("Validation errors: ", "");
        showAlert(`Please fix the following issues: ${errorMessage}`, "danger");
        return; // Don't close the form, let user fix the errors
      }

      throw new Error("Failed to update book");
    }
    await loadBooks();

    // Check if we're on My Books page and stay there
    const currentPage = localStorage.getItem("currentPage");
    if (currentPage === "myBooks") {
      renderMyBooksPage();
    } else {
      renderApp();
    }

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

    // Check if we're on My Books page and stay there
    const currentPage = localStorage.getItem("currentPage");
    if (currentPage === "myBooks") {
      renderMyBooksPage();
    } else {
      renderApp();
    }

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
      ratings = await response.json();
    } else {
      console.error("Failed to load my ratings:", response.status);
      ratings = [];
    }
  } catch (error) {
    console.error("Error loading my ratings:", error);
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
      ratings = await response.json();
    } else {
      console.error("Failed to load all ratings:", response.status);
      ratings = [];
    }
  } catch (error) {
    console.error("Error loading all ratings:", error);
    ratings = [];
  }
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
      const data = await response.json();
      contactedSellers = new Set(
        data.map((item) => `${item.sellerEmail}-${item.bookId}`)
      );
      console.log("Loaded contacted sellers from API:", contactedSellers);
    } else {
      console.error("Failed to load contacted sellers:", response.status);
      // Keep existing data if API fails
    }
  } catch (error) {
    console.error("Error loading contacted sellers:", error);
    // Keep existing data if API fails
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
      const data = await response.json();
      ratedBooks = new Set(
        data.map(
          (item) => `${item.raterEmail}-${item.sellerEmail}-${item.bookId}`
        )
      );
      console.log("Loaded rated books from API:", ratedBooks);
    } else {
      console.error("Failed to load rated books:", response.status);
      // Keep existing data if API fails
    }
  } catch (error) {
    console.error("Error loading rated books:", error);
    // Keep existing data if API fails
  }
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
      const data = await response.json();
      promptedToRate = new Set(
        data.map((item) => `${item.sellerEmail}-${item.bookId}`)
      );
      console.log("Loaded prompted to rate from API:", promptedToRate);
    } else {
      console.error("Failed to load prompted to rate:", response.status);
      // Keep existing data if API fails
    }
  } catch (error) {
    console.error("Error loading prompted to rate:", error);
    // Keep existing data if API fails
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

// Admin Panel Functions
async function loadAllUsers() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/existing-users`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error("Failed to load users:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
}

async function loadBackups() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/backups`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error("Failed to load backups:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Error loading backups:", error);
    return [];
  }
}
