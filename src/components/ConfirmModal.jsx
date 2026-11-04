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
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            title={title}
            message={message}
            type="confirm"
            showCancel={true}
            confirmText={confirmText}
            cancelText={cancelText}
        />
    );
}

export default ConfirmModal;
