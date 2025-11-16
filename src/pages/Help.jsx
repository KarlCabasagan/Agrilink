import { useContext } from "react";
import { Icon } from "@iconify/react";
import { AuthContext } from "../App.jsx";
import NavigationBar from "../components/NavigationBar";
import ProducerNavigationBar from "../components/ProducerNavigationBar";

function Help() {
    const { userRole } = useContext(AuthContext);

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Help & About
                </h1>
            </div>

            {/* Content */}
            <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 pb-20">
                {/* About Agrilink Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-primary mb-4">
                            About Agrilink
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-3">
                            Agrilink is a comprehensive farm-to-table
                            marketplace designed to connect three key groups:
                        </p>
                        <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start gap-3">
                                <span className="text-primary font-bold mt-0.5">
                                    •
                                </span>
                                <span>
                                    <strong>Consumers</strong> can browse and
                                    purchase fresh produce directly from
                                    producers, enjoy hassle-free ordering and
                                    delivery, and connect with sellers to ask
                                    questions.
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary font-bold mt-0.5">
                                    •
                                </span>
                                <span>
                                    <strong>Producers</strong> can manage their
                                    crops and products, monitor market demand,
                                    handle orders from customers, and track
                                    sales with live analytics.
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary font-bold mt-0.5">
                                    •
                                </span>
                                <span>
                                    <strong>Admins</strong> oversee the entire
                                    ecosystem by managing users, approving
                                    products and sellers, maintaining crop
                                    databases, and monitoring transactions.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Features by Role Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-primary mb-4">
                            Features & How to Use
                        </h2>

                        {/* Consumer Features */}
                        {(userRole === 1 || userRole === null) && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Icon
                                        icon="mingcute:shopping-bag-1-line"
                                        width="20"
                                        height="20"
                                        className="text-blue-600"
                                    />
                                    Consumer Features
                                </h3>
                                <div className="space-y-4 text-gray-700 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Profile & Account Management
                                        </p>
                                        <p>
                                            View and edit your profile, address,
                                            and contact information from your
                                            profile page. Access it anytime from
                                            the navigation menu to keep your
                                            account details up to date.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Applying to be a Seller
                                        </p>
                                        <p>
                                            From your profile, tap "Apply to be
                                            a Seller" to become a producer
                                            yourself. Submit required
                                            information and wait for admin
                                            approval. A red dot appears if your
                                            application is rejected.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Shopping: Cart, Favorites & Orders
                                        </p>
                                        <p>
                                            Add items to your cart, adjust
                                            quantities in kilograms, and save
                                            favorites for quick re-ordering.
                                            View all your orders with live
                                            delivery and payment status. A red
                                            dot on "My Orders" signals a status
                                            update waiting for your attention.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Browsing Products & Categories
                                        </p>
                                        <p>
                                            Explore products by category on the
                                            home page. Tap any product to view
                                            full details, reviews, ratings, and
                                            seller information.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Messaging & Customer Support
                                        </p>
                                        <p>
                                            Open conversations with producers
                                            directly from product pages or your
                                            Messages section. See unread
                                            conversations marked with a live
                                            badge at the bottom.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Producer Features */}
                        {(userRole === 2 || userRole === null) && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Icon
                                        icon="mingcute:plant-line"
                                        width="20"
                                        height="20"
                                        className="text-green-600"
                                    />
                                    Producer Features
                                </h3>
                                <div className="space-y-4 text-gray-700 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Profile Settings
                                        </p>
                                        <p>
                                            Manage your business profile and
                                            settings from your profile page.
                                            Edit your information and keep your
                                            shop details current.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Managing Products
                                        </p>
                                        <p>
                                            Add and edit products from your home
                                            page, assigning crop types,
                                            categories, prices, and images.
                                            Track approval status—pending
                                            products need admin review, rejected
                                            ones show reasons. Update stock and
                                            manage product details as needed.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Crop Recommendation & My Crops
                                        </p>
                                        <p>
                                            Visit Crop Recommendation to see
                                            market-demand labels, competition
                                            bars, and price ranges. Use My Crops
                                            to track planted crops, monitor
                                            growth progress (days planted), and
                                            log harvests as they complete.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Handling Producer Orders
                                        </p>
                                        <p>
                                            View all customer orders in your
                                            Orders section with status tracking
                                            (pending, processing, shipped,
                                            delivered). Update order statuses as
                                            they progress to keep customers
                                            informed.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Messaging Customers
                                        </p>
                                        <p>
                                            Use ProducerMessages to communicate
                                            with customers about orders,
                                            products, and special requests. See
                                            unread conversation badges at the
                                            bottom navigation.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Farming Guides & Community
                                        </p>
                                        <p>
                                            Access educational farming guides
                                            with videos and tips. Join the
                                            Farmer Community on Facebook to
                                            connect with other producers and
                                            share experiences.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Features */}
                        {(userRole === 3 || userRole === null) && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Icon
                                        icon="mingcute:shield-line"
                                        width="20"
                                        height="20"
                                        className="text-purple-600"
                                    />
                                    Admin Features
                                </h3>
                                <div className="space-y-4 text-gray-700 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Dashboard & Live Stats
                                        </p>
                                        <p>
                                            Monitor system health with live
                                            statistics on users, products,
                                            orders, and revenue. Use time-range
                                            filters to view trends and identify
                                            top performers.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            User Management
                                        </p>
                                        <p>
                                            Review producer applications pending
                                            approval, approve or reject
                                            applicants, update user roles, and
                                            manage account statuses. A badge
                                            shows pending applications in real
                                            time.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Product Management
                                        </p>
                                        <p>
                                            Manage crop categories (cannot
                                            delete categories with crops in
                                            use), approve or reject pending
                                            products, suspend problematic
                                            listings, and understand product
                                            statuses. A real-time badge shows
                                            pending product approvals.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Crop Management
                                        </p>
                                        <p>
                                            Create and edit crops with validated
                                            harvest times (supports ranges like
                                            "80-100 days" or "1-1.5 years" and
                                            converts to months). Assign
                                            categories and manage all
                                            market-level crop data. Changes to
                                            crop categories cascade to products.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Transaction Monitoring
                                        </p>
                                        <p>
                                            Filter transactions by flexible
                                            day/month/year ranges. Expand any
                                            transaction to see order items,
                                            quantities, prices, and product
                                            images for full audit capability.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Admin Navigation & Badges
                                        </p>
                                        <p>
                                            Use the fixed bottom navigation bar
                                            with live badges showing pending
                                            producer applications (Users) and
                                            pending product approvals
                                            (Products). Tap any badge area to
                                            jump directly to the queue.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation & Notifications Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                            <Icon
                                icon="mingcute:bell-line"
                                width="20"
                                height="20"
                            />
                            Navigation & Notifications
                        </h2>
                        <div className="space-y-4 text-gray-700 text-sm">
                            <div>
                                <p className="font-semibold text-gray-800 mb-2">
                                    Bottom Navigation Bars
                                </p>
                                <p>
                                    Your role determines which bottom navigation
                                    bar you see. Consumers, producers, and
                                    admins each have a role-specific bar with
                                    quick links to their main features. Tap any
                                    icon to jump directly to that section.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 mb-2">
                                    Profile Menu Shortcuts
                                </p>
                                <p>
                                    Your profile page hosts a menu with
                                    shortcuts to the most-used features. Most of
                                    these destinations also appear in the bottom
                                    navigation for quick access.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 mb-2">
                                    Live Badges & Notification Dots
                                </p>
                                <p>
                                    Red badge numbers appear on navigation items
                                    and profile shortcuts to signal pending or
                                    unread activity:
                                </p>
                                <ul className="mt-2 space-y-1 ml-4">
                                    <li>
                                        <strong>Cart count:</strong> Shows total
                                        items in your cart
                                    </li>
                                    <li>
                                        <strong>Unread messages:</strong> Badges
                                        on messaging and conversation links
                                    </li>
                                    <li>
                                        <strong>Order status:</strong> Red dot
                                        on "My Orders" when a delivery or
                                        payment update arrives
                                    </li>
                                    <li>
                                        <strong>Producer applications:</strong>{" "}
                                        Admin badge showing pending seller
                                        applications
                                    </li>
                                    <li>
                                        <strong>Product approvals:</strong>{" "}
                                        Admin badge showing products awaiting
                                        review
                                    </li>
                                    <li>
                                        <strong>Seller rejection:</strong> Red
                                        dot on "Apply to be a Seller" if your
                                        application was declined
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 mb-2">
                                    Real-Time Updates
                                </p>
                                <p>
                                    All badges and notifications update
                                    instantly as activity occurs. You'll always
                                    see the latest count of pending or unread
                                    items without refreshing the page.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-6 text-center">
                        <p className="text-gray-600 text-sm mb-3">
                            Have more questions?
                        </p>
                        <p className="text-gray-700 text-sm">
                            Reach out to us through the messaging feature or
                            contact your local support team for additional help.
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Bar - show only for consumers and producers */}
            {userRole === 1 && <NavigationBar />}
            {userRole === 2 && <ProducerNavigationBar />}
        </div>
    );
}

export default Help;
