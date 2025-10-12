import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";
import RejectModal from "../../components/RejectModal";
import supabase from "../../SupabaseClient";
import { deleteImageFromUrl } from "../../utils/imageUpload";
import { toast } from "react-hot-toast";

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
        return data.filter(
            (item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.role &&
                    item.role
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) ||
                (item.address &&
                    item.address
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
        );
    };

    // Fetch producer applications
    const fetchProducerApplications = async () => {
        try {
            setLoadingApplications(true);
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
                profileImage: app.profiles.avatar_url,
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
            setLoadingApplications(false);
        }
    };

    // Fetch all users
    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            setError(null);

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
                role: user.roles.name,
                status: user.statuses.name,
                roleId: user.role_id,
                statusId: user.status_id,
                joinDate: user.created_at,
                lastLogin: user.last_login,
            }));

            setAllUsers(formattedUsers);
        } catch (err) {
            setError(err.message);
            toast.error("Failed to load users");
        } finally {
            setLoadingUsers(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchProducerApplications();
        fetchUsers();
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
            const statusId = action === "suspend" ? 2 : 1; // 2 for suspended, 1 for active

            const { error } = await supabase
                .from("profiles")
                .update({ status_id: statusId })
                .eq("id", userId);

            if (error) throw error;

            await fetchUsers();
            toast.success(
                "User successfully " +
                    (action === "suspend" ? "suspended" : "activated")
            );
        } catch (err) {
            toast.error("Failed to update user status");
            console.error("User action error:", err);
        }
    };

    const handleRoleToggle = async (userId) => {
        const user = allUsers.find((u) => u.id === userId);
        if (!user || user.role === "Admin") return; // Don't allow toggling admin roles

        try {
            const newRoleId = user.roleId === 1 ? 2 : 1; // Toggle between Consumer (1) and Producer (2)

            const { error } = await supabase
                .from("profiles")
                .update({ role_id: newRoleId })
                .eq("id", userId);

            if (error) throw error;

            await fetchUsers();
            toast.success("User role updated successfully");
        } catch (err) {
            toast.error("Failed to update user role");
            console.error("Role toggle error:", err);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    User Management
                </h1>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6 mt-4">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("applications")}
                            className={
                                "flex-1 py-3 px-4 text-center font-medium transition-colors " +
                                (activeTab === "applications"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800")
                            }
                        >
                            Producer Applications
                            {producerApplications.length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {producerApplications.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "users"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
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
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search applications..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        {loadingApplications ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-gray-500 mt-2">
                                    Loading applications...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <Icon
                                    icon="mingcute:error-fill"
                                    width="64"
                                    height="64"
                                    className="mx-auto text-red-500 mb-4"
                                />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Error Loading Data
                                </h3>
                                <p className="text-gray-600">{error}</p>
                            </div>
                        ) : filterData(producerApplications).length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <Icon
                                    icon="mingcute:user-add-line"
                                    width="64"
                                    height="64"
                                    className="mx-auto text-gray-300 mb-4"
                                />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    No Applications Found
                                </h3>
                                <p className="text-gray-500">
                                    There are no producer applications to
                                    review.
                                </p>
                            </div>
                        ) : (
                            filterData(sortData(producerApplications)).map(
                                (application) => (
                                    <div
                                        key={application.id}
                                        className="bg-white rounded-lg shadow-md p-6"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={
                                                        application.profileImage
                                                    }
                                                    alt={application.name}
                                                    className="w-16 h-16 object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() =>
                                                        handleImageClick(
                                                            application.profileImage
                                                        )
                                                    }
                                                />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {application.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Applied on{" "}
                                                        {new Date(
                                                            application.applicationDate
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1">
                                                    Contact Information
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {application.email}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {application.contact}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1">
                                                    Farming Experience
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {application.experience}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1">
                                                    Crops{" "}
                                                    <span className="text-gray-400 text-xs">
                                                        (
                                                        {
                                                            application.crops
                                                                .length
                                                        }
                                                        )
                                                    </span>
                                                </h4>
                                                <div className="max-h-[4.5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pr-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {application.crops.map(
                                                            (crop, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs whitespace-nowrap"
                                                                >
                                                                    {crop}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4 flex w-1/2 justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1">
                                                    Address
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {application.address}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    handleImageClick(
                                                        application.validIdUrl
                                                    )
                                                }
                                                className="mt-2 text-primary hover:text-primary-dark flex items-center gap-1 text-sm font-semibold"
                                            >
                                                <Icon
                                                    icon="mingcute:idcard-line"
                                                    className="w-4 h-4"
                                                />
                                                Click to view Valid ID
                                            </button>
                                        </div>

                                        <div className="flex justify-end gap-3">
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
                                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId ===
                                                    application.id &&
                                                confirmAction?.type ===
                                                    "approved" ? (
                                                    <>
                                                        <Icon
                                                            icon="mingcute:loading-line"
                                                            className="animate-spin"
                                                        />
                                                        Approving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon icon="mingcute:check-line" />
                                                        Approve
                                                    </>
                                                )}
                                            </button>
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
                                                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId ===
                                                    application.id &&
                                                confirmAction?.type ===
                                                    "rejected" ? (
                                                    <>
                                                        <Icon
                                                            icon="mingcute:loading-line"
                                                            className="animate-spin"
                                                        />
                                                        Rejecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon icon="mingcute:close-line" />
                                                        Reject
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
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filterData(sortData(allUsers)).map(
                                            (user) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            onClick={() =>
                                                                handleRoleToggle(
                                                                    user.id
                                                                )
                                                            }
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md ${
                                                                user.role ===
                                                                "Admin"
                                                                    ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                                                    : user.role ===
                                                                      "Producer"
                                                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                            }`}
                                                            title="Click to toggle between Consumer and Producer"
                                                        >
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                user.status ===
                                                                "Active"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(
                                                            user.joinDate
                                                        ).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(
                                                            user.lastLogin
                                                        ).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() =>
                                                                handleUserAction(
                                                                    user.id,
                                                                    user.status ===
                                                                        "Active"
                                                                        ? "suspend"
                                                                        : "activate"
                                                                )
                                                            }
                                                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                                                                user.status ===
                                                                "Active"
                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                                        >
                                                            {user.status ===
                                                            "Active"
                                                                ? "Suspend"
                                                                : "Activate"}
                                                        </button>
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

            <AdminNavigationBar />
        </div>
    );
}

export default AdminUserManagement;
