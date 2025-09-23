function renderBookForm() {
  const book = editingBookId ? books.find((b) => b.id === editingBookId) : null;

  return `
    <div class="form-container">
      <div class="form-header">
        <h5 class="mb-0">
          <i class="bi bi-${editingBookId ? "pencil" : "plus-circle"}"></i>
          ${editingBookId ? "Edit Book Listing" : "List Your Book"}
        </h5>
      </div>
      <div class="card-body">
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
                <option value="" ${
                  !book ? "selected" : ""
                } disabled>-- Select Condition --</option>
                <option value="Excellent" ${
                  book && book.condition === "Excellent" ? "selected" : ""
                }>⭐ Excellent - Like new, minimal wear</option>
                <option value="Very Good" ${
                  book && book.condition === "Very Good" ? "selected" : ""
                }>🌟 Very Good - Minor wear, clean pages</option>
                <option value="Good" ${
                  book && book.condition === "Good" ? "selected" : ""
                }>✅ Good - Light wear, some highlighting</option>
                <option value="Fair" ${
                  book && book.condition === "Fair" ? "selected" : ""
                }>⚠️ Fair - Moderate wear, significant highlighting</option>
                <option value="Poor" ${
                  book && book.condition === "Poor" ? "selected" : ""
                }>❌ Poor - Heavy wear, extensive damage</option>
              </select>
              <div class="form-text">
                <small class="text-muted">Choose the condition that best describes your book's state</small>
              </div>
            </div>
            <div class="col-md-4 mb-3">
              <label for="book-year" class="form-label">Year</label>
              <input type="number" class="form-control" id="book-year" min="1900" max="2030"
                     value="${book ? book.year : ""}">
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="book-course" class="form-label">Course Code *</label>
              <div class="row">
                <div class="col-6">
                  <input type="text" class="form-control" id="book-course-letters" placeholder="e.g., MATH" 
                         pattern="[A-Za-z]+" title="Only letters allowed" required
                         value="${
                           book && book.courseCode
                             ? book.courseCode.split(" ")[0]
                             : ""
                         }">
                </div>
                <div class="col-6">
                  <input type="text" class="form-control" id="book-course-numbers" placeholder="e.g., 125" 
                         pattern="[0-9]+" title="Only numbers allowed" required
                         value="${
                           book && book.courseCode
                             ? book.courseCode.split(" ")[1] || ""
                             : ""
                         }">
                </div>
              </div>
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
                editingBookId ? "Update Listing" : "List Book"
              }
            </button>
            <button type="button" class="btn btn-outline-crimson" onclick="hideBookForm()">
              <i class="bi bi-x-circle"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Event Handlers
function showAddBookForm() {
  editingBookId = null;

  // Re-render the form to ensure it's in add mode
  const formContainer = document.getElementById("book-form-container");
  if (formContainer) {
    formContainer.innerHTML = renderBookForm();
    formContainer.style.display = "block";
  }

  // Focus on the title field after a short delay to ensure it's rendered
  setTimeout(() => {
    const titleField = document.getElementById("book-title");
    if (titleField) titleField.focus();
  }, 100);
}

function editBook(id) {
  console.log("editBook called with id:", id);
  console.log("Current books:", books);

  const book = books.find((b) => b.id === id);
  console.log("Found book to edit:", book);

  if (!book) {
    console.error("Book not found with id:", id);
    showAlert("Book not found", "danger");
    return;
  }

  editingBookId = id;

  // Re-render the form with the book data
  const formContainer = document.getElementById("book-form-container");
  if (formContainer) {
    formContainer.innerHTML = renderBookForm();
    formContainer.style.display = "block";
  }

  // Ensure the form is populated with the book data (backup method)
  setTimeout(() => {
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

    // Split course code into letters and numbers
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
  }, 100);
}

function hideBookForm() {
  editingBookId = null;
  document.getElementById("book-form-container").style.display = "none";
  document.getElementById("book-form").reset();
}

async function handleBookSubmit(event) {
  event.preventDefault();

  // Check if user is logged in
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  const title = document.getElementById("book-title").value.trim();
  const author = document.getElementById("book-author").value.trim();
  const price = parseFloat(document.getElementById("book-price").value) || 0;
  const condition = document.getElementById("book-condition").value;
  const yearInput = document.getElementById("book-year").value.trim();
  const year = yearInput ? parseInt(yearInput) : null; // Use null for empty year
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
    title: !!title,
    author: !!author,
    price: !!price,
    condition: !!condition,
    courseLetters: !!courseLetters,
    courseNumbers: !!courseNumbers,
    conditionValue: condition,
    courseCodeValue: courseCode,
    courseLettersValue: courseLetters,
    courseNumbersValue: courseNumbers,
  });

  // Check for empty condition (placeholder selected)
  if (condition === "") {
    showAlert("Please select a condition for your book", "warning");
    return;
  }

  // Validate year range only if provided
  if (yearInput && year && (year < 1900 || year > 2030)) {
    showAlert("Please enter a valid year between 1900 and 2030", "warning");
    return;
  }

  if (
    !title ||
    !author ||
    !price ||
    !condition ||
    !courseLetters ||
    !courseNumbers
  ) {
    showAlert("Please fill in all required fields", "warning");
    return;
  }

  // Use current user's information
  const sellerName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "Unknown";
  const sellerEmail = currentUser ? currentUser.email : "";

  const bookData = {
    book: {
      title,
      author,
      price,
      condition,
      year,
      courseCode,
      professor,
      sellerName,
      sellerEmail,
      description,
      genre: "Textbook",
      isAvailable: true,
      datePosted: new Date().toISOString(),
    },
  };

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
  if (courseFilter === null) {
    courseFilter = selectedCourse;
  }

  if (courseFilter) {
    const filteredBooks = books.filter(
      (book) => book.courseCode === courseFilter
    );
    books.splice(0, books.length, ...filteredBooks);
  } else {
    loadBooks();
  }
  renderApp();
}

function getUniqueCourses() {
  return [
    ...new Set(books.map((book) => book.courseCode).filter((code) => code)),
  ];
}

// Course selection system
let selectedCourse = "";

async function selectCourse(course) {
  selectedCourse = course;

  // Update UI
  const courseButton = document.getElementById("courseDropdown");

  if (course) {
    courseButton.innerHTML = `<span class="badge bg-secondary me-2">${course}</span><span id="courseText">Select Course</span>`;
  } else {
    courseButton.innerHTML = `<span id="courseText">Select Course</span>`;
  }

  // Apply filter
  if (course) {
    filterByCourse(course);
  } else {
    // If "All Courses" selected, reload all books
    await loadBooks();
    renderApp();
  }
}

function filterCourses() {
  const searchTerm = document
    .getElementById("courseSearch")
    .value.toLowerCase();
  const menu = document.getElementById("courseMenu");
  const options = menu.querySelectorAll(".dropdown-item");

  options.forEach((option) => {
    const text = option.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      option.style.display = "block";
    } else {
      option.style.display = "none";
    }
  });
}

async function clearCourseSelection() {
  selectedCourse = "";

  // Update UI
  const courseButton = document.getElementById("courseDropdown");
  courseButton.innerHTML = `<span id="courseText">Select Course</span>`;

  // Reload all books from API
  await loadBooks();
  renderApp();
}

function setupStarRating() {
  const stars = document.querySelectorAll("#starRating .bi-star");
  const scoreInput = document.getElementById("ratingScore");

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const rating = index + 1;
      scoreInput.value = rating;

      // Update star display
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });

    star.addEventListener("mouseenter", () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });
  });

  // Reset on mouse leave
  document.getElementById("starRating").addEventListener("mouseleave", () => {
    const currentRating = parseInt(scoreInput.value) || 0;
    stars.forEach((s, i) => {
      if (i < currentRating) {
        s.className = "bi bi-star-fill text-warning";
      } else {
        s.className = "bi bi-star text-muted";
      }
    });
  });
}

function setupAdminStarRating(currentScore) {
  const stars = document.querySelectorAll("#adminStarRating .bi-star");
  const scoreInput = document.getElementById("adminRatingScore");

  // Set initial rating
  stars.forEach((s, i) => {
    if (i < currentScore) {
      s.className = "bi bi-star-fill text-warning";
    } else {
      s.className = "bi bi-star text-muted";
    }
  });

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const rating = index + 1;
      scoreInput.value = rating;

      // Update star display
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });

    star.addEventListener("mouseenter", () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });
  });

  // Reset on mouse leave
  document
    .getElementById("adminStarRating")
    .addEventListener("mouseleave", () => {
      const currentRating = parseInt(scoreInput.value) || 0;
      stars.forEach((s, i) => {
        if (i < currentRating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-muted";
        }
      });
    });
}

function handleAdClick(adNumber) {
  console.log("Ad clicked:", adNumber);

  if (adNumber === 1) {
    // Wilderness Tours ad - show phone number
    showCustomAlert("Wilderness Tours", "📞 Call us at: 867-5309");
  } else {
    // Monroe coding ad - show joke message
    showCustomAlert(
      "Monroe Coding Services",
      "😄 Don't actually call Monroe please! He will probably mess up your code!"
    );
  }
}

function showCustomAlert(title, message) {
  // Create custom modal
  const modal = document.createElement("div");
  modal.className = "modal fade show";
  modal.style.display = "block";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}
