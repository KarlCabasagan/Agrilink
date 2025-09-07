import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";

function AdminUserManagement() {
    // Get initial tab from localStorage or default to "applications"
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("adminUsersActiveTab") || "applications";
    });

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("adminUsersActiveTab", activeTab);
    }, [activeTab]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    const [producerApplications, setProducerApplications] = useState([
        {
            id: 1,
            name: "John Farmer",
            email: "john.farmer@email.com",
            contact: "+63912345678",
            address: "Brgy. San Miguel, Bulacan",
            farmSize: "2 hectares",
            experience: "5 years",
            crops: ["Tomatoes", "Carrots", "Lettuce"],
            businessPermit: "Yes",
            status: "pending",
            applicationDate: "2024-08-30",
            profileImage: "/assets/adel.jpg",
        },
        {
            id: 2,
            name: "Maria Santos",
            email: "maria.santos@email.com",
            contact: "+63987654321",
            address: "Brgy. Maligaya, Nueva Ecija",
            farmSize: "3 hectares",
            experience: "8 years",
            crops: ["Rice", "Corn"],
            businessPermit: "Yes",
            status: "pending",
            applicationDate: "2024-08-28",
            profileImage: "/assets/adel.jpg",
        },
    ]);

    const [allUsers, setAllUsers] = useState([
        {
            id: 1,
            name: "Pedro Santos",
            email: "pedro@email.com",
            role: "Consumer",
            status: "Active",
            joinDate: "2024-07-15",
            lastLogin: "2024-09-02",
        },
        {
            id: 2,
            name: "Ana Garcia",
            email: "ana@email.com",
            role: "Producer",
            status: "Active",
            joinDate: "2024-06-20",
            lastLogin: "2024-09-01",
        },
        {
            id: 3,
            name: "Carlos Mendoza",
            email: "carlos@email.com",
            role: "Consumer",
            status: "Suspended",
            joinDate: "2024-08-10",
            lastLogin: "2024-08-30",
        },
    ]);

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

    const handleApplicationAction = (applicationId, action) => {
        setConfirmAction({ id: applicationId, type: action });
        setShowConfirmModal(true);
    };

    const confirmApplicationAction = () => {
        if (confirmAction) {
            setProducerApplications((prev) =>
                prev.map((app) =>
                    app.id === confirmAction.id
                        ? {
                              ...app,
                              status:
                                  confirmAction.type === "approved"
                                      ? "approved"
                                      : "rejected",
                          }
                        : app
                )
            );
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    const handleUserAction = (userId, action) => {
        setAllUsers((prev) =>
            prev.map((user) =>
                user.id === userId
                    ? {
                          ...user,
                          status: action === "suspend" ? "Suspended" : "Active",
                      }
                    : user
            )
        );
    };

    const handleRoleToggle = (userId) => {
        setAllUsers((prev) =>
            prev.map((user) =>
                user.id === userId
                    ? {
                          ...user,
                          role:
                              user.role === "Consumer"
                                  ? "Producer"
                                  : "Consumer",
                      }
                    : user
            )
        );
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
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "applications"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Producer Applications
                            {producerApplications.filter(
                                (app) => app.status === "pending"
                            ).length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {
                                        producerApplications.filter(
                                            (app) => app.status === "pending"
                                        ).length
                                    }
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

                        {filterData(
                            producerApplications.filter(
                                (app) => app.status === "pending"
                            )
                        ).length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <Icon
                                    icon="mingcute:user-add-line"
                                    width="64"
                                    height="64"
                                    className="mx-auto text-gray-300 mb-4"
                                />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    No Pending Applications
                                </h3>
                                <p className="text-gray-500">
                                    All producer applications have been
                                    reviewed.
                                </p>
                            </div>
                        ) : (
                            filterData(
                                sortData(
                                    producerApplications.filter(
                                        (app) => app.status === "pending"
                                    )
                                )
                            ).map((application) => (
                                <div
                                    key={application.id}
                                    className="bg-white rounded-lg shadow-md p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={application.profileImage}
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
                                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                            Pending Review
                                        </span>
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
                                                Farm Details
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                Size: {application.farmSize}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Experience:{" "}
                                                {application.experience}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-1">
                                                Crops
                                            </h4>
                                            <div className="flex flex-wrap gap-1">
                                                {application.crops.map(
                                                    (crop, index) => (
                                                        <span
                                                            key={index}
                                                            className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                                                        >
                                                            {crop}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-medium text-gray-700 mb-1">
                                            Address
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {application.address}
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() =>
                                                handleApplicationAction(
                                                    application.id,
                                                    "approved"
                                                )
                                            }
                                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Icon icon="mingcute:check-line" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleApplicationAction(
                                                    application.id,
                                                    "rejected"
                                                )
                                            }
                                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <Icon icon="mingcute:close-line" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
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
            {showConfirmModal && (
                <ConfirmModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmApplicationAction}
                    title={`${
                        confirmAction?.type === "approved"
                            ? "Approve"
                            : "Reject"
                    } Application`}
                    message={`Are you sure you want to ${
                        confirmAction?.type === "approved"
                            ? "approve"
                            : "reject"
                    } this producer application?`}
                    confirmText={
                        confirmAction?.type === "approved"
                            ? "Approve"
                            : "Reject"
                    }
                    confirmButtonClass={
                        confirmAction?.type === "approved"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                    }
                />
            )}

            {/* Image Modal */}
            {showImageModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="bg-white p-4 rounded-lg max-w-2xl max-h-[80vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Profile Image
                            </h3>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-500 hover:text-gray-700"
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
                            alt="Profile"
                            className="w-full h-auto rounded-lg"
                        />
                    </div>
                </div>
            )}

            <AdminNavigationBar />
        </div>
    );
}

export default AdminUserManagement;
