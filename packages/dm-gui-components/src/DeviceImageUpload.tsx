import React, { type ChangeEvent, type ChangeEventHandler } from 'react';
import type { Connection } from '@iobroker/adapter-react-v5';

interface DeviceImageUploadProps {
    socket: Connection;
    manufacturer?: string;
    model?: string;
    deviceId: string;
    onImageSelect: (image: string) => void;
    uploadImagesToInstance: string;
}

function DeviceImageUpload(params: DeviceImageUploadProps): React.JSX.Element | null {
    const { socket, manufacturer, model, deviceId, onImageSelect, uploadImagesToInstance } = params;

    const handleImageUpload: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        const target = event.target as HTMLInputElement;
        const files: FileList | null = target.files;
        if (!files || files.length === 0) {
            return;
        }

        const file = files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>): void => {
                if (!e.target || !e.target.result) {
                    return;
                }

                const img = new Image();
                img.src = e.target.result as string;

                img.onload = async () => {
                    const maxWidth = 100;
                    const maxHeight = 100;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);

                        const resizedImage = canvas.toDataURL('image/webp');

                        // Build the file name from a manufacturer and model, if not available, use device id
                        const fileName = `${manufacturer ? `${manufacturer}_` : ''}${model || deviceId}.webp`;
                        const base64Data = resizedImage.replace(/^data:image\/webp;base64,/, '');
                        const response = await socket.writeFile64(uploadImagesToInstance, fileName, base64Data);
                        console.log(`saveImage response: ${JSON.stringify(response)}`);

                        if (onImageSelect) {
                            onImageSelect(resizedImage);
                        }
                    }
                };
            };

            reader.readAsDataURL(file);
        }
    };

    const imageUploadButtonStyle: React.CSSProperties = {
        // make the button invisible but still clickable
        opacity: 0,
        position: 'absolute',
        width: 45,
        height: 45,
        zIndex: 3,
    };

    const imageUploadDiv: React.CSSProperties = {
        position: 'relative',
        top: -22,
    };

    return (
        <div style={imageUploadDiv}>
            <input
                style={imageUploadButtonStyle}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
    );
}

export default DeviceImageUpload;
