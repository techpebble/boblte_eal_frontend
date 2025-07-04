import React from 'react';
import ReactSelect from 'react-select';

const Select = ({ value, onChange, label, options = [], placeholder, disabled, searchable }) => {
  // Find the selected option object
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <div>
      {label && (
        <label className='text-[13px] text-slate-800 mb-1 block'>
          {label}
        </label>
      )}
      <ReactSelect
        value={selectedOption}
        onChange={(selected) => {
          // Create a mock event object for compatibility with onChange({ target: { value } })
          onChange({ target: { value: selected ? selected.value : '' } });
        }}
        options={options}
        placeholder={placeholder}
        isSearchable={searchable}
        isDisabled={disabled}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: '#d1d5db',
            minHeight: '45px',
            fontSize: '0.875rem',
          }),
          menu: (base) => ({
            ...base,
            zIndex: 10,
          }),
        }}
      />
    </div>
  );
};

export default Select;
