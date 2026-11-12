import React from "react";
import Modal from "./Modal.jsx";

function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonClass,
    type = "confirm",
    icon,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            title={title}
            message={message}
            type={type}
            showCancel={true}
            confirmText={confirmText}
            cancelText={cancelText}
            confirmButtonClass={confirmButtonClass}
            icon={icon}
        />
    );
}

export default ConfirmModal;
