import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import supabase from "../../SupabaseClient";

const orderStatuses = [
    {
        value: "pending",
        label: "Pending",
        color: "bg-amber-50 text-amber-800 border border-amber-200/80",
        icon: "mingcute:time-line",
    },
    {
        value: "confirmed",
        label: "Confirmed",
        color: "bg-sky-50 text-sky-800 border border-sky-200/80",
        icon: "mingcute:check-circle-line",
    },
    {
        value: "preparing",
        label: "Preparing",
        color: "bg-orange-50 text-orange-800 border border-orange-200/80",
        icon: "mingcute:box-line",
    },
    {
        value: "ready for pickup",
        label: "Ready for Pickup",
        color: "bg-purple-50 text-purple-800 border border-purple-200/80",
        icon: "mingcute:truck-line",
    },
    {
        value: "in delivery",
        label: "In Delivery",
        color: "bg-purple-50 text-purple-800 border border-purple-200/80",
        icon: "mingcute:truck-line",
    },
    {
        value: "completed",
        label: "Completed",
        color: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
        icon: "mingcute:check-circle-fill",
    },
    {
        value: "cancelled",
        label: "Cancelled",
        color: "bg-rose-50 text-rose-800 border border-rose-200/80",
        icon: "mingcute:close-circle-line",
    },
];

function AdminTransactions() {
    const [filterDay, setFilterDay] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [filterType, setFilterType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });
    const [transactions, setTransactions] = useState([]);
    const [expandedTransaction, setExpandedTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Utility functions
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortData = (data) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
    };

    const filterData = (data) => {
        let filtered = data;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    // Order ID search
                    (item.orderId &&
                        item.orderId.toLowerCase().includes(searchLower)) ||
                    // Customer name search
                    (item.customer &&
                        item.customer.toLowerCase().includes(searchLower)) ||
                    // Producer name search
                    (item.producer &&
                        item.producer.toLowerCase().includes(searchLower)) ||
                    // Product name search in order items
                    (item.items &&
                        item.items.some(
                            (orderItem) =>
                                (orderItem.name &&
                                    orderItem.name
                                        .toLowerCase()
                                        .includes(searchLower)) ||
                                (orderItem.product &&
                                    orderItem.product.name &&
                                    orderItem.product.name
                                        .toLowerCase()
                                        .includes(searchLower))
                        ))
            );
        }

        // Apply date filters (day/month/year)
        if (filterDay || filterMonth || filterYear) {
            filtered = filtered.filter((item) => {
                const date = new Date(item.timestamp);
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();

                // Check each filter piece if provided
                if (filterDay && parseInt(filterDay) !== day) return false;
                if (filterMonth && parseInt(filterMonth) !== month)
                    return false;
                if (filterYear && parseInt(filterYear) !== year) return false;

                return true;
            });
        }

        // Apply status filter
        if (filterType) {
            filtered = filtered.filter(
                (item) =>
                    item.status &&
                    item.status.toLowerCase() === filterType.toLowerCase()
            );
        }

        return filtered;
    };

    const getStatusConfig = (status, deliveryMethod) => {
        // Handle ready for pickup/delivery status based on delivery method
        if (status?.toLowerCase() === "ready for pickup") {
            const statusValue =
                deliveryMethod?.toLowerCase() === "farm pickup"
                    ? "ready for pickup"
                    : "in delivery";

            return (
                orderStatuses.find((s) => s.value === statusValue) || {
                    value: statusValue,
                    label:
                        deliveryMethod?.toLowerCase() === "farm pickup"
                            ? "Ready for Pickup"
                            : "In Delivery",
                    color: "bg-purple-100 text-purple-800",
                    icon: "mingcute:truck-line",
                }
            );
        }

        return (
            orderStatuses.find((s) => s.value === status?.toLowerCase()) || {
                value: status?.toLowerCase() || "unknown",
                label: status || "Unknown",
                color: "bg-gray-100 text-gray-800",
                icon: "mingcute:question-line",
            }
        );
    };

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true);
            const { data: orders, error } = await supabase
                .from("orders")
                .select(
                    `
                *,
                user_id:profiles!orders_user_id_fkey(name),
                seller_id:profiles!orders_seller_id_fkey(name),
                payment_method:payment_methods!orders_payment_method_id_fkey(name),
                status:statuses!orders_status_id_fkey(name),
                delivery_method:delivery_methods!orders_delivery_method_id_fkey(name),
                order_items(
                    id,
                    quantity,
                    price_at_purchase,
                    name_at_purchase,
                    product:products(
                        id,
                        name,
                        description,
                        image_url
                    )
                )
            `
                )
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching transactions:", error);
                return;
            }

            const formattedTransactions = orders.map((order) => {
                const itemsTotal = order.order_items.reduce(
                    (sum, item) => sum + item.quantity * item.price_at_purchase,
                    0
                );
                const total = itemsTotal + (order.delivery_fee_at_order || 0);

                return {
                    id: order.id,
                    orderId: `Order #${order.id}`,
                    customer: order.user_id?.name || "Unknown Customer",
                    producer: order.seller_id?.name || "Unknown Producer",
                    paymentMethod:
                        order.payment_method?.name || "Unknown Method",
                    status: order.status?.name?.toLowerCase() || "unknown",
                    timestamp: order.created_at,
                    deliveryMethod:
                        order.delivery_method?.name || "Unknown Method",
                    deliveryFee: order.delivery_fee_at_order || 0,
                    orderNotes: order.order_notes || "",
                    amount: total,
                    items: (order.order_items || []).map((item) => ({
                        id: item.id,
                        name: item.name_at_purchase,
                        quantity: item.quantity || 0,
                        price: item.price_at_purchase || 0,
                        total:
                            (item.quantity || 0) *
                            (item.price_at_purchase || 0),
                        image:
                            item.product?.image_url || "/assets/gray-apple.png",
                    })),
                    total: total,
                };
            });

            setTransactions(formattedTransactions);
            setIsLoading(false);
        };

        fetchTransactions();
    }, []);

    // Top-level helper to fetch transactions
    const fetchTransactions = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);

        const { data: orders, error } = await supabase
            .from("orders")
            .select(
                `
                *,
                user_id:profiles!orders_user_id_fkey(name),
                seller_id:profiles!orders_seller_id_fkey(name),
                payment_method:payment_methods!orders_payment_method_id_fkey(name),
                status:statuses!orders_status_id_fkey(name),
                delivery_method:delivery_methods!orders_delivery_method_id_fkey(name),
                order_items(
                    id,
                    quantity,
                    price_at_purchase,
                    name_at_purchase,
                    product:products(
                        id,
                        name,
                        description,
                        image_url
                    )
                )
            `
            )
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching transactions:", error);
            if (showLoading) setIsLoading(false);
            return;
        }

        const formattedTransactions = orders.map((order) => {
            const itemsTotal = order.order_items.reduce(
                (sum, item) => sum + item.quantity * item.price_at_purchase,
                0
            );
            const total = itemsTotal + (order.delivery_fee_at_order || 0);

            return {
                id: order.id,
                orderId: `Order #${order.id}`,
                customer: order.user_id?.name || "Unknown Customer",
                producer: order.seller_id?.name || "Unknown Producer",
                paymentMethod: order.payment_method?.name || "Unknown Method",
                status: order.status?.name?.toLowerCase() || "unknown",
                timestamp: order.created_at,
                deliveryMethod: order.delivery_method?.name || "Unknown Method",
                deliveryFee: order.delivery_fee_at_order || 0,
                orderNotes: order.order_notes || "",
                amount: total,
                items: (order.order_items || []).map((item) => ({
                    id: item.id,
                    name: item.name_at_purchase,
                    quantity: item.quantity || 0,
                    price: item.price_at_purchase || 0,
                    total: (item.quantity || 0) * (item.price_at_purchase || 0),
                    image:
                        item.product?.image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                })),
                total: total,
            };
        });

        setTransactions(formattedTransactions);
        if (showLoading) setIsLoading(false);
    };

    // Set up Realtime subscriptions for transaction updates
    useEffect(() => {
        const realtimeChannel = supabase.channel("admin_transactions");

        // Listen to orders changes
        realtimeChannel
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                () => {
                    // Refresh transactions without showing loading state
                    fetchTransactions(false);
                }
            )
            // Listen to order_items changes (affects totals and items)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "order_items",
                },
                () => {
                    // Refresh transactions without showing loading state
                    fetchTransactions(false);
                }
            );

        realtimeChannel.subscribe();

        // Cleanup: unsubscribe on unmount
        return () => {
            realtimeChannel.unsubscribe();
        };
    }, []);

    const toggleExpanded = (transactionId) => {
        setExpandedTransaction(
            expandedTransaction === transactionId ? null : transactionId
        );
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-slate-50/50 overflow-x-hidden text-slate-800 pb-24 md:pb-16">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Icon icon="mingcute:bill-line" className="w-4 h-4" />
                    </div>
                    <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                        Transaction Logs
                    </h1>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                    {transactions.length} records
                </span>
            </div>

            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            <span>Admin Portal</span>
                            <Icon icon="mingcute:right-line" className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-emerald-700">Financial Audit</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Transaction Logs
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 max-w-prose">
                            Audit platform orders, payments, delivery statuses, and buyer-seller receipts.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs text-right">
                            <div className="text-[10px] uppercase font-semibold text-slate-400">
                                Total Orders
                            </div>
                            <div className="text-base font-bold text-slate-900 tabular-nums">
                                {transactions.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Logs */}
                <div className="space-y-4">
                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-5 relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Search by order ID, customer, producer, or crop…"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                />
                            </div>
                            <div className="md:col-span-4 flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="Day"
                                    value={filterDay}
                                    onChange={(e) =>
                                        setFilterDay(e.target.value)
                                    }
                                    className="w-1/3 h-11 px-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-center text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 tabular-nums transition-all"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    placeholder="Month"
                                    value={filterMonth}
                                    onChange={(e) =>
                                        setFilterMonth(e.target.value)
                                    }
                                    className="w-1/3 h-11 px-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-center text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 tabular-nums transition-all"
                                />
                                <input
                                    type="number"
                                    min="2000"
                                    placeholder="Year"
                                    value={filterYear}
                                    onChange={(e) =>
                                        setFilterYear(e.target.value)
                                    }
                                    className="w-1/3 h-11 px-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-center text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 tabular-nums transition-all"
                                />
                            </div>
                            <div className="md:col-span-3 flex items-center gap-2">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full h-11 px-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 cursor-pointer transition-all"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready for pickup">
                                        Ready for Pickup / Delivery
                                    </option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {(searchTerm || filterDay || filterMonth || filterYear || filterType) && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setFilterDay("");
                                            setFilterMonth("");
                                            setFilterYear("");
                                            setFilterType("");
                                        }}
                                        className="h-11 px-3 inline-flex items-center justify-center rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 active:scale-95 transition-all cursor-pointer"
                                        title="Clear filters"
                                    >
                                        <Icon icon="mingcute:close-line" className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-200/80">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                            Transaction
                                        </th>
                                        <th
                                            className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 select-none transition-colors"
                                            onClick={() => handleSort("amount")}
                                        >
                                            <div className="inline-flex items-center gap-1">
                                                <span>Amount</span>
                                                {sortConfig.key === "amount" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction === "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="w-3.5 h-3.5 text-emerald-700"
                                                    />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 select-none transition-colors"
                                            onClick={() =>
                                                handleSort("customer")
                                            }
                                        >
                                            <div className="inline-flex items-center gap-1">
                                                <span>Customer</span>
                                                {sortConfig.key === "customer" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction === "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="w-3.5 h-3.5 text-emerald-700"
                                                    />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 select-none transition-colors"
                                            onClick={() =>
                                                handleSort("producer")
                                            }
                                        >
                                            <div className="inline-flex items-center gap-1">
                                                <span>Producer</span>
                                                {sortConfig.key === "producer" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction === "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="w-3.5 h-3.5 text-emerald-700"
                                                    />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th
                                            className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 select-none transition-colors"
                                            onClick={() =>
                                                handleSort("timestamp")
                                            }
                                        >
                                            <div className="inline-flex items-center gap-1">
                                                <span>Date</span>
                                                {sortConfig.key === "timestamp" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction === "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="w-3.5 h-3.5 text-emerald-700"
                                                    />
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filterData(sortData(transactions))
                                        .filter(
                                            (transaction) => transaction != null
                                        )
                                        .map((transaction) => (
                                            <React.Fragment
                                                key={transaction.id}
                                            >
                                                <tr
                                                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                                                        expandedTransaction === transaction.id
                                                            ? "bg-emerald-50/30"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        toggleExpanded(
                                                            transaction.id
                                                        )
                                                    }
                                                >
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-emerald-800">
                                                        <div className="flex items-center">
                                                            <Icon
                                                                icon={
                                                                    expandedTransaction ===
                                                                    transaction.id
                                                                        ? "mingcute:down-line"
                                                                        : "mingcute:right-line"
                                                                }
                                                                className="mr-2 w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors"
                                                            />
                                                            {
                                                                transaction.orderId
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-slate-900 tabular-nums">
                                                        ₱
                                                        {(
                                                            transaction.amount ??
                                                            0
                                                        ).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-800">
                                                        {transaction.customer}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-slate-600">
                                                        {transaction.producer}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                                                                getStatusConfig(
                                                                    transaction.status,
                                                                    transaction.deliveryMethod
                                                                ).color
                                                            }`}
                                                        >
                                                            <Icon
                                                                icon={
                                                                    getStatusConfig(
                                                                        transaction.status,
                                                                        transaction.deliveryMethod
                                                                    ).icon
                                                                }
                                                                className="w-3.5 h-3.5"
                                                            />
                                                            {
                                                                getStatusConfig(
                                                                    transaction.status,
                                                                    transaction.deliveryMethod
                                                                ).label
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                                                        {transaction.timestamp
                                                            ? new Date(
                                                                  transaction.timestamp
                                                              ).toLocaleDateString("en-US", {
                                                                  year: "numeric",
                                                                  month: "short",
                                                                  day: "numeric",
                                                              })
                                                            : "N/A"}
                                                    </td>
                                                </tr>
                                                {expandedTransaction ===
                                                    transaction.id && (
                                                    <tr>
                                                        <td
                                                            colSpan="7"
                                                            className="px-6 py-4 bg-gray-50"
                                                        >
                                                            <div className="space-y-6">
                                                                {/* Order Summary Header */}
                                                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                                                    <div className="flex items-center gap-3">
                                                                        <Icon
                                                                            icon="mingcute:document-line"
                                                                            className="w-5 h-5 text-primary"
                                                                        />
                                                                        <span className="text-sm font-semibold text-gray-900">
                                                                            {
                                                                                transaction.orderId
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <span
                                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-full ${
                                                                            getStatusConfig(
                                                                                transaction.status,
                                                                                transaction.deliveryMethod
                                                                            )
                                                                                .color
                                                                        }`}
                                                                    >
                                                                        <Icon
                                                                            icon={
                                                                                getStatusConfig(
                                                                                    transaction.status,
                                                                                    transaction.deliveryMethod
                                                                                )
                                                                                    .icon
                                                                            }
                                                                            className="w-3.5 h-3.5"
                                                                        />
                                                                        {
                                                                            getStatusConfig(
                                                                                transaction.status,
                                                                                transaction.deliveryMethod
                                                                            )
                                                                                .label
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {/* Products Grid */}
                                                                <div className="bg-white rounded-lg border border-gray-200">
                                                                    <div className="px-4 py-3 border-b border-gray-200">
                                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                                            Order
                                                                            Items
                                                                        </h3>
                                                                    </div>
                                                                    <div className="divide-y divide-gray-200">
                                                                        {transaction.items.map(
                                                                            (
                                                                                item
                                                                            ) => (
                                                                                <div
                                                                                    key={`${
                                                                                        transaction.id
                                                                                    }-${
                                                                                        item.id ||
                                                                                        item.name
                                                                                    }`}
                                                                                    className="p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                                                                                >
                                                                                    <div className="flex-shrink-0">
                                                                                        <img
                                                                                            src={
                                                                                                item.image
                                                                                            }
                                                                                            alt={
                                                                                                item.name
                                                                                            }
                                                                                            className="w-20 h-20 object-cover rounded-lg"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <h4 className="text-sm font-medium text-gray-900">
                                                                                            {
                                                                                                item.name
                                                                                            }
                                                                                        </h4>
                                                                                        <p className="text-sm text-gray-500 mt-1">
                                                                                            Quantity:{" "}
                                                                                            {
                                                                                                item.quantity
                                                                                            }{" "}
                                                                                            kg
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="flex flex-col sm:items-end gap-1">
                                                                                        <span className="text-sm text-gray-500">
                                                                                            ₱
                                                                                            {(
                                                                                                item.price ??
                                                                                                0
                                                                                            ).toFixed(
                                                                                                2
                                                                                            )}{" "}
                                                                                            /
                                                                                            kg
                                                                                        </span>
                                                                                        <span className="text-sm font-medium text-gray-900">
                                                                                            ₱
                                                                                            {(
                                                                                                item.total ??
                                                                                                0
                                                                                            ).toFixed(
                                                                                                2
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Order Details Grid */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {/* Delivery and Payment Info */}
                                                                    <div className="bg-white rounded-lg border border-gray-200">
                                                                        <div className="px-4 py-3 border-b border-gray-200">
                                                                            <h3 className="text-sm font-semibold text-gray-900">
                                                                                Delivery
                                                                                &
                                                                                Payment
                                                                            </h3>
                                                                        </div>
                                                                        <div className="p-4 space-y-3">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-sm text-gray-500">
                                                                                    Delivery
                                                                                    Method
                                                                                </span>
                                                                                <span className="text-sm font-medium text-gray-900">
                                                                                    {
                                                                                        transaction.deliveryMethod
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-sm text-gray-500">
                                                                                    Payment
                                                                                    Method
                                                                                </span>
                                                                                <span className="text-sm font-medium text-gray-900">
                                                                                    {
                                                                                        transaction.paymentMethod
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            {transaction.orderNotes && (
                                                                                <div className="pt-3 border-t border-gray-200">
                                                                                    <span className="text-sm text-gray-500 block mb-1">
                                                                                        Order
                                                                                        Notes
                                                                                    </span>
                                                                                    <p className="text-sm text-gray-900">
                                                                                        {
                                                                                            transaction.orderNotes
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Summary */}
                                                                    <div className="bg-white rounded-lg border border-gray-200">
                                                                        <div className="px-4 py-3 border-b border-gray-200">
                                                                            <h3 className="text-sm font-semibold text-gray-900">
                                                                                Order
                                                                                Summary
                                                                            </h3>
                                                                        </div>
                                                                        <div className="p-4 space-y-3">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-sm text-gray-500">
                                                                                    Subtotal
                                                                                </span>
                                                                                <span className="text-sm text-gray-900">
                                                                                    ₱
                                                                                    {(
                                                                                        transaction.amount -
                                                                                        transaction.deliveryFee
                                                                                    ).toFixed(
                                                                                        2
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-sm text-gray-500">
                                                                                    Delivery
                                                                                    Fee
                                                                                </span>
                                                                                <span className="text-sm text-gray-900">
                                                                                    ₱
                                                                                    {(
                                                                                        transaction.deliveryFee ??
                                                                                        0
                                                                                    ).toFixed(
                                                                                        2
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="pt-3 border-t border-gray-200">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-sm font-medium text-gray-900">
                                                                                        Total
                                                                                    </span>
                                                                                    <span className="text-base font-semibold text-primary">
                                                                                        ₱
                                                                                        {transaction.amount.toFixed(
                                                                                            2
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <AdminNavigationBar />
        </div>
    );
}

export default AdminTransactions;
