new Vue({
  el: "#app",
  data() {
    return {
      courses: [],
      cartItems: [],
      totalPrice: 0,
      userName: "",
      userPhone: "",
    };
  },
  computed: {
    isValidPhone() {
      const phonePattern = /^\d+$/;
      return phonePattern.test(this.userPhone);
    },
    isCheckoutEnabled() {
      return this.userName.trim() !== "" && this.isValidPhone;
    },
  },
  created() {
    this.fetchCourses();
    this.loadCart();
  },
  methods: {
    async fetchCourses() {
      try {
        const response = await fetch(this.getBaseUrl() + "/api/courses");
        this.courses = await response.json();
        this.syncCartWithCourses();
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    },
  
    loadCart() {
      this.cartItems = JSON.parse(localStorage.getItem("cart")) || [];
      this.calculateTotalPrice();
      this.syncCartWithCourses();
    },
    syncCartWithCourses() {
      // Sync the course spaces based on the items in the cart
      this.cartItems.forEach((cartItem) => {
        const course = this.courses.find((c) => c.id === cartItem.id);
        if (course) {
          course.space -= cartItem.space;
        }
      });
    },
    calculateTotalPrice() {
      this.totalPrice = this.cartItems.reduce(
        (sum, item) => sum + Number(item.price) * item.space,
        0
      );
    },
    removeFromCart(index) {
      const course = this.cartItems[index];
      const courseInMainList = this.courses.find((c) => c.id === course.id);

      if (courseInMainList) {
        courseInMainList.space += course.space; // Restore spaces in the main course list
      }

      this.cartItems.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(this.cartItems));
      this.calculateTotalPrice();
      alert(`Removed ${course.subject} from cart!`);
    },
    async checkout() {
      if (!this.userName || !this.userPhone) {
        alert("Please enter your name and phone number to proceed.");
        return;
      }

      const baseUrl = this.getBaseUrl();

      const order = {
        userName: this.userName,
        userPhone: this.userPhone,
        items: this.cartItems,
        totalPrice: this.totalPrice,
      };

      try {
        const response = await fetch(`${baseUrl}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(order),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        alert(
          `Thank you, ${this.userName}! Your order has been placed. Order ID: ${data.orderId}`
        );

        for (const item of this.cartItems) {
          await fetch(`${baseUrl}/api/courses/${item.id}/decrement`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ spacesToReduce: item.space }),
          });
        }

        await this.fetchCourses();
        this.cartItems = [];
        localStorage.removeItem("cart");
        this.userName = "";
        this.userPhone = "";
        this.calculateTotalPrice();
      } catch (error) {
        console.error("Error placing order:", error);
        alert("There was a problem placing your order. Please try again.");
      }
    },
    getBaseUrl() {
      return window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://back-end-61de.onrender.com";
    },
  },
  filters: {
    currency(value) {
      return "$" + parseFloat(value).toFixed(2);
    },
  },
});
