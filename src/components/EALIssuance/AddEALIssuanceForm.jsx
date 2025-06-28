import React, { useEffect, useState } from 'react'
import Input from '../inputs/input';
import Select from '../inputs/Select';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';

function AddEALIssuanceForm({onAddEALIssuance}) {
    const [companies, setcompanies] = useState([]);
    const [packs, setpacks] = useState([]);
    const [loading, setloading] = useState(false);
    const markets = [
        { value: 'local', label: 'Local' },
        { value: 'export', label: 'Export' },
    ];
    const [EALIssuance, setEALIssuance] = useState({
        company: '',
        dateIssued: '',
        market: '',
        pack:'',
        prefix:'',
        serialFrom:'',
        serialTo:'',
        issuedQuantity: ''
    });

    const handleChange = (key, value) => setEALIssuance({...EALIssuance, [key]: value});
    
    // Get all companies
    const fetchCompanies = async () => {
        if (loading) return;

        try {
        const response = await axiosInstance.get(API_PATHS.COMPANY.GET_DATA);
        if (response.data) {
            const companyOptions = response.data.data.map((company) => ({
                value: company._id,
                label: company.name,
            }));
            setcompanies(companyOptions);
        }

        } catch (error) {
            console.log("Something went wrong. Please try again.", error)
        } finally {
            setloading(false);
        }
    }

    // Get all packs
    const fetchPacks = async () => {
        if (loading) return;

        try {
        const response = await axiosInstance.get(API_PATHS.PACK.GET_DATA);
        if (response.data) {
            const packOptions = response.data.data.map((pack) => ({
                value: pack._id,
                label: pack.name,
            }));
            setpacks(packOptions);
        }

        } catch (error) {
            console.log("Something went wrong. Please try again.", error)
        } finally {
            setloading(false);
        }
    }

    useEffect(() => {
        fetchCompanies();
        fetchPacks();

        return() => { }
    }, [])

  return (
    <div className="space-y-4">
        {/* Row 1: Company (6/12) & Market (6/12) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
                <Select
                    label="Company"
                    placeholder="Select a Company"
                    value={EALIssuance.company}
                    onChange={({target}) => handleChange('company', target.value)}
                    options={companies}
                />
            </div>
            <div className="md:col-span-6">
                <Select
                    label="Market"
                    placeholder="Select a Market"
                    value={EALIssuance.market}
                    onChange={({target}) => handleChange('market', target.value)}
                    options={markets}
                />
            </div>
        </div>

        {/* Row 2: Issued Date (6/12) & Pack Size (6/12) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
            <Input
                value={EALIssuance.dateIssued}
                onChange={({target}) => handleChange('dateIssued', target.value)}
                label="Issued Date"
                placeholder="DD/MM/YYYY"
                type="date"
            />
            </div>
            <div className="md:col-span-6">
            <Select
                label="Pack Size"
                placeholder="Select a Pack Size"
                value={EALIssuance.pack}
                onChange={({target}) => handleChange('pack', target.value)}
                options={packs}
            />
            </div>
        </div>

        {/* Row 3: Prefix (2/12), Serial From (5/12), Serial To (5/12) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
                <Input
                    value={EALIssuance.prefix}
                    onChange={({target}) => handleChange('prefix', target.value.toUpperCase())}
                    label="Prefix"
                    placeholder="Prefix (e.g., ABC)"
                    type="text"
                />
            </div>
            <div className="md:col-span-3">
                <Input
                    value={EALIssuance.serialFrom}
                    onChange={({target}) => handleChange('serialFrom', target.value)}
                    label="Serial From"
                    placeholder="Serial From (10 digits)"
                    type="number"
                />
            </div>
            <div className="md:col-span-3">
                <Input
                    value={EALIssuance.serialTo}
                    onChange={({target}) => handleChange('serialTo', target.value)}
                    label="Serial To"
                    placeholder="Serial To (10 digits)"
                    type="number"
                />
            </div>
            <div className="md:col-span-3">
                <Input
                    value={EALIssuance.issuedQuantity}
                    onChange={({target}) => handleChange('issuedQuantity', target.value)}
                    label="Quantity Issued"
                    placeholder="Quantity"
                    type="number"
                />
            </div>
        </div>
        <div>
            <div className="flex justify-end mt-6">
                <button
                    type="button"
                    className="add-btn add-btn-fill"
                    onClick={()=>onAddEALIssuance (EALIssuance) }
                >
                    Add EAL Issuance 
                </button>
            </div>
        </div>
    </div>
  )
}

export default AddEALIssuanceForm