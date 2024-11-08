import React from 'react'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface CropperProps {
  image: string
  crop: Crop
  onChange: (crop: Crop) => void
  onComplete: (crop: Crop) => void
}

export function Cropper({ image, crop, onChange, onComplete }: CropperProps) {
  return (
    <ReactCrop
      src={image}
      crop={crop}
      onChange={onChange}
      onComplete={onComplete}
    />
  )
}