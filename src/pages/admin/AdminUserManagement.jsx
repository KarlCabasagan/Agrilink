import { useState } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";

function AdminUserManagement() {
    const [activeTab, setActiveTab] = useState("applications");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

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
            applicationDate: "2024-09-01",
            status: "pending",
        },
        {
            id: 2,
            name: "Maria Cruz",
            email: "maria.cruz@email.com",
            contact: "+63923456789",
            address: "Brgy. Santa Rosa, Nueva Ecija",
            farmSize: "3.5 hectares",
            experience: "8 years",
            crops: ["Rice", "Corn", "Vegetables"],
            businessPermit: "Yes",
            applicationDate: "2024-08-28",
            status: "pending",
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

    const handleApplicationAction = (applicationId, action) => {
        setConfirmAction({ id: applicationId, type: action });
        setShowConfirmModal(true);
    };

    const confirmApplicationAction = () => {
        if (confirmAction) {
            setProducerApplications((prev) =>
                prev.map((app) =>
                    app.id === confirmAction.id
                        ? { ...app, status: confirmAction.type }
                        : app
                )
            );

            if (confirmAction.type === "approved") {
                // Add to users list as producer
                const application = producerApplications.find(
                    (app) => app.id === confirmAction.id
                );
                setAllUsers((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        name: application.name,
                        email: application.email,
                        role: "Producer",
                        status: "Active",
                        joinDate: new Date().toISOString().split("T")[0],
                        lastLogin: "Never",
                    },
                ]);
            }
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const toggleUserStatus = (userId) => {
        setAllUsers((prev) =>
            prev.map((user) =>
                user.id === userId
                    ? {
                          ...user,
                          status:
                              user.status === "Active" ? "Suspended" : "Active",
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
                        {producerApplications.filter(
                            (app) => app.status === "pending"
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
                            producerApplications
                                .filter((app) => app.status === "pending")
                                .map((application) => (
                                    <div
                                        key={application.id}
                                        className="bg-white rounded-lg shadow-md p-6"
                                    >
                                        <div className="flex items-start justify-between mb-4">
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
                                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                                Pending Review
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1">
                                                    Contact Info
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
                                                    Location
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {application.address}
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
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1">
                                                    Business Permit
                                                </h4>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                                    {application.businessPermit}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() =>
                                                    handleApplicationAction(
                                                        application.id,
                                                        "approved"
                                                    )
                                                }
                                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                            >
                                                <Icon
                                                    icon="mingcute:check-line"
                                                    width="20"
                                                    height="20"
                                                    className="inline mr-2"
                                                />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleApplicationAction(
                                                        application.id,
                                                        "rejected"
                                                    )
                                                }
                                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                            >
                                                <Icon
                                                    icon="mingcute:close-line"
                                                    width="20"
                                                    height="20"
                                                    className="inline mr-2"
                                                />
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
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Join Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Login
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allUsers.map((user) => (
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
                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                        user.role === "Producer"
                                                            ? "bg-green-100 text-green-800"
                                                            : user.role ===
                                                              "Consumer"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-purple-100 text-purple-800"
                                                    }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                        user.status === "Active"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(
                                                    user.joinDate
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.lastLogin}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        toggleUserStatus(
                                                            user.id
                                                        )
                                                    }
                                                    className={`${
                                                        user.status === "Active"
                                                            ? "text-red-600 hover:text-red-900"
                                                            : "text-green-600 hover:text-green-900"
                                                    } mr-3`}
                                                >
                                                    {user.status === "Active"
                                                        ? "Suspend"
                                                        : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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

            <AdminNavigationBar />
        </div>
    );
}

export default AdminUserManagement;
