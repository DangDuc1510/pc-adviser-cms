'use client';
import { useState } from 'react';

const ImageGallery = ({ 
    images = [], 
    onImageDelete, 
    onSetPrimary,
    editable = false,
    className = ""
}) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (image, index) => {
        setSelectedImage({ ...image, index });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedImage(null);
        setIsModalOpen(false);
    };

    const handleDelete = (index) => {
        if (window.confirm('Bạn có chắc muốn xóa ảnh này?')) {
            onImageDelete?.(index);
        }
    };

    const handleSetPrimary = (index) => {
        if (window.confirm('Đặt ảnh này làm ảnh chính?')) {
            onSetPrimary?.(index);
        }
    };

    if (images.length === 0) {
        return (
            <div className={`image-gallery empty ${className}`}>
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <p>Chưa có ảnh nào</p>
                </div>

                <style jsx>{`
                    .image-gallery.empty {
                        border: 1px dashed #d1d5db;
                        border-radius: 8px;
                        padding: 2rem;
                    }

                    .empty-state {
                        text-align: center;
                        color: #6b7280;
                    }

                    .empty-icon {
                        opacity: 0.5;
                        margin-bottom: 1rem;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <>
            <div className={`image-gallery ${className}`}>
                <div className="gallery-grid">
                    {images.map((image, index) => (
                        <div key={index} className="gallery-item">
                            <div className="image-container">
                                <img 
                                    src={image.url} 
                                    alt={image.alt || `Image ${index + 1}`}
                                    onClick={() => openModal(image, index)}
                                    className="gallery-image"
                                />
                                
                                {image.isPrimary && (
                                    <div className="primary-badge">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                        </svg>
                                        Chính
                                    </div>
                                )}

                                {editable && (
                                    <div className="gallery-actions">
                                        {!image.isPrimary && (
                                            <button
                                                type="button"
                                                className="action-btn primary-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSetPrimary(index);
                                                }}
                                                title="Đặt làm ảnh chính"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        )}
                                        
                                        <button
                                            type="button"
                                            className="action-btn delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(index);
                                            }}
                                            title="Xóa ảnh"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {image.alt && (
                                <div className="image-caption">{image.alt}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal for full-size image */}
            {isModalOpen && selectedImage && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                        
                        <img 
                            src={selectedImage.url} 
                            alt={selectedImage.alt || `Image ${selectedImage.index + 1}`}
                            className="modal-image"
                        />
                        
                        <div className="modal-info">
                            <div className="modal-title">
                                {selectedImage.alt || `Ảnh ${selectedImage.index + 1}`}
                                {selectedImage.isPrimary && <span className="primary-text">• Ảnh chính</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .image-gallery {
                    width: 100%;
                }

                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .gallery-item {
                    position: relative;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #f3f4f6;
                    transition: transform 0.2s ease;
                }

                .gallery-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .image-container {
                    position: relative;
                    aspect-ratio: 1;
                    cursor: pointer;
                }

                .gallery-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.2s ease;
                }

                .image-container:hover .gallery-image {
                    transform: scale(1.05);
                }

                .primary-badge {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: linear-gradient(45deg, #f59e0b, #d97706);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .gallery-actions {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    display: flex;
                    gap: 4px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .image-container:hover .gallery-actions {
                    opacity: 1;
                }

                .action-btn {
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .action-btn:hover {
                    transform: scale(1.1);
                }

                .primary-btn:hover {
                    background: rgba(245, 158, 11, 0.9);
                }

                .delete-btn:hover {
                    background: rgba(220, 38, 38, 0.9);
                }

                .image-caption {
                    padding: 0.75rem;
                    font-size: 0.875rem;
                    color: #4b5563;
                    background: white;
                    border-top: 1px solid #e5e7eb;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 2rem;
                }

                .modal-content {
                    position: relative;
                    max-width: 90vw;
                    max-height: 90vh;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .modal-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s ease;
                }

                .modal-close:hover {
                    background: rgba(220, 38, 38, 0.8);
                    transform: scale(1.1);
                }

                .modal-image {
                    width: 100%;
                    height: auto;
                    max-height: calc(90vh - 100px);
                    object-fit: contain;
                    display: block;
                }

                .modal-info {
                    padding: 1rem;
                    border-top: 1px solid #e5e7eb;
                    background: #f9fafb;
                }

                .modal-title {
                    font-weight: 600;
                    color: #111827;
                }

                .primary-text {
                    color: #f59e0b;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .gallery-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                        gap: 0.75rem;
                    }

                    .modal-overlay {
                        padding: 1rem;
                    }

                    .modal-info {
                        padding: 0.75rem;
                    }
                }
            `}</style>
        </>
    );
};

export default ImageGallery;
