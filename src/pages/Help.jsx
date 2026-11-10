import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AuthContext } from "../context/AuthContext.jsx";
import NavigationBar from "../components/NavigationBar";
import ProducerNavigationBar from "../components/ProducerNavigationBar";

function Help() {
    const { userRole } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        type="button"
                        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                        aria-label="Go back"
                    >
                        <Icon icon="mingcute:left-line" width="22" height="22" />
                    </button>
                    <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                        Help &amp; About
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 mt-4 md:mt-6 space-y-6">
                {/* Desktop Breadcrumbs & Title */}
                <div className="hidden md:block">
                    <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                        <Link to="/" className="hover:text-emerald-700 transition flex items-center gap-1">
                            <Icon icon="mingcute:home-4-line" width="14" height="14" />
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-slate-900 font-semibold">Help &amp; About</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                            <Icon icon="mingcute:question-line" width="22" height="22" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help &amp; About Agrilink</h1>
                            <p className="text-xs text-slate-500">Platform guides, role features, and marketplace support</p>
                        </div>
                    </div>
                </div>

                {/* About Agrilink Section */}
                <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-emerald-700 text-white items-center justify-center shrink-0 shadow-sm">
                            <Icon icon="mingcute:plant-fill" width="24" height="24" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">
                                About Agrilink
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed mb-4 max-w-prose">
                                Agrilink is a comprehensive farm-to-table marketplace designed to connect three key groups for direct, fair, and transparent agricultural trade:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1.5">
                                        <Icon icon="mingcute:shopping-bag-1-line" width="18" height="18" />
                                        <span>Consumers</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Browse and purchase fresh produce directly from local producers with hassle-free ordering and direct seller chat.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1.5">
                                        <Icon icon="mingcute:plant-line" width="18" height="18" />
                                        <span>Producers</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Manage crops, monitor market demand, handle customer orders, and track sales performance with live analytics.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm mb-1.5">
                                        <Icon icon="mingcute:shield-line" width="18" height="18" />
                                        <span>Admins</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Oversee the ecosystem by approving sellers and products, curating crop categories, and monitoring transactions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features by Role Section */}
                <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            Features &amp; How to Use
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Key features available depending on your account role</p>
                    </div>

                    {/* Consumer Features */}
                    {(userRole === 1 || userRole === null) && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Icon icon="mingcute:shopping-bag-1-line" width="16" height="16" />
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Consumer Features
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Profile &amp; Account Management
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        View and edit your profile, delivery address, and contact details from your profile page to keep account info current.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Applying to be a Seller
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Tap "Apply to be a Seller" to become a producer. Submit your farm details for admin review; notification dots alert you on status changes.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Shopping: Cart, Favorites &amp; Orders
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Add items to cart, adjust kilograms, and save favorites. Track order fulfillment stages in real time with live status tabs.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Messaging &amp; Inquiries
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Chat directly with farmers about crop freshness, bulk orders, or replacements with instant message synchronization.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Producer Features */}
                    {(userRole === 2 || userRole === null) && (
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Icon icon="mingcute:plant-line" width="16" height="16" />
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Producer Features
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Managing Products &amp; Stock
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Add and edit listings with crop categories, kilograms, prices, and photos. Track approval status and manage inventory levels.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Crop Recommendation &amp; My Crops
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        View market demand signals, competition bars, and projected prices. Track planting growth schedules and log harvests.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Order Processing
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Review incoming customer orders, manage fulfillment stages (pending, processing, shipped, delivered), and arrange delivery.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Farming Guides &amp; Community
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Access educational farming guides and videos, and connect with fellow agricultural producers in the community.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Features */}
                    {(userRole === 3 || userRole === null) && (
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Icon icon="mingcute:shield-line" width="16" height="16" />
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Admin Features
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Dashboard &amp; Live Stats
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Monitor system health with live metrics on users, active products, transactions, and revenue across custom date ranges.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        User &amp; Seller Verification
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Review producer applications, verify certifications, approve or decline sellers, and manage account statuses.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Catalog &amp; Crop Management
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Curate crop categories, validate crop harvest intervals, approve product listings, and maintain data integrity.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="font-semibold text-slate-900 text-xs mb-1">
                                        Transaction Monitoring
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Audit platform orders, filter by flexible date intervals, and review full order line items and payment settlements.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Navigation & Notifications Section */}
                <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <Icon icon="mingcute:bell-line" width="18" height="18" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Navigation &amp; Real-time Badges
                            </h2>
                            <p className="text-xs text-slate-500">How to navigate and understand notification indicators</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="font-semibold text-slate-900 text-xs mb-1">
                                Adaptive Role Navigation
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Your account role automatically adapts the navigation bar. Consumers, producers, and administrators have dedicated navigation shortcuts designed for their daily tasks.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="font-semibold text-slate-900 text-xs mb-2">
                                Live Badges &amp; Indicators
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                                    <span><strong>Cart count:</strong> Items in your cart</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                                    <span><strong>Messages:</strong> Unread chat count</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                    <span><strong>Order status:</strong> Delivery update alert</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                                    <span><strong>Admin queues:</strong> Pending approvals</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer / Support Card */}
                <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                        <Icon icon="mingcute:customer-service-line" width="24" height="24" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                        Need Additional Assistance?
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mb-4 leading-relaxed">
                        Have questions about orders, payments, or your producer account? Reach out to our community support or send an inquiry directly.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to="/messages"
                            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-2 active:scale-95 transition shadow-xs"
                        >
                            <Icon icon="mingcute:message-4-line" width="16" height="16" />
                            Open Messages
                        </Link>
                        <Link
                            to="/"
                            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 active:scale-95 transition"
                        >
                            <Icon icon="mingcute:home-4-line" width="16" height="16" />
                            Return Home
                        </Link>
                    </div>
                </section>
            </main>

            {/* Navigation Bar - show only for consumers and producers */}
            {userRole === 1 && <NavigationBar />}
            {userRole === 2 && <ProducerNavigationBar />}
        </div>
    );
}

export default Help;
