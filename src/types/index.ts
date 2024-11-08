export interface Tool {
  id: string
  name: string
  icon: string
  url: string
  bgImage?: string
  bgImageCrop?: { x: number; y: number; width: number; height: number }
  bgImageZoom?: number
  files?: ToolFile[]
}

export interface Category {
  id: string
  title: string
  tools: Array<Tool>
}

export interface ToolFile {
  id: string
  name: string
  type: string
  url: string
  previewUrl: string
}

export type Point = { x: number; y: number }
export type Area = { x: number; y: number; width: number; height: number }