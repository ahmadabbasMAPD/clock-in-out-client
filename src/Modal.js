// src/Modal.js
import ReactDOM from 'react-dom';
import React from 'react';
import './ClockInOut.css'; // Or a separate CSS file for modal styling

const Modal = ({ children }) => {
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default Modal;
