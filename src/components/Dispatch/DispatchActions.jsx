import { useState } from 'react';
import Input from '../inputs/input';

const DispatchActions = ({ dispatch, onSubmitVehicleDetails }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverContact: ''
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmitVehicleDetails(dispatch._id, vehicleData);
    closeModal();
  };

  const isFullyLoaded =
    dispatch.EALIssuedTotalQuantity === dispatch.totalQuantity;

  return (
    <>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">

            <div className="space-y-3">
              <Input
                name="vehicleNumber"
                placeholder="Vehicle Number"
                value={vehicleData.vehicleNumber}
                onChange={handleChange}
              />
              <Input
                name="driverName"
                placeholder="Driver Name"
                value={vehicleData.driverName}
                onChange={handleChange}
              />
              <Input
                name="driverContact"
                placeholder="Driver Contact"
                value={vehicleData.driverContact}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button
                    type="button"
                    className="add-btn add-btn-fill"
                    onClick={closeModal}
                >Cancel</button>
                <button
                    type="button"
                    className="add-btn add-btn-fill"
                    onClick={handleSubmit}
                >Submit</button>
            </div>
        </div>
    </>
  );
};

export default DispatchActions;
