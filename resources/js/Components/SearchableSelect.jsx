import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Pilih opsi...',
    className = '',
    style = {},
    multiple = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    // Close dropdown on clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter options based on search query
    const filteredOptions = options.filter((option) =>
        String(option.label || '')
            .toLowerCase()
            .includes(search.toLowerCase()),
    );

    // Find the currently selected options/option
    let selectedOptions = [];
    if (multiple) {
        const arrValue = Array.isArray(value) ? value : [];
        selectedOptions = options.filter((option) =>
            arrValue.map(String).includes(String(option.value)),
        );
    } else {
        const selectedOption =
            options.find((option) => String(option.value) === String(value)) ||
            null;
        if (selectedOption) selectedOptions = [selectedOption];
    }

    // Handle selecting an option
    const handleSelect = (option) => {
        if (multiple) {
            const arrValue = Array.isArray(value) ? value : [];
            let newValues;
            if (arrValue.map(String).includes(String(option.value))) {
                newValues = arrValue.filter(
                    (v) => String(v) !== String(option.value),
                );
            } else {
                newValues = [...arrValue, option.value];
            }
            onChange({ target: { value: newValues } });
        } else {
            onChange({ target: { value: option.value } });
            setIsOpen(false);
            setSearch('');
        }
    };

    const handleRemoveTag = (e, optionVal) => {
        e.stopPropagation();
        const arrValue = Array.isArray(value) ? value : [];
        const newValues = arrValue.filter(
            (v) => String(v) !== String(optionVal),
        );
        onChange({ target: { value: newValues } });
    };

    return (
        <div
            ref={containerRef}
            className={`sibau-select2-container ${className}`}
            style={style}
        >
            {/* Display / Trigger Box */}
            <div
                className="sibau-select2-selection sibau-input"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: 'auto',
                    minHeight: '38px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    padding: '6px 36px 6px 12px',
                    position: 'relative',
                }}
            >
                {selectedOptions.length > 0 ? (
                    multiple ? (
                        <div className="sibau-select2-tags">
                            {selectedOptions.map((opt) => (
                                <span
                                    key={opt.value}
                                    className="sibau-select2-tag"
                                >
                                    {opt.label}
                                    <span
                                        className="sibau-select2-tag-remove"
                                        onClick={(e) =>
                                            handleRemoveTag(e, opt.value)
                                        }
                                    >
                                        ×
                                    </span>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span style={{ color: '#000000', fontWeight: '600' }}>
                            {selectedOptions[0].label}
                        </span>
                    )
                ) : (
                    <span style={{ color: '#9ca3af' }}>{placeholder}</span>
                )}
                <span
                    className="sibau-select2-arrow"
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                >
                    {isOpen ? '▲' : '▼'}
                </span>
            </div>

            {/* Dropdown Container */}
            {isOpen && (
                <div className="sibau-select2-dropdown">
                    {/* Search Field */}
                    <input
                        type="text"
                        className="sibau-input"
                        placeholder="Ketik untuk mencari..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        style={{
                            marginBottom: '8px',
                            padding: '6px 10px',
                            fontSize: '9pt',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                    />

                    {/* Options List */}
                    <div className="sibau-select2-options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = multiple
                                    ? Array.isArray(value)
                                        ? value
                                              .map(String)
                                              .includes(String(option.value))
                                        : false
                                    : String(option.value) === String(value);
                                const isDisabled = option.disabled;
                                return (
                                    <div
                                        key={option.value}
                                        onClick={() =>
                                            !isDisabled && handleSelect(option)
                                        }
                                        className={`sibau-select2-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                        style={
                                            isDisabled
                                                ? {
                                                      opacity: 0.5,
                                                      cursor: 'not-allowed',
                                                      color: '#94a3b8',
                                                  }
                                                : {}
                                        }
                                    >
                                        {option.label}
                                    </div>
                                );
                            })
                        ) : (
                            <div
                                style={{
                                    padding: '8px 10px',
                                    color: '#94a3b8',
                                    fontSize: '9pt',
                                    textAlign: 'center',
                                }}
                            >
                                Tidak ada data cocok
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
