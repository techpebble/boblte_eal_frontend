import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { formatDate } from '../../utils/helper';
import LoadingOverlay from '../../components/LoadingOverlay';
import Modal from '../../components/Modal/Modal';

const FinishedStock = () => {
    const [finishedStockData, setFinishedStockData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Get all EAL Usage details
    const fetchEALUsageDetails = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const url = API_PATHS.EALUSAGE.GET_DATA +
                `?type=balance`;

            const response = await axiosInstance.get(url);

            if (response.data) {
                setFinishedStockData(response.data);
            }

        } catch (error) {
            console.log("Something went wrong. Please try again.", error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEALUsageDetails()
        return () => { }
    }, [])




    // Group by company and item for summary table
    const companyItemSummary = React.useMemo(() => {
        const entries = Array.isArray(finishedStockData?.data) ? finishedStockData.data : [];
        const result = {};
        entries.forEach(entry => {
            const companyId = entry.company._id;
            const itemId = entry.item._id;
            if (!result[companyId]) result[companyId] = { company: entry.company, items: {} };
            if (!result[companyId].items[itemId]) {
                result[companyId].items[itemId] = {
                    item: entry.item,
                    totalBalance: 0,
                    entries: []
                };
            }
            result[companyId].items[itemId].totalBalance += entry.balanceQuantityInCases || 0;
            result[companyId].items[itemId].entries.push(entry);
        });
        return Object.values(result);
    }, [finishedStockData]);


    // Modal state for showing all entries of an item
    const [modalItem, setModalItem] = useState(null);

    const openModal = (item) => setModalItem(item);
    const closeModal = () => setModalItem(null);


    return (
        <DashboardLayout activeMenu="Finished Stock">
            {loading && <LoadingOverlay />}
            <div className="my-5 mx-auto">
                <div className='grid grid-cols-1 gap-6'>
                    <div className=''>
                        <div className="card shadow-lg rounded-lg border border-gray-200 p-6 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="">
                                    <h5 className="text-2xl font-bold text-gray-800">Finished Stock</h5>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Click an item to view all entries in a modal, or see summary by company below.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6">
                                {/* Company summary table */}
                                <div className="mt-12">
                                    <div className="overflow-x-auto">
                                        <table className="table-auto min-w-full border border-gray-200 text-sm text-left text-gray-700 rounded-lg">
                                            <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                                                <tr>
                                                    <th className="px-4 py-3 border">Company</th>
                                                    <th className="px-4 py-3 border">Item</th>
                                                    <th className="px-4 py-3 border">Total Balance (Cases)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyItemSummary.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center py-4 text-gray-500">No data available</td>
                                                    </tr>
                                                ) : (
                                                    companyItemSummary.map(company => (
                                                        Object.values(company.items).map(item => (
                                                            <tr
                                                                onClick={() => openModal(item)}
                                                                key={company.company._id + '-' + item.item._id}
                                                                className="bg-white border-b hover:bg-blue-100 cursor-pointer transition-colors"
                                                            >
                                                                <td className="px-4 py-2 border">{company.company.name}</td>
                                                                <td className="px-4 py-2 border">{item.item.name}</td>
                                                                <td className="px-4 py-2 border">{item.totalBalance}</td>
                                                            </tr>
                                                        ))
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for item entries */}
            {modalItem && (

                <Modal
                    isOpen={modalItem}
                    onClose={() => closeModal()}
                    styleClass="w-full max-w-4xl"
                >
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{modalItem.item.name}</h3>
                    <div className="mb-4 text-sm text-gray-600">
                        Total Balance (Cases): <span className="font-bold">{modalItem.totalBalance}</span>
                    </div>
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                        <table className="table-auto min-w-full border border-gray-200 text-sm text-left text-gray-700">
                            <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th className="px-4 py-3 border">Company</th>
                                    <th className="px-4 py-3 border">Date Issued</th>
                                    <th className="px-4 py-3 border">Market</th>
                                    <th className="px-4 py-3 border">Serial From</th>
                                    <th className="px-4 py-3 border">Serial To</th>
                                    <th className="px-4 py-3 border">QTY [BALA](in CS)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalItem.entries.map(entry => (
                                    <tr key={entry._id} className="bg-white border-b hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-2 border">{entry.company.name}</td>
                                        <td className="px-4 py-2 border">{formatDate(entry.dateUsed)}</td>
                                        <td className="px-4 py-2 border capitalize">{entry.market}</td>
                                        <td className="px-4 py-2 border">{entry.prefix}{entry.serialFrom.toString().padStart(10, '0')}</td>
                                        <td className="px-4 py-2 border">{entry.prefix}{entry.serialTo.toString().padStart(10, '0')}</td>
                                        <td className="px-4 py-2 border">{entry.usedQuantityInCases} [{entry.balanceQuantityInCases}]</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </DashboardLayout>
    );
}

export default FinishedStock