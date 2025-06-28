import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import Modal from '../../components/Modal/Modal';
import AddEALIssuanceForm from '../../components/EALIssuance/AddEALIssuanceForm';
import toast from 'react-hot-toast';
import DateRangeModal from '../../components/Modal/DateRangeModal';
import { formatDate, formatDateToYYYYMMDD } from '../../utils/helper';
import { LuPlus } from 'react-icons/lu'
import LoadingOverlay from '../../components/LoadingOverlay';

const EALIssuance = () => {
  const [openAddEALIssuanceModal, setOpenAddEALIssuanceModal] = useState(false);
  const [EALIssuanceData, setEALIssuanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setopenDeleteAlert] = useState({
    show: false,
    data: null
  });

  // DateRange Start
    const [dateRange, setDateRange] = useState({
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    });
  
    const onApplyDateRange = (selectedRange) => {
      setDateRange(selectedRange);
      fetchEALIssuanceDetails(selectedRange); // Pass selected range for filtered data
    };
    // DateRange End

  // Get all EAL Issuance details
  const fetchEALIssuanceDetails = async (selectedRange = dateRange) => {
    if (loading) return;
    setLoading(true);

    try {
      const url = API_PATHS.EALISSUANCE.GET_DATA + `?startDate=${formatDateToYYYYMMDD(selectedRange.startDate)}&endDate=${formatDateToYYYYMMDD(selectedRange.endDate)}`;
      const response = await axiosInstance.get(url);

      if (response.data) {
        setEALIssuanceData(response.data);
      }

    } catch (error) {
      console.log("Something went wrong. Please try again.", error)
    } finally {
      setLoading(false);
    }
  }

  // Handle Add EAL Issuance
  const handleAddEALIssuance = async (EALIssuance) => {
    const {
        company,
        dateIssued,
        market,
        pack,
        prefix,
        serialFrom,
        serialTo,
        issuedQuantity
    } = EALIssuance;

    if (!company.trim()) {
      toast.error("Please select a Company");
      return;
    }

    if (!dateIssued.trim()) {
      toast.error("Please enter the date correctly");
      return;
    }

    if (!market.trim()) {
      toast.error("Please select a Market");
      return;
    }

    if (!pack.trim()) {
      toast.error("Please select a Pack");
      return;
    }

    if (!/^[A-Z]{3}$/.test(prefix.trim())) {
      toast.error("Prefix must be 3 uppercase letters (A-Z)");
      return;
    }

    if (!/^\d{10}$/.test(serialFrom)) {
      toast.error("Serial From must be a 10-digit number");
      return;
    }

    if (!/^\d{10}$/.test(serialTo)) {
      toast.error("Serial To must be a 10-digit number");
      return;
    }

    if (!issuedQuantity > 0 || issuedQuantity != (serialTo - serialFrom + 1)) {
      toast.error("Quantity Issued and the serial numbers are not matching");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(API_PATHS.EALISSUANCE.ADD_DATA, EALIssuance)

      setOpenAddEALIssuanceModal(false);
      toast.success("EAL Issuance added sucesfully");
      fetchEALIssuanceDetails();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
      console.error('Error adding EAL Issuance:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }

  }

  // Handle Delete EAL Issuance
  const handleDeleteEALIssuance = async (id) => {}

  useEffect(() => {
    fetchEALIssuanceDetails()
    return() => {}
  }, [])

  return (
    <DashboardLayout activeMenu="EAL Issuance">
      {loading && <LoadingOverlay />}
      <div className="my-5 mx-auto">
        <div className='grid grid-cols-1 gap-6'>
          <div className=''>
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="">
                  <h5 className="text-lg">EAL Issuance </h5>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Track your EAL Issuance over time
                  </p>
                </div>
                <DateRangeModal
                  dateRange={dateRange}
                  onApplyDateRange={onApplyDateRange}
                />
                <button className="add-btn" onClick={() => setOpenAddEALIssuanceModal(true)}>
                  <LuPlus className="text-lg" />
                  Add Issuance
                </button>
              </div>
              <div className="mt-10">
                <div className="overflow-x-auto mt-4">
                  <table className="table-auto min-w-full border border-gray-200 text-sm text-left text-gray-700">
                    <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                      <tr>
                        <th className="px-4 py-3 border">Company</th>
                        <th className="px-4 py-3 border">Date Issued</th>
                        <th className="px-4 py-3 border">Market</th>
                        <th className="px-4 py-3 border">Pack</th>
                        <th className="px-4 py-3 border">Serial From</th>
                        <th className="px-4 py-3 border">Serial To</th>
                        <th className="px-4 py-3 border">Balance Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(EALIssuanceData?.data) && EALIssuanceData.data.length > 0 ? (
                        EALIssuanceData.data.map((entry) => (
                          <tr key={entry._id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-2 border">{entry.company.name}</td>
                            <td className="px-4 py-2 border">{formatDate(entry.dateIssued)}</td>
                            <td className="px-4 py-2 border capitalize">{entry.market}</td>
                            <td className="px-4 py-2 border">{entry.pack.name}</td>
                            <td className="px-4 py-2 border">{entry.prefix}{entry.serialFrom.toString().padStart(10, '0')}</td>
                            <td className="px-4 py-2 border">{entry.prefix}{entry.serialTo.toString().padStart(10, '0')}</td>
                            <td className="px-4 py-2 border">{entry.balanceQuantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-gray-500">
                            {EALIssuanceData ? "No data available" : "Loading..."}
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
        
        <Modal 
          isOpen={openAddEALIssuanceModal} 
          onClose={() => setOpenAddEALIssuanceModal(false)}
          title="Add EAL Issuance"
          styleClass='w-full'
        >
          <AddEALIssuanceForm onAddEALIssuance={handleAddEALIssuance} />
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default EALIssuance