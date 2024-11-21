new Vue({
  el: "#app",
  data: {
    courses: [],
    selectedFilter: "subject", 
    selectedSort: "asc", 
    errorMessage: null,
    searchQuery: "",
    searchResults: [],
    searchPerformed: false,
    isLoading: false,
  },

  computed: {
    baseUrl() {
      return window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://back-end-61de.onrender.com";
    },

    sortedCourses() {
      let courseList =
        this.searchPerformed && this.searchResults.length > 0
          ? this.searchResults
          : this.courses;

  
      const sorted = [...courseList];
      sorted.sort((a, b) => {
        let comparison = 0;
        if (
          this.selectedFilter === "price" ||
          this.selectedFilter === "space"
        ) {
          comparison = a[this.selectedFilter] - b[this.selectedFilter];
        } else {
          comparison = a[this.selectedFilter].localeCompare(
            b[this.selectedFilter]
          );
        }
        return this.selectedSort === "asc" ? comparison : -comparison;
      });
      return sorted;
    },
  },

  mounted() {
    this.fetchCourses();
  },

  watch: {
    searchQuery(newQuery) {
      if (!newQuery.trim()) {
        this.searchPerformed = false;
        this.searchResults = [];
      } else {
        this.performSearch(newQuery);
      }
    },
  },

  methods: {
    async fetchCourses() {
      console.log("Base URL:", this.baseUrl);
      this.isLoading = true;
      try {
        const response = await fetch(`${this.baseUrl}/api/courses`);
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        this.courses = await response.json();
      } catch (error) {
        this.errorMessage = "Error fetching courses: " + error.message;
        console.error(this.errorMessage);
      } finally {
        this.isLoading = false;
      }
    },

    getImageUrl(path) {
      const cleanPath = path.replace("/back-end", "");
      return `${this.baseUrl}${cleanPath}`;
    },

    async performSearch() {
      const query = this.searchQuery.trim();
      if (!query) {
        return;
      }

      this.isLoading = true;
      this.searchResults = [];
      this.errorMessage = "";

      try {
        const response = await fetch(
          `${this.baseUrl}/api/search?query=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch search results.");
        }
        this.searchResults = await response.json();
      } catch (error) {
        console.error("Error during search:", error);
        this.errorMessage = "An error occurred while searching.";
      } finally {
        this.isLoading = false;
        this.searchPerformed = true;
      }
    },

    handleSearchInput: debounce(function () {
      if (this.searchQuery.trim() === "") {
        this.searchResults = [];
        this.searchPerformed = false;
        return;
      }
      this.performSearch();
    }, 300),

    addToCart(course) {
      if (course.space > 0) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.push({
          id: course._id, // Assuming the _id is the MongoDB _id for the course
          subject: course.subject,
          location: course.location,
          price: course.price,
          space: 1,
        });
        console.log("Cart items after adding:", cart);
        course.space -= 1;
        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`Added ${course.subject} to cart!`);
      } else {
        alert(`No spaces available for ${course.subject}.`);
      }
    },
  },
});

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
