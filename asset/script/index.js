
new Vue({
  el: "#app",
  data: {
    courses: [],
    selectedFilter: "subject", // Default filter
    selectedSort: "asc", // Default sort order
    errorMessage: null,
    searchQuery: "",
    searchResults: [],
    searchPerformed: false,
    loading: true,
  },
  computed: {
    sortedCourses() {
      let courseList =
        this.searchPerformed && this.searchResults.length > 0
          ? this.searchResults
          : this.courses;

      // Sort the courses based on selected filter and order
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
      // Perform search whenever there's a change in the searchQuery
      this.performSearch(newQuery);
    },
  },
  methods: {
    async fetchCourses() {
      this.loading = true;
      try {
        const response = await fetch("http://localhost:3000/api/courses");
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        this.courses = await response.json();
      } catch (error) {
        this.errorMessage = "Error fetching courses: " + error.message;
        console.error(this.errorMessage);
      } finally {
        this.loading = false;
      }
    },

    getImageUrl(path) {
      const baseUrl = 'http://localhost:3000';
      
      // Remove 'back-end' prefix if it exists
      const cleanPath = path.replace('/back-end', '');
      
      // Join the base URL and cleaned path
      return `${baseUrl}${cleanPath}`;
  },

    handleSearchInput() {
      // Clear previous timeout to reset debounce
      clearTimeout(this.typingTimer);
      // Set up a new timeout to wait before performing search
      this.typingTimer = setTimeout(() => {
        this.performSearch();
      }, this.debounceDelay);
    },

    async performSearch(query) {
      this.searchPerformed = true;
      this.searchResults = [];

      if (query === "") {
        // If the search query is empty, clear the search results
        this.searchResults = [];
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/search?query=${encodeURIComponent(
            query
          )}`
        );
        if (!response.ok) {
          throw new Error("Failed to search courses");
        }
        this.searchResults = await response.json();
      } catch (error) {
        console.error("Error performing search:", error);
        this.errorMessage = "Error performing search";
      }
    },

    addToCart(course) {
      if (course.space > 0) {
          let cart = JSON.parse(localStorage.getItem('cart')) || [];
          cart.push({
              id: course._id, // Assuming the _id is the MongoDB _id for the course
              subject: course.subject,
              location: course.location,
              price: course.price,
              space: 1
          });
          console.log("Cart items after adding:", cart);
          course.space -= 1;
          localStorage.setItem('cart', JSON.stringify(cart));
          this.loadCart();
          alert(`Added ${course.subject} to cart!`);
      } else {
          alert(`No spaces available for ${course.subject}.`);
      }
  },
  


    sortCourses() {
      // This method can be left empty; the computed property will handle sorting automatically.
    },
  },
});
