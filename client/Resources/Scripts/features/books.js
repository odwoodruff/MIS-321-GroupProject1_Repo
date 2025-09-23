// Book-related functions

// Book rendering and management
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

function renderBooks() {
  // Check if user is authenticated
  if (!currentUser) {
    document.getElementById("app").innerHTML = `
      <div class="container mt-4">
        <div class="row justify-content-center">
          <div class="col-md-8 text-center">
            <h2>Welcome to Roll Tide Books</h2>
            <p class="lead">Please sign in to view and manage books</p>
            <button class="btn btn-primary" onclick="showLoginForm()">Sign In</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const app = document.getElementById("app");
  const filteredBooks = selectedCourse
    ? books.filter((book) => book.courseCode === selectedCourse)
    : books;

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Available Books</h2>
            <button class="btn btn-crimson" onclick="showAddBookForm()">
              <i class="bi bi-plus-circle"></i> Add Book
            </button>
          </div>
          
          <div class="search-container">
            <div class="row">
              <div class="col-md-6">
                <div class="input-group">
                  <input type="text" class="form-control search-input" id="search-input" 
                         placeholder="Search by title, author, or professor..." 
                         value="${escapeHtml(currentSearchTerm)}"
                         onkeyup="handleSearch(event)">
                  <button class="btn search-btn" onclick="handleSearch(event)">
                    <i class="bi bi-search"></i> Search
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <div class="input-group">
                  <select class="form-control" id="course-filter" onchange="selectCourse(this.value)">
                    <option value="">All Courses</option>
                    ${getUniqueCourses()
                      .sort()
                      .map(
                        (course) =>
                          `<option value="${course}" ${
                            selectedCourse === course ? "selected" : ""
                          }>${course}</option>`
                      )
                      .join("")}
                  </select>
                  ${
                    selectedCourse
                      ? `<button class="btn btn-outline-secondary" onclick="clearCourseSelection()" title="Clear course filter"><i class="bi bi-x"></i></button>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
          
          <div class="books-grid mt-4">
            ${filteredBooks
              .map((book, index) => {
                // Insert ad after every 6 books
                if (index > 0 && index % 6 === 0) {
                  return (
                    renderAdCard((Math.floor(index / 6) % 2) + 1) +
                    renderBookCard(book)
                  );
                }
                return renderBookCard(book);
              })
              .join("")}
          </div>
          
          ${
            filteredBooks.length === 0
              ? `
            <div class="text-center mt-5">
              <h4>No books found</h4>
              <p>Try adjusting your search or course filter</p>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  updateNavigationState("");
}

function renderBookCard(book) {
  const conditionInfo = getConditionInfo(book.condition);
  const isRated = ratedBooks.has(
    `${currentUser.email}-${book.sellerEmail}-${book.id}`
  );
  const hasBeenPrompted = promptedToRate.has(`${book.sellerEmail}-${book.id}`);
  const hasContacted = contactedSellers.has(`${book.sellerEmail}-${book.id}`);

  return `
    <div class="book-card">
      <div class="book-icon"></div>
      <div class="book-info">
        <div class="book-details">
          <h5 class="book-title">${escapeHtml(book.title)}</h5>
          <p class="book-author">
            <i class="bi bi-pencil"></i> <strong>Author:</strong> ${escapeHtml(
              book.author
            )}
          </p>
          <div class="book-meta">
            <span><i class="bi bi-bookmark"></i> ${
              book.courseCode || "N/A"
            }</span>
            <span><i class="bi bi-person-badge"></i> ${escapeHtml(
              book.professor || "N/A"
            )}</span>
            <span><i class="bi bi-person-circle"></i> <strong>Sold by:</strong> ${escapeHtml(
              book.sellerName || "Unknown"
            )}</span>
            ${
              book.sellerRating && book.sellerRating > 0
                ? `<span><i class="bi bi-star-fill"></i> ${book.sellerRating.toFixed(
                    1
                  )} (${book.sellerRatingCount})</span>`
                : ""
            }
          </div>
          <p class="book-price">$${book.price}</p>
          <p class="book-condition">
            <span class="badge bg-${getConditionColor(book.condition)} ms-2">${
    book.condition
  }</span>
          </p>
        </div>
        <div class="book-actions">
          ${
            isRated
              ? `
            <button class="btn btn-outline-success btn-sm" disabled>
              <i class="bi bi-star-fill"></i> Rated
            </button>
          `
              : hasBeenPrompted
              ? `<button class="btn btn-outline-warning btn-sm" onclick="showRatingModal(${
                  book.id
                }, '${escapeHtml(book.sellerName)}', '${escapeHtml(
                  book.sellerEmail
                )}')">
                 <i class="bi bi-star"></i> Rate Seller
               </button>`
              : `<button class="btn btn-outline-secondary btn-sm" disabled>
                 <i class="bi bi-star"></i> Rate Seller
               </button>`
          }
          ${
            hasContacted
              ? `
            <button class="btn btn-outline-info btn-sm" disabled>
              <i class="bi bi-envelope-check"></i> Contacted
            </button>
          `
              : `
            <button class="btn btn-primary btn-sm" onclick="contactSeller(${book.id})">
              <i class="bi bi-envelope"></i> Contact Seller
            </button>
          `
          }
          ${
            canEditBook(book)
              ? `
            <button class="btn btn-outline-secondary btn-sm" onclick="editBook(${
              book.id
            })">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="confirmDelete(${
              book.id
            }, '${escapeHtml(book.title)}')">
              <i class="bi bi-trash"></i>
            </button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function renderAdCard(adNumber) {
  const adImage = adNumber === 1 ? "ad1.jpg" : "ad2.jpg";
  return `
    <div class="ad-card" onclick="handleAdClick(${adNumber})">
      <div class="ad-content">
        <div class="ad-image">
          <i class="bi bi-megaphone"></i>
        </div>
        <div class="ad-text">
          <h6>Advertisement</h6>
          <p>Click to learn more</p>
        </div>
      </div>
    </div>
  `;
}

function handleAdClick(adNumber) {
  console.log("Ad clicked:", adNumber);
  showCustomAlert(
    "Advertisement",
    `This is a placeholder for advertisement #${adNumber}. In a real application, this would link to the advertiser's website or show more details.`
  );
}

function showCustomAlert(title, message) {
  // Create custom modal
  const modalHtml = `
    <div class="modal fade" id="customAlertModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("customAlertModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("customAlertModal")
  );
  modal.show();
}

// Book form functions
function renderBookForm() {
  const book = editingBookId ? books.find((b) => b.id === editingBookId) : null;
  const modalHtml = `
    <div class="modal fade" id="bookModal" tabindex="-1" aria-labelledby="bookModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="bookModalLabel">${
              editingBookId ? "Edit Book" : "Add New Book"
            }</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="book-form" onsubmit="handleBookSubmit(event)">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="book-title" class="form-label">Book Title *</label>
                  <input type="text" class="form-control" id="book-title" required 
                         value="${book ? escapeHtml(book.title) : ""}">
                </div>
                <div class="col-md-6 mb-3">
                  <label for="book-author" class="form-label">Author *</label>
                  <input type="text" class="form-control" id="book-author" required 
                         value="${book ? escapeHtml(book.author) : ""}">
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="book-price" class="form-label">Price ($) *</label>
                  <input type="number" class="form-control" id="book-price" step="0.01" min="0" required 
                         value="${book ? book.price : ""}">
                </div>
                <div class="col-md-4 mb-3">
                  <label for="book-condition" class="form-label">Condition *</label>
                  <select class="form-control" id="book-condition" required>
                    <option value="">Select condition</option>
                    <option value="Excellent" ${
                      book && book.condition === "Excellent" ? "selected" : ""
                    }>Excellent</option>
                    <option value="Very Good" ${
                      book && book.condition === "Very Good" ? "selected" : ""
                    }>Very Good</option>
                    <option value="Good" ${
                      book && book.condition === "Good" ? "selected" : ""
                    }>Good</option>
                    <option value="Fair" ${
                      book && book.condition === "Fair" ? "selected" : ""
                    }>Fair</option>
                    <option value="Poor" ${
                      book && book.condition === "Poor" ? "selected" : ""
                    }>Poor</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="book-year" class="form-label">Year</label>
                  <input type="number" class="form-control" id="book-year" min="1900" max="2024" 
                         value="${book ? book.year : ""}">
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="book-course-letters" class="form-label">Course Letters</label>
                  <input type="text" class="form-control" id="book-course-letters" placeholder="e.g., MATH" 
                         value="${
                           book && book.courseCode
                             ? book.courseCode.split(" ")[0]
                             : ""
                         }">
                  <div class="form-text">
                    <small class="text-muted">Enter course letters (e.g., MATH) and numbers (e.g., 125) separately</small>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="book-professor" class="form-label">Professor</label>
                  <input type="text" class="form-control" id="book-professor" placeholder="e.g., Dr. Smith"
                         value="${book ? escapeHtml(book.professor) : ""}">
                  <div class="form-text">
                    <small class="text-muted">Enter professor name (2-100 characters, letters, spaces, hyphens, apostrophes, and periods only)</small>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <label for="book-description" class="form-label">Description</label>
                <textarea class="form-control" id="book-description" rows="3" 
                          placeholder="Describe the book's condition, any notes, etc.">${
                            book ? escapeHtml(book.description) : ""
                          }</textarea>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-crimson">
                  <i class="bi bi-check-circle"></i> ${
                    editingBookId ? "Update Book" : "Add Book"
                  }
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="bi bi-x-circle"></i> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("bookModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Populate form with book data if editing
  if (book) {
    setTimeout(() => {
      populateBookForm(book);
    }, 100);
  }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("bookModal"));
  modal.show();
}

function populateBookForm(book) {
  const titleField = document.getElementById("book-title");
  const authorField = document.getElementById("book-author");
  const priceField = document.getElementById("book-price");
  const conditionField = document.getElementById("book-condition");
  const yearField = document.getElementById("book-year");
  const courseLettersField = document.getElementById("book-course-letters");
  const courseNumbersField = document.getElementById("book-course-numbers");
  const professorField = document.getElementById("book-professor");
  const descriptionField = document.getElementById("book-description");

  if (titleField) titleField.value = book.title || "";
  if (authorField) authorField.value = book.author || "";
  if (priceField) priceField.value = book.price || "";
  if (conditionField) conditionField.value = book.condition || "";
  if (yearField) yearField.value = book.year || "";

  if (book.courseCode) {
    const courseParts = book.courseCode.split(" ");
    if (courseLettersField) courseLettersField.value = courseParts[0] || "";
    if (courseNumbersField) courseNumbersField.value = courseParts[1] || "";
  } else {
    if (courseLettersField) courseLettersField.value = "";
    if (courseNumbersField) courseNumbersField.value = "";
  }

  if (professorField) professorField.value = book.professor || "";
  if (descriptionField) descriptionField.value = book.description || "";

  console.log("Form populated with book data");
  if (titleField) titleField.focus();
}

function showAddBookForm() {
  editingBookId = null;
  renderBookForm();
}

function editBook(id) {
  console.log("editBook called with id:", id);
  editingBookId = id;
  renderBookForm();
}

function hideBookForm() {
  editingBookId = null;
}

async function handleBookSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("book-title").value.trim();
  const author = document.getElementById("book-author").value.trim();
  const price = parseFloat(document.getElementById("book-price").value);
  const condition = document.getElementById("book-condition").value;
  const year = document.getElementById("book-year").value
    ? parseInt(document.getElementById("book-year").value)
    : null;
  const courseLetters = document
    .getElementById("book-course-letters")
    .value.trim();
  const courseNumbers = document
    .getElementById("book-course-numbers")
    .value.trim();
  const courseCode = `${courseLetters} ${courseNumbers}`.trim();
  const professor =
    document.getElementById("book-professor").value.trim() || null;

  // Client-side validation for professor name
  if (professor && !isValidProfessorName(professor)) {
    showAlert(
      "Professor name must be 2-100 characters and contain only letters, spaces, hyphens, apostrophes, and periods.",
      "warning"
    );
    return;
  }
  const description =
    document.getElementById("book-description").value.trim() || null;

  // Debug logging
  console.log("Form validation check:", {
    title,
    author,
    price,
    condition,
    year,
    courseCode,
    professor,
    description,
  });

  if (!title || !author || !price || !condition) {
    showAlert("Please fill in all required fields", "warning");
    return;
  }

  if (price <= 0) {
    showAlert("Price must be greater than 0", "warning");
    return;
  }

  const bookData = {
    title,
    author,
    price,
    condition,
    year,
    courseCode: courseCode || null,
    professor,
    sellerName: currentUser.firstName + " " + currentUser.lastName,
    sellerEmail: currentUser.email,
    description,
    genre: "Textbook",
    isAvailable: true,
  };

  console.log("Submitting book data:", bookData);

  if (editingBookId) {
    // For updates, send the book object directly (not wrapped in 'book' property)
    await updateBook(editingBookId, bookData.book);
  } else {
    await addBook(bookData);
  }

  hideBookForm();

  // Check if we're on My Books page and stay there
  const currentPage = localStorage.getItem("currentPage");
  if (currentPage === "myBooks") {
    renderMyBooksPage();
  } else {
    renderApp();
  }
}

function confirmDelete(id, title) {
  if (confirm(`Are you sure you want to delete "${title}"?`)) {
    deleteBook(id);
  }
}

// Search and filtering functions
async function handleSearch(event) {
  if (event.key === "Enter" || event.type === "click") {
    currentSearchTerm = document.getElementById("search-input").value.trim();
    await loadBooks();
    renderApp();
  }
}

async function clearSearch() {
  currentSearchTerm = "";
  document.getElementById("search-input").value = "";
  await loadBooks();
  renderApp();
}

function filterByCourse(courseFilter = null) {
  // If no courseFilter provided, use the selected course
  if (courseFilter !== null) {
    selectedCourse = courseFilter;
  }

  // Re-render the books with the new filter
  renderApp();
}

function getUniqueCourses() {
  return [
    ...new Set(books.map((book) => book.courseCode).filter((code) => code)),
  ];
}

let selectedCourse = "";

async function selectCourse(course) {
  selectedCourse = course;
  document.getElementById("course-filter").value = course;
  renderApp();
}

function filterCourses() {
  const searchTerm = document
    .getElementById("course-search")
    .value.toLowerCase();
  const courseOptions = document.querySelectorAll("#course-dropdown option");
  courseOptions.forEach((option) => {
    const courseText = option.textContent.toLowerCase();
    option.style.display = courseText.includes(searchTerm) ? "block" : "none";
  });
}

async function clearCourseSelection() {
  selectedCourse = "";
  document.getElementById("course-filter").value = "";
  renderApp();
}

// My Books page functions
function renderMyBooksPage() {
  const app = document.getElementById("app");
  const userBooks = books.filter(
    (book) => book.sellerEmail === currentUser.email
  );

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>My Books</h2>
            <button class="btn btn-crimson" onclick="showAddBookForm()">
              <i class="bi bi-plus-circle"></i> Add Book
            </button>
          </div>
          
          <div class="books-grid">
            ${userBooks
              .map(
                (book) => `
              <div class="book-card">
                <div class="book-icon"></div>
                <div class="book-info">
                  <div class="book-details">
                    <h5 class="book-title">${escapeHtml(book.title)}</h5>
                    <p class="book-author">
                      <i class="bi bi-pencil"></i> <strong>Author:</strong> ${escapeHtml(
                        book.author
                      )}
                    </p>
                    <div class="book-meta">
                      <span><i class="bi bi-bookmark"></i> ${
                        book.courseCode || "N/A"
                      }</span>
                      <span><i class="bi bi-person-badge"></i> ${escapeHtml(
                        book.professor || "N/A"
                      )}</span>
                    </div>
                    <p class="book-price">$${book.price}</p>
                    <p class="book-condition">
                      <span class="badge bg-${getConditionColor(
                        book.condition
                      )} ms-2">${book.condition}</span>
                    </p>
                  </div>
                  <div class="book-actions">
                    <button class="btn btn-outline-secondary btn-sm" onclick="editBook(${
                      book.id
                    })">
                      <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="confirmDelete(${
                      book.id
                    }, '${escapeHtml(book.title)}')">
                      <i class="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          
          ${
            userBooks.length === 0
              ? `
            <div class="text-center mt-5">
              <h4>No books posted yet</h4>
              <p>Add your first book to get started!</p>
              <button class="btn btn-crimson" onclick="showAddBookForm()">
                <i class="bi bi-plus-circle"></i> Add Your First Book
              </button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  updateNavigationState("myBooks");
}

function goBackToBooks() {
  localStorage.removeItem("currentPage");
  renderApp();
}
