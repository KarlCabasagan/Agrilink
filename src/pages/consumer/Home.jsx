import { useState, useMemo, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import StateView from "../../components/StateView.jsx";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import useUpdateLastLogin from "../../hooks/useUpdateLastLogin";

function formatProductRow(product) {
    const reviews = product.reviews || [];
    const rating = reviews.length
        ? reviews.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / reviews.length
        : 0;

    return {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image:
            product.image_url ||
            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
        address: product.profiles?.address || "Location not available",
        category: product.categories?.name || "Other",
        farmerName: product.profiles?.name || "Local Farmer",
        description: product.description || "",
        stock: parseFloat(product.stock) || 0,
        rating,
        reviewCount: reviews.length,
        minimumOrderQuantity: parseFloat(product.profiles?.minimum_order_quantity) || 1,
        deliveryCost: parseFloat(product.profiles?.delivery_cost) || 50,
        pickupLocation: product.profiles?.address || "Farm location",
        farmerId: product.user_id,
    };
}

function ProductRating({ rating, reviewCount }) {
    if (!reviewCount || reviewCount === 0) {
        return (
            <span className="text-[11px] text-slate-600 font-medium">
                No reviews yet
            </span>
        );
    }
    return (
        <div className="flex items-center gap-1 tabular-nums text-xs font-semibold text-slate-700">
            <Icon icon="mingcute:star-fill" className="text-amber-400 w-3.5 h-3.5" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-slate-600 font-normal">({reviewCount})</span>
        </div>
    );
}

function Home() {
    const { user } = useContext(AuthContext);
    useUpdateLastLogin(user?.id);

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([
        { name: "All", icon: "mdi:apps-box" },
    ]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    const [hasOrdersWithStatus6, setHasOrdersWithStatus6] = useState(false);
    const [modal, setModal] = useState({
        open: false,
        type: "",
        title: "",
        message: "",
        onConfirm: null,
    });

    const showModal = (type, title, message, onConfirm = null) => {
        setModal({ open: true, type, title, message, onConfirm });
    };

    // Helper: Fisher-Yates shuffle
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from("categories")
                    .select("*")
                    .order("name");

                if (error) {
                    console.error("Error fetching categories:", error);
                    return;
                }

                const dbCategories = data.map((cat) => ({
                    name: cat.name,
                    icon: cat.icon || "mingcute:leaf-line",
                    id: cat.id,
                }));

                setCategories([
                    { name: "All", icon: "mdi:apps-box" },
                    ...dbCategories,
                ]);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    // Fetch user favorites
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from("favorites")
                    .select("product_id")
                    .eq("user_id", user.id);

                if (error) {
                    console.error("Error fetching favorites:", error);
                    return;
                }

                const favoriteIds = new Set(data.map((fav) => fav.product_id));
                setFavorites(favoriteIds);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            }
        };

        fetchFavorites();
    }, [user]);

    // Check order status 6 for mobile badge
    useEffect(() => {
        if (!user?.id) return;

        const checkOrderStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("status_id", 6)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setHasOrdersWithStatus6(true);
                } else {
                    setHasOrdersWithStatus6(false);
                }
            } catch (error) {
                console.error("Error checking order status:", error);
            }
        };

        checkOrderStatus();

        const channel = supabase
            .channel(`orders-status-home-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `user_id=eq.${user.id}`,
                },
                () => checkOrderStatus()
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // Toggle favorite
    const toggleFavorite = async (productId, event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!user) {
            showModal(
                "warning",
                "Login Required",
                "Please log in to add favorites",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
            return;
        }

        const isFavorite = favorites.has(productId);

        try {
            if (isFavorite) {
                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("product_id", productId);

                if (error) throw error;

                setFavorites((prev) => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            } else {
                const { error } = await supabase.from("favorites").insert({
                    user_id: user.id,
                    product_id: productId,
                    created_at: new Date().toISOString(),
                });

                if (error) throw error;

                setFavorites((prev) => new Set([...prev, productId]));
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            showModal(
                "error",
                "Error",
                "Failed to update favorites. Please try again.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
        }
    };

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select(
                        `
                        *,
                        categories(name),
                        profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                        statuses(name),
                        reviews!reviews_product_id_fkey(rating)
                        `
                    )
                    .neq("status_id", 2)
                    .not("approval_date", "is", null)
                    .neq("approval_date", "1970-01-01 00:00:00+00")
                    .eq("statuses.name", "active")
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching products:", error);
                    setProducts([]);
                    return;
                }

                if (!data || data.length === 0) {
                    setProducts([]);
                    return;
                }

                const formatted = data.map(formatProductRow);
                setProducts(shuffleArray(formatted));
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Real-time product sync
    useEffect(() => {
        const subscription = supabase
            .channel("products-channel-home")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "products",
                },
                async (payload) => {
                    const { data, error } = await supabase
                        .from("products")
                        .select(
                            `
                            *,
                            categories(name),
                            profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                            statuses(name),
                            reviews!reviews_product_id_fkey(rating)
                            `
                        )
                        .eq("id", payload.new.id)
                        .neq("status_id", 2)
                        .not("approval_date", "is", null)
                        .neq("approval_date", "1970-01-01 00:00:00+00")
                        .eq("statuses.name", "active");

                    if (!error && data && data.length === 1) {
                        setProducts((prev) => [...prev, formatProductRow(data[0])]);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "products",
                },
                async (payload) => {
                    const { data, error } = await supabase
                        .from("products")
                        .select(
                            `
                            *,
                            categories(name),
                            profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                            statuses(name),
                            reviews!reviews_product_id_fkey(rating)
                            `
                        )
                        .eq("id", payload.new.id)
                        .neq("status_id", 2)
                        .not("approval_date", "is", null)
                        .neq("approval_date", "1970-01-01 00:00:00+00")
                        .eq("statuses.name", "active");

                    setProducts((prev) => {
                        const productIndex = prev.findIndex((p) => p.id === payload.new.id);
                        if (!error && data && data.length === 1) {
                            const updatedProduct = formatProductRow(data[0]);
                            if (productIndex !== -1) {
                                const copy = [...prev];
                                copy[productIndex] = updatedProduct;
                                return copy;
                            }
                            return [...prev, updatedProduct];
                        }
                        if (productIndex !== -1) {
                            return prev.filter((p) => p.id !== payload.new.id);
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const filteredProducts = useMemo(() => {
        if (!products || products.length === 0) return [];

        return products
            .filter(
                (product) =>
                    selectedCategory === "All" ||
                    product.category === selectedCategory
            )
            .filter(
                (product) =>
                    product.name.toLowerCase().includes(search.toLowerCase()) ||
                    product.address.toLowerCase().includes(search.toLowerCase())
            );
    }, [products, selectedCategory, search]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
            {/* MOBILE TOP BAR (< 768px) */}
            <header className="md:hidden sticky top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                    <img
                        src="/components/icon_logo.png"
                        alt="AgriLink"
                        className="w-7 h-7 object-contain"
                    />
                    <span className="font-bold text-base text-emerald-800 tracking-tight">
                        AgriLink
                    </span>
                </div>
                <Link
                    to="/orders"
                    className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700 hover:text-emerald-800"
                    aria-label="View orders"
                >
                    <Icon icon="mingcute:truck-line" width="22" height="22" />
                    {hasOrdersWithStatus6 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                    )}
                </Link>
            </header>

            {/* MOBILE SEARCH BAR */}
            <div className="md:hidden w-full px-4 pt-3 pb-2">
                <div className="relative w-full">
                    <Icon
                        icon="mingcute:search-line"
                        width="18"
                        height="18"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white shadow-xs text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        placeholder="Search crops, produce, or farm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                            aria-label="Clear search"
                        >
                            <Icon icon="mingcute:close-line" width="16" height="16" />
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 md:mt-8">
                {/* DESKTOP HERO & SEARCH */}
                <section className="hidden md:block w-full bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-8 rounded-3xl mb-8 border border-emerald-100/70 shadow-xs">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-3">
                            <Icon icon="mingcute:leaf-line" className="w-3.5 h-3.5" />
                            <span>Direct Farm Marketplace</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                            Fresh Produce, Straight From Iligan Growers
                        </h1>
                        <p className="text-sm text-slate-600 measure-prose mb-6">
                            Directly connecting local producers with consumers — guaranteed fresh harvest with no middleman markups.
                        </p>

                        <div className="relative max-w-xl">
                            <Icon
                                icon="mingcute:search-line"
                                width="20"
                                height="20"
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-300 bg-white shadow-xs text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                                placeholder="Search fresh vegetables, fruits, crops, or farms…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    <Icon icon="mingcute:close-line" width="16" height="16" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* CATEGORY FILTER PILLS */}
                <div className="w-full mb-6">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                        {categories.map((category) => {
                            const isSelected = selectedCategory === category.name;
                            return (
                                <button
                                    key={category.name}
                                    type="button"
                                    onClick={() => setSelectedCategory(category.name)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                                        isSelected
                                            ? "bg-emerald-800 text-white shadow-xs"
                                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 shadow-2xs"
                                    }`}
                                >
                                    <Icon
                                        icon={category.icon}
                                        width="16"
                                        height="16"
                                        className={isSelected ? "text-white" : "text-emerald-700"}
                                    />
                                    <span>{category.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SECTION HEADER */}
                <div className="mb-4 flex items-baseline justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {selectedCategory} Produce
                        </h2>
                        <p className="text-slate-600 text-xs mt-0.5 tabular-nums">
                            {filteredProducts.length} listings available
                        </p>
                    </div>
                </div>

                {/* PRODUCTS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                    {loading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse flex flex-col"
                            >
                                <div className="aspect-4/3 w-full bg-slate-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                    <div className="h-4 bg-slate-200 rounded w-1/3 pt-2" />
                                </div>
                            </div>
                        ))
                    ) : !products || products.length === 0 ? (
                        <div className="col-span-full py-8">
                            <StateView
                                type="empty"
                                title="No products available"
                                description="Fresh farm produce will appear here when local producers publish their listings."
                            />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full py-8">
                            <StateView
                                type="empty"
                                icon="mingcute:search-line"
                                title="No products found"
                                description="Try adjusting your search query or selecting another crop category."
                            />
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <Link
                                to={`/product/${product.id}`}
                                key={product.id}
                                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-700/40 hover:shadow-md transition-all duration-150 overflow-hidden flex flex-col active:scale-[0.98]"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src =
                                                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
                                        }}
                                    />
                                    {/* Category Pill */}
                                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100/80 shadow-xs">
                                        {product.category}
                                    </span>
                                    {/* Favorite Button (44x44px Hit Target) */}
                                    <button
                                        type="button"
                                        onClick={(e) => toggleFavorite(product.id, e)}
                                        className="absolute top-1 right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-red-500 active:scale-95 transition-all"
                                        aria-label={
                                            favorites.has(product.id)
                                                ? "Remove from favorites"
                                                : "Add to favorites"
                                        }
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                                            <Icon
                                                icon={
                                                    favorites.has(product.id)
                                                        ? "mingcute:heart-fill"
                                                        : "mingcute:heart-line"
                                                }
                                                width="17"
                                                height="17"
                                                className={
                                                    favorites.has(product.id)
                                                        ? "text-red-500"
                                                        : "text-slate-400"
                                                }
                                            />
                                        </div>
                                    </button>
                                </div>

                                {/* Content Details */}
                                <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 leading-snug group-hover:text-emerald-800 transition-colors">
                                            {product.name}
                                        </h3>

                                        {/* Farmer & Address */}
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                                            <Icon
                                                icon="mingcute:user-3-line"
                                                className="w-3.5 h-3.5 text-emerald-700 shrink-0"
                                            />
                                            <span className="font-medium text-slate-700 truncate">
                                                {product.farmerName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-600">
                                            <Icon
                                                icon="mingcute:location-line"
                                                className="w-3.5 h-3.5 text-slate-400 shrink-0"
                                            />
                                            <span className="truncate">
                                                {product.address}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <ProductRating
                                        rating={product.rating}
                                        reviewCount={product.reviewCount}
                                    />

                                    {/* Price & Stock */}
                                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between gap-1 mt-auto">
                                        <div className="tabular-nums">
                                            <span className="text-emerald-800 font-bold text-base">
                                                ₱{product.price.toFixed(2)}
                                            </span>
                                            <span className="text-[11px] font-normal text-slate-600 ml-0.5">
                                                /kg
                                            </span>
                                        </div>
                                        <span
                                            className={`text-[11px] font-medium tabular-nums ${
                                                product.stock > 0
                                                    ? "text-emerald-700"
                                                    : "text-rose-600"
                                            }`}
                                        >
                                            {product.stock > 0
                                                ? `${product.stock} kg`
                                                : "Out of stock"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </main>

            {/* SHARED NAVIGATION */}
            <NavigationBar />

            {/* MODAL */}
            <Modal
                isOpen={modal.open}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default Home;
