import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Modal from '../../components/Modal/Modal';
import AddDispatchForm from '../../components/Dispatch/AddDispatchForm';
import toast from 'react-hot-toast';
import { formatDate, formatDateToYYYYMMDD } from '../../utils/helper';
import DateRangeModal from '../../components/Modal/DateRangeModal';
import { LuEye, LuLink, LuPen, LuPlus } from 'react-icons/lu';
import LoadingOverlay from '../../components/LoadingOverlay';
import DispatchActions from '../../components/Dispatch/DispatchActions';

const Dispatch = () => {
  // State for loading indicator
  const [loading, setLoading] = useState(false);

  // State for storing dispatch details
  const [dispatches, setDispatches] = useState([]);

  // State for controlling the "Add Dispatch" modal
  const [openDispatchModalAdd, setOpenDispatchModalAdd] = useState(false);

  // State for controlling the "View Dispatch Details" modal
  const [openDispatchModalView, setOpenDispatchModalView] = useState(false);

  // State for controlling the "Submit the Vehcile Details" modal
  const [openDispatchModalLoad, setopenDispatchModalLoad] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverContact: ''
  });

  // State for storing the data of the currently viewed/edited dispatch
  const [dispatchData, setDispatchData] = useState([]);

  // State for the currently selected item within a dispatch for EAL linking
  const [selectedItem, setSelectedItem] = useState(null);

  // State for new EAL data to be linked
  const [newEALData, setNewEALData] = useState({ prefix: '', serialFrom: '', serialTo: '', usedQuantity: '' });

  // State for managing EAL unlink confirmation
  const [unlinkCandidate, setUnlinkCandidate] = useState(null);
  const [unlinkConfirmText, setUnlinkConfirmText] = useState('');

  // State for date range filtering
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });

  /**
   * Fetches dispatch details from the API based on the selected date range.
   * @param {Object} selectedRange - The date range object containing startDate and endDate.
   */
  const fetchDispatchDetails = async (selectedRange = dateRange) => {
    if (loading) return null;
    setLoading(true);

    try {
      const url =
        API_PATHS.DISPATCH.GET_DATA +
        `?startDate=${formatDateToYYYYMMDD(selectedRange.startDate)}&endDate=${formatDateToYYYYMMDD(selectedRange.endDate)}`;

      const response = await axiosInstance.get(url);

      if (response.data) {
        setDispatches(response.data);
        return response.data; // ✅ Return data for immediate use
      }

      return null;
    } catch (error) {
      console.error('Error fetching dispatch details:', error);
      toast.error('Something went wrong. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };


  /**
   * Handles the addition of a new dispatch or updates an existing one.
   * @param {Object} dispatch - The dispatch object containing details like company, deliveryTo, etc.
   */
  const handleSubmitDispatch = async (dispatch) => {
    const { company, deliveryTo, dateDispatched, market, items } = dispatch;

    // Input validation
    if (!company?.trim()) {
      toast.error('Please select a Company');
      return;
    }
    if (!deliveryTo?.trim()) {
      toast.error('Please select a delivery location');
      return;
    }
    if (isNaN(Date.parse(dateDispatched))) {
      toast.error('Please enter the date correctly');
      return;
    }
    if (!market?.trim()) {
      toast.error('Please select a Market');
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Calculate total quantity of items
    let totalQuantity = 0;
    items.forEach((item) => {
      totalQuantity += +item.quantityInCases;
    });
    dispatch.totalQuantity = totalQuantity;
    try {
      setLoading(true);
      // Determine if it's an add or edit operation
      if (dispatch._id) { // If _id exists, it's an update
        await axiosInstance.put(`${API_PATHS.DISPATCH.UPDATE_DATA}/${dispatch._id}`, dispatch);
        toast.success('Dispatch Details updated successfully');
      } else { // Otherwise, it's a new dispatch
        await axiosInstance.post(API_PATHS.DISPATCH.ADD_DATA, dispatch);
        toast.success('Dispatch Details added successfully');
      }
      setOpenDispatchModalAdd(false); // Close the modal
      fetchDispatchDetails(); // Refresh the dispatch list
    } catch (error) {
      console.error('Error adding/updating Dispatch Details:', error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Failed to save dispatch details.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the "View Dispatch Details" modal and sets the data for display.
   * @param {Object} details - The dispatch object to be viewed.
   */
  const viewDispatchDetails = (details) => {
    setOpenDispatchModalView(true);
    setDispatchData(details);
  };

  /**
   * Opens the "Add Dispatch" modal with pre-filled data for editing.
   * @param {Object} details - The dispatch object to be edited.
   */
  const editDispatchDetails = (details) => {
    setDispatchData(details);
    setOpenDispatchModalAdd(true);
  };

  /**
   * Handles changes in the new EAL data input fields.
   * @param {string} key - The key of the EAL data field to update (e.g., 'prefix', 'serialFrom').
   * @param {string} value - The new value for the field.
   */
  const handleChange = (key, value) => {
    setNewEALData({ ...newEALData, [key]: value });
  };

  /**
   * Opens the EAL linking modal for a specific item within a dispatch.
   * @param {Object} item - The item object from the dispatch that needs EAL linking.
   */
  const openEALModal = (item) => {
    setSelectedItem(item);
    setNewEALData({ prefix: '', serialFrom: '', serialTo: '', usedQuantity: '' }); // Reset form
  };

  /**
   * Closes the EAL linking modal.
   */
  const closeEALModal = () => setSelectedItem(null);

  /**
   * Handles the addition of a new EAL issuance.
   */
  const handleAddEAL = async () => {

    const usedQuantity = parseInt(newEALData.serialTo) - parseInt(newEALData.serialFrom) + 1;
    const bottlesPerCase = selectedItem.item.bottlesPerCase;
    const usedCases = usedQuantity / bottlesPerCase;
    const availableCases = selectedItem.quantityInCases - selectedItem.EALIssuedQuantity;

    
    // Validate EAL input fields
    if (!/^[A-Z]{3}$/.test(newEALData.prefix.trim())) {
      toast.error('Prefix must be 3 uppercase letters (A-Z)');
      return;
    }
    if (!/^\d{10}$/.test(newEALData.serialFrom)) {
      toast.error('Serial From must be a 10-digit number');
      return;
    }
    if (!/^\d{10}$/.test(newEALData.serialTo)) {
      toast.error('Serial To must be a 10-digit number');
      return;
    }
    if (newEALData.serialFrom >= newEALData.serialTo) {
      toast.error('Serial To must be greater than Serial From');
      return;
    }

    if (usedQuantity % bottlesPerCase !== 0 || (parseInt(newEALData.serialTo) % bottlesPerCase) !== 0 || ((parseInt(newEALData.serialFrom) - 1) %  bottlesPerCase) !== 0) {
      toast.error(`Serial range not divisible by bottles per case.`);
      return;
    }
    if ((selectedItem.quantity - selectedItem.EALIssuedQuantity) * bottlesPerCase < usedQuantity) {
      toast.error('Serials exceed quantity to be issued');
      return;
    }

    if (usedCases > availableCases) {
      toast.error(`Cannot link more EALs than required. Available: ${availableCases} cases.`);
      return;
    }

    const EALLink = {
      "dispatchId": dispatchData._id,
      "itemId": selectedItem.item._id,
      "prefix": newEALData.prefix,
      "serialFrom": newEALData.serialFrom,
      "serialTo": newEALData.serialTo
    }
    
    try {
      setLoading(true);
      const response = await axiosInstance.post(API_PATHS.EALDISPATCH.ADD_EAL_LINK, EALLink);
      const { message, updatedDispatch } = response.data;

      toast.success(message);
      setNewEALData({ prefix: '', serialFrom: '', serialTo: '', usedQuantity: '' }); // Clear form after successful add
      // 1. Update `dispatchData` state
      setDispatchData(updatedDispatch);

      // 2. Update `selectedItem` state
      // Find the updated item within the updatedDispatch's items array
      const updatedSelectedItem = updatedDispatch.items.find(
        (item) => item.item._id === selectedItem.item._id
      );
      if (updatedSelectedItem) {
        setSelectedItem(updatedSelectedItem);
      }

      // 3. Update `dispatches` state
      setDispatches(prevDispatches => {
        // Assuming dispatches.data is the array we need to update
        if (Array.isArray(prevDispatches.data)) {
          return {
            ...prevDispatches,
            data: prevDispatches.data.map(dispatch =>
              dispatch._id === updatedDispatch._id ? updatedDispatch : dispatch
            ),
          };
        }
        return prevDispatches; // Return original if data is not an array
      });
    } catch (error) {
      console.error('Error adding EAL Issuance:', error.response?.data?.message || error.message);
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Applies the selected date range and refetches dispatch details.
   * @param {Object} selectedRange - The new date range.
   */
  const onApplyDateRange = (selectedRange) => {
    setDateRange(selectedRange);
    fetchDispatchDetails(selectedRange); // Pass selected range for filtered data
  };

  /**
   * Placeholder function for linking dispatch details (currently not implemented in the UI).
   * @param {Object} details - The dispatch details to be linked.
   */
  const linkDispatchDetails = (details) => {
    console.log('Link dispatch details:', details);
    // This function can be expanded to handle specific linking logic, e.g., for external systems.
  };

  /**
   * Updates the status of a dispatch.
   * @param {string} id - The ID of the dispatch to update.
   * @param {string} status - The new status (e.g., 'final').
   */
  const updateDispatchStatus = async (id, status) => {
    if (!status.trim()) {
      toast.error('Something went wrong. Status cannot be empty.');
      return;
    }
    if (!id.trim()) {
      toast.error('Something went wrong. Status cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const url = `${API_PATHS.DISPATCH.UPDATE_DATA}/${id}/status`;
      await axiosInstance.put(url, { status });

      setDispatches(prev => ({
        ...prev,
        data: prev.data.map(dispatch =>
          dispatch._id === id ? { ...dispatch, status } : dispatch
        )
      }));

      setDispatchData(prev =>
        prev && prev._id === id ? { ...prev, status } : prev
      );
      //setOpenDispatchModalView(false); // Close the view modal
      toast.success('Dispatch Details updated successfully');
      // await fetchDispatchDetails(); // Refresh the dispatch list
      // console.log(dispatches.data);
      // const updatedDispatch = dispatches.data.find(dispatch => dispatch._id === id)
      // setDispatchData(updatedDispatch);
    } catch (error) {
      console.error('Error updating Dispatch Details status:', error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Failed to update dispatch status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVehicleDetails = async (dispatchId, vehicleDetails) => {
    try {
      vehicleDetails.status = 'loaded'; // Set status to 'loaded' when submitting vehicle details
      setLoading(true);
      const url = `${API_PATHS.DISPATCH.UPDATE_DATA}/${dispatchId}/vehicle`;
      await axiosInstance.put(url, vehicleDetails);
      toast.success("Vehicle details submitted");
      fetchDispatchDetails(); // Refresh dispatch info
      setopenDispatchModalLoad(false);
      setOpenDispatchModalView(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting vehicle info');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the unlinking of an EAL.
   * @param {Object} linkToUnlink - The EAL link object to be unlinked.
   */
  const handleUnlinkEAL = async (ealLink) => {
    // This is a client-side only unlink as per the provided code.
    // In a real application, you'd make an API call to unlink the EAL on the server.
    if (unlinkConfirmText === "unlink") {

      const EALLink = {
        "dispatchId": dispatchData._id,
        "itemId": selectedItem.item._id,
        "prefix": ealLink.prefix,
        "serialFrom": ealLink.serialFrom,
        "serialTo": ealLink.serialTo
      }
      
      try {
        setLoading(true);
        // Example API call for unlinking (replace with your actual API endpoint)
        // await axiosInstance.delete(`${API_PATHS.EALDISPATCH.DELETE_DATA}/${unlinkCandidate._id}`);
        const response = await axiosInstance.post(API_PATHS.EALDISPATCH.REMOVE_EAL_LINK, EALLink);
        const { message, updatedDispatch } = response.data;

        // ✅ Update `dispatchData`
        setDispatchData(updatedDispatch);
        
        // ✅ Update `selectedItem`
        const updatedSelectedItem = updatedDispatch.items.find(
          item => item.item._id === selectedItem.item._id
        );
        if (updatedSelectedItem) {
          setSelectedItem(updatedSelectedItem);
        }

        // ✅ Update `dispatches` list
        setDispatches(prevDispatches => {
          if (Array.isArray(prevDispatches.data)) {
            return {
              ...prevDispatches,
              data: prevDispatches.data.map(dispatch =>
                dispatch._id === updatedDispatch._id ? updatedDispatch : dispatch
              )
            };
          }
          return prevDispatches;
        });

        toast.success("EAL unlinked successfully!");
        setUnlinkCandidate(null);
        setUnlinkConfirmText("");
        // fetchDispatchDetails(); // Refresh the main dispatch list
      } catch (error) {
        console.error("Error unlinking EAL:", error.response?.data?.message || error.message);
        toast.error(error.response?.data?.message || "Failed to unlink EAL.");
      } finally {
        setLoading(false);
      }
    }
  };


  // Effect hook to fetch dispatch details on component mount
  useEffect(() => {
    fetchDispatchDetails();
  }, []); // Empty dependency array means this effect runs once after the initial render

  return (
    <DashboardLayout activeMenu="Dispatch">
      {loading && <LoadingOverlay />}
      <div className="my-5 mx-auto">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-lg">Dispatch </h5>
                  <p className="text-xs text-gray-400 mt-0.5">Track your Dispatch over time</p>
                </div>
                <DateRangeModal dateRange={dateRange} onApplyDateRange={onApplyDateRange} />
                <button
                  className="add-btn"
                  onClick={() => {
                    setOpenDispatchModalAdd(true);
                    setDispatchData([]); // Clear dispatch data when adding new
                  }}
                >
                  <LuPlus className="text-lg" />
                  Add Dispatch
                </button>
              </div>
              <div className="mt-10">
                <div className="overflow-x-auto mt-4">
                  <table className="table-auto min-w-full border border-gray-200 text-sm text-left text-gray-700">
                    <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                      <tr>
                        <th className="px-4 py-3 border">Si. No.</th>
                        <th className="px-4 py-3 border">Company</th>
                        <th className="px-4 py-3 border">Dispatch Date</th>
                        <th className="px-4 py-3 border">Market</th>
                        <th className="px-4 py-3 border">Delivery Depot</th>
                        <th className="px-4 py-3 border">Status</th>
                        <th className="px-4 py-3 border">Quantity</th>
                        <th className="px-4 py-3 border">EAL Linked Quantity</th>
                        <th className="px-4 py-3 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Conditional rendering for dispatch data */}
                      {Array.isArray(dispatches?.data) && dispatches.data.length > 0 ? (
                        dispatches.data.map((entry, index) => (
                          <tr key={entry._id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-2 border">{index + 1}</td>
                            <td className="px-4 py-2 border">{entry.company.name}</td>
                            <td className="px-4 py-2 border">{formatDate(entry.dateDispatched)}</td>
                            <td className="px-4 py-2 border capitalize">{entry.market}</td>
                            <td className="px-4 py-2 border">{entry.deliveryTo.name}</td>
                            <td className="px-4 py-2 border capitalize">{entry.status}</td>
                            <td className="px-4 py-2 border">{entry.totalQuantity}</td>
                            <td className="px-4 py-2 border">{entry.EALIssuedTotalQuantity}</td>
                            <td className="px-4 py-2 flex justify-center items-center gap-2">
                              <button
                                className="btn bg-green-300 border-none"
                                onClick={() => viewDispatchDetails(entry)}
                              >
                                <LuEye className="text-lg" />
                              </button>
                              <button
                                className="btn bg-amber-200 border-none"
                                onClick={() => editDispatchDetails(entry)}
                              >
                                <LuPen className="text-lg" />
                              </button>
                              <button
                                className="btn bg-red-400 border-none"
                                onClick={() => linkDispatchDetails(entry)}
                              >
                                <LuLink className="text-lg" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-4 text-gray-500">
                            {loading ? 'Loading...' : 'No data available'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Adding/Editing Dispatch */}
        <Modal isOpen={openDispatchModalAdd} onClose={() => setOpenDispatchModalAdd(false)} title={dispatchData?._id ? 'Update Dispatch' : 'Add Dispatch'} styleClass="w-full">
          <AddDispatchForm onSubmitDispatch={handleSubmitDispatch} dispatchDetails={dispatchData} />
        </Modal>

        {/* Modal for Viewing Dispatch Details */}
        <Modal isOpen={openDispatchModalView} onClose={() => setOpenDispatchModalView(false)} title="Dispatch Details" styleClass="w-full">
          <div className="h-full overflow-y-auto mx-auto p-6 bg-white shadow-xl rounded-xl space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Company</p>
                <h2 className="text-lg font-semibold">{dispatchData?.company?.name}</h2>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Market</p>
                <h2 className="text-lg font-semibold capitalize">{dispatchData.market}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Dispatch Date</p>
                <h2 className="text-lg font-semibold">{new Date(dispatchData.dateDispatched).toLocaleDateString()}</h2>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Delivery Location</p>
                <h2 className="text-lg font-semibold">{dispatchData.deliveryTo?.name}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Total Quantity</p>
                <h2 className="text-lg font-semibold">{dispatchData.totalQuantity}</h2>
              </div>
              <div>
                <p className="text-gray-500 text-sm">EAL Issued Quantity</p>
                <h2 className="text-lg font-semibold">{dispatchData.EALIssuedTotalQuantity}</h2>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Items</h3>
              <table className="w-full border border-gray-300 rounded-md overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Item</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Quantity</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">EAL Issued</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchData.items &&
                    dispatchData.items.map((itemEntry, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 text-gray-800">{itemEntry?.item.name}</td>
                        <td className="p-3 text-right text-gray-800">{itemEntry.quantityInCases}</td>
                        <td className="p-3 text-right text-gray-800">{itemEntry.EALIssuedQuantity || 0}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => openEALModal(itemEntry)} className="text-sm text-blue-600 hover:underline">
                            {itemEntry.EALIssuedQuantity < itemEntry.quantityInCases ? 'Link EAL' : 'Unlink EAL'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-4">
              <span />
              {/* Conditional rendering for Finalize button */}
              {dispatchData.status === 'draft' && (
                <button type="button" className="btn" onClick={() => updateDispatchStatus(dispatchData._id, 'final')}>
                  Finalize
                </button>
              )}

              {dispatchData.status === 'final' && (
                dispatchData.EALIssuedTotalQuantity === dispatchData.totalQuantity ? (
                  <button
                    type="button"
                    className="btn bg-green-600 text-white hover:bg-green-700"
                    onClick={() => setopenDispatchModalLoad(true)}
                  >
                    Loaded
                  </button>
                ) : (
                  <span className="text-sm italic text-gray-500 mt-2">Pending EAL issuance</span>
                )
              )}

            </div>
          </div>
        </Modal>

        {/* Modal for Linking EAL */}
        <Modal isOpen={selectedItem} onClose={closeEALModal} title={`Link EAL - ${selectedItem?.item.name}`} styleClass="w-3xl">
          {/* Quantity Summary */}
          <div className="grid grid-cols-3 text-center gap-2 mt-4 text-sm">
            <div className="p-3 rounded bg-gray-100">
              <div className="font-semibold text-gray-600">Total Qty</div>
              <div className="text-lg font-bold">{selectedItem?.quantityInCases}</div>
            </div>
            <div className="p-3 rounded bg-green-100">
              <div className="font-semibold text-gray-600">EAL Issued</div>
              <div className="text-lg font-bold text-green-700">
                {selectedItem?.EALIssuedQuantity || 0}
              </div>
            </div>
            <div className="p-3 rounded bg-yellow-100">
              <div className="font-semibold text-gray-600">Balance</div>
              <div className="text-lg font-bold text-yellow-700">
                {selectedItem?.quantityInCases - (selectedItem?.EALIssuedQuantity || 0)}
              </div>
            </div>
          </div>

          {/* Linked EAL Details */}
          <div className="mt-5">
            <h4 className="font-semibold text-sm mb-3">Linked EALs</h4>
            {selectedItem?.EALLinks && selectedItem.EALLinks.length > 0 ? (
              <ul className="space-y-2">
                {selectedItem.EALLinks.map((link, index) => (
                  <li key={index} className="border rounded-lg p-3 flex justify-between items-center bg-gray-50">
                    <div>
                      <div className="font-medium text-sm">Prefix: {link.prefix}</div>
                      <div className="font-medium text-sm">Serials: {link.serialFrom.toString().padStart(10, '0')} &rarr; {link.serialTo.toString().padStart(10, '0')}</div>
                      <div className="text-xs text-gray-500">Used: {(link.serialTo - link.serialFrom + 1) / selectedItem?.item?.bottlesPerCase}</div>
                    </div>
                    {dispatchData.status === 'final' && <button onClick={() => setUnlinkCandidate(link)} className="text-red-500 hover:underline text-xs">
                      Unlink
                    </button>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-gray-400">No EALs linked yet.</p>
            )}
          </div>

          {/* Add New EAL Form (conditionally rendered if balance > 0) */}
          {selectedItem?.quantityInCases - (selectedItem?.EALIssuedQuantity || 0) > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">Link New EAL</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <input
                    value={newEALData.prefix}
                    onChange={({ target }) => handleChange('prefix', target.value)}
                    type="text"
                    name="prefix"
                    placeholder="Prefix (e.g., ABC)"
                    required
                    className="border px-3 py-2 rounded w-full"
                  />
                  <input
                    value={newEALData.serialFrom}
                    onChange={({ target }) => handleChange('serialFrom', target.value)}
                    type="number"
                    name="serialFrom"
                    placeholder="Serial From (10 digits)"
                    required
                    className="border px-3 py-2 rounded w-full"
                  />
                  <input
                    value={newEALData.serialTo}
                    onChange={({ target }) => handleChange('serialTo', target.value)}
                    type="number"
                    name="serialTo"
                    placeholder="Serial To (10 digits)"
                    required
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div className="text-right">
                  <button onClick={handleAddEAL} type="button" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded">
                    Link EAL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end mt-6">
            <button onClick={closeEALModal} className="px-4 py-2 bg-gray-200 rounded mr-2">
              Close
            </button>
          </div>
        </Modal>

        {/* Unlink Confirmation Modal */}
        {unlinkCandidate && (
          <Modal
            isOpen={unlinkCandidate}
            onClose={() => {
              setUnlinkCandidate(null);
              setUnlinkConfirmText('');
            }}
            title={`Unlink EAL`}
            styleClass="w-3xl"
          >
            <div className="text-sm border rounded-md p-3 bg-gray-50">
              <div>
                <strong>Prefix:</strong> {unlinkCandidate.prefix}
              </div>
              <div>
                <strong>Serials:</strong> {unlinkCandidate.serialFrom} &rarr; {unlinkCandidate.serialTo}
              </div>
              <div>
                <strong>Used Quantity:</strong> {unlinkCandidate.usedQuantity}
              </div>
            </div>
            <p className="text-sm mt-2 text-gray-600">
              To confirm, type <strong className="bg-gray-200 px-1">unlink</strong> below:
            </p>
            <input
              type="text"
              value={unlinkConfirmText}
              onChange={(e) => setUnlinkConfirmText(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Type 'unlink' to confirm"
            />
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => {
                  setUnlinkCandidate(null);
                  setUnlinkConfirmText('');
                }}
                className="text-gray-500 hover:text-gray-800 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={unlinkConfirmText !== 'unlink'}
                onClick={()=> {handleUnlinkEAL(unlinkCandidate)}}
                className={`px-4 py-2 text-sm text-white rounded ${
                  unlinkConfirmText === 'unlink' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                Confirm Unlink
              </button>
            </div>
          </Modal>
        )}

        {/* Modal for Submitting Vehicle Details */}
        <Modal
          isOpen={openDispatchModalLoad}
          onClose={() => setopenDispatchModalLoad(false)}
          title="Enter Vehicle Details"
          styleClass="w-full max-w-md"
        >
          <div className="space-y-4">
            <input
              type="text"
              value={vehicleData.vehicleNumber}
              onChange={(e) => setVehicleData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
              placeholder="Vehicle Number"
            />
            <input
              type="text"
              value={vehicleData.driverName}
              onChange={(e) => setVehicleData(prev => ({ ...prev, driverName: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
              placeholder="Driver Name"
            />
            <input
              type="text"
              value={vehicleData.driverContact}
              onChange={(e) => setVehicleData(prev => ({ ...prev, driverContact: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
              placeholder="Driver Contact"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setopenDispatchModalLoad(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => handleSubmitVehicleDetails(dispatchData._id, vehicleData)}
              >
                Submit
              </button>
            </div>
          </div>
        </Modal>
        
      </div>
    </DashboardLayout>
  );
};

export default Dispatch;