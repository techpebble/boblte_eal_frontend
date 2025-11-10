import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { formatDate } from '../../utils/helper';
import LoadingOverlay from '../../components/LoadingOverlay';
import Modal from '../../components/Modal/Modal';

const EALStock = () => {
    const [ealStockData, setEalStockData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch EAL Issuance (stock) data
    const fetchEALIssuance = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const url = API_PATHS.EALISSUANCE.GET_DATA + `?type=balance`;
            const response = await axiosInstance.get(url);
            if (response.data) setEalStockData(response.data);
        } catch (error) {
            console.error('Error fetching EAL issuance data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEALIssuance();
        return () => { };
    }, []);

    // Group by company and pack for summary table
    const companyPackSummary = React.useMemo(() => {
        const entries = Array.isArray(ealStockData?.data) ? ealStockData.data : [];
        const result = {};
        entries.forEach((entry) => {
            const companyId = entry.company._id;
            const market = entry.market;
            const packId = entry.pack._id;
            const quantityPerCase = entry.pack.bottlesPerCase;
            if (!result[companyId + market]) result[companyId + market] = { company: entry.company, items: {} };
            if (!result[companyId + market].items[packId]) {
                result[companyId + market].items[packId] = { pack: entry.pack, market: entry.market, totalBalance: 0, totalBalanceInCases: 0, entries: [] };
            }
            // assume issuance returns 'balanceQuantity' similar to usage
            result[companyId + market].items[packId].totalBalance += entry.balanceQuantity || 0;
            result[companyId + market].items[packId].totalBalanceInCases = result[companyId + market].items[packId].totalBalance / quantityPerCase;
            result[companyId + market].items[packId].entries.push(entry);
        });
        return Object.values(result);
    }, [ealStockData]);

    const [modalItem, setModalItem] = useState(null);
    const openModal = (item) => setModalItem(item);
    const closeModal = () => setModalItem(null);

    return (
        <DashboardLayout activeMenu="EAL Stock">
            {loading && <LoadingOverlay />}
            <div className="my-5 mx-auto">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <div className="card shadow-lg rounded-lg border border-gray-200 p-6 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h5 className="text-2xl font-bold text-gray-800">EAL Stock</h5>
                                    <p className="text-sm text-gray-500 mt-1">View current EAL stock balances grouped by company and item.</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="mt-12">
                                    <div className="overflow-x-auto">
                                        <table className="table-auto min-w-full border border-gray-200 text-sm text-left text-gray-700 rounded-lg">
                                            <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                                                <tr>
                                                    <th className="px-4 py-3 border">Company</th>
                                                    <th className="px-4 py-3 border">Pack</th>
                                                    <th className="px-4 py-3 border">Market</th>
                                                    <th className="px-4 py-3 border">Balance in Numbers</th>
                                                    <th className="px-4 py-3 border">Balance in Cases</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyPackSummary.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center py-4 text-gray-500">No data available</td>
                                                    </tr>
                                                ) : (
                                                    companyPackSummary.map((company) => (
                                                        Object.values(company.items).map((item) => (
                                                            <tr
                                                                onClick={() => openModal(item)}
                                                                key={company.company._id + '-' + item.pack._id + '-' + item.market}
                                                                className="bg-white border-b hover:bg-blue-100 cursor-pointer transition-colors"
                                                            >
                                                                <td className="px-4 py-2 border">{company.company.name}</td>
                                                                <td className="px-4 py-2 border">{item.pack.name}</td>
                                                                <td className="px-4 py-2 border capitalize">{item.market}</td>
                                                                <td className="px-4 py-2 border">{item.totalBalance}</td>
                                                                <td className="px-4 py-2 border">{item.totalBalanceInCases}</td>
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

            {modalItem && (
                <Modal isOpen={modalItem} onClose={() => closeModal()} styleClass="w-full max-w-4xl">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{modalItem.pack.name} - {modalItem.market}</h3>
                    <div className="mb-4 text-sm text-gray-600">Total Balance: <span className="font-bold">{modalItem.totalBalance}</span></div>
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                        <table className="table-auto min-w-full border border-gray-200 text-sm text-left text-gray-700">
                            <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th className="px-4 py-3 border">Company</th>
                                    <th className="px-4 py-3 border">Date Issued</th>
                                    <th className="px-4 py-3 border">Market</th>
                                    <th className="px-4 py-3 border">Serial From</th>
                                    <th className="px-4 py-3 border">Serial To</th>
                                    <th className="px-4 py-3 border">Balance in Numbers</th>
                                    <th className="px-4 py-3 border">Balance in Cases</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalItem.entries.map((entry) => (
                                    <tr key={entry._id} className="bg-white border-b hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-2 border">{entry.company.name}</td>
                                        <td className="px-4 py-2 border">{formatDate(entry.dateIssued || entry.date)}</td>
                                        <td className="px-4 py-2 border capitalize">{entry.market}</td>
                                        <td className="px-4 py-2 border">{entry.prefix}{entry.serialFrom?.toString().padStart(10, '0')}</td>
                                        <td className="px-4 py-2 border">{entry.prefix}{entry.serialTo?.toString().padStart(10, '0')}</td>
                                        <td className="px-4 py-2 border">{entry.balanceQuantity}</td>
                                        <td className="px-4 py-2 border">{(entry.balanceQuantity || 0) / entry.pack.bottlesPerCase}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}

        </DashboardLayout>
    );
};

export default EALStock;
