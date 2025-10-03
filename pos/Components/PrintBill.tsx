// FIX: Add React import to fix 'Cannot find namespace React' error.
import React from "react";

const PrintBill: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="btn btn-primary btn-block"
    >
      Print Bill
    </button>
  );
};

export default PrintBill;
