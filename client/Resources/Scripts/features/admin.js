function editRating(ratingId) {
  const rating = ratings.find((r) => r.id === ratingId);
  if (rating) {
    console.log("Editing rating:", rating); // Debug log
    showAdminRatingModal(rating);
  } else {
    showAlert("Rating not found", "danger");
  }
}

async function createSampleRatings() {
  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  try {
    // First, clear all existing ratings to avoid conflicts
    const clearResponse = await fetch(
      `${CONFIG.API_BASE_URL}/Dev/clear-all-ratings`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );

    if (!clearResponse.ok) {
      console.warn("Could not clear existing ratings, continuing anyway...");
    }

    // Using dummy user IDs (1000-1999 range) to avoid conflicts with real users

    // Create dummy users and get their actual assigned IDs
    const dummyUserData = [
      {
        username: "dummy_user_1",
        email: "dummy1@example.com",
        firstName: "Dummy",
        lastName: "User1",
      },
      {
        username: "dummy_user_2",
        email: "dummy2@example.com",
        firstName: "Dummy",
        lastName: "User2",
      },
      {
        username: "dummy_user_3",
        email: "dummy3@example.com",
        firstName: "Dummy",
        lastName: "User3",
      },
      {
        username: "dummy_user_4",
        email: "dummy4@example.com",
        firstName: "Dummy",
        lastName: "User4",
      },
      {
        username: "dummy_user_5",
        email: "dummy5@example.com",
        firstName: "Dummy",
        lastName: "User5",
      },
    ];

    const dummyUserIds = [];

    // Create dummy users and collect their actual IDs
    for (const userData of dummyUserData) {
      const createUserResponse = await fetch(
        `${CONFIG.API_BASE_URL}/Dev/create-dummy-user`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(userData),
        }
      );

      if (createUserResponse.ok) {
        const result = await createUserResponse.json();
        dummyUserIds.push(result.userId);
        console.log(
          `Created dummy user: ${userData.username} with ID ${result.userId}`
        );
      } else {
        console.warn(
          `Could not create dummy user ${userData.username}, continuing...`
        );
      }
    }

    if (dummyUserIds.length < 2) {
      showAlert(
        "Could not create enough dummy users for sample ratings",
        "warning"
      );
      return;
    }
    const sampleRatings = [];
    const usedCombinations = new Set();

    // Generate 6 random ratings between dummy users
    for (let i = 0; i < 6; i++) {
      let raterId, ratedUserId, bookId;
      let combination;

      // Ensure we don't create duplicate combinations
      do {
        raterId = dummyUserIds[Math.floor(Math.random() * dummyUserIds.length)];
        ratedUserId =
          dummyUserIds[Math.floor(Math.random() * dummyUserIds.length)];
        bookId = Math.floor(Math.random() * 5) + 1; // Books 1-5
        combination = `${raterId}-${ratedUserId}-${bookId}`;
      } while (raterId === ratedUserId || usedCombinations.has(combination));

      usedCombinations.add(combination);

      sampleRatings.push({
        ratedUserId: ratedUserId,
        bookId: bookId,
        score: Math.floor(Math.random() * 5) + 1, // 1-5 stars
        comment: [
          "Great seller, book was in excellent condition!",
          "Fast response and easy transaction.",
          "Book was okay, some highlighting as described.",
          "Perfect condition, would buy again!",
          "Good communication, book as described.",
          "Quick delivery, satisfied with purchase.",
        ][Math.floor(Math.random() * 6)],
      });
    }

    // Submit all sample ratings
    for (const ratingData of sampleRatings) {
      await submitRating(
        ratingData.ratedUserId,
        ratingData.bookId,
        ratingData.score,
        ratingData.comment
      );
    }

    // Reload ratings and refresh the page
    await loadAllRatings();
    renderAdminRatingManagement();
    showAlert("Sample ratings created successfully!", "success");
  } catch (error) {
    console.error("Error creating sample ratings:", error);
    showAlert("Failed to create sample ratings", "danger");
  }
}

// Admin Panel Functions
async function loadAllUsers() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Admin/users`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const usersList = document.getElementById("usersList");

    if (data.users && data.users.length > 0) {
      const usersTable = `
        <table class="table admin-table">
          <thead class="admin-table-header">
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Name</th>
              <th>Rating</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="admin-table-body">
            ${data.users
              .map(
                (user) => `
              <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.averageRating.toFixed(1)} (${user.ratingCount})</td>
                <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${
                    user.id
                  })">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${
                    user.id
                  })">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p class="text-muted">Total users: ${data.totalCount}</p>
      `;
      usersList.innerHTML = usersTable;
    } else {
      usersList.innerHTML = '<p class="text-muted">No users found</p>';
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("Failed to load users", "danger");
  }
}

async function searchUserByUsername() {
  const username = document.getElementById("usernameSearch").value.trim();
  if (!username) {
    showAlert("Please enter a username to search", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/search-users-by-username/${encodeURIComponent(username)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const usersList = document.getElementById("usersList");

    if (data.users && data.users.length > 0) {
      const usersTable = `
        <table class="table admin-table">
          <thead class="admin-table-header">
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Name</th>
              <th>Rating</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="admin-table-body">
            ${data.users
              .map(
                (user) => `
              <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.averageRating.toFixed(1)} (${user.ratingCount})</td>
                <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${
                    user.id
                  })">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${
                    user.id
                  })">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p class="text-muted">Found ${
          data.users.length
        } user(s) matching "${username}"</p>
      `;
      usersList.innerHTML = usersTable;
    } else {
      usersList.innerHTML = `<p class="text-muted">No users found matching "${username}"</p>`;
    }
  } catch (error) {
    console.error("Error searching users:", error);
    showAlert("Failed to search users", "danger");
  }
}

// Debounced search functionality
let userSearchTimeout;

function handleUserSearchInput() {
  // Clear existing timeout
  if (userSearchTimeout) {
    clearTimeout(userSearchTimeout);
  }

  // Set new timeout for 1 second
  userSearchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("usernameSearch").value.trim();
    if (searchTerm === "") {
      // Empty search shows all users
      loadAllUsers();
    } else {
      // Search for users starting with the term
      searchUserByUsername();
    }
  }, 1000);
}

// Handle user ID search input
let userIdSearchTimeout;

function handleUserIdSearchInput() {
  // Clear existing timeout
  if (userIdSearchTimeout) {
    clearTimeout(userIdSearchTimeout);
  }

  // Set new timeout for 1 second
  userIdSearchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("userIdSearch").value.trim();
    if (searchTerm === "") {
      // Empty search shows all users
      loadAllUsers();
    } else {
      // Search for user by ID
      searchUserById();
    }
  }, 1000);
}

async function searchUserById() {
  const userId = document.getElementById("userIdSearch").value.trim();
  if (!userId) {
    loadAllUsers();
    return;
  }

  if (isNaN(userId)) {
    showAlert("Please enter a valid user ID", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/user-by-id/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        const usersList = document.getElementById("usersList");
        usersList.innerHTML = `<p class="text-muted">No user found with ID ${userId}</p>`;
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user = await response.json();
    const usersList = document.getElementById("usersList");

    const usersTable = `
      <table class="table admin-table">
        <thead class="admin-table-header">
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Name</th>
            <th>Rating</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody class="admin-table-body">
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.averageRating.toFixed(1)} (${user.ratingCount})</td>
            <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${
                user.id
              })">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${
                user.id
              })">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="text-muted">Found user with ID ${userId}</p>
    `;
    usersList.innerHTML = usersTable;
  } catch (error) {
    console.error("Error searching user by ID:", error);
    showAlert("Failed to search user by ID", "danger");
  }
}

// Book management functions
let bookSearchTimeout;

function handleBookSearchInput() {
  // Clear existing timeout
  if (bookSearchTimeout) {
    clearTimeout(bookSearchTimeout);
  }

  // Set new timeout for 1 second
  bookSearchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("bookSearch").value.trim();
    if (searchTerm === "") {
      // Empty search shows all books
      loadAllBooks();
    } else {
      // Search for books containing the term
      searchBooks();
    }
  }, 1000);
}

// Handle book ID search input
let bookIdSearchTimeout;

function handleBookIdSearchInput() {
  // Clear existing timeout
  if (bookIdSearchTimeout) {
    clearTimeout(bookIdSearchTimeout);
  }

  // Set new timeout for 1 second
  bookIdSearchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("bookIdSearch").value.trim();
    if (searchTerm === "") {
      // Empty search shows all books
      loadAllBooks();
    } else {
      // Search for book by ID
      searchBookById();
    }
  }, 1000);
}

async function searchBookById() {
  const bookId = document.getElementById("bookIdSearch").value.trim();
  if (!bookId) {
    loadAllBooks();
    return;
  }

  if (isNaN(bookId)) {
    showAlert("Please enter a valid book ID", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Book/${bookId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        const booksList = document.getElementById("booksList");
        booksList.innerHTML = `<p class="text-muted">No book found with ID ${bookId}</p>`;
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const book = await response.json();
    const booksList = document.getElementById("booksList");

    const booksTable = `
      <table class="table admin-table">
        <thead class="admin-table-header">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Author</th>
            <th>Price</th>
            <th>Seller</th>
            <th>Status</th>
            <th>Posted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody class="admin-table-body">
          <tr>
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>$${book.price.toFixed(2)}</td>
            <td>${book.sellerName}</td>
            <td>
              <span class="badge ${
                book.isAvailable ? "bg-success" : "bg-secondary"
              }">
                ${book.isAvailable ? "Available" : "Sold"}
              </span>
            </td>
            <td>${new Date(book.datePosted).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" onclick="editBook(${
                book.id
              })">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${
                book.id
              })">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="text-muted">Found book with ID ${bookId}</p>
    `;
    booksList.innerHTML = booksTable;
  } catch (error) {
    console.error("Error searching book by ID:", error);
    showAlert("Failed to search book by ID", "danger");
  }
}

async function loadAllBooks() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Book/all`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const books = await response.json();
    const booksList = document.getElementById("booksList");

    if (books && books.length > 0) {
      const booksTable = `
        <table class="table admin-table">
          <thead class="admin-table-header">
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Price</th>
              <th>Seller</th>
              <th>Status</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="admin-table-body">
            ${books
              .map(
                (book) => `
              <tr>
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>$${book.price.toFixed(2)}</td>
                <td>${book.sellerName}</td>
                <td>
                  <span class="badge ${
                    book.isAvailable ? "bg-success" : "bg-secondary"
                  }">
                    ${book.isAvailable ? "Available" : "Sold"}
                  </span>
                </td>
                <td>${new Date(book.datePosted).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" onclick="editBook(${
                    book.id
                  })">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${
                    book.id
                  })">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p class="text-muted">Total books: ${books.length}</p>
      `;
      booksList.innerHTML = booksTable;
    } else {
      booksList.innerHTML = '<p class="text-muted">No books found</p>';
    }
  } catch (error) {
    console.error("Error loading books:", error);
    showAlert("Failed to load books", "danger");
  }
}

async function searchBooks() {
  const searchTerm = document.getElementById("bookSearch").value.trim();
  if (!searchTerm) {
    loadAllBooks();
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Book/search?term=${encodeURIComponent(searchTerm)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const books = await response.json();
    const booksList = document.getElementById("booksList");

    if (books && books.length > 0) {
      const booksTable = `
        <table class="table admin-table">
          <thead class="admin-table-header">
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Price</th>
              <th>Seller</th>
              <th>Status</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="admin-table-body">
            ${books
              .map(
                (book) => `
              <tr>
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>$${book.price.toFixed(2)}</td>
                <td>${book.sellerName}</td>
                <td>
                  <span class="badge ${
                    book.isAvailable ? "bg-success" : "bg-secondary"
                  }">
                    ${book.isAvailable ? "Available" : "Sold"}
                  </span>
                </td>
                <td>${new Date(book.datePosted).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" onclick="editBook(${
                    book.id
                  })">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${
                    book.id
                  })">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p class="text-muted">Found ${
          books.length
        } book(s) matching "${searchTerm}"</p>
      `;
      booksList.innerHTML = booksTable;
    } else {
      booksList.innerHTML = `<p class="text-muted">No books found matching "${searchTerm}"</p>`;
    }
  } catch (error) {
    console.error("Error searching books:", error);
    showAlert("Failed to search books", "danger");
  }
}

async function editBook(bookId) {
  // For now, just show an alert - can be expanded later
  showAlert("Edit functionality coming soon!", "info");
}

async function deleteBook(bookId) {
  if (
    confirm(
      "Are you sure you want to delete this book? This action cannot be undone."
    )
  ) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Book/${bookId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showAlert("Book deleted successfully", "success");
      loadAllBooks(); // Refresh the list
    } catch (error) {
      console.error("Error deleting book:", error);
      showAlert("Failed to delete book", "danger");
    }
  }
}

async function checkRateLimit() {
  const identifier = document
    .getElementById("rateLimitIdentifier")
    .value.trim();
  if (!identifier) {
    showAlert("Please enter an identifier to check", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/rate-limit-status/${encodeURIComponent(identifier)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const statusDiv = document.getElementById("rateLimitStatus");

    const alertClass = data.isRateLimited ? "alert-danger" : "alert-success";
    statusDiv.className = `alert ${alertClass}`;
    statusDiv.innerHTML = `
      <h6>Rate Limit Status for: ${data.identifier}</h6>
      <p><strong>Is Rate Limited:</strong> ${
        data.isRateLimited ? "Yes" : "No"
      }</p>
      <p><strong>Remaining Requests:</strong> ${data.remainingRequests}</p>
    `;
  } catch (error) {
    console.error("Error checking rate limit:", error);
    showAlert("Failed to check rate limit status", "danger");
  }
}

async function resetRateLimit() {
  const identifier = document
    .getElementById("rateLimitIdentifier")
    .value.trim();
  if (!identifier) {
    showAlert("Please enter an identifier to reset", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/reset-rate-limit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier,
          actionType: "general",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the rate limit status
    await checkRateLimit();
  } catch (error) {
    console.error("Error resetting rate limit:", error);
    showAlert("Failed to reset rate limit", "danger");
  }
}

async function createBackup() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Backup/create`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the backup list
    await loadBackups();
  } catch (error) {
    console.error("Error creating backup:", error);
    showAlert("Failed to create backup", "danger");
  }
}

async function loadBackups() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Backup/list`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const backupsList = document.getElementById("backupsList");

    if (data && data.length > 0) {
      const backupsTable = `
        <table class="table admin-table">
          <thead class="admin-table-header">
            <tr>
              <th>File Name</th>
              <th>Created Date</th>
              <th>File Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="admin-table-body">
            ${data
              .map(
                (backup) => `
              <tr>
                <td>${backup.fileName}</td>
                <td>${new Date(backup.createdDate).toLocaleString()}</td>
                <td>${(backup.fileSize / 1024).toFixed(1)} KB</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" onclick="downloadBackup('${
                    backup.fileName
                  }')">
                    <i class="bi bi-download"></i> Download
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteBackup('${
                    backup.fileName
                  }')">
                    <i class="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      backupsList.innerHTML = backupsTable;
    } else {
      backupsList.innerHTML = '<p class="text-muted">No backups found</p>';
    }
  } catch (error) {
    console.error("Error loading backups:", error);
    showAlert("Failed to load backups", "danger");
  }
}

async function downloadBackup(fileName) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Backup/download/${fileName}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading backup:", error);
    showAlert("Failed to download backup", "danger");
  }
}

// User management functions
async function editUser(userId) {
  try {
    // Fetch user details
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/user-by-id/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user = await response.json();

    // Create edit modal
    const modalHtml = `
      <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editUserModalLabel">
                <i class="bi bi-pencil"></i> Edit User: ${user.username}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="editUserForm">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="editUsername" class="form-label">Username</label>
                      <input type="text" class="form-control" id="editUsername" value="${user.username}">
                    </div>
                    <div class="mb-3">
                      <label for="editEmail" class="form-label">Email</label>
                      <input type="email" class="form-control" id="editEmail" value="${user.email}">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="editFirstName" class="form-label">First Name</label>
                      <input type="text" class="form-control" id="editFirstName" value="${user.firstName}">
                    </div>
                    <div class="mb-3">
                      <label for="editLastName" class="form-label">Last Name</label>
                      <input type="text" class="form-control" id="editLastName" value="${user.lastName}">
                    </div>
                  </div>
                </div>
                <div class="alert alert-info">
                  <i class="bi bi-info-circle"></i>
                  <strong>Note:</strong> Clearing the first or last name will prompt the user to re-enter their name on next login.
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger me-2" onclick="clearUserName(${user.id})">
                <i class="bi bi-person-x"></i> Clear Names
              </button>
              <button type="button" class="btn btn-primary" onclick="saveUserChanges(${user.id})">
                <i class="bi bi-check"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if it exists
    const existingModal = document.getElementById("editUserModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading user for edit:", error);
    showAlert("Failed to load user details", "danger");
  }
}

async function saveUserChanges(userId) {
  try {
    const username = document.getElementById("editUsername").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const firstName = document.getElementById("editFirstName").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();

    if (!username || !email) {
      showAlert("Username and email are required", "warning");
      return;
    }

    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/update-user/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          firstName,
          lastName,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    showAlert("User updated successfully", "success");

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editUserModal")
    );
    if (modal) {
      modal.hide();
    }

    // Refresh the users list
    loadAllUsers();
  } catch (error) {
    console.error("Error updating user:", error);
    showAlert("Failed to update user", "danger");
  }
}

async function clearUserName(userId) {
  if (
    confirm(
      "Are you sure you want to clear this user's first and last name? They will be prompted to re-enter their name on next login."
    )
  ) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL.replace(
          "/api/Book",
          ""
        )}/api/Admin/clear-user-name/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showAlert(
        "User name cleared successfully. They will be prompted to re-enter their name on next login.",
        "success"
      );

      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editUserModal")
      );
      if (modal) {
        modal.hide();
      }

      // Refresh the users list
      loadAllUsers();
    } catch (error) {
      console.error("Error clearing user name:", error);
      showAlert("Failed to clear user name", "danger");
    }
  }
}

async function deleteUser(userId) {
  if (
    confirm(
      "Are you sure you want to delete this user? This will soft delete the user and all their associated data (books, ratings, contacts). This action cannot be undone."
    )
  ) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL.replace(
          "/api/Book",
          ""
        )}/api/Admin/delete-user/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showAlert("User deleted successfully", "success");

      // Refresh the users list
      loadAllUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      showAlert("Failed to delete user", "danger");
    }
  }
}

async function deleteBackup(fileName) {
  if (!confirm(`Are you sure you want to delete backup "${fileName}"?`)) {
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Backup/${fileName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the backup list
    await loadBackups();
  } catch (error) {
    console.error("Error deleting backup:", error);
    showAlert("Failed to delete backup", "danger");
  }
}

// Support Tickets Management
let supportTickets = [];
let selectedTicket = null;

async function loadSupportTickets() {
  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  try {
    console.log("Loading support tickets...");
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/support-tickets`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    supportTickets = await response.json();
    console.log("Loaded support tickets:", supportTickets);
    console.log("Number of tickets loaded:", supportTickets.length);

    // Log each ticket for debugging
    supportTickets.forEach((ticket, index) => {
      console.log(`Ticket ${index + 1}:`, {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        user: ticket.user
          ? `${ticket.user.firstName} ${ticket.user.lastName}`
          : "No user",
        dateCreated: ticket.dateCreated,
      });
    });

    renderSupportTickets();

    // Force dark mode styling for ticket cards
    setTimeout(() => {
      const isDarkMode =
        document.documentElement.getAttribute("data-bs-theme") === "dark";
      if (isDarkMode) {
        const ticketCards = document.querySelectorAll(".ticket-card");
        ticketCards.forEach((card) => {
          card.style.backgroundColor = "#343a40";
          card.style.color = "#e9ecef";
          card.style.border = "1px solid #495057";

          // Style all child elements
          const childElements = card.querySelectorAll("*");
          childElements.forEach((el) => {
            el.style.color = "#e9ecef";
          });
        });
        console.log(
          `Applied dark mode styling to ${ticketCards.length} ticket cards`
        );
      }
    }, 100);
  } catch (error) {
    console.error("Error loading support tickets:", error);
    showAlert("Failed to load support tickets", "danger");
  }
}

function renderSupportTickets() {
  const container = document.getElementById("supportTicketsContainer");
  if (!container) {
    console.error("Support tickets container not found!");
    return;
  }

  console.log("Rendering support tickets...");
  console.log("Total tickets:", supportTickets.length);

  const openTickets = supportTickets.filter(
    (ticket) => ticket.status !== "Resolved" && ticket.status !== "Closed"
  );
  const closedTickets = supportTickets.filter(
    (ticket) => ticket.status === "Resolved" || ticket.status === "Closed"
  );

  console.log("Open tickets:", openTickets.length);
  console.log("Closed tickets:", closedTickets.length);

  container.innerHTML = `
    <div class="support-tickets-header">
      <h3>Support Tickets Management</h3>
      <div class="ticket-tabs">
        <button class="tab-btn active" onclick="switchTicketTab('open')">
          Open Tickets (${openTickets.length})
        </button>
        <button class="tab-btn" onclick="switchTicketTab('closed')">
          Closed Tickets (${closedTickets.length})
        </button>
      </div>
    </div>
    
    <div id="openTicketsTab" class="ticket-tab-content">
      ${renderTicketList(openTickets)}
    </div>
    
    <div id="closedTicketsTab" class="ticket-tab-content" style="display: none;">
      ${renderTicketList(closedTickets)}
    </div>
  `;
}

function renderTicketList(tickets) {
  if (tickets.length === 0) {
    return '<div class="no-tickets">No tickets found</div>';
  }

  return `
    <div class="tickets-list">
      ${tickets
        .map(
          (ticket) => `
        <div class="ticket-card" onclick="selectSupportTicket(${
          ticket.id
        })" style="background-color: var(--bs-body-bg, #f8f9fa); color: var(--bs-body-color, #212529); border: 1px solid var(--bs-border-color, #dee2e6);">
          <div class="ticket-header">
            <span class="ticket-id">#${ticket.id}</span>
            <span class="ticket-status status-${ticket.status
              .toLowerCase()
              .replace(" ", "-")}">${ticket.status}</span>
          </div>
          <div class="ticket-subject">${ticket.subject}</div>
          <div class="ticket-user">User: ${
            ticket.user
              ? ticket.user.firstName + " " + ticket.user.lastName
              : "Unknown"
          }</div>
          <div class="ticket-date">Created: ${new Date(
            ticket.dateCreated
          ).toLocaleDateString()}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function switchTicketTab(tab) {
  // Update tab buttons
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  // Show/hide tab content
  document.getElementById("openTicketsTab").style.display =
    tab === "open" ? "block" : "none";
  document.getElementById("closedTicketsTab").style.display =
    tab === "closed" ? "block" : "none";
}

async function selectSupportTicket(ticketId) {
  try {
    console.log("selectSupportTicket called with ID:", ticketId);
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/support-ticket/${ticketId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    selectedTicket = await response.json();
    console.log("Selected ticket:", selectedTicket);
    showAdminSupportTicketModal();
  } catch (error) {
    console.error("Error loading support ticket:", error);
    showAlert("Failed to load support ticket details", "danger");
  }
}

// Make function globally accessible
window.selectSupportTicket = selectSupportTicket;

function showAdminSupportTicketModal() {
  console.log("showAdminSupportTicketModal called");
  console.log("selectedTicket:", selectedTicket);
  if (!selectedTicket) {
    console.log("No selected ticket, returning");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content support-ticket-modal">
      <div class="modal-header">
        <h3>Support Ticket #${selectedTicket.id}</h3>
        <button class="close-btn" onclick="closeSupportTicketModal()">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="ticket-details">
          <div class="detail-row">
            <label>Subject:</label>
            <span>${selectedTicket.subject}</span>
          </div>
          
          <div class="detail-row">
            <label>User:</label>
            <span>${
              selectedTicket.user
                ? selectedTicket.user.firstName +
                  " " +
                  selectedTicket.user.lastName
                : "Unknown"
            }</span>
          </div>
          
          <div class="detail-row">
            <label>Email:</label>
            <span>${
              selectedTicket.user ? selectedTicket.user.email : "Unknown"
            }</span>
          </div>
          
          <div class="detail-row">
            <label>Status:</label>
            <select id="ticketStatus" class="form-control">
              <option value="Open" ${
                selectedTicket.status === "Open" ? "selected" : ""
              }>Open</option>
              <option value="In Progress" ${
                selectedTicket.status === "In Progress" ? "selected" : ""
              }>In Progress</option>
              <option value="Resolved" ${
                selectedTicket.status === "Resolved" ? "selected" : ""
              }>Resolved</option>
              <option value="Closed" ${
                selectedTicket.status === "Closed" ? "selected" : ""
              }>Closed</option>
            </select>
          </div>
          
          <div class="detail-row">
            <label>Created:</label>
            <span>${new Date(
              selectedTicket.dateCreated
            ).toLocaleString()}</span>
          </div>
          
          ${
            selectedTicket.dateResolved
              ? `
          <div class="detail-row">
            <label>Resolved:</label>
            <span>${new Date(
              selectedTicket.dateResolved
            ).toLocaleString()}</span>
          </div>
          `
              : ""
          }
          
          <div class="detail-row">
            <label>Message:</label>
            <div class="ticket-message">${selectedTicket.message}</div>
          </div>
          
          <div class="detail-row">
            <label>Admin Response:</label>
            <textarea id="adminResponse" class="form-control" rows="4" placeholder="Enter admin response...">${
              selectedTicket.adminResponse || ""
            }</textarea>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeSupportTicketModal()">Cancel</button>
        <button class="btn btn-primary" onclick="updateSupportTicket()">Update Ticket</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Show the modal
  modal.style.display = "block";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  console.log("Modal added to DOM and displayed");
}

// Make functions globally accessible
window.showAdminSupportTicketModal = showAdminSupportTicketModal;
window.closeSupportTicketModal = closeSupportTicketModal;
window.updateSupportTicket = updateSupportTicket;

function closeSupportTicketModal() {
  const modal = document
    .querySelector(".support-ticket-modal")
    .closest(".modal");
  if (modal) {
    modal.remove();
  }
  selectedTicket = null;
}

async function updateSupportTicket() {
  if (!selectedTicket) return;

  const status = document.getElementById("ticketStatus").value;
  const adminResponse = document.getElementById("adminResponse").value;

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/support-ticket/${selectedTicket.id}/update`,
      {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
          adminResponse: adminResponse,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    closeSupportTicketModal();
    await loadSupportTickets(); // Refresh the list
  } catch (error) {
    console.error("Error updating support ticket:", error);
    showAlert("Failed to update support ticket", "danger");
  }
}

// Create Sample Support Tickets
async function createSampleSupportTickets() {
  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  try {
    const url = `${CONFIG.API_BASE_URL.replace(
      "/api/Book",
      ""
    )}/api/Dev/create-sample-support-tickets`;

    console.log("Creating sample support tickets...");
    console.log("API URL:", url);
    console.log("Auth headers:", getAuthHeaders());

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Sample tickets created:", data);
    showAlert(data.message, "success");

    // Refresh the support tickets list to show the new tickets
    console.log("Refreshing support tickets list...");
    await loadSupportTickets();
  } catch (error) {
    console.error("Error creating sample support tickets:", error);
    showAlert("Failed to create sample support tickets", "danger");
  }
}

// Add test support tickets (simpler version)
async function addTestSupportTickets() {
  try {
    console.log("Adding test support tickets...");

    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Dev/add-test-support-tickets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );

    console.log("Test tickets response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Test tickets created successfully:", result);

    showAlert(
      `Successfully created ${result.tickets.length} test support tickets!`,
      "success"
    );

    // Reload the support tickets to show the new ones
    await loadSupportTickets();
  } catch (error) {
    console.error("Error adding test support tickets:", error);
    showAlert("Error adding test support tickets: " + error.message, "danger");
  }
}
