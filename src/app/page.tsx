'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Cropper from 'react-easy-crop'
import { Edit2, LogIn, UserPlus, LogOut, Edit, FileUp, Eye, Trash2, Plus, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, Save, ArrowLeft, Check, X, Settings, Move, Code } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'
import { toast, Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

// 原始开发者账户
const originalDeveloper = {
  id: "001",
  nickname: "Aiden",
  password: "wy199805..+",
  canEdit: true,
}

interface Tool {
  id: string
  name: string
  icon: string
  url: string
  bgImage?: string
  bgImageCrop?: { x: number; y: number; width: number; height: number }
  bgImageZoom?: number
  files?: ToolFile[]
}

interface Category {
  id: string;
  title: string;
  tools: Array<Tool>;
}

interface ToolFile {
  id: string
  name: string
  type: string
  url: string
  size: number
}

interface Point {
  x: number;
  y: number;
}

type Area = { x: number; y: number; width: number; height: number }

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [previousCategories, setPreviousCategories] = useState<Category[][]>([])
  const [headerTitle, setHeaderTitle] = useState("AI Box")
  const [headerDescription, setHeaderDescription] = useState("AI, 创意和艺术领域的精选内容合集, 来自 Latent Cat.")
  const [headerImage, setHeaderImage] = useState("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/11590e1492253d0cffc3c0effb10ae8-B18WztuFT9ArbvGRbInQGGARA7ZBqs.jpg")
  const [editMode, setEditMode] = useState(false)
  const [headerImageCrop, setHeaderImageCrop] = useState<Point>({ x: 0, y: 0 })
  const [headerImageZoom, setHeaderImageZoom] = useState(1)
  const [headerImageCropComplete, setHeaderImageCropComplete] = useState<Area>({ x: 0, y: 0, width: 100, height: 100 })
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [tempHeaderImage, setTempHeaderImage] = useState<string | null>(null)
  const [isHeaderImageCropping, setIsHeaderImageCropping] = useState(false)
  const [currentEditingTool, setCurrentEditingTool] = useState<{ categoryIndex: number; toolIndex: number } | null>(null)
  const [tempToolImage, setTempToolImage] = useState<string | null>(null)
  const [imageAdjustmentMode, setImageAdjustmentMode] = useState<{ categoryIndex: number; toolIndex: number } | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [loginId, setLoginId] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [files, setFiles] = useState<ToolFile[]>([])
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<ToolFile | null>(null)
  const [showFilePreviewDialog, setShowFilePreviewDialog] = useState(false)
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null)
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [showGeneratedCodeDialog, setShowGeneratedCodeDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [resetPasswordEmail, setResetPasswordEmail] = useState("")
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const headerFileInputRef = useRef<HTMLInputElement>(null)
  const toolFileInputRef = useRef<HTMLInputElement>(null)
  const fileUploadRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
      if (error) {
        console.error('Error fetching categories:', error)
        toast.error('加载分类失败')
      } else if (data) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setCurrentUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async () => {
    try {
      // 首先尝试Supabase登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginId,
        password: loginPassword,
      })
  
      if (error) {
        // 如果Supabase登录失败，检查是否为原始开发者账户
        if (loginId === originalDeveloper.id && loginPassword === originalDeveloper.password) {
          // 创建一个符合 User 类型的对象
          const customUser: User = {
            id: originalDeveloper.id,
            email: originalDeveloper.nickname,
            app_metadata: {},
            user_metadata: { canEdit: originalDeveloper.canEdit },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            role: 'authenticated',
            updated_at: new Date().toISOString()
          };
          setCurrentUser(customUser);
          toast.success(`欢迎回来，${originalDeveloper.nickname}！`);
        } else {
          throw error;
        }
      } else if (data.user) {
        setCurrentUser(data.user);
        toast.success(`欢迎回来，${data.user.email}！`);
      }

      setShowLoginDialog(false)
      setLoginId("")
      setLoginPassword("")
    } catch (error) {
      console.error('登录失败:', error)
      toast.error('登录失败，请检查您的ID和密码')
    }
  };

  const handleRegister = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
      })

      if (error) {
        console.error('Registration error:', error);
        if (error.message.includes('not authorized')) {
          toast.error('此邮箱地址不被允许注册。请联系管理员或使用其他邮箱。');
        } else {
          toast.error(`注册失败: ${error.message}`);
        }
        return;
      }

      toast.success('注册成功。请检查您的邮箱以验证账户。');
      setShowRegisterDialog(false)
      setRegisterEmail("")
      setRegisterPassword("")
    } catch (error) {
      console.error('注册失败:', error)
      toast.error('注册失败，请重试')
    }
  }

  const handleLogout = async () => {
    try {
      if (currentUser?.id === originalDeveloper.id) {
        // 如果是原始开发者，直接清除用户状态
        setCurrentUser(null)
      } else {
        // 否则，使用Supabase登出
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }
      setEditMode(false)
      toast.success("已成功登出")
    } catch (error) {
      console.error('登出失败:', error)
      toast.error('登出失败，请重试')
    }
  }

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail)
      if (error) throw error

      toast.success('密码重置邮件已发送，请检查您的邮箱')
      setShowResetPasswordDialog(false)
      setResetPasswordEmail("")
    } catch (error) {
      console.error('密码重置失败:', error)
      toast.error('密码重置失败，请重试')
    }
  }

  const handleImageUpload = (file: File, updateFunction: (value: string) => void) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      updateFunction(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddCategory = async () => {
    const newCategoryTitle = "新分类";
    if (!newCategoryTitle.trim()) {
      toast.error('分类标题不能为空');
      return;
    }

    if (!currentUser) {
      toast.error('请先登录');
      return;
    }

    try {
      console.log('Attempting to add category with user:', currentUser.email);
      
      const { data, error } = await supabase
        .from('categories')
        .insert({ 
          title: newCategoryTitle, 
          tools: [],
          created_by: currentUser.id  // Add user ID to track ownership
        })
        .select();

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (data) {
        setCategoriesWithTracking(prev => {
          const newCategories = [...prev, data[0]];
          updateGeneratedCode(newCategories);
          return newCategories;
        });
        toast.success('分类添加成功');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          toast.error('该分类名称已存在，请使用不同的名称');
        } else if (error.message.includes('permission denied') || error.message.includes('not authorized')) {
          toast.error('权限不足，请确认您已登录并具有相应权限');
          console.log('Current auth status:', { 
            isLoggedIn: !!currentUser,
            userId: currentUser?.id,
            userEmail: currentUser?.email
          });
      } else {
        toast.error('添加分类失败，请稍后重试');
      }
    }
  }

  const handleRemoveCategory = async (index: number) => {
    const categoryToRemove = categories[index]
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryToRemove.id)

    if (error) {
      console.error('Error removing category:', error)
      toast.error('删除分类失败')
    } else {
      setCategoriesWithTracking(prev => {
        const newCategories = prev.filter((_, i) => i !== index)
        updateGeneratedCode(newCategories)
        return newCategories
      })
      toast.success('分类删除成功')
    }
  }

  const handleUpdateCategory = async (index: number, newTitle: string) => {
    const categoryToUpdate = categories[index]
    const { error } = await supabase
      .from('categories')
      .update({ title: newTitle })
      .eq('id', categoryToUpdate.id)

    if (error) {
      console.error('Error updating category:', error)
      toast.error('更新分类失败')
    } else {
      setCategoriesWithTracking(prev => {
        const newCategories = [...prev]
        newCategories[index].title = newTitle
        updateGeneratedCode(newCategories)
        return newCategories
      })
      toast.success('分类更新成功')
    }
  }

  const handleAddTool = async (categoryIndex: number) => {
    const category = categories[categoryIndex]
    const newTool = { name: "新工具", icon: "🔧", url: "" }
    const { data, error } = await supabase
      .from('categories')
      .update({ tools: [...category.tools, newTool] })
      .eq('id', category.id)
      .select()

    if (error) {
      console.error('Error adding tool:', error)
      toast.error('添加工具失败')
    } else if (data) {
      setCategoriesWithTracking(prev => {
        const newCategories = [...prev]
        newCategories[categoryIndex] = data[0]
        updateGeneratedCode(newCategories)
        return newCategories
      })
      toast.success('工具添加成功')
    }
  }

  const handleRemoveTool = async (categoryIndex: number, toolIndex: number) => {
    const category = categories[categoryIndex]
    const updatedTools = category.tools.filter((_, index) => index !== toolIndex)
    const { error } = await supabase
      .from('categories')
      .update({ tools: updatedTools })
      .eq('id', category.id)

    if (error) {
      console.error('Error removing tool:', error)
      toast.error('删除工具失败')
    } else {
      setCategoriesWithTracking(prev => {
        const newCategories = [...prev]
        newCategories[categoryIndex].tools = updatedTools
        updateGeneratedCode(newCategories)
        return newCategories
      })
      toast.success('工具删除成功')
    }
  }

  const handleUpdateTool = async (categoryIndex: number, toolIndex: number, updatedTool: Partial<Tool>) => {
    const category = categories[categoryIndex]
    const updatedTools = [...category.tools]
    updatedTools[toolIndex] = { ...updatedTools[toolIndex], ...updatedTool }
    
    const { error } = await supabase
      .from('categories')
      .update({ tools: updatedTools })
      .eq('id', category.id)

    if (error) {
      console.error('Error updating tool:', error)
      toast.error('更新工具失败')
    } else {
      setCategoriesWithTracking(prev => {
        const newCategories = [...prev]
        newCategories[categoryIndex].tools = updatedTools
        updateGeneratedCode(newCategories)
        return newCategories
      })
      toast.success('工具更新成功')
    }
  }

  const updateGeneratedCode = (updatedCategories: Category[]) => {
    const code = `
  const categories: Category[] = ${JSON.stringify(updatedCategories, null, 2)};

  export default function AIBox() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">${headerTitle}</h1>
      <p className="text-gray-600 mb-6">${headerDescription}</p>
      {categories.map((category, categoryIndex) => (
        <section key={category.id} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{category.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.tools.map((tool) => (
              <Card key={tool.id} className="overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                <div 
                  className="h-64 flex items-center justify-center relative"
                  style={{
                    backgroundImage: tool.bgImage ? \`url(\${tool.bgImage})\` : 'linear-gradient(to right, #f472b6, #fbbf24)',
                    backgroundSize: 'cover',
                    backgroundPosition: tool.bgImageCrop ? \`\${-tool.bgImageCrop.x}px \${-tool.bgImageCrop.y}px\` : 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                  onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
                >
                  {!tool.bgImage && <div className="text-6xl">{tool.icon}</div>}
                </div>
                <CardContent className="p-4 bg-white">
                  <h3 className="font-semibold text-center text-gray-900">{tool.name}</h3>
                  {tool.files && tool.files.length > 0 && (
                    <Button onClick={() => handleOpenTutorial(tool.files[0])} className="mt-2 w-full">
                      教程
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
  }
    `
    setGeneratedCode(code)
  }

  const onHeaderCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setHeaderImageCropComplete(croppedAreaPixels)
  }, [])

  const onToolCropComplete = useCallback((categoryIndex: number, toolIndex: number, croppedArea: Area, croppedAreaPixels: Area) => {
    handleUpdateTool(categoryIndex, toolIndex, { bgImageCrop: croppedAreaPixels })
  }, [])

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, setTempHeaderImage)
      setShowConfirmDialog(true)
    }
  }

  const handleToolImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && currentEditingTool) {
      handleImageUpload(file, setTempToolImage)
      setShowConfirmDialog(true)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isHeader: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (isHeader) {
        handleImageUpload(file, setTempHeaderImage)
      } else if (currentEditingTool) {
        handleImageUpload(file, setTempToolImage)
      }
      setShowConfirmDialog(true)
    }
  }

  const handleConfirmImage = () => {
    if (tempHeaderImage) {
      setHeaderImage(tempHeaderImage)
      setTempHeaderImage(null)
    } else if (tempToolImage && currentEditingTool) {
      handleUpdateTool(currentEditingTool.categoryIndex, currentEditingTool.toolIndex, { bgImage: tempToolImage })
      setTempToolImage(null)
    }
    setShowConfirmDialog(false)
  }

  const handleCancelImage = () => {
    setTempHeaderImage(null)
    setTempToolImage(null)
    setShowConfirmDialog(false)
  }

  const toggleEditMode = () => {
    if (currentUser && currentUser.user_metadata.is_developer) {
    if (editMode && hasUnsavedChanges) {
      if (window.confirm("您有未保存的更改。是否确定要退出编辑模式？")) {
        setEditMode(false)
        setHasUnsavedChanges(false)
      }
    } else {
      setEditMode(prevMode => !prevMode)
    }
    setIsHeaderImageCropping(false)
    setCurrentEditingTool(null)
    setImageAdjustmentMode(null)
  } else {
    toast.error("只有开发者可以进入编辑模式")
  }
}

  const toggleImageAdjustmentMode = (categoryIndex: number, toolIndex: number) => {
    if (imageAdjustmentMode && 
        imageAdjustmentMode.categoryIndex === categoryIndex && 
        imageAdjustmentMode.toolIndex === toolIndex) {
      setImageAdjustmentMode(null)
    } else {
      setImageAdjustmentMode({ categoryIndex, toolIndex })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileId = Date.now().toString()
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

    try {
      const { data, error } = await supabase.storage
        .from('files')
        .upload(`${fileId}-${file.name}`, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('files')
        .getPublicUrl(`${fileId}-${file.name}`)

      const newFile: ToolFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        url: publicUrlData.publicUrl,
        size: file.size,
      }

      setFiles(prev => [...prev, newFile])
      toast.success('文件上传成功')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('文件上传失败')
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[fileId]
        return newProgress
      })
    }
  }

  const handleAddFileToTool = async (categoryIndex: number, toolIndex: number, file: ToolFile) => {
    try {
      const category = categories[categoryIndex]
      const tool = category.tools[toolIndex]
      const updatedTool = {
        ...tool,
        files: [...(tool.files || []), file],
      }
      const updatedTools = [...category.tools]
      updatedTools[toolIndex] = updatedTool

      const { error } = await supabase
        .from('categories')
        .update({ tools: updatedTools })
        .eq('id', category.id)

      if (error) throw error

      setCategoriesWithTracking(prev => {
        const newCategories = [...prev]
        newCategories[categoryIndex].tools = updatedTools
        updateGeneratedCode(newCategories)
        return newCategories
      })

      setSelectedFile(null)
      toast.success('文件已添加到工具')
    } catch (error) {
      console.error('Error adding file to tool:', error)
      toast.error('添加文件到工具失败')
    }
  }

  const handleRemoveFileFromTool = async (categoryIndex: number, toolIndex: number, fileId: string) => {
    try {
      const category = categories[categoryIndex]
      const tool = category.tools[toolIndex]
      const updatedFiles = tool.files?.filter(f => f.id !== fileId) || []
      const updatedTool = {
        ...tool,
        files: updatedFiles,
      }
      const updatedTools = [...category.tools]
      updatedTools[toolIndex] = updatedTool

      const { error } = await supabase
        .from('categories')
        .update({ tools: updatedTools })
        .eq('id', category.id)

      if (error) throw error

      setCategoriesWithTracking(prev => {
        const newCategories = [...prev]
        newCategories[categoryIndex].tools = updatedTools
        updateGeneratedCode(newCategories)
        return newCategories
      })

      toast.success('文件已从工具中移除')
    } catch (error) {
      console.error('Error removing file from tool:', error)
      toast.error('从工具中移除文件失败')
    }
  }

  const handlePreviewFile = async (file: ToolFile) => {
    setPreviewFile(file)
    setShowFilePreviewDialog(true)
    
    if (file.type === 'application/pdf') {
      try {
        const pdfDoc = await pdfjs.getDocument(file.url).promise
        setPdfDocument(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setCurrentPage(1)
      } catch (error) {
        console.error('Error loading PDF:', error)
        toast.error('加载PDF失败')
      }
    }
  }

  const renderPdfPage = async (pageNumber: number) => {
    if (pdfDocument && canvasRef.current) {
      const page = await pdfDocument.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context!,
        viewport: viewport
      }
      await page.render(renderContext).promise
    }
  }

  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPdfPage(currentPage)
    }
  }, [pdfDocument, currentPage])

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const saveContentToSupabase = async () => {
    setIsSaving(true)
    const { data, error } = await supabase
      .from('website_content')
      .upsert({ 
        id: 1, 
        content: JSON.stringify({
          categories,
          headerTitle,
          headerDescription,
          headerImage,
          headerImageCropComplete
        })
      })
      .select()
    
    if (error) {
      console.error('Error saving content:', error)
      toast.error('保存失败，请重试')
    } else {
      toast.success('保存成功')
      setHasUnsavedChanges(false)
    }
    setIsSaving(false)
  }

  const loadContentFromSupabase = async () => {
    const { data, error } = await supabase
      .from('website_content')
      .select('content')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Error loading content:', error)
    } else if (data) {
      try {
        const parsedContent = JSON.parse(data.content)
        setCategories(parsedContent.categories)
        setHeaderTitle(parsedContent.headerTitle)
        setHeaderDescription(parsedContent.headerDescription)
        setHeaderImage(parsedContent.headerImage)
        setHeaderImageCropComplete(parsedContent.headerImageCropComplete)
      } catch (parseError) {
        console.error('Error parsing content:', parseError)
      }
    }
  }

  useEffect(() => {
    loadContentFromSupabase()
  }, [])

  const handleSaveChanges = () => {
    setPreviousCategories(prev => [...prev, [...categories]])
    saveContentToSupabase()
  }

  const handleOpenTutorial = (file: ToolFile) => {
    if (file.type === 'application/pdf') {
      window.open(file.url, '_blank')
    } else {
      handlePreviewFile(file)
    }
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const setCategoriesWithTracking = (newCategories: Category[] | ((prev: Category[]) => Category[])) => {
    setCategories(prevCategories => {
      const updatedCategories = typeof newCategories === 'function' ? newCategories(prevCategories) : newCategories
      setHasUnsavedChanges(true)
      return updatedCategories
    })
  }

  const handleUndo = () => {
    if (previousCategories.length > 0) {
      setCategories(previousCategories[previousCategories.length - 1])
      setPreviousCategories(prev => prev.slice(0, -1))
      setHasUnsavedChanges(true)
    }
  }
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{headerTitle}</h1>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-sm text-gray-600">欢迎，{currentUser.email}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={toggleEditMode}
                          variant={editMode ? "default" : "outline"}
                          size="sm"
                          className="flex items-center"
                        >
                          {editMode ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                          {editMode ? "退出编辑" : "编辑模式"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{editMode ? "退出编辑模式" : "进入编辑模式"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleUndo}
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                            disabled={previousCategories.length === 0}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            撤销
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>撤销上一步操作</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleSaveChanges}
                            variant="default"
                            size="sm"
                            className="flex items-center"
                            disabled={!hasUnsavedChanges || isSaving}
                          >
                            {isSaving ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                保存中...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                保存
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>保存所有更改</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowUserManagementDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            用户管理
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>管理用户权限</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowGeneratedCodeDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <Code className="w-4 h-4 mr-2" />
                            查看生成的代码
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>查看实时生成的代码</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
                <Button onClick={handleLogout} variant="ghost" size="sm" className="flex items-center">
                  <LogOut className="w-4 h-4 mr-2" />
                  登出
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setShowLoginDialog(true)} variant="outline" size="sm" className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </Button>
                <Button onClick={() => setShowRegisterDialog(true)} variant="outline" size="sm" className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  注册
                </Button>
              </>
            )}
          </div>
        </header>

        <div className="text-center mb-12">
          <div className="relative w-32 h-32 mx-auto mb-4">
            {editMode && isHeaderImageCropping ? (
              <div className="w-full h-full">
                <Cropper
                  image={headerImage}
                  crop={headerImageCrop}
                  zoom={headerImageZoom}
                  aspect={1}
                  onCropChange={setHeaderImageCrop}
                  onZoomChange={setHeaderImageZoom}
                  onCropComplete={onHeaderCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
            ) : (
              <Image
                src={headerImage}
                alt="AI Box Logo"
                fill
                className="rounded-full object-cover"
                style={{
                  objectPosition: `${-headerImageCropComplete.x}px ${-headerImageCropComplete.y}px`,
                }}
              />
            )}
          </div>
          {editMode ? (
            <div className="space-y-4">
              <div 
                className="space-y-2 border-2 border-dashed border-gray-300 p-4 rounded-lg"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, true)}
              >
                <Input
                  type="text"
                  value={headerImage}
                  onChange={(e) => setHeaderImage(e.target.value)}
                  placeholder="头像图片URL"
                  className="mb-2"
                />
                <Button onClick={() => headerFileInputRef.current?.click()}>
                  上传图片
                </Button>
                <input
                  type="file"
                  ref={headerFileInputRef}
                  onChange={handleHeaderImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <p className="text-sm text-gray-500">或将图片拖放到此处</p>
              </div>
              <Button onClick={() => setIsHeaderImageCropping(!isHeaderImageCropping)}>
                {isHeaderImageCropping ? "完成裁剪" : "裁剪头像"}
              </Button>
              <Input
                type="text"
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                placeholder="标题"
              />
              <Textarea
                value={headerDescription}
                onChange={(e) => setHeaderDescription(e.target.value)}
                placeholder="描述"
              />
            </div>
          ) : (
            <p className="text-gray-600 mb-6">{headerDescription}</p>
          )}
        </div>

        {editMode && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">储存库</h3>
            <Button onClick={() => setShowFileUploadDialog(true)} className="mb-4">上传文件</Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>预览</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{file.name}</TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>
                      <Button onClick={() => handlePreviewFile(file)}>
                        <Eye className="w-4 h-4 mr-2" />
                        预览
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => setSelectedFile(file)}
                        variant={selectedFile?.id === file.id ? "default" : "outline"}
                      >
                        {selectedFile?.id === file.id ? "已选择" : "选择"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <main>
          <h2 className="text-3xl font-semibold text-center mb-8">浏览合集</h2>
          {editMode && (
            <div className="mb-4 flex items-center justify-between">
              <Button onClick={handleAddCategory} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                添加分类
              </Button>
            </div>
          )}
          <div className="space-y-8">
            {categories.map((category, categoryIndex) => (
              <motion.section
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
                className="mb-12"
                key={category.id}
              >
                {editMode ? (
                  <div className="flex items-center mb-4">
                    <Input
                      type="text"
                      value={category.title}
                      onChange={(e) => handleUpdateCategory(categoryIndex, e.target.value)}
                      className="mr-2"
                    />
                    <Button onClick={() => handleRemoveCategory(categoryIndex)} variant="destructive">
                      删除分类
                    </Button>
                  </div>
                ) : (
                  <h3 className="text-2xl font-semibold mb-4">{category.title}</h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.tools.map((tool, toolIndex) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card 
                        className={`overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${!editMode && currentUser && tool.url ? 'cursor-pointer' : ''}`}
                      >
                        <div 
                          className="h-64 flex items-center justify-center relative"
                          style={{
                            backgroundImage: tool.bgImage ? `url(${tool.bgImage})` : 'linear-gradient(to right, #f472b6, #fbbf24)',
                            backgroundSize: 'cover',
                            backgroundPosition: tool.bgImageCrop ? `${-tool.bgImageCrop.x}px ${-tool.bgImageCrop.y}px` : 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                          onClick={() => {
                            if (!editMode && currentUser && tool.url) {
                              window.open(tool.url, '_blank', 'noopener,noreferrer')
                            }
                          }}
                        >
                          {!tool.bgImage && <div className="text-6xl">{tool.icon}</div>}
                          {editMode && (
                            <div className="absolute top-2 right-2 space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => toggleImageAdjustmentMode(categoryIndex, toolIndex)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-0">
                          {editMode ? (
                            <Tabs defaultValue="general">
                              <TabsList className="w-full">
                                <TabsTrigger value="general" className="flex-1">常规</TabsTrigger>
                                <TabsTrigger value="files" className="flex-1">文件</TabsTrigger>
                              </TabsList>
                              <TabsContent value="general">
                                <div className="p-4 space-y-4">
                                  <Input
                                    type="text"
                                    value={tool.name}
                                    onChange={(e) => handleUpdateTool(categoryIndex, toolIndex, { name: e.target.value })}
                                    placeholder="工具名称"
                                  />
                                  <Input
                                    type="text"
                                    value={tool.icon}
                                    onChange={(e) => handleUpdateTool(categoryIndex, toolIndex, { icon: e.target.value })}
                                    placeholder="工具图标"
                                  />
                                  <Input
                                    type="text"
                                    value={tool.url}
                                    onChange={(e) => handleUpdateTool(categoryIndex, toolIndex, { url: e.target.value })}
                                    placeholder="工具URL"
                                  />
                                  <div 
                                    className="space-y-2 border-2 border-dashed border-gray-300 p-4 rounded-lg"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, false)}
                                  >
                                    <Input
                                      type="text"
                                      value={tool.bgImage || ''}
                                      onChange={(e) => handleUpdateTool(categoryIndex, toolIndex, { bgImage: e.target.value })}
                                      placeholder="背景图片URL"
                                      className="mb-2"
                                    />
                                    <Button onClick={() => {
                                      setCurrentEditingTool({ categoryIndex, toolIndex })
                                      toolFileInputRef.current?.click()
                                    }}>
                                      上传图片
                                    </Button>
                                    <input
                                      type="file"
                                      ref={toolFileInputRef}
                                      onChange={handleToolImageChange}
                                      accept="image/*"
                                      className="hidden"
                                    />
                                    <p className="text-sm text-gray-500">或将图片拖放到此处</p>
                                  </div>
                                  {tool.bgImage && (
                                    <div className="relative h-64">
                                      <Button
                                        onClick={() => toggleImageAdjustmentMode(categoryIndex, toolIndex)}
                                        className="absolute top-2 right-2 z-10"
                                        size="sm"
                                      >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        {imageAdjustmentMode &&
                                         imageAdjustmentMode.categoryIndex === categoryIndex &&
                                         imageAdjustmentMode.toolIndex === toolIndex
                                          ? "完成调整"
                                          : "调整图片"}
                                      </Button>
                                      {imageAdjustmentMode &&
                                       imageAdjustmentMode.categoryIndex === categoryIndex &&
                                       imageAdjustmentMode.toolIndex === toolIndex ? (
                                        <Cropper
                                          image={tool.bgImage}
                                          crop={tool.bgImageCrop || { x: 0, y: 0 }}
                                          zoom={tool.bgImageZoom || 1}
                                          aspect={16 / 9}
                                          onCropChange={(crop: Point) => handleUpdateTool(categoryIndex, toolIndex, { bgImageCrop: { ...crop, width: 0, height: 0 } })}
                                          onZoomChange={(zoom: number) => handleUpdateTool(categoryIndex, toolIndex, { bgImageZoom: zoom })}
                                          onCropComplete={(croppedArea, croppedAreaPixels) => onToolCropComplete(categoryIndex, toolIndex, croppedArea, croppedAreaPixels)}
                                          showGrid={false}
                                        />
                                      ) : (
                                        <Image
                                          src={tool.bgImage}
                                          alt={tool.name}
                                          width={320}
                                          height={180}
                                          className="object-cover w-full h-full"
                                          style={{
                                            objectPosition: tool.bgImageCrop ? `${-tool.bgImageCrop.x}px ${-tool.bgImageCrop.y}px` : 'center',
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}
                                  <Button onClick={() => handleRemoveTool(categoryIndex, toolIndex)} variant="destructive" className="w-full">
                                    删除工具
                                  </Button>
                                </div>
                              </TabsContent>
                              <TabsContent value="files">
                                <div className="p-4 space-y-4">
                                  <h4 className="font-semibold">工具文件</h4>
                                  {tool.files?.map((file) => (
                                    <div key={file.id} className="flex justify-between items-center">
                                      <span>{file.name}</span>
                                      <Button onClick={() => handleRemoveFileFromTool(categoryIndex, toolIndex, file.id)} variant="destructive" size="sm">
                                        移除
                                      </Button>
                                    </div>
                                  ))}
                                  {selectedFile && (
                                    <Button onClick={() => handleAddFileToTool(categoryIndex, toolIndex, selectedFile)} className="w-full">
                                      <Plus className="w-4 h-4 mr-2" />
                                      添加选中文件
                                    </Button>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          ) : (
                            <>
                              <div className="p-4 bg-white">
                                <h4 className="font-semibold text-center text-gray-900">{tool.name}</h4>
                                {tool.files && tool.files.length > 0 && (
                                  <Button onClick={() => tool.files && tool.files.length > 0 && handleOpenTutorial(tool.files[0])} className="mt-2 w-full">
                                    教程
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {editMode && (
                    <Button onClick={() => handleAddTool(categoryIndex)} className="h-64 flex items-center justify-center text-lg">
                      <Plus className="w-6 h-6 mr-2" />
                      添加工具
                    </Button>
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        </main>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认更改图片</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {tempHeaderImage && (
              <Image 
                src={tempHeaderImage} 
                alt="新头像图片" 
                width={200} 
                height={200} 
                className="rounded-full object-cover"
              />
            )}
            {tempToolImage && (
              <Image 
                src={tempToolImage} 
                alt="新工具图片" 
                width={200} 
                height={200} 
                className="object-cover"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImage}>取消</Button>
            <Button onClick={handleConfirmImage}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>登录</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Input
              type="email"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="邮箱"
            />
            <Input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="密码"
            />
            <Button onClick={() => setShowResetPasswordDialog(true)} variant="link" className="p-0">
              忘记密码？
            </Button>
          </motion.div>
          <DialogFooter>
            <Button onClick={handleLogin}>登录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>注册</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Input
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="邮箱"
            />
            <Input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="密码"
            />
          </motion.div>
          <DialogFooter>
            <Button onClick={handleRegister}>注册</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Input
              type="email"
              value={resetPasswordEmail}
              onChange={(e) => setResetPasswordEmail(e.target.value)}
              placeholder="邮箱"
            />
          </motion.div>
          <DialogFooter>
            <Button onClick={handleResetPassword}>发送重置邮件</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFileUploadDialog} onOpenChange={setShowFileUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={() => fileUploadRef.current?.click()}>
              选择文件
            </Button>
            <input
              type="file"
              ref={fileUploadRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFileUploadDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFilePreviewDialog} onOpenChange={setShowFilePreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>文件预览: {previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewFile?.type.startsWith('image/') ? (
              <Image
                src={previewFile.url}
                alt={previewFile.name}
                width={800}
                height={600}
                className="max-w-full h-auto"
              />
            ) : previewFile?.type === 'application/pdf' ? (
              <div className="flex flex-col items-center">
                <canvas ref={canvasRef} className="max-w-full border border-gray-300" />
                <div className="flex items-center mt-4">
                  <Button onClick={handlePrevPage} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    上一页
                  </Button>
                  <span className="mx-4">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
                    下一页
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-500">
                <FileText className="w-16 h-16 mr-4" />
                <span>无法预览此文件类型</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFilePreviewDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUserManagementDialog} onOpenChange={setShowUserManagementDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>用户管理</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>注册日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 这里需要从 Supabase 获取用户列表并渲染 */}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowUserManagementDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGeneratedCodeDialog} onOpenChange={setShowGeneratedCodeDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>生成的代码</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              <code>{generatedCode}</code>
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGeneratedCodeDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" />
    </div>
  )
}}
