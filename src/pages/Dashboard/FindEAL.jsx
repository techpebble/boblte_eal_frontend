import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import LoadingOverlay from '../../components/LoadingOverlay';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Select from '../../components/inputs/Select';
import { formatDate } from '../../utils/helper';

const FindEAL = () => {
    // form state
    const [ealNumber, setEalNumber] = useState('');
    const [company, setCompany] = useState('');
    const [market, setMarket] = useState('');
    const [pack, setPack] = useState('');
    const [usedDate, setUsedDate] = useState('');

    // select options
    const [companies, setCompanies] = useState([]);
    const [packs, setPacks] = useState([]);
    const markets = [
        { value: 'local', label: 'Local' },
        { value: 'export', label: 'Export' },
    ];

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(null);

    const reset = () => {
        setEalNumber('');
        setCompany('');
        setMarket('');
        setPack('');
        setUsedDate('');
        setResults([]);
        setError(null);
    };

    // Fetch companies
    const fetchCompanies = async () => {
        try {
            const res = await axiosInstance.get(API_PATHS.COMPANY.GET_DATA);
            if (res.data) {
                const opts = (res.data.data || res.data).map((c) => ({ value: c._id, label: c.name }));
                setCompanies(opts);
            }
        } catch (err) {
            console.error('fetchCompanies', err);
        }
    };

    // Fetch packs
    const fetchPacks = async () => {
        try {
            const res = await axiosInstance.get(API_PATHS.PACK.GET_DATA);
            if (res.data) {
                const opts = (res.data.data || res.data).map((p) => ({ value: p._id, label: p.name }));
                setPacks(opts);
            }
        } catch (err) {
            console.error('fetchPacks', err);
        }
    };

    useEffect(() => {
        fetchCompanies();
        fetchPacks();
        return () => { };
    }, []);

    const buildQuery = () => {
        const params = new URLSearchParams();
        if (ealNumber.trim()) params.append('ealNumber', ealNumber.trim());
        if (company.trim()) params.append('company', company.trim());
        if (market.trim()) params.append('market', market.trim());
        if (pack.trim()) params.append('pack', pack.trim());
        if (usedDate) params.append('usedDate', usedDate);
        return params.toString();
    };

    const onSearch = async (e) => {
        if (e) e.preventDefault();
        // EAL Number is mandatory
        if (!ealNumber || !ealNumber.trim()) {
            setError('EAL Number is required.');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const qs = buildQuery();
            const url = `${API_PATHS.EALUSAGE.FIND}${qs ? `?${qs}` : ''}`;
            const res = await axiosInstance.get(url);
            const data = res.data?.data ?? res.data?.results ?? res.data ?? [];
            setResults(Array.isArray(data) ? data : [data]);
        } catch (err) {
            console.error('FindEAL error', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout activeMenu="Find EAL">
            <div className="my-5 mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-gray-100 p-6">
                    {loading && <LoadingOverlay />}

                    <div className="mb-4">
                        <h1 className="text-2xl font-bold">Find EAL</h1>
                        <p className="text-sm text-gray-500 mt-1">Search EAL records by number, company, market, pack, used date or item.</p>
                    </div>

                    <form className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" onSubmit={onSearch}>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">EAL Number <span className="text-red-500">*</span></label>
                            <input value={ealNumber} onChange={(e) => { setEalNumber(e.target.value); setError(null); }} className="w-full border rounded px-3 py-2" placeholder="Prefix + serial (or serial)" />
                        </div>
                        <div>
                            <Select
                                label="Company"
                                placeholder="Select a Company"
                                value={company}
                                onChange={({ target }) => setCompany(target.value)}
                                options={companies}
                            />
                        </div>
                        <div>
                            <Select
                                label="Market"
                                placeholder="Select a Market"
                                value={market}
                                onChange={({ target }) => setMarket(target.value)}
                                options={markets}
                            />
                        </div>

                        <div>
                            <Select
                                label="Pack"
                                placeholder="Select a Pack"
                                value={pack}
                                onChange={({ target }) => setPack(target.value)}
                                options={packs}
                            />
                        </div>

                        <div className="md:col-span-3 flex gap-2 justify-end">
                            <button type="button" onClick={reset} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Reset</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Search</button>
                        </div>
                    </form>

                    <div>
                        {error && <div className="text-red-600 mb-4">{error}</div>}

                        {Array.isArray(results) && results.length === 0 && (
                            <div className="text-gray-500">No results. Try a different filter.</div>
                        )}

                        {Array.isArray(results) && results.length > 0 && (
                            <div className="space-y-4">
                                {results.map((res, idx) => {
                                    // handle case where API returns an object with respondData
                                    const data = res.respondData || res;
                                    const { serial, prefix, issuance, usage, dispatch } = data;
                                    return (
                                        <div key={`${prefix || ''}-${serial || idx}`} className="bg-white border rounded p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="text-sm text-gray-500">EAL</div>
                                                    <div className="font-mono text-lg">{prefix ? `${prefix}-${serial}` : (serial || '-')}</div>
                                                    <div className="text-m text-gray-500 mt-2">
                                                        {`EAL [${prefix ? `${prefix}-${serial}` : (serial || '-')}] was created by ${issuance[0]?.createdBy?.fullName || issuance[0]?.createdBy || '-'} on ${formatDate(issuance[0]?.dateIssued || issuance[0]?.createdAt)}, within the range ${issuance[0]?.serialFrom || '-'} → ${issuance[0]?.serialTo || '-'}. ${usage ? `It was allocated for the product ${usage?.item?.name || '-'}, recorded by ${usage?.createdBy?.fullName || usage?.createdBy || '-'} on ${formatDate(usage?.dateUsed || usage?.createdAt)}.` : 'It has not been used yet.'} ${dispatch ? `It was dispatched on ${formatDate(dispatch?.dateDispatched || dispatch?.createdAt)}, and subsequently recorded by ${dispatch?.createdBy?.fullName || dispatch?.createdBy || '-'}.` : ''}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FindEAL;
