import React from 'react'

function Modal({ children, isOpen, onClose, title, styleClass }) {

    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex justify-center items-center bg-black/30 backdrop-blur-sm transition-all duration-200"
            onClick={e => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`relative min-w-2 max-w-7xl mx-auto my-8 animate-modal-fade-in ${styleClass}`}
            >
                <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
                    {/* Close Icon */}
                    <button
                        type="button"
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full w-9 h-9 flex items-center justify-center transition z-10"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 1l12 12M13 1L1 13"
                            />
                        </svg>
                    </button>
                    <div className="px-4 py-4 space-y-4"
                        style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        {children}
                    </div>
                </div>
            </div>
            <style>{`
                .animate-modal-fade-in {
                    animation: modalFadeIn 0.25s cubic-bezier(0.4,0,0.2,1);
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )
}

export default Modal