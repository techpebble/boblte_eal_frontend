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

  const [linkDispatchModalOpen, setLinkDispatchModalOpen] = useState(false);
  const [linkDispatchDetailsData, setLinkDispatchDetailsData] = useState(null);

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
    if (details.status == 'draft') {
      setDispatchData(details);
      setOpenDispatchModalAdd(true);
    }
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

    if (usedQuantity % bottlesPerCase !== 0 || (parseInt(newEALData.serialTo) % bottlesPerCase) !== 0 || ((parseInt(newEALData.serialFrom) - 1) % bottlesPerCase) !== 0) {
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
    setLinkDispatchDetailsData(details);
    setLinkDispatchModalOpen(true);
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

  const deleteDispatch = async (id) => {
    try {
      setLoading(true);
      const url = `${API_PATHS.DISPATCH.DELETE_DATA}/${id}`;
      await axiosInstance.delete(url);

      // close the modal
      setOpenDispatchModalView(false);

      setDispatches(prev => ({
        ...prev,
        data: prev.data.filter(dispatch => dispatch._id !== id)
      }));

      toast.success('Dispatch deleted successfully');
    } catch (error) {
      console.error('Error deleting Dispatch:', error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Failed to delete dispatch.');
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
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-gray-100 p-0">
              <div className="px-8 pt-8 pb-4 border-b border-gray-200 rounded-t-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-1">Dispatches</h2>
                  <p className="text-sm text-gray-500">Track your dispatch records over time.</p>
                </div>
                <div className="flex items-center gap-3">
                  <DateRangeModal dateRange={dateRange} onApplyDateRange={onApplyDateRange} />
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow flex items-center gap-2"
                    onClick={() => {
                      setOpenDispatchModalAdd(true);
                      setDispatchData([]); // Clear dispatch data when adding new
                    }}
                  >
                    <LuPlus className="text-lg" />
                    Add Dispatch
                  </button>
                </div>
              </div>
              <div className="px-8 py-8">
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Si. No.</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Company</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Dispatch Date</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Market</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Delivery Depot</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Quantity</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">EAL Linked Quantity</th>
                        <th className="px-4 py-3 border-b font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Conditional rendering for dispatch data */}
                      {Array.isArray(dispatches?.data) && dispatches.data.length > 0 ? (
                        dispatches.data.map((entry, index) => (
                          <tr key={entry._id} className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 border-b text-gray-900 font-medium">{index + 1}</td>
                            <td className="px-4 py-2 border-b">{entry.company.name}</td>
                            <td className="px-4 py-2 border-b">{formatDate(entry.dateDispatched)}</td>
                            <td className="px-4 py-2 border-b capitalize">{entry.market}</td>
                            <td className="px-4 py-2 border-b">{entry.deliveryTo.name}</td>
                            <td className="px-4 py-2 border-b capitalize">{entry.status}</td>
                            <td className="px-4 py-2 border-b">{entry.totalQuantity}</td>
                            <td className="px-4 py-2 border-b">{entry.EALIssuedTotalQuantity}</td>
                            <td className="px-4 py-2 border-b flex justify-center items-center gap-2">
                              <button
                                className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-3 py-1 rounded shadow flex items-center gap-1"
                                onClick={() => viewDispatchDetails(entry)}
                              >
                                <LuEye className="text-lg" />
                              </button>
                              <button
                                className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-3 py-1 rounded shadow flex items-center gap-1"
                                onClick={() => linkDispatchDetails(entry)}
                              >
                                <LuLink className="text-lg" />
                              </button>
                              <button
                                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold px-3 py-1 rounded shadow flex items-center gap-1"
                                onClick={() => editDispatchDetails(entry)}
                              >
                                <LuPen className="text-lg" />
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
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-0">
            <div className="px-8 pt-8 pb-4 border-b border-gray-200 rounded-t-xl">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{dispatchData?._id ? 'Update Dispatch' : 'Add Dispatch'}</h2>
              <p className="text-sm text-gray-500 mb-2">Fill in the details below to {dispatchData?._id ? 'update' : 'add'} a dispatch record.</p>
            </div>
            <div className="px-8 py-8">
              <AddDispatchForm onSubmitDispatch={handleSubmitDispatch} dispatchDetails={dispatchData} />
            </div>
          </div>
        </Modal>

        {/* Modal for Viewing Dispatch Details */}
        <Modal isOpen={openDispatchModalView} onClose={() => setOpenDispatchModalView(false)} title="Dispatch Details" styleClass="w-full">
          <div className="h-full overflow-y-auto mx-auto p-0 bg-white shadow-xl rounded-xl">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
              <div className="grid grid-cols-2 gap-6 mb-2">
                <div>
                  <p className="text-gray-500 text-xs">Company</p>
                  <h2 className="text-xl font-bold text-blue-900">{dispatchData?.company?.name}</h2>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Market</p>
                  <h2 className="text-xl font-bold capitalize text-blue-900">{dispatchData.market}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-2">
                <div>
                  <p className="text-gray-500 text-xs">Dispatch Date</p>
                  <h2 className="text-lg font-semibold">{new Date(dispatchData.dateDispatched).toLocaleDateString()}</h2>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Delivery Location</p>
                  <h2 className="text-lg font-semibold">{dispatchData.deliveryTo?.name}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-2">
                <div>
                  <p className="text-gray-500 text-xs">Total Quantity</p>
                  <h2 className="text-lg font-semibold">{dispatchData.totalQuantity}</h2>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">EAL Issued Quantity</p>
                  <h2 className="text-lg font-semibold">{dispatchData.EALIssuedTotalQuantity}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-500 text-xs">Vehicle Number</p>
                  <h2 className="text-lg font-semibold">{dispatchData?.vehicleDetails?.vehicleNumber}</h2>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Driver</p>
                  <h2 className="text-lg font-semibold">{dispatchData?.vehicleDetails?.driverName} ({dispatchData?.vehicleDetails?.driverContact})</h2>
                </div>
              </div>
            </div>

            {/* Items Table Section */}
            <div className="px-8 py-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Items</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b font-semibold text-gray-700">Item</th>
                      <th className="px-4 py-3 border-b font-semibold text-gray-700 text-right">Quantity</th>
                      <th className="px-4 py-3 border-b font-semibold text-gray-700 text-right">EAL Issued</th>
                      <th className="px-4 py-3 border-b font-semibold text-gray-700 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchData.items &&
                      dispatchData.items.map((itemEntry, index) => (
                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-2 border-b text-gray-900 font-medium">{itemEntry?.item.name}</td>
                          <td className="px-4 py-2 border-b text-right">{itemEntry.quantityInCases}</td>
                          <td className="px-4 py-2 border-b text-right">{itemEntry.EALIssuedQuantity || 0}</td>
                          <td className="px-4 py-2 border-b text-center">
                            {dispatchData.status == 'final' && <button onClick={() => openEALModal(itemEntry)} className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition">
                              {itemEntry.EALIssuedQuantity < itemEntry.quantityInCases ? 'Link EAL' : 'Unlink EAL'}
                            </button>}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Actions Section */}
            <div className="px-8 pb-8 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              {/* Conditional rendering for Finalize button */}
              {dispatchData.status === 'draft' && (
                <>
                  <button type="button" className="btn bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded" onClick={() => updateDispatchStatus(dispatchData._id, 'final')}>
                    Finalize
                  </button>
                  <button type="button" className="btn bg-gray-500 text-white hover:bg-gray-600 px-6 py-2 rounded" onClick={() => deleteDispatch(dispatchData._id)}>
                    Delete
                  </button>
                </>
              )}

              {dispatchData.status === 'final' && dispatchData.EALIssuedTotalQuantity === 0 && (
                <button type="button" className="btn bg-yellow-500 text-white hover:bg-yellow-600 px-6 py-2 rounded" onClick={() => updateDispatchStatus(dispatchData._id, 'draft')}>
                  Draft
                </button>
              )}

              {dispatchData.status === 'final' && (
                dispatchData.EALIssuedTotalQuantity === dispatchData.totalQuantity ? (
                  <button
                    type="button"
                    className="btn bg-green-600 text-white hover:bg-green-700 px-6 py-2 rounded"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 mb-6">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-xs text-gray-500 mb-1">Total Qty</span>
              <span className="text-2xl font-bold text-blue-900">{selectedItem?.quantityInCases}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-50 border border-green-200">
              <span className="text-xs text-gray-500 mb-1">EAL Issued</span>
              <span className="text-2xl font-bold text-green-700">{selectedItem?.EALIssuedQuantity || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <span className="text-xs text-gray-500 mb-1">Balance</span>
              <span className="text-2xl font-bold text-yellow-700">{selectedItem?.quantityInCases - (selectedItem?.EALIssuedQuantity || 0)}</span>
            </div>
          </div>

          {/* Linked EAL Details */}
          <div className="mt-2 mb-6">
            <h4 className="font-semibold text-base mb-3 text-gray-800">Linked EALs</h4>
            {selectedItem?.EALLinks && selectedItem.EALLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedItem.EALLinks.map((link, index) => (
                  <div key={index} className="border rounded-xl p-4 flex flex-col gap-2 bg-white shadow-sm relative">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded">{link.prefix}</span>
                      <span className="text-xs text-gray-500">Serials:</span>
                      <span className="font-mono text-xs text-gray-800">{link.serialFrom.toString().padStart(10, '0')}</span>
                      <span className="text-xs">→</span>
                      <span className="font-mono text-xs text-gray-800">{link.serialTo.toString().padStart(10, '0')}</span>
                    </div>
                    <div className="text-xs text-gray-500">Used: <span className="font-semibold text-gray-700">{(link.serialTo - link.serialFrom + 1) / selectedItem?.item?.bottlesPerCase}</span> cases</div>
                    {dispatchData.status === 'final' && <button onClick={() => setUnlinkCandidate(link)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded bg-red-50">Unlink</button>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-gray-400">No EALs linked yet.</p>
            )}
          </div>

          {/* Add New EAL Form (conditionally rendered if balance > 0) */}
          {selectedItem?.quantityInCases - (selectedItem?.EALIssuedQuantity || 0) > 0 && (
            <div className="mt-6 border-t pt-6">
              <h4 className="font-semibold text-base mb-3 text-gray-800">Link New EAL</h4>
              <form className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm items-end" onSubmit={e => { e.preventDefault(); handleAddEAL(); }}>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="prefix">Prefix</label>
                  <input
                    value={newEALData.prefix}
                    onChange={({ target }) => handleChange('prefix', target.value)}
                    type="text"
                    name="prefix"
                    id="prefix"
                    placeholder="e.g., ABC"
                    required
                    className="border px-3 py-2 rounded w-full focus:ring focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="serialFrom">Serial From</label>
                  <input
                    value={newEALData.serialFrom}
                    onChange={({ target }) => handleChange('serialFrom', target.value)}
                    type="number"
                    name="serialFrom"
                    id="serialFrom"
                    placeholder="10 digits"
                    required
                    className="border px-3 py-2 rounded w-full focus:ring focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="serialTo">Serial To</label>
                  <input
                    value={newEALData.serialTo}
                    onChange={({ target }) => handleChange('serialTo', target.value)}
                    type="number"
                    name="serialTo"
                    id="serialTo"
                    placeholder="10 digits"
                    required
                    className="border px-3 py-2 rounded w-full focus:ring focus:ring-blue-100"
                  />
                </div>
                <div className="md:col-span-3 text-right mt-2">
                  <button onClick={handleAddEAL} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded shadow">
                    Link EAL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end mt-8 gap-2">
            <button onClick={closeEALModal} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium">
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
                onClick={() => { handleUnlinkEAL(unlinkCandidate) }}
                className={`px-4 py-2 text-sm text-white rounded ${unlinkConfirmText === 'unlink' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
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

        {/* Modal for Viewing Link Dispatch Details */}
        <Modal
          isOpen={linkDispatchModalOpen}
          onClose={() => {
            setLinkDispatchModalOpen(false);
            setLinkDispatchDetailsData(null);
          }}
          title="Link Dispatch Details"
          styleClass="w-full max-w-4xl"
        >
          {linkDispatchDetailsData ? (
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-0">
              {/* Section: Dispatch Info */}
              <div className="px-8 pt-8 pb-4 border-b border-gray-200 rounded-t-xl">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Dispatch Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Company</span>
                    <div className="font-semibold text-blue-900">{linkDispatchDetailsData?.company?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Dispatch Date</span>
                    <div className="font-semibold">{formatDate(linkDispatchDetailsData?.dateDispatched)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Market</span>
                    <div className="font-semibold capitalize">{linkDispatchDetailsData?.market}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Delivery Depot</span>
                    <div className="font-semibold">{linkDispatchDetailsData?.deliveryTo?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Vehicle No.</span>
                    <div className="font-semibold">{linkDispatchDetailsData?.vehicleDetails?.vehicleNumber}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Driver Name</span>
                    <div className="font-semibold">{linkDispatchDetailsData?.vehicleDetails?.driverName} ({linkDispatchDetailsData?.vehicleDetails?.driverContact})</div>
                  </div>
                </div>
              </div>

              {/* Section: Items & EAL Links */}
              <div className="px-8 py-8">
                <h3 className="text-lg font-bold mb-6 text-gray-800">Items & EAL Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {linkDispatchDetailsData.items?.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-6 bg-blue-50 mb-4 shadow-sm">
                      {/* Item Summary */}
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-bold text-blue-900">
                          {item?.item?.name}
                        </h4>
                        <span className="text-sm text-gray-500">
                          Quantity: <span className="font-semibold text-gray-700">{item.quantityInCases}</span> cases | Issued: <span className="font-semibold text-green-700">{item.EALIssuedQuantity || 0}</span> cases
                        </span>
                      </div>

                      {/* EAL Links List */}
                      {item?.EALLinks?.length > 0 ? (
                        <div className="space-y-2">
                          {item.EALLinks.map((link, linkIndex) => {
                            const usedQty = (parseInt(link.serialTo) - parseInt(link.serialFrom) + 1) / item?.item?.bottlesPerCase;
                            return (
                              <div
                                key={linkIndex}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex flex-col gap-1 shadow-sm"
                              >
                                <div className="flex gap-2 items-center">
                                  <span className="font-bold text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded">{link.prefix}</span>
                                  <span className="text-xs text-gray-500">Serials:</span>
                                  <span className="font-mono text-xs text-gray-800">{link.serialFrom.toString().padStart(10, '0')}</span>
                                  <span className="text-xs">→</span>
                                  <span className="font-mono text-xs text-gray-800">{link.serialTo.toString().padStart(10, '0')}</span>
                                </div>
                                <div className="text-xs text-gray-500">Used: <span className="font-semibold text-gray-700">{usedQty}</span> cases</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm italic text-gray-400">No EALs linked for this item.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 pb-8 flex justify-end">
                <button
                  onClick={() => setLinkDispatchModalOpen(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No dispatch selected.</p>
          )}
        </Modal>


      </div>
    </DashboardLayout>
  );
};

export default Dispatch;