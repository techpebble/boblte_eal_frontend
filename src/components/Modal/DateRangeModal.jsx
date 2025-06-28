import React, { useState } from 'react';
import Modal from './Modal';
import { LuCalendar } from 'react-icons/lu';
import { DateRangePicker } from 'react-date-range';
import { formatDate } from '../../utils/helper';

const DateRangeModal = ({
  dateRange,
  onApplyDateRange // Passes final selected range to parent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalDateRange, setModalDateRange] = useState(dateRange);

  const handleModalDateChange = (ranges) => {
    setModalDateRange(ranges.selection);
  };

  const onApply = () => {
    onApplyDateRange(modalDateRange);
    setIsOpen(false);
  };

  return (
    <div>
      {/* Calendar toggle button */}
      <button
        className="date-range-btn"
        onClick={() => setIsOpen(true)}
      >
        <LuCalendar className="text-lg" />
        {formatDate(dateRange?.startDate) + ' - ' + formatDate(dateRange?.endDate)}
      </button>

      {/* Modal */}
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Select Date"
        >
          <div className="space-y-4">
            <DateRangePicker
              ranges={[modalDateRange]}
              onChange={handleModalDateChange}
            />
            <div className="flex justify-between mt-4">
              <span></span>
              <button
                type="button"
                className="add-btn add-btn-fill"
                onClick={onApply}
              >
                Apply
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DateRangeModal;
