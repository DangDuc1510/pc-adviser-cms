'use client';
import { useState, useRef, useEffect } from 'react';

const ImageUpload = ({
    onImageSelect,
    currentImage = null,
    multiple = false,
    accept = "image/*",
    maxSize = 5, // MB
    className = "",
    placeholder = "Chọn ảnh",
    showPreview = true,
    isAvatar = false,
    hideIconWhenEmpty = false
}) => {
    const [preview, setPreview] = useState(currentImage);
    const [previews, setPreviews] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Sync currentImage with preview state
    useEffect(() => {
        if (!multiple) {
            setPreview(currentImage || null);
        }
    }, [currentImage, multiple]);

    const handleFiles = (files) => {
        const validFiles = [];
        const newPreviews = [];

        Array.from(files).forEach(file => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} không phải là ảnh!`);
                return;
            }

            // Validate file size
            if (file.size > maxSize * 1024 * 1024) {
                alert(`File ${file.name} quá lớn! Kích thước tối đa: ${maxSize}MB`);
                return;
            }

            validFiles.push(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                if (multiple) {
                    newPreviews.push({
                        file,
                        preview: e.target.result,
                        name: file.name
                    });
                    if (newPreviews.length === validFiles.length) {
                        setPreviews(prev => [...prev, ...newPreviews]);
                    }
                } else {
                    setPreview(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        });

        if (validFiles.length > 0) {
            onImageSelect(multiple ? validFiles : validFiles[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removePreview = (index) => {
        if (multiple) {
            setPreviews(prev => prev.filter((_, i) => i !== index));
        } else {
            setPreview(null);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Upload Area */}
            <div
                className={`
                    border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer 
                    transition-all duration-300 bg-gray-50 relative min-h-[200px] 
                    flex items-center justify-center
                    hover:border-blue-500 hover:bg-blue-50
                    ${dragActive ? 'border-blue-500 bg-blue-100' : ''}
                    ${(preview || previews.length > 0) && multiple === false ? 'p-0 bg-transparent border-none' : ''}
                    md:p-6 md:min-h-[150px]
                `}
                onDrop={handleDrop}
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="!hidden"
                />

                {(!showPreview || (!preview && previews.length === 0)) || multiple === true ? (
                    <div className="flex flex-col items-center gap-4">
                        {!hideIconWhenEmpty && (
                            <div className="text-gray-500 opacity-70">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14.2639 15.9375L12.5958 14.2834C12.267 13.9587 11.7424 13.9587 11.4137 14.2834L9.74557 15.9375M12.0047 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12.0047 3C16.9753 3 21 7.02944 21 12C21 16.9706 16.9753 21 12.0047 21ZM12.0047 14.2834V8.625V14.2834Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        )}
                        <div className="text-gray-500">
                            <p className="text-lg font-semibold mb-2 text-gray-700 md:text-base">{placeholder}</p>
                            <p className="mb-2 text-sm md:text-xs">
                                Kéo thả hoặc click để chọn ảnh
                            </p>
                            <p className="text-xs opacity-80 md:text-xs">
                                Định dạng: PNG, JPG, WebP (Tối đa {maxSize}MB)
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Single Image Preview */}
                {showPreview && preview && !multiple && (
                    <div className={`relative rounded-xl overflow-hidden max-w-full max-h-96 ${isAvatar ? '!h-[200px] !w-[200px]' : ''}`}>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover content-center" />
                        <button
                            type="button"
                            className={`absolute top-2 right-2 bg-black bg-opacity-70 text-white border-none 
                                     rounded-full w-8 h-8 ${isAvatar ? '!w-[20px] !h-[20px]' : ''} flex items-center justify-center cursor-pointer 
                                     transition-all duration-200 hover:bg-red-600 hover:bg-opacity-80 hover:scale-110`}
                            onClick={(e) => {
                                e.stopPropagation();
                                removePreview(0);
                                onImageSelect(null);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Multiple Images Preview */}
            {showPreview && multiple && previews.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 mt-4 md:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
                    {previews.map((item, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
                            <img src={item.preview} alt={item.name} className="w-full h-full object-cover content-center" />
                            <button
                                type="button"
                                className="absolute top-2 right-2 bg-black bg-opacity-70 text-white border-none 
                                         rounded-full w-8 h-8 flex items-center justify-center cursor-pointer 
                                         transition-all duration-200 hover:bg-red-600 hover:bg-opacity-80 hover:scale-110"
                                onClick={() => removePreview(index)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent 
                                          text-white p-4 pb-2 pt-4 text-xs truncate">
                                {item.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
