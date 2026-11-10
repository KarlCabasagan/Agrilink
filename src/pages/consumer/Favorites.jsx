import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import { useState, useEffect, useContext } from "react";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { CartCountContext } from "../../context/CartCountContext.jsx";
import { StateView } from "../../components/StateView.jsx";

function Favorites() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { cartCount, setCartCount, updateCartCount } =
        useContext(CartCountContext);
    const [search, setSearch] = useState("");
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isClearingFavorites, setIsClearingFavorites] = useState(false);
    const [addToCartResult, setAddToCartResult] = useState(null);
    const [hasOrdersWithStatus6, setHasOrdersWithStatus6] = useState(false);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (addToCartResult) {
            const timer = setTimeout(() => {
                setAddToCartResult(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [addToCartResult]);

    // Check for orders with status_id 6 and subscribe to real-time changes
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

        // Initial check
        checkOrderStatus();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`orders-status-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // On any order change, recheck status
                    checkOrderStatus();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // Compute cart summary before opening modal
    const getCartSummary = () => {
        if (!filteredFavorites.length) return null;

        // Only include products with positive stock that are neither suspended nor not approved
        const availableProducts = filteredFavorites.filter(
            (product) =>
                product.stock > 0 && !product.suspended && !product.notApproved
        );
        const outOfStockCount = filteredFavorites.filter(
            (product) =>
                product.stock <= 0 && !product.suspended && !product.notApproved
        ).length;
        const suspendedCount = filteredFavorites.filter(
            (product) => product.suspended
        ).length;
        const notApprovedCount = filteredFavorites.filter(
            (product) => product.notApproved
        ).length;

        return {
            totalToAdd: availableProducts.length,
            outOfStockCount,
            suspendedCount,
            notApprovedCount,
            availableProducts,
        };
    };

    // Fetch user's favorite products from database
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("favorites")
                    .select(
                        `
                        product_id,
                        products (
                            *,
                            categories(name),
                            profiles!products_user_id_fkey(name, address),
                            reviews!reviews_product_id_fkey(rating)
                        )
                    `
                    )
                    .eq("user_id", user.id);

                if (error) {
                    console.error("Error fetching favorites:", error);
                    setFavoriteProducts([]);
                    return;
                }

                const formattedFavorites = data
                    .filter((fav) => fav.products) // Filter out any null products
                    .map((fav) => {
                        const product = fav.products;
                        // Calculate average rating
                        const ratings =
                            product.reviews?.map((r) => r.rating) || [];
                        const averageRating =
                            ratings.length > 0
                                ? ratings.reduce((a, b) => a + b, 0) /
                                  ratings.length
                                : 0;

                        // Derive suspended and notApproved flags independently
                        // suspended: status_id === 2
                        // notApproved: approval_date is null OR represents 1970-01-01 00:00:00+00 sentinel
                        const isSuspended = product.status_id === 2;
                        const isNotApproved =
                            product.approval_date === null ||
                            (product.approval_date &&
                                String(product.approval_date).startsWith(
                                    "1970-01-01"
                                ));

                        return {
                            id: product.id,
                            name: product.name,
                            price: parseFloat(product.price),
                            image:
                                product.image_url ||
                                "https://via.placeholder.com/300x200?text=No+Image",
                            address:
                                product.profiles?.address ||
                                "Location not available",
                            category: product.categories?.name || "Other",
                            farmerName:
                                product.profiles?.name || "Unknown Farmer",
                            description: product.description,
                            stock: parseFloat(product.stock) || 0,
                            rating: averageRating, // Real calculated rating
                            unit: product.unit || "kg",
                            minimumOrderQuantity:
                                parseFloat(product.minimum_order_quantity) || 1,
                            deliveryCost:
                                parseFloat(product.delivery_cost) || 50,
                            pickupLocation: product.pickup_location,
                            suspended: isSuspended,
                            notApproved: isNotApproved,
                        };
                    });

                setFavoriteProducts(formattedFavorites);
            } catch (error) {
                console.error("Error fetching favorites:", error);
                setFavoriteProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user]);

    // Memoize product IDs as a joined string to track actual product set for realtime subscription
    const productIdsString = favoriteProducts
        .map((p) => p.id)
        .sort()
        .join(",");

    // Real-time subscription to favorite products
    useEffect(() => {
        if (!user || favoriteProducts.length === 0) return;

        const productIds = favoriteProducts.map((p) => p.id);
        const subscriptionRef = supabase
            .channel("favorites-products-channel")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "products",
                    filter: `id=in.(${productIds.join(",")})`,
                },
                (payload) => {
                    const newRow = payload.new;
                    setFavoriteProducts((prev) =>
                        prev.map((fav) => {
                            if (fav.id !== newRow.id) return fav;

                            // Recompute both suspended and notApproved flags independently using same logic
                            const isSuspended = newRow.status_id === 2;
                            const isNotApproved =
                                newRow.approval_date === null ||
                                (newRow.approval_date &&
                                    String(newRow.approval_date).startsWith(
                                        "1970-01-01"
                                    ));

                            return {
                                ...fav,
                                price: parseFloat(newRow.price),
                                stock: parseFloat(newRow.stock) || 0,
                                name: newRow.name,
                                image: newRow.image_url || fav.image,
                                suspended: isSuspended,
                                notApproved: isNotApproved,
                            };
                        })
                    );
                }
            )
            .subscribe();

        return () => subscriptionRef.unsubscribe();
    }, [user, productIdsString]);

    const filteredFavorites = favoriteProducts.filter(
        (product) =>
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.address.toLowerCase().includes(search.toLowerCase())
    );

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);

        return (
            <>
                {[...Array(fullStars)].map((_, i) => (
                    <Icon
                        key={i}
                        icon="mingcute:star-fill"
                        className="text-yellow-400"
                        width="12"
                        height="12"
                    />
                ))}
                {hasHalfStar && (
                    <Icon
                        key="half"
                        icon="mingcute:star-half-fill"
                        className="text-yellow-400"
                        width="12"
                        height="12"
                    />
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Icon
                        key={`empty-${i}`}
                        icon="mingcute:star-line"
                        className="text-gray-300"
                        width="12"
                        height="12"
                    />
                ))}
            </>
        );
    };

    const handleRemoveFromFavorites = async (productId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            alert("Please log in to remove favorites");
            return;
        }

        try {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id)
                .eq("product_id", productId);

            if (error) {
                console.error("Error removing favorite:", error);
                alert("Failed to remove from favorites. Please try again.");
                return;
            }

            // Update local state to remove the product
            setFavoriteProducts((prev) =>
                prev.filter((product) => product.id !== productId)
            );
        } catch (error) {
            console.error("Error removing favorite:", error);
            alert("Failed to remove from favorites. Please try again.");
        }
    };

    // Handle opening clear favorites modal
    const handleOpenClearModal = () => {
        if (!user) {
            setAddToCartResult({
                type: "error",
                message: "Please log in to clear favorites",
            });
            return;
        }
        setIsClearModalOpen(true);
    };

    // Handle actual clearing of favorites
    const handleClearAllFavorites = async () => {
        if (!user) return;

        setIsClearingFavorites(true);
        try {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id);

            if (error) throw error;

            setFavoriteProducts([]);
            setAddToCartResult({
                type: "success",
                title: "Favorites Cleared",
                details: {
                    actions: [
                        {
                            type: "clear",
                            text: "All favorites have been removed",
                        },
                    ],
                    skipped: [],
                },
            });
        } catch (error) {
            console.error("Error clearing favorites:", error);
            setAddToCartResult({
                type: "error",
                message: "Failed to clear favorites. Please try again.",
            });
        } finally {
            setIsClearingFavorites(false);
            setIsClearModalOpen(false);
        }
    };

    // Handle opening add to cart modal
    const handleOpenAddToCartModal = () => {
        if (!user) {
            alert("Please log in to add items to cart");
            return;
        }

        const summary = getCartSummary();
        if (!summary || summary.totalToAdd === 0) {
            setAddToCartResult({
                type: "error",
                message: "No products available to add to cart",
            });
            return;
        }

        setIsModalOpen(true);
        setAddToCartResult(null);
    };

    // Handle actual cart addition
    const handleAddAllToCart = async () => {
        if (!user) return;

        setIsAddingToCart(true);
        setAddToCartResult(null);

        const summary = getCartSummary();
        if (!summary || summary.totalToAdd === 0) return;

        const { availableProducts } = summary;

        try {
            // Get or create user's cart
            let { data: cartData, error: cartError } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (cartError && cartError.code === "PGRST116") {
                // Cart doesn't exist, create one
                const { data: newCart, error: createCartError } = await supabase
                    .from("carts")
                    .insert({ user_id: user.id })
                    .select("id")
                    .single();

                if (createCartError) throw createCartError;
                cartData = newCart;
            } else if (cartError) {
                throw cartError;
            }

            // Get existing cart items for this user
            const { data: existingCartItems, error: existingError } =
                await supabase
                    .from("cart_items")
                    .select("product_id, quantity")
                    .eq("cart_id", cartData.id);

            if (existingError) throw existingError;

            // Create a map of existing products in cart
            const existingProductsMap = {};
            if (existingCartItems) {
                existingCartItems.forEach((item) => {
                    existingProductsMap[item.product_id] = item.quantity;
                });
            }

            // Separate products into new and existing, tracking stock limits
            const newProducts = [];
            const existingProductsToUpdate = [];
            const maxedOutCount = [];

            availableProducts.forEach((product) => {
                if (existingProductsMap[product.id]) {
                    const currentQuantity = existingProductsMap[product.id];
                    // Only update if current quantity is less than available stock
                    if (currentQuantity < product.stock) {
                        existingProductsToUpdate.push({
                            product_id: product.id,
                            current_quantity: currentQuantity,
                            new_quantity: currentQuantity + 1,
                        });
                    } else {
                        maxedOutCount.push(product.id);
                    }
                } else {
                    // New product - add with minimum order quantity if it won't exceed stock
                    const minQuantity = product.minimumOrderQuantity || 1;
                    if (minQuantity <= product.stock) {
                        newProducts.push({
                            cart_id: cartData.id,
                            product_id: product.id,
                            quantity: minQuantity,
                        });
                    }
                }
            });

            // Insert new products to cart
            if (newProducts.length > 0) {
                const { error: insertError } = await supabase
                    .from("cart_items")
                    .insert(newProducts);

                if (insertError) throw insertError;
            }

            // Update existing products in cart (add 1kg where possible)
            for (const existingProduct of existingProductsToUpdate) {
                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update({ quantity: existingProduct.new_quantity })
                    .eq("cart_id", cartData.id)
                    .eq("product_id", existingProduct.product_id);

                if (updateError) throw updateError;
            }

            // Calculate net increase in cart units (new items added + existing items incremented)
            // Each new product counts as 1 item, each updated product counts as 1 item
            const netIncrease =
                newProducts.length + existingProductsToUpdate.length;

            // Optimistically update shared cart count state for immediate UI feedback
            if (netIncrease > 0) {
                setCartCount(cartCount + netIncrease);
            }

            // Background reconciliation: fetch authoritative cart count to keep state accurate
            // This runs without blocking the modal close or toast display
            updateCartCount(user.id).catch((error) => {
                console.error(
                    "Background cart count reconciliation failed:",
                    error
                );
                // Silently fail - optimistic update already showed to user
            });

            const outOfStockCount = filteredFavorites.filter(
                (product) =>
                    product.stock <= 0 &&
                    !product.suspended &&
                    !product.notApproved
            ).length;
            const suspendedCount = filteredFavorites.filter(
                (product) => product.suspended
            ).length;
            const notApprovedCount = filteredFavorites.filter(
                (product) => product.notApproved
            ).length;
            const newItemsCount = newProducts.length;
            const updatedItemsCount = existingProductsToUpdate.length;
            const maxedItemsCount = maxedOutCount.length;

            setAddToCartResult({
                type: "success",
                details: {
                    actions: [
                        newItemsCount > 0 && {
                            type: "new",
                            count: newItemsCount,
                            text: `${newItemsCount} new ${
                                newItemsCount === 1 ? "item" : "items"
                            } added`,
                        },
                        updatedItemsCount > 0 && {
                            type: "updated",
                            count: updatedItemsCount,
                            text: `${updatedItemsCount} ${
                                updatedItemsCount === 1 ? "item" : "items"
                            } updated (+1kg each)`,
                        },
                    ].filter(Boolean),
                    skipped: [
                        outOfStockCount > 0 && {
                            type: "out-of-stock",
                            count: outOfStockCount,
                            text: `${outOfStockCount} ${
                                outOfStockCount === 1 ? "item" : "items"
                            } out of stock`,
                        },
                        maxedItemsCount > 0 && {
                            type: "max-stock",
                            count: maxedItemsCount,
                            text: `${maxedItemsCount} ${
                                outOfStockCount === 1 ? "item" : "items"
                            } at max stock`,
                        },
                        suspendedCount > 0 && {
                            type: "suspended",
                            count: suspendedCount,
                            text: `${suspendedCount} ${
                                suspendedCount === 1 ? "item" : "items"
                            } suspended and not added`,
                        },
                        notApprovedCount > 0 && {
                            type: "not-approved",
                            count: notApprovedCount,
                            text: `${notApprovedCount} ${
                                notApprovedCount === 1 ? "item" : "items"
                            } not approved and not added`,
                        },
                    ].filter(Boolean),
                },
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding items to cart:", error);
            setAddToCartResult({
                type: "error",
                message: "Failed to add items to cart. Please try again.",
                error,
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
            {/* MOBILE TOP BAR (< 768px) */}
            <header className="md:hidden sticky top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-700 hover:text-emerald-800 active:scale-95 transition-all"
                        aria-label="Go back"
                    >
                        <Icon icon="mingcute:left-line" width="22" height="22" />
                    </button>
                    <div className="flex items-center gap-1.5 font-bold text-base text-slate-900 tracking-tight">
                        <Icon icon="mingcute:heart-fill" className="w-5 h-5 text-red-500" />
                        <span>Favorites</span>
                    </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 tabular-nums border border-emerald-200/60">
                    {filteredFavorites.length} saved
                </span>
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
                        placeholder="Search saved produce…"
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
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 md:mt-8 flex-1">
                {/* DESKTOP HEADER & SEARCH */}
                <div className="hidden md:flex items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                                <Icon icon="mingcute:heart-fill" width="20" height="20" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Saved Favorites
                            </h1>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 max-w-prose">
                            Quickly order your favorite fresh produce from local Iligan growers.
                        </p>
                    </div>

                    {/* Desktop Right Controls: Search + Batch Actions */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Icon
                                icon="mingcute:search-line"
                                width="18"
                                height="18"
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-300 bg-white shadow-xs text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
                                placeholder="Search favorites…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    <Icon icon="mingcute:close-line" width="16" height="16" />
                                </button>
                            )}
                        </div>

                        {filteredFavorites.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleOpenAddToCartModal}
                                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                                >
                                    <Icon icon="mingcute:shopping-cart-1-line" width="16" height="16" />
                                    <span>Add All to Cart</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenClearModal}
                                    className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 font-medium text-xs shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                                >
                                    <Icon icon="mingcute:delete-2-line" width="16" height="16" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* MOBILE ACTIONS ROW (< 768px) */}
                {filteredFavorites.length > 0 && (
                    <div className="md:hidden flex items-center justify-between gap-2 mb-4 px-1">
                        <span className="text-xs text-slate-600 font-medium tabular-nums">
                            {filteredFavorites.length} {filteredFavorites.length === 1 ? "listing" : "listings"}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleOpenAddToCartModal}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                            >
                                <Icon icon="mingcute:shopping-cart-1-line" width="15" height="15" />
                                <span>Add All</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenClearModal}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 font-medium text-xs shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1"
                            >
                                <Icon icon="mingcute:delete-2-line" width="15" height="15" />
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* FAVORITES GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 mb-8">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
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
                    ) : !user ? (
                        <div className="col-span-full py-12">
                            <StateView
                                type="empty"
                                icon="mingcute:user-3-line"
                                title="Please sign in"
                                description="You need to be signed in to your AgriLink account to view and save favorite harvest listings."
                                actionLabel="Sign In"
                                onAction={() => navigate("/login")}
                            />
                        </div>
                    ) : filteredFavorites.length === 0 ? (
                        <div className="col-span-full py-12">
                            <StateView
                                type="empty"
                                icon="mingcute:heart-line"
                                title="No saved favorites yet"
                                description={
                                    search
                                        ? "No favorites matched your search criteria. Try a different query."
                                        : "Tap the heart icon on any fresh produce listing to keep it easily accessible here."
                                }
                                actionLabel="Explore Marketplace"
                                onAction={() => navigate("/")}
                            />
                        </div>
                    ) : (
                        filteredFavorites.map((product) => (
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
                                    {/* Category Badge */}
                                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100/80 shadow-xs">
                                        {product.category}
                                    </span>

                                    {/* Suspended / Unapproved Badges */}
                                    {product.suspended && (
                                        <span className="absolute top-8 left-2 bg-red-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                                            Suspended
                                        </span>
                                    )}
                                    {product.notApproved && !product.suspended && (
                                        <span className="absolute top-8 left-2 bg-amber-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                                            Not Approved
                                        </span>
                                    )}

                                    {/* Remove Favorite Button (44x44px Hit Target) */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveFromFavorites(product.id, e)}
                                        className="absolute top-1 right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:text-red-600 active:scale-95 transition-all"
                                        aria-label={`Remove ${product.name} from favorites`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                                            <Icon icon="mingcute:heart-fill" width="17" height="17" className="text-red-500" />
                                        </div>
                                    </button>
                                </div>

                                {/* Content Details */}
                                <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 leading-snug group-hover:text-emerald-800 transition-colors">
                                            {product.name}
                                        </h3>

                                        {/* Farmer & Location */}
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                                            <Icon icon="mingcute:user-3-line" className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                            <span className="font-medium text-slate-700 truncate">{product.farmerName}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-600">
                                            <Icon icon="mingcute:location-line" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{product.address}</span>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    {product.rating > 0 ? (
                                        <div className="flex items-center gap-1 text-xs">
                                            <Icon icon="mingcute:star-fill" className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="font-semibold text-slate-800 tabular-nums">{product.rating.toFixed(1)}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-slate-400">No reviews yet</span>
                                    )}

                                    {/* Price & Stock */}
                                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between gap-1 mt-auto">
                                        <div className="tabular-nums">
                                            <span className="text-emerald-800 font-bold text-base">₱{product.price.toFixed(2)}</span>
                                            <span className="text-[11px] font-normal text-slate-600 ml-0.5">/{product.unit}</span>
                                        </div>
                                        <span className={`text-[11px] font-medium ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>
                                            {product.stock > 0 ? `${product.stock} ${product.unit}` : "Out of stock"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </main>

            {/* Toast Notification */}
            {addToCartResult && (
                <div
                    className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-4 z-50 animate-[slide-up_0.2s_cubic-bezier(0.16,1,0.3,1)]"
                    role="alert"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                            <Icon
                                icon={
                                    addToCartResult.type === "success"
                                        ? "mingcute:check-circle-fill"
                                        : "mingcute:warning-fill"
                                }
                                width="20"
                                height="20"
                                className={`shrink-0 mt-0.5 ${
                                    addToCartResult.type === "success"
                                        ? "text-emerald-700"
                                        : "text-red-500"
                                }`}
                            />
                            <div>
                                <h4 className="font-semibold text-sm text-slate-900">
                                    {addToCartResult.type === "success"
                                        ? addToCartResult.title || "Cart Updated"
                                        : "Action Failed"}
                                </h4>
                                <div className="mt-1 space-y-1 text-xs text-slate-600">
                                    {addToCartResult.type === "success" ? (
                                        <>
                                            {addToCartResult.details?.actions?.map((action, idx) => (
                                                <div key={idx} className="inline-block bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-medium mr-1.5 mb-1 border border-emerald-100">
                                                    {action.text}
                                                </div>
                                            ))}
                                            {addToCartResult.details?.skipped?.map((skip, idx) => (
                                                <div key={idx} className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium mr-1.5 mb-1">
                                                    {skip.text}
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <p>{addToCartResult.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAddToCartResult(null)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            aria-label="Close notification"
                        >
                            <Icon icon="mingcute:close-line" width="16" height="16" />
                        </button>
                    </div>
                </div>
            )}

            {/* Add to Cart Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-md w-full p-6 animate-[scale-in_0.15s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-100/80">
                            <Icon icon="mingcute:shopping-cart-1-fill" width="24" height="24" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Add All Favorites to Cart?
                        </h3>
                        {getCartSummary() && (
                            <div className="space-y-2 text-sm text-slate-600 mb-6">
                                <p className="font-medium text-slate-800">
                                    <span className="font-bold tabular-nums text-emerald-800">
                                        {getCartSummary().totalToAdd}
                                    </span>{" "}
                                    available {getCartSummary().totalToAdd === 1 ? "item" : "items"} will be added to your cart.
                                </p>
                                {getCartSummary().outOfStockCount > 0 && (
                                    <p className="text-xs text-amber-700 flex items-center gap-1.5">
                                        <Icon icon="mingcute:alert-line" className="w-3.5 h-3.5 shrink-0" />
                                        <span>{getCartSummary().outOfStockCount} out-of-stock items will be skipped.</span>
                                    </p>
                                )}
                                {getCartSummary().suspendedCount > 0 && (
                                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                                        <Icon icon="mingcute:close-circle-line" className="w-3.5 h-3.5 shrink-0" />
                                        <span>{getCartSummary().suspendedCount} suspended items will be skipped.</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isAddingToCart}
                                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm active:scale-[0.98] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddAllToCart}
                                disabled={isAddingToCart}
                                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isAddingToCart ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Adding…</span>
                                    </>
                                ) : (
                                    <span>Confirm & Add</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Favorites Modal */}
            {isClearModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-md w-full p-6 animate-[scale-in_0.15s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
                            <Icon icon="mingcute:delete-2-line" width="24" height="24" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Remove All Favorites?
                        </h3>
                        <p className="text-sm text-slate-600 mb-6">
                            This will remove all {filteredFavorites.length} saved harvest listings from your favorites. You can always add them back later from the marketplace.
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsClearModalOpen(false)}
                                disabled={isClearingFavorites}
                                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm active:scale-[0.98] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAllFavorites}
                                disabled={isClearingFavorites}
                                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isClearingFavorites ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Removing…</span>
                                    </>
                                ) : (
                                    <span>Remove All</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SHARED NAVIGATION */}
            <NavigationBar />
        </div>
    );
}

export default Favorites;
