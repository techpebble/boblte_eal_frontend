import React from 'react';

const Select = ({ value, onChange, label, options = [], placeholder, disabled }) => {
  return (
    <div>
      <label className='text-[13px] text-slate-800'>{label}</label>
      <div className='input-box'>
        <select
          value={value}
          onChange={(e) => onChange(e)}
          className='w-full bg-transparent outline-none'
          disabled={disabled}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Select;
