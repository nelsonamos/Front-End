
new Vue({
    el: '#app',
    data() {
        return {
            courses: [],
            cartItems: [],
            totalPrice: 0,
            userName: '',   // User's name
            userPhone: ''   // User's phone number
        };
    },
    computed: {
        // Computed property to enable or disable the checkout button
        isCheckoutEnabled() {
            // Ensure userName and userPhone are not empty and phone contains only digits
            const phonePattern = /^\d+$/;
            return this.userName.trim() !== '' && phonePattern.test(this.userPhone);
        }
    },
    created() {
        this.fetchCourses(); // Fetch courses from MongoDB when the page loads
        this.loadCart(); // Load cart items from local storage
    },
    methods: {
        async fetchCourses() {
            try {
                const response = await fetch('/api/courses'); // Update with your API endpoint
                this.courses = await response.json();
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        },
        addToCart(course) {
            if (course.space > 0) {
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                cart.push({
                    id: course.id,
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
        loadCart() {
            this.cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            console.log("Cart items in loadCart:", this.cartItems);
            this.calculateTotalPrice();
        },
        calculateTotalPrice() {
            let total = this.cartItems.reduce((sum, item) => sum + Number(item.price), 0);
            console.log("Calculated total price:", total); // Log total price calculation as a number
            this.totalPrice = total;
        },
        removeFromCart(index) {
            const course = this.cartItems[index];
            const courseInMainList = this.courses.find(c => c.id === course.id);
            if (courseInMainList) {
                courseInMainList.space += 1;
            }
            this.cartItems.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(this.cartItems));
            this.calculateTotalPrice();
            alert(`Removed ${course.subject} from cart!`);
        },
        checkout() {
if (!this.userName || !this.userPhone) {
alert("Please enter your name and phone number to proceed.");
return;
}

// Create an order object
const order = {
userName: this.userName,
userPhone: this.userPhone,
items: this.cartItems,
totalPrice: this.totalPrice,
};

// Send the order to the server
fetch('http://localhost:3000/api/orders', {  // Full URL here
method: 'POST',
headers: {
    'Content-Type': 'application/json',
},
body: JSON.stringify(order), // Convert the order object to JSON
})
.then(response => {
if (!response.ok) {
    throw new Error('Network response was not ok');
}
return response.json();
})
.then(data => {
alert(`Thank you, ${this.userName}! Your order has been placed. Order ID: ${data.orderId}`);
// Clear cart and reset form
this.cartItems = [];
localStorage.removeItem('cart');
this.userName = '';
this.userPhone = '';
this.calculateTotalPrice();
})
.catch(error => {
console.error('Error placing order:', error);
alert('There was a problem placing your order. Please try again.');
});
},
        openCart() {
            alert("Opening cart..."); // Replace with cart navigation logic
        }
    },
    filters: {
        currency(value) {
            return '$' + parseFloat(value).toFixed(2);
        }
    }
});
