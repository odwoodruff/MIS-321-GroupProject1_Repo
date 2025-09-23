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
