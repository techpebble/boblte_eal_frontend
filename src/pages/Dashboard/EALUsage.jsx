import React, { useEffect, useState } from 'react'
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Modal from '../../components/Modal/Modal';
import AddEALUsageForm from '../../components/EALUsage/AddEALUsageForm';
import toast from 'react-hot-toast';
import { LuPlus } from 'react-icons/lu';
import DateRangeModal from '../../components/Modal/DateRangeModal';
import { formatDate, formatDateToYYYYMMDD } from '../../utils/helper';
import LoadingOverlay from '../../components/LoadingOverlay';

const EALUsage = () => {
  const [openAddEALUsageModal, setOpenAddEALUsageModal] = useState(false);
  const [EALUsageData, setEALUsageData] = useState([]);
  const [loading, setLoading] = useState(false);

  // DateRange Start
    const [dateRange, setDateRange] = useState({
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    });
  
    const onApplyDateRange = (selectedRange) => {
      setDateRange(selectedRange);
      fetchEALUsageDetails(selectedRange); // Pass selected range for filtered data
    };
    // DateRange End
    
  // Get all EAL Usage details
  const fetchEALUsageDetails = async (selectedRange = dateRange) => {
    if (loading) return;
    setLoading(true);

    try {
      const url = API_PATHS.EALUSAGE.GET_DATA +
      `?startDate=${formatDateToYYYYMMDD(selectedRange.startDate)}&endDate=${formatDateToYYYYMMDD(selectedRange.endDate)}`;
    
      const response = await axiosInstance.get(url);

      if (response.data) {
        setEALUsageData(response.data);
      }

    } catch (error) {
      console.log("Something went wrong. Please try again.", error)
    } finally {
      setLoading(false);
    }
  }

  // Handle Add EAL Usage
  const handleAddEALUsage = async (EALUsage) => {
    const {
        company,
        dateUsed,
        market,
        item,
        pack,
        usedQuantityInCases,
        prefix,
        serialFrom,
        serialTo,
        usedQuantity
    } = EALUsage;

    if (!company.trim()) {
      toast.error("Please select a Company");
      return;
    }

    if (!dateUsed.trim()) {
      toast.error("Please enter the date correctly");
      return;
    }

    if (!market.trim()) {
      toast.error("Please select a Market");
      return;
    }

    if (!item.trim()) {
      toast.error("Please select a Item");
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

    if (!usedQuantity > 0 || usedQuantity != (serialTo - serialFrom + 1)) {
      toast.error("Quantity Issued and the serial numbers are not matching");
      return;
    }

    if (!usedQuantityInCases > 0) {
      toast.error("Produced Quantity should be greater than zero");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(API_PATHS.EALUSAGE.ADD_DATA, EALUsage)
      setOpenAddEALUsageModal(false);
      toast.success("EAL Usage added sucesfully");
      fetchEALUsageDetails();
    } catch (error) {
      console.error('Error adding EAL Usage:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }

  }

  useEffect(() => {
    fetchEALUsageDetails()
    return() => {}
  }, [])

  return (
    <DashboardLayout activeMenu="EAL Usage">
      {loading && <LoadingOverlay />}
      <div className="my-5 mx-auto">
        <div className='grid grid-cols-1 gap-6'>
          <div className=''>
            <div className="card">
              <div className="flex items-center justify-between">
              <div className="">
                <h5 className="text-lg">EAL Usage</h5>
                <p className="text-xs text-gray-400 mt-0.5">
                  Track your EAL Usage over time
                </p>
              </div>
               <DateRangeModal
                dateRange={dateRange}
                onApplyDateRange={onApplyDateRange}
              />
                <button className="add-btn" onClick={() => setOpenAddEALUsageModal(true)}>
                  <LuPlus className="text-lg" />
                  Add Usage
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
                        <th className="px-4 py-3 border">Balance in Cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(EALUsageData?.data) && EALUsageData.data.length > 0 ? (
                        EALUsageData.data.map((entry) => (
                          <tr key={entry._id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-2 border">{entry.company.name}</td>
                            <td className="px-4 py-2 border">{formatDate(entry.dateUsed)}</td>
                            <td className="px-4 py-2 border capitalize">{entry.market}</td>
                            <td className="px-4 py-2 border">{entry.pack.bottlesPerCase + ' x ' + entry.pack.name}</td>
                            <td className="px-4 py-2 border">{entry.prefix}{entry.serialFrom.toString().padStart(10, '0')}</td>
                            <td className="px-4 py-2 border">{entry.prefix}{entry.serialTo.toString().padStart(10, '0')}</td>
                            <td className="px-4 py-2 border">{entry.balanceQuantity / entry.pack.bottlesPerCase}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-gray-500">
                            {EALUsageData ? "No data available" : "Loading..."}
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
          isOpen={openAddEALUsageModal} 
          onClose={() => setOpenAddEALUsageModal(false)}
          title="Add EAL Usage"
          styleClass='w-full'
        >
          <AddEALUsageForm onAddEALUsage={handleAddEALUsage} />
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default EALUsage