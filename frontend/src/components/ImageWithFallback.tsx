'use client';
import { useState, ImgHTMLAttributes } from 'react';
import Image, { ImageProps } from 'next/image';

interface Props extends ImageProps {
    fallbackSrc?: string;
    fallbackContent?: React.ReactNode;
}

export default function ImageWithFallback({
    src,
    alt,
    fallbackSrc = '/assets/cards/card_back.png',
    fallbackContent,
    ...props
}: Props) {
    const [error, setError] = useState(false);

    if (error) {
        if (fallbackContent) return <>{fallbackContent}</>;
        return <Image src={fallbackSrc} alt={alt} {...props} />;
    }

    return (
        <Image
            src={src}
            alt={alt}
            onError={() => setError(true)}
            {...props}
        />
    );
}
