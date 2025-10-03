// FIX: Add React import to fix 'Cannot find namespace React' error.
import React from 'react';

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
    // Prevent clicks inside the modal from closing it
    const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={handleContentClick}>
                {children}
            </div>
        </div>
    );
};

export default Modal;
