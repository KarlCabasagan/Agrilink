import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";
import RejectModal from "../../components/RejectModal";
import SuspendUserModal from "../../components/SuspendUserModal";
import supabase from "../../SupabaseClient";
import { deleteImageFromUrl } from "../../utils/imageUpload";
import { toast } from "react-hot-toast";
import { getProfileAvatarUrl } from "../../utils/avatarUtils.js";

function AdminUserManagement() {
    // Get                         {filterData(producerApplications).length === 0 ? (al tab from localStorage or default to "applications"
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("adminUsersActiveTab") || "applications";
    });

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("adminUsersActiveTab", activeTab);
    }, [activeTab]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });
    const [processingId, setProcessingId] = useState(null);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [userToSuspend, setUserToSuspend] = useState(null);

    // Data states with loading and error handling
    const [producerApplications, setProducerApplications] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loadingApplications, setLoadingApplications] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState(null);

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
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase(); // Optimization: compute once

        return data.filter(
            (item) =>
                (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
                (item.email && item.email.toLowerCase().includes(lowerTerm)) ||
                (item.role && item.role.toLowerCase().includes(lowerTerm)) ||
                (item.address && item.address.toLowerCase().includes(lowerTerm))
        );
    };

    // Fetch producer applications
    const fetchProducerApplications = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoadingApplications(true);
            }
            setError(null);

            const { data: applications, error: applicationsError } =
                await supabase
                    .from("seller_applications")
                    .select(
                        `
                        *,
                        profiles:user_id (
                            id,
                            name,
                            email,
                            contact,
                            address,
                            avatar_url
                        ),
                        application_crops!inner (
                            crops:crop_id (
                                id,
                                name
                            )
                        )
                    `
                    )
                    .is("rejection_reason", null) // Only get applications that haven't been rejected
                    .order("created_at", { ascending: false });

            if (applicationsError) throw applicationsError;

            const formattedApplications = applications.map((app) => ({
                id: app.id,
                userId: app.user_id,
                user_id: app.user_id,
                name: app.profiles.name,
                email: app.profiles.email,
                contact: app.profiles.contact,
                address: app.profiles.address,
                profileImage: getProfileAvatarUrl(app.profiles),
                validIdUrl: app.valid_id_url,
                experience: app.farming_experience,
                crops: app.application_crops.map((ac) => ac.crops.name),
                applicationDate: app.created_at,
                rejectionReason: app.rejection_reason,
            }));
            setProducerApplications(formattedApplications);
        } catch (err) {
            setError(err.message);
            toast.error("Failed to load applications");
        } finally {
            if (showLoading) {
                setLoadingApplications(false);
            }
        }
    };

    // Fetch all users
    const fetchUsers = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoadingUsers(true);
            }
            setError(null);

            // First, get the status mappings
            const { data: statuses, error: statusError } = await supabase
                .from("statuses")
                .select("id, name")
                .eq("category", "Users & Products");

            if (statusError) throw statusError;

            const statusMap = Object.fromEntries(
                statuses.map((status) => [status.id, status.name])
            );

            // Then fetch users with their roles and status
            const { data: users, error: usersError } = await supabase
                .from("profiles")
                .select(
                    `
                    *,
                    roles:role_id (name),
                    statuses:status_id (name)
                `
                )
                .order("created_at", { ascending: false });

            if (usersError) throw usersError;

            const formattedUsers = users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: getProfileAvatarUrl(user),
                role: user.roles.name,
                status: statusMap[user.status_id] || "Unknown",
                statusLabel: (statusMap[user.status_id] || "unknown").replace(
                    /\b\w/g,
                    (l) => l.toUpperCase()
                ),
                roleId: user.role_id,
                statusId: user.status_id,
                joinDate: user.created_at,
                lastLogin: user.last_login,
                suspensionReason: user.suspension_reason,
            }));

            setAllUsers(formattedUsers);
        } catch (err) {
            setError(err.message);
            toast.error("Failed to load users");
        } finally {
            if (showLoading) {
                setLoadingUsers(false);
            }
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchProducerApplications(true);
        fetchUsers(true);
    }, []);

    // Set up Realtime subscriptions for selective tab updates
    useEffect(() => {
        const realtimeChannel = supabase.channel("admin_user_management");

        // Listener for seller_applications changes - only update applications tab
        realtimeChannel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "seller_applications",
            },
            () => {
                fetchProducerApplications(false);
            }
        );

        // Listener for profiles changes - only update users tab
        realtimeChannel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "profiles",
            },
            () => {
                fetchUsers(false);
            }
        );

        realtimeChannel.subscribe();

        // Cleanup: unsubscribe from channel on unmount
        return () => {
            realtimeChannel.unsubscribe();
        };
    }, []);

    // Monitor and cleanup modal state
    useEffect(() => {
        if (!showConfirmModal && !showRejectModal) {
            setConfirmAction(null);
            setProcessingId(null);
        }
    }, [showConfirmModal, showRejectModal]);

    const handleApplicationAction = (applicationId, action) => {
        try {
            const application = producerApplications.find(
                (app) => app.id === applicationId
            );
            if (!application) {
                toast.error("Application not found");
                return;
            }

            // Clear previous state
            setConfirmAction(null);
            setShowConfirmModal(false);
            setShowRejectModal(false);
            setProcessingId(null);

            // Set new state
            setConfirmAction({ id: applicationId, type: action });

            // Open appropriate modal
            if (action === "approved") {
                setShowConfirmModal(true);
            } else {
                setShowRejectModal(true);
            }
        } catch (error) {
            toast.error("Failed to process application action");
        }
    };

    const deleteValidIdFile = async (fileUrl) => {
        if (!fileUrl) return null;
        try {
            const success = await deleteImageFromUrl(fileUrl, "valid_ids");
            if (!success) {
                return new Error("Failed to delete valid ID file");
            }
            return null;
        } catch (err) {
            return err;
        }
    };

    const handleReject = async (reason) => {
        if (!confirmAction) return;
        const { id } = confirmAction;
        const application = producerApplications.find((app) => app.id === id);

        if (!application) {
            toast.error("Application not found");
            return;
        }

        try {
            setProcessingId(id);

            // Update seller application with rejection reason
            const { error: rejectError } = await supabase
                .from("seller_applications")
                .update({
                    rejection_reason: reason,
                })
                .eq("id", id);

            if (rejectError) throw rejectError;

            // Delete valid ID file after successful rejection
            if (application.validIdUrl) {
                const deleteError = await deleteValidIdFile(
                    application.validIdUrl
                );
                if (deleteError) {
                    console.error("Warning: Failed to delete valid ID file");
                }
            }

            // Refresh data
            await fetchProducerApplications();
            await fetchUsers();

            toast.success("Application rejected successfully");
            setShowRejectModal(false);
        } catch (err) {
            toast.error("Failed to reject application");
            console.error("Error in handleReject:", err);
        } finally {
            setProcessingId(null);
            setConfirmAction(null);
        }
    };

    const confirmApplicationAction = async () => {
        if (!confirmAction || !confirmAction.id) {
            console.error("❌ No application selected for approval");
            return;
        }

        const { id } = confirmAction;
        console.log("🔍 Looking for application:", id);
        const application = producerApplications.find((app) => app.id === id);
        console.log("📄 Found application:", application);

        if (!application || !application.user_id) {
            console.error(
                "❌ Application or user data not found:",
                application
            );
            toast.error("Could not process application: missing data");
            return;
        }

        try {
            console.log("🚀 Starting approval process for:", {
                applicationId: id,
                userId: application.user_id,
                name: application.name,
            });
            setProcessingId(id);

            // Store valid ID URL for later deletion
            const validIdUrl = application.validIdUrl;

            // First verify the user exists and isn't already a producer
            const { data: existingProfile, error: profileCheckError } =
                await supabase
                    .from("profiles")
                    .select("role_id, id")
                    .eq("id", application.user_id)
                    .single();

            if (profileCheckError) {
                throw new Error(
                    "Failed to verify user profile: " +
                        profileCheckError.message
                );
            }
            console.log("👤 Current user profile:", existingProfile);
            if (existingProfile.role_id === 2) {
                throw new Error("User is already a producer");
            }

            // Correct Supabase update: use .select() and .single() to get updated row
            const { data: updatedProfile, error: profileError } = await supabase
                .from("profiles")
                .update({
                    role_id: 2,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", application.user_id)
                .select("id, role_id, name")
                .single();

            if (profileError || !updatedProfile) {
                console.error("❌ Profile update error:", profileError);
                throw new Error(
                    profileError?.message ||
                        "Failed to update user profile - no data returned"
                );
            }
            console.log("✅ Profile updated successfully:", updatedProfile);

            // Delete the seller application
            const { error: applicationError } = await supabase
                .from("seller_applications")
                .delete()
                .eq("id", id)
                .eq("user_id", application.user_id);

            if (applicationError) {
                console.error(
                    "❌ Application deletion error:",
                    applicationError
                );
                // Revert the profile changes
                const { error: revertError } = await supabase
                    .from("profiles")
                    .update({
                        role_id: 1,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", application.user_id);
                if (revertError) {
                    console.error(
                        "❌ Failed to revert profile changes:",
                        revertError
                    );
                }
                throw new Error(
                    "Failed to delete application. Changes have been reverted."
                );
            }
            console.log(
                "✅ Application deleted for user:",
                application.user_id
            );

            // Delete the valid ID file
            if (validIdUrl) {
                console.log("🗑️ Deleting valid ID file...");
                const deleteError = await deleteValidIdFile(validIdUrl);
                if (deleteError) {
                    console.error(
                        "Warning: Failed to delete valid ID file:",
                        deleteError
                    );
                }
            }

            // Refresh data
            console.log("🔄 Refreshing data...");
            await Promise.all([fetchProducerApplications(), fetchUsers()]);
            console.log("✨ Approval process completed successfully");
            toast.success(
                `Successfully approved ${application.name}'s application`
            );
        } catch (err) {
            console.error("❌ Approval error:", err);
            toast.error(err.message || "Failed to approve application");
        } finally {
            setProcessingId(null);
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    const handleUserAction = async (userId, action) => {
        try {
            const user = allUsers.find((u) => u.id === userId);
            if (!user) {
                throw new Error("User not found");
            }

            if (action === "suspend") {
                setUserToSuspend(user);
                setShowSuspendModal(true);
                return;
            }

            const previousSuspensionReason = user.suspensionReason;

            // Handle activation
            const { error } = await supabase
                .from("profiles")
                .update({
                    status_id: 1, // active
                    suspension_reason: null, // Clear suspension reason
                })
                .eq("id", userId);

            if (error) throw error;

            if (user.roleId === 2) {
                const { data: userProducts, error: userProductsError } =
                    await supabase
                        .from("products")
                        .select("id")
                        .eq("user_id", userId);

                if (userProductsError) {
                    await supabase
                        .from("profiles")
                        .update({
                            status_id: 2,
                            suspension_reason: previousSuspensionReason,
                        })
                        .eq("id", userId);
                    throw userProductsError;
                }

                if (userProducts?.length) {
                    const {
                        data: suspendedProducts,
                        error: suspendedProductsError,
                    } = await supabase
                        .from("suspended_products")
                        .select("product_id");

                    if (suspendedProductsError) {
                        await supabase
                            .from("profiles")
                            .update({
                                status_id: 2,
                                suspension_reason: previousSuspensionReason,
                            })
                            .eq("id", userId);
                        throw suspendedProductsError;
                    }

                    const suspendedProductSet = new Set(
                        suspendedProducts?.map((item) => item.product_id) || []
                    );

                    const productIdsToActivate = userProducts
                        .filter(
                            (product) => !suspendedProductSet.has(product.id)
                        )
                        .map((product) => product.id);

                    if (productIdsToActivate.length) {
                        const { error: productActivationError } = await supabase
                            .from("products")
                            .update({ status_id: 1 })
                            .in("id", productIdsToActivate);

                        if (productActivationError) {
                            await supabase
                                .from("profiles")
                                .update({
                                    status_id: 2,
                                    suspension_reason: previousSuspensionReason,
                                })
                                .eq("id", userId);
                            throw productActivationError;
                        }
                    }
                }
            }

            // Update UI optimistically
            setAllUsers((prev) =>
                prev.map((currentUser) => {
                    if (currentUser.id === userId) {
                        return {
                            ...currentUser,
                            status: "Active",
                            statusId: 1,
                            suspensionReason: null,
                        };
                    }
                    return currentUser;
                })
            );

            toast.success("User successfully activated");
        } catch (err) {
            toast.error("Failed to update user status");
            console.error("User action error:", err);
        }
    };

    const handleSuspendUser = async (reason) => {
        try {
            if (!userToSuspend)
                throw new Error("No user selected for suspension");

            const previousSuspensionReason = userToSuspend.suspensionReason;

            const { error } = await supabase
                .from("profiles")
                .update({
                    status_id: 2, // suspended
                    suspension_reason: reason,
                })
                .eq("id", userToSuspend.id);

            if (error) throw error;

            if (userToSuspend.roleId === 2) {
                const { error: productSuspensionError } = await supabase
                    .from("products")
                    .update({ status_id: 2 })
                    .eq("user_id", userToSuspend.id);

                if (productSuspensionError) {
                    await supabase
                        .from("profiles")
                        .update({
                            status_id: 1,
                            suspension_reason: previousSuspensionReason,
                        })
                        .eq("id", userToSuspend.id);
                    throw productSuspensionError;
                }
            }

            // Update UI optimistically
            setAllUsers((prev) =>
                prev.map((user) => {
                    if (user.id === userToSuspend.id) {
                        return {
                            ...user,
                            status: "Suspended",
                            statusId: 2,
                            suspensionReason: reason,
                        };
                    }
                    return user;
                })
            );

            toast.success("User successfully suspended");
            setShowSuspendModal(false);
            setUserToSuspend(null);
        } catch (err) {
            toast.error("Failed to suspend user");
            console.error("User suspension error:", err);
        }
    };

    const handleRoleToggle = async (userId) => {
        const user = allUsers.find((u) => u.id === userId);
        if (!user || user.role === "Admin") return; // Don't allow toggling admin roles

        try {
            const newRoleId = user.roleId === 1 ? 2 : 1; // Toggle between Consumer (1) and Producer (2)

            if (newRoleId === 2) {
                // When promoting to producer, use RPC function that handles application cleanup
                const { data, error: promoteError } = await supabase.rpc(
                    "promote_to_producer",
                    {
                        target_user_id: userId,
                    }
                );

                if (promoteError) {
                    console.error("Promotion error:", promoteError);
                    throw new Error(
                        promoteError.message ||
                            "Failed to promote user to producer"
                    );
                }

                if (!data) {
                    throw new Error(
                        "No response received from promotion function"
                    );
                }
            } else {
                // For demoting to consumer, just update the role
                const { error: updateError } = await supabase
                    .from("profiles")
                    .update({
                        role_id: newRoleId,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);

                if (updateError) {
                    console.error("Demotion error:", updateError);
                    throw new Error("Failed to demote user to consumer");
                }
            }

            // Refresh both users and applications lists since we might have cleaned up applications
            await Promise.all([fetchUsers(), fetchProducerApplications()]);

            toast.success(
                `User role changed to ${
                    newRoleId === 2 ? "Producer" : "Consumer"
                } successfully`
            );
        } catch (err) {
            toast.error(err.message || "Failed to update user role");
            console.error("Role toggle error:", err);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center bg-slate-50/50 text-slate-800 overflow-x-hidden">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 h-14 flex items-center justify-center">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    User Management
                </h1>
            </header>

            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-24 md:pb-16">
                {/* Desktop Header Banner */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            User Management
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Verify producer seller applications and manage platform user credentials.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab("applications")}
                            className={`flex-1 min-h-[42px] py-2 px-4 text-center text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 ${
                                activeTab === "applications"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <span>Producer Applications</span>
                            {producerApplications.length > 0 && (
                                <span className="bg-emerald-800 text-white text-[10px] font-bold tabular-nums min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-2xs">
                                    {producerApplications.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`flex-1 min-h-[42px] py-2 px-4 text-center text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                                activeTab === "users"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            All Users
                        </button>
                    </div>
                </div>

                {/* Producer Applications Tab */}
                {activeTab === "applications" && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search applications by applicant name, email, or address…"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                />
                            </div>
                        </div>

                        {loadingApplications ? (
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center">
                                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-slate-500 text-xs mt-3">
                                    Loading applications…
                                </p>
                            </div>
                        ) : error ? (
                            <div className="bg-white rounded-2xl border border-rose-200/90 shadow-2xs p-8 text-center">
                                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-3">
                                    <Icon
                                        icon="mingcute:warning-line"
                                        width="24"
                                        height="24"
                                    />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">
                                    Error Loading Data
                                </h3>
                                <p className="text-xs text-slate-600">{error}</p>
                            </div>
                        ) : filterData(producerApplications).length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-10 text-center flex flex-col items-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                                    <Icon
                                        icon="mingcute:user-add-line"
                                        width="28"
                                        height="28"
                                    />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">
                                    No Applications Found
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm">
                                    There are currently no producer seller applications pending review.
                                </p>
                            </div>
                        ) : (
                            filterData(sortData(producerApplications)).map(
                                (application) => (
                                    <div
                                        key={application.id}
                                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 transition-all duration-150"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3.5">
                                                <img
                                                    src={
                                                        application.profileImage
                                                    }
                                                    alt={application.name}
                                                    className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:opacity-85 transition-opacity"
                                                    onClick={() =>
                                                        handleImageClick(
                                                            application.profileImage
                                                        )
                                                    }
                                                />
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                                        {application.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 tabular-nums">
                                                        Applied on{" "}
                                                        {new Date(
                                                            application.applicationDate
                                                        ).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Valid ID preview button */}
                                            <button
                                                onClick={() =>
                                                    handleImageClick(
                                                        application.validIdUrl
                                                    )
                                                }
                                                className="self-start sm:self-auto min-h-[38px] px-3.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                            >
                                                <Icon
                                                    icon="mingcute:idcard-line"
                                                    className="w-4 h-4 text-emerald-700"
                                                />
                                                <span>View Valid ID Document</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 mb-4">
                                            <div>
                                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                    Email & Contact
                                                </h4>
                                                <p className="text-xs font-semibold text-slate-800 break-all">
                                                    {application.email}
                                                </p>
                                                <p className="text-xs text-slate-600 tabular-nums">
                                                    {application.contact}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                    Farming Experience
                                                </h4>
                                                <p className="text-xs font-semibold text-slate-800">
                                                    {application.experience || "Not specified"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                    Farm Address
                                                </h4>
                                                <p className="text-xs text-slate-700 leading-relaxed">
                                                    {application.address || "No address provided"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                    Target Crops{" "}
                                                    <span className="tabular-nums">
                                                        ({application.crops.length})
                                                    </span>
                                                </h4>
                                                <div className="max-h-[4rem] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 pr-1">
                                                    <div className="flex flex-wrap gap-1">
                                                        {application.crops.map(
                                                            (crop, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums"
                                                                >
                                                                    {crop}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                                            <button
                                                onClick={() =>
                                                    handleApplicationAction(
                                                        application.id,
                                                        "rejected"
                                                    )
                                                }
                                                disabled={
                                                    processingId ===
                                                    application.id
                                                }
                                                className="min-h-[40px] px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId ===
                                                    application.id &&
                                                confirmAction?.type ===
                                                    "rejected" ? (
                                                    <>
                                                        <Icon
                                                            icon="mingcute:loading-line"
                                                            className="animate-spin w-3.5 h-3.5"
                                                        />
                                                        <span>Rejecting…</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon icon="mingcute:close-line" className="w-3.5 h-3.5" />
                                                        <span>Reject</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleApplicationAction(
                                                        application.id,
                                                        "approved"
                                                    )
                                                }
                                                disabled={
                                                    processingId ===
                                                    application.id
                                                }
                                                className="min-h-[40px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId ===
                                                    application.id &&
                                                confirmAction?.type ===
                                                    "approved" ? (
                                                    <>
                                                        <Icon
                                                            icon="mingcute:loading-line"
                                                            className="animate-spin w-3.5 h-3.5"
                                                        />
                                                        <span>Approving…</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon icon="mingcute:check-line" className="w-3.5 h-3.5" />
                                                        <span>Approve Producer</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>
                )}

                {/* All Users Tab */}
                {activeTab === "users" && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search users by name, email, role, or location…"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 border-b border-slate-200/80">
                                        <tr>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("name")
                                                }
                                            >
                                                User{" "}
                                                {sortConfig.key === "name" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("role")
                                                }
                                            >
                                                Role{" "}
                                                {sortConfig.key === "role" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("status")
                                                }
                                            >
                                                Status{" "}
                                                {sortConfig.key ===
                                                    "status" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("joinDate")
                                                }
                                            >
                                                Join Date{" "}
                                                {sortConfig.key ===
                                                    "joinDate" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("lastLogin")
                                                }
                                            >
                                                Last Login{" "}
                                                {sortConfig.key ===
                                                    "lastLogin" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {filterData(sortData(allUsers)).map(
                                            (user) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-slate-50/70 transition-colors"
                                                >
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={
                                                                    user.profileImage
                                                                }
                                                                alt={user.name}
                                                                className="w-10 h-10 object-cover rounded-xl border border-slate-200 shadow-2xs"
                                                            />
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-900 tracking-tight">
                                                                    {user.name}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500">
                                                                    {user.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <span
                                                            onClick={() =>
                                                                handleRoleToggle(
                                                                    user.id
                                                                )
                                                            }
                                                            className={`inline-flex px-2.5 py-0.5 text-[11px] font-semibold rounded-full cursor-pointer transition-all duration-150 active:scale-95 shadow-2xs ${
                                                                user.role ===
                                                                "Admin"
                                                                    ? "bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100"
                                                                    : user.role ===
                                                                      "Producer"
                                                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
                                                                    : "bg-sky-50 text-sky-800 border border-sky-200/80 hover:bg-sky-100"
                                                            }`}
                                                            title="Click to toggle between Consumer and Producer"
                                                        >
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full cursor-help shadow-2xs transition-all duration-150 ${
                                                                    user.statusId ===
                                                                    1
                                                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                                                                        : user.statusId ===
                                                                          2
                                                                        ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                                                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                                                }`}
                                                                title={
                                                                    user.suspensionReason
                                                                        ? `Suspension Reason: ${user.suspensionReason}`
                                                                        : "User Active"
                                                                }
                                                            >
                                                                <Icon
                                                                    icon={
                                                                        user.statusId ===
                                                                        1
                                                                            ? "mingcute:user-follow-2-line"
                                                                            : user.statusId ===
                                                                              2
                                                                            ? "mingcute:user-forbid-line"
                                                                            : "mingcute:question-fill"
                                                                    }
                                                                    className="w-3.5 h-3.5"
                                                                />
                                                                {user.statusId ===
                                                                1
                                                                    ? "Active"
                                                                    : user.statusId ===
                                                                      2
                                                                    ? "Suspended"
                                                                    : "Pending"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 tabular-nums">
                                                        {new Date(
                                                            user.joinDate
                                                        ).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 tabular-nums">
                                                        {new Date(
                                                            user.lastLogin
                                                        ).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                                        {user.role !==
                                                            "Admin" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleUserAction(
                                                                        user.id,
                                                                        user.statusId ===
                                                                            1
                                                                            ? "suspend"
                                                                            : "activate"
                                                                    )
                                                                }
                                                                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 ${
                                                                    user.statusId ===
                                                                    1
                                                                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80"
                                                                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80"
                                                                }`}
                                                            >
                                                                {user.statusId ===
                                                                1
                                                                    ? "Suspend"
                                                                    : "Activate"}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                open={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                }}
                onConfirm={() => {
                    if (confirmAction) {
                        confirmApplicationAction();
                    } else {
                        toast.error("No application selected for approval");
                    }
                }}
                title="Approve Producer Application"
                message={
                    confirmAction
                        ? `Are you sure you want to approve ${
                              producerApplications.find(
                                  (app) => app.id === confirmAction.id
                              )?.name
                          }'s application?`
                        : "Loading application details..."
                }
                confirmText="Approve"
                confirmButtonClass="bg-green-600 hover:bg-green-700"
            />

            {/* Image Modal */}
            {showImageModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black opacity-70 flex items-center justify-center z-[9999]"
                        onClick={() => setShowImageModal(false)}
                    ></div>
                    <div
                        className="bg-white p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto transform transition-all duration-300 ease-in-out z-[10000] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedImage?.includes("valid-ids")
                                    ? "Valid ID"
                                    : "Profile Image"}
                            </h3>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="24"
                                    height="24"
                                />
                            </button>
                        </div>
                        <img
                            src={selectedImage}
                            alt={
                                selectedImage?.includes("valid-ids")
                                    ? "Valid ID"
                                    : "Profile"
                            }
                            className="w-full h-auto rounded-lg shadow-lg object-contain"
                            style={{ maxHeight: "70vh" }}
                        />
                    </div>
                </>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <RejectModal
                    isOpen={showRejectModal}
                    onClose={() => {
                        setShowRejectModal(false);
                        setConfirmAction(null);
                    }}
                    onConfirm={handleReject}
                    title="Reject Application"
                    message="Please provide a reason for rejecting this producer application. This will be visible to the applicant."
                />
            )}

            {/* Suspend User Modal */}
            {showSuspendModal && userToSuspend && (
                <SuspendUserModal
                    isOpen={showSuspendModal}
                    onClose={() => {
                        setShowSuspendModal(false);
                        setUserToSuspend(null);
                    }}
                    onConfirm={handleSuspendUser}
                    userName={userToSuspend.name}
                />
            )}

            <AdminNavigationBar />
        </div>
    );
}

export default AdminUserManagement;
