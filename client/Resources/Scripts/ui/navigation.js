function setupScrollBehavior() {
  let lastScrollTop = 0;
  const searchContainer = document.querySelector(".search-container");

  if (!searchContainer) {
    console.log("Search container not found for scroll behavior");
    return;
  }

  // Remove any existing scroll listeners to prevent duplicates
  window.removeEventListener("scroll", handleScroll);

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down - hide search bar
      searchContainer.classList.add("hidden");
    } else {
      // Scrolling up - show search bar
      searchContainer.classList.remove("hidden");
    }

    lastScrollTop = scrollTop;
  }

  window.addEventListener("scroll", handleScroll);
  console.log("Scroll behavior setup completed");
}

function updateNavigationState(activePage) {
  const homeLink = document.getElementById("home-nav-link");
  const notificationsLink = document.getElementById("notifications-nav-link");
  const myBooksLink = document.getElementById("my-books-nav-link");
  const contactedBooksLink = document.getElementById(
    "contacted-books-nav-link"
  );
  const myRatingsLink = document.getElementById("my-ratings-nav-link");

  if (
    homeLink &&
    notificationsLink &&
    myBooksLink &&
    contactedBooksLink &&
    myRatingsLink
  ) {
    // Remove all active/inactive classes
    homeLink.classList.remove("active", "inactive");
    notificationsLink.classList.remove("active", "inactive");
    myBooksLink.classList.remove("active", "inactive");
    contactedBooksLink.classList.remove("active", "inactive");
    myRatingsLink.classList.remove("active", "inactive");

    if (activePage === "home") {
      homeLink.classList.add("active");
      notificationsLink.classList.add("inactive");
      myBooksLink.classList.add("inactive");
      contactedBooksLink.classList.add("inactive");
      myRatingsLink.classList.add("inactive");
    } else if (activePage === "notifications") {
      homeLink.classList.add("inactive");
      notificationsLink.classList.add("active");
      myBooksLink.classList.add("inactive");
      contactedBooksLink.classList.add("inactive");
      myRatingsLink.classList.add("inactive");
    } else if (activePage === "myBooks") {
      homeLink.classList.add("inactive");
      notificationsLink.classList.add("inactive");
      myBooksLink.classList.add("active");
      contactedBooksLink.classList.add("inactive");
      myRatingsLink.classList.add("inactive");
    } else if (activePage === "contactedBooks") {
      homeLink.classList.add("inactive");
      notificationsLink.classList.add("inactive");
      myBooksLink.classList.add("inactive");
      contactedBooksLink.classList.add("active");
      myRatingsLink.classList.add("inactive");
    } else if (activePage === "myRatings") {
      homeLink.classList.add("inactive");
      notificationsLink.classList.add("inactive");
      myBooksLink.classList.add("inactive");
      contactedBooksLink.classList.add("inactive");
      myRatingsLink.classList.add("active");
    } else if (activePage === "profile") {
      // For profile page, all links are inactive
      homeLink.classList.add("inactive");
      notificationsLink.classList.add("inactive");
      myBooksLink.classList.add("inactive");
      contactedBooksLink.classList.add("inactive");
      myRatingsLink.classList.add("inactive");
    } else if (activePage === "admin") {
      // For admin panel, all links are inactive
      homeLink.classList.add("inactive");
      notificationsLink.classList.add("inactive");
      myBooksLink.classList.add("inactive");
      contactedBooksLink.classList.add("inactive");
      myRatingsLink.classList.add("inactive");
    }
  }
}
