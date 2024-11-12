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
        isCheckoutEnabled() {
            const phonePattern = /^\d+$/;
            return this.userName.trim() !== '' && phonePattern.test(this.userPhone);
        }
    },
    created() {
        this.fetchCourses(); 
        this.loadCart();
    },
    methods: {
        async fetchCourses() {
            try {
                const response = await fetch('/api/courses');
                this.courses = await response.json();
                this.syncCartWithCourses();
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        },
        addToCart(course) {
            if (course.space > 0) {
                let cart = JSON.parse(localStorage.getItem('cart')) || [];

                // Check if course already exists in the cart and update space if needed
                const cartItem = cart.find(item => item.id === course.id);
                if (cartItem) {
                    cartItem.space += 1;
                } else {
                    cart.push({
                        id: course.id,
                        subject: course.subject,
                        location: course.location,
                        price: course.price,
                        space: 1
                    });
                }

                course.space -= 1;  // Decrease space in the main course list
                localStorage.setItem('cart', JSON.stringify(cart));
                this.loadCart();
                alert(`Added ${course.subject} to cart!`);
            } else {
                alert(`No spaces available for ${course.subject}.`);
            }
        },
        loadCart() {
            this.cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            this.calculateTotalPrice();
            this.syncCartWithCourses();
        },
        syncCartWithCourses() {
            // Sync the course spaces based on the items in the cart
            this.cartItems.forEach(cartItem => {
                const course = this.courses.find(c => c.id === cartItem.id);
                if (course) {
                    course.space -= cartItem.space;
                }
            });
        },
        calculateTotalPrice() {
            this.totalPrice = this.cartItems.reduce((sum, item) => sum + Number(item.price) * item.space, 0);
        },
        removeFromCart(index) {
            const course = this.cartItems[index];
            const courseInMainList = this.courses.find(c => c.id === course.id);

            if (courseInMainList) {
                courseInMainList.space += course.space; // Restore spaces in the main course list
            }

            this.cartItems.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(this.cartItems));
            this.calculateTotalPrice();
            alert(`Removed ${course.subject} from cart!`);
        },
        async checkout() {
            if (!this.userName || !this.userPhone) {
                alert("Please enter your name and phone number to proceed.");
                return;
            }

            const order = {
                userName: this.userName,
                userPhone: this.userPhone,
                items: this.cartItems,
                totalPrice: this.totalPrice,
            };

            try {
                const response = await fetch('http://localhost:3000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(order),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                alert(`Thank you, ${this.userName}! Your order has been placed. Order ID: ${data.orderId}`);

                for (const item of this.cartItems) {
                    await fetch(`http://localhost:3000/api/courses/${item.id}/decrement`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ spacesToReduce: item.space })
                    });
                }

                await this.fetchCourses();
                this.cartItems = [];
                localStorage.removeItem('cart');
                this.userName = '';
                this.userPhone = '';
                this.calculateTotalPrice();

            } catch (error) {
                console.error('Error placing order:', error);
                alert('There was a problem placing your order. Please try again.');
            }
        },
        openCart() {
            alert("Opening cart..."); 
        }
    },
    filters: {
        currency(value) {
            return '$' + parseFloat(value).toFixed(2);
        }
    }
});
