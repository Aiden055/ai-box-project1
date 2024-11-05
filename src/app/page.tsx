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
import LZString from 'lz-string'
import { toast, Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

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
  tools: Array<{
    id: string;
    name: string;
    icon: string;
    url: string;
    bgImage?: string;
    bgImageCrop?: { x: number; y: number; width: number; height: number };
    bgImageZoom?: number;
    files?: ToolFile[];
  }>;
}

interface User {
  id: string
  nickname: string
  password: string
  canEdit: boolean
  realName: string
  isVerified: boolean
  isDeleted: boolean
  registrationDate: string
}

interface ToolFile {
  id: string
  name: string
  type: string
  url: string
  previewUrl: string
}

interface Point {
  x: number;
  y: number;
}

type Area = { x: number; y: number; width: number; height: number }

const initialCategories: Category[] = [
  {
    id: "1",
    title: "AI图像处理工具",
    tools: [
      { id: "1", name: "AI扩图工具", icon: "🖼️", url: "https://huggingface.co/spaces/fffiloni/diffusers-image-outpaint", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-jhAcAV4iP8BQUfEd0ahra0cTvd7UZO.png" },
      { id: "2", name: "AI高清工具", icon: "🧠", url: "https://huggingface.co/spaces/finegrain/finegrain-image-enhancer", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-dhkwKYaZyBZ9k3GOdPZmNLAZOjAPtx.png" },
      { id: "3", name: "AI抠图工具", icon: "✂️", url: "https://huggingface.co/spaces/not-lain/background-removal", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rTXnHaycoyKqnCQIPaWjDnUAEWmtu4.png" },
    ]
  },
  {
    id: "2",
    title: "AI热门应用",
    tools: [
      { id: "4", name: "Midjourney", icon: "🎨", url: "https://www.midjourney.com/home", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EG9C1ojbTvnH4Ci0mWXGj0ST8yPUXO.png" },
      { id: "5", name: "哩布哩布AI", icon: "🖌️", url: "https://www.liblib.art/", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-lMS5uF8dumxNal4fjR9PPhPmqidFke.png" },
      { id: "6", name: "PromeAI", icon: "🤖", url: "https://www.promeai.pro/", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-u7grHA3PMZnCM7jWodDKQpMB5R6t1k.png" },
      { id: "7", name: "WHEE", icon: "🌀", url: "https://www.whee.com/", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-mjY9Giiy4Mw0G5IcAjCDk6EBRLwRzH.png" },
      { id: "8", name: "Canva", icon: "🎨", url: "https://www.canva.com/", bgImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-T9VwZPUrse1IwGYqODXrOxUcBVElfv.png" },
    ]
  },
  {
    id: "3",
    title: "语言类AI辅助工具",
    tools: [
      { id: "9", name: "Midjourney图像提示词生成", icon: "🖼️", url: "" },
      { id: "10", name: "Midjourney产品提示词生成", icon: "🏷️", url: "" },
      { id: "11", name: "专业翻译", icon: "🌐", url: "" },
    ]
  },
  {
    id: "4",
    title: "Stable Diffusion教程",
    tools: [
      { id: "12", name: "Stable Diffusion WebUI入门教程", icon: "📚", url: "" },
      { id: "13", name: "Stable Diffusion WebUI 进阶教程 ControlNET", icon: "🔧", url: "" },
      { id: "14", name: "Stable Diffusion WebUI 进阶教程（二） ControlNET实战演练", icon: "🎓", url: "" },
    ]
  },
]

const initialUsers: User[] = [
  { 
    id: "001", 
    nickname: "Aiden", 
    password: "wy199805..+", 
    canEdit: true, 
    realName: "Aiden Developer", 
    isVerified: true, 
    isDeleted: false,
    registrationDate: new Date().toISOString()
  },
]

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [previousCategories, setPreviousCategories] = useState<Category[][]>([]);
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
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [loginId, setLoginId] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerId, setRegisterId] = useState("")
  const [registerNickname, setRegisterNickname] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerRealName, setRegisterRealName] = useState("")
  const [files, setFiles] = useState<ToolFile[]>([])
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<ToolFile | null>(null)
  const [showFilePreviewDialog, setShowFilePreviewDialog] = useState(false)
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null)
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [showGeneratedCodeDialog, setShowGeneratedCodeDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const headerFileInputRef = useRef<HTMLInputElement>(null)
  const toolFileInputRef = useRef<HTMLInputElement>(null)
  const fileUploadRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const savedCategoriesCompressed = localStorage.getItem('savedCategories');
    const savedUsersCompressed = localStorage.getItem('savedUsers');
    if (savedCategoriesCompressed) {
      try {
        const decompressed = LZString.decompressFromUTF16(savedCategoriesCompressed);
        setCategories(JSON.parse(decompressed));
      } catch (error) {
        console.error('Error decompressing categories:', error);
      }
    }
    if (savedUsersCompressed) {
      try {
        const decompressed = LZString.decompressFromUTF16(savedUsersCompressed);
        setUsers(JSON.parse(decompressed));
      } catch (error) {
        console.error('Error decompressing users:', error);
      }
    }
  }, []);

  const handleImageUpload = (file: File, updateFunction: (value: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      updateFunction(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCategory = () => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev, { id: Date.now().toString(), title: "新分类", tools: [] }];
      updateGeneratedCode(newCategories);
      return newCategories;
    });
  }

  const handleRemoveCategory = (index: number) => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev];
      newCategories.splice(index, 1);
      updateGeneratedCode(newCategories);
      return newCategories;
    });
  }

  const handleUpdateCategory = (index: number, newTitle: string) => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev];
      newCategories[index].title = newTitle;
      updateGeneratedCode(newCategories);
      return newCategories;
    });
  }

  const handleAddTool = (categoryIndex: number) => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev];
      newCategories[categoryIndex].tools.push({ id: Date.now().toString(), name: "新工具", icon: "🔧", url: "" });
      updateGeneratedCode(newCategories);
      return newCategories;
    });
  }

  const handleRemoveTool = (categoryIndex: number, toolIndex: number) => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev];
      newCategories[categoryIndex].tools.splice(toolIndex, 1);
      updateGeneratedCode(newCategories);
      return newCategories;
    });
  }

  const handleUpdateTool = (categoryIndex: number, toolIndex: number, updatedTool: Partial<Tool>) => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev];
      
      newCategories[categoryIndex].tools[toolIndex] = {
        ...newCategories[categoryIndex].tools[toolIndex],
        ...updatedTool,
        bgImageCrop: updatedTool.bgImageCrop || newCategories[categoryIndex].tools[toolIndex].bgImageCrop,
        bgImageZoom: updatedTool.bgImageZoom || newCategories[categoryIndex].tools[toolIndex].bgImageZoom,
      };
      updateGeneratedCode(newCategories);
      return newCategories;
    });
  };

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
    `;
    setGeneratedCode(code);
  };

  const onHeaderCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setHeaderImageCropComplete(croppedAreaPixels)
  }, [])

  const onToolCropComplete = useCallback((categoryIndex: number, toolIndex: number, croppedArea: Area, croppedAreaPixels: Area) => {
    handleUpdateTool(categoryIndex, toolIndex, { bgImageCrop: croppedAreaPixels })
  }, [])

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, setTempHeaderImage);
      setShowConfirmDialog(true);
    }
  };

  const handleToolImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentEditingTool) {
      handleImageUpload(file, setTempToolImage);
      setShowConfirmDialog(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isHeader: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (isHeader) {
        handleImageUpload(file, setTempHeaderImage);
      } else if (currentEditingTool) {
        handleImageUpload(file, setTempToolImage);
      }
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmImage = () => {
    if (tempHeaderImage) {
      setHeaderImage(tempHeaderImage);
      setTempHeaderImage(null);
    } else if (tempToolImage && currentEditingTool) {
      handleUpdateTool(currentEditingTool.categoryIndex, currentEditingTool.toolIndex, { bgImage: tempToolImage });
      setTempToolImage(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelImage = () => {
    setTempHeaderImage(null);
    setTempToolImage(null);
    setShowConfirmDialog(false);
  };

  const toggleEditMode = () => {
    if (currentUser && currentUser.canEdit) {
      if (editMode && hasUnsavedChanges) {
        if (window.confirm("您有未保存的更改。是否确定要退出编辑模式？")) {
          setEditMode(false);
          setHasUnsavedChanges(false);
        }
      } else {
        setEditMode(prevMode => !prevMode);
      }
      setIsHeaderImageCropping(false);
      setCurrentEditingTool(null);
      setImageAdjustmentMode(null);
    }
  };

  const toggleImageAdjustmentMode = (categoryIndex: number, toolIndex: number) => {
    if (imageAdjustmentMode && 
        imageAdjustmentMode.categoryIndex === categoryIndex && 
        imageAdjustmentMode.toolIndex === toolIndex) {
      setImageAdjustmentMode(null);
    } else {
      setImageAdjustmentMode({ categoryIndex, toolIndex });
    }
  };

  const handleRegister = () => {
    if (users.some(u => u.id === registerId)) {
      toast.error("用户ID已存在");
      return;
    }
    const newUser: User = {
      id: registerId,
      nickname: registerNickname,
      password: registerPassword,
      canEdit: false,
      realName: registerRealName,
      isVerified: false,
      isDeleted: false,
      registrationDate: new Date().toISOString()
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    setShowRegisterDialog(false);
    setRegisterId("");
    setRegisterNickname("");
    setRegisterPassword("");
    setRegisterRealName("");
    toast.success("注册成功。请等待管理员验证后登录。");
  };

  const handleLogin = () => {
    const user = users.find(u => u.id === loginId && u.password === loginPassword);
    if (user) {
      if (user.isDeleted) {
        toast.error("此账号已被删除。请联系管理员。");
        return;
      }
      if (!user.isVerified) {
        toast.error("您的账号尚未通过验证。请等待管理员验证。");
        return;
      }
      setCurrentUser(user);
      setShowLoginDialog(false);
      setLoginId("");
      setLoginPassword("");
      toast.success(`欢迎回来，${user.nickname}！`);
    } else {
      toast.error("用户ID或密码错误");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEditMode(false);
    toast.success("已成功登出");
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, isDeleted: true } : user
    ));
    toast.success("用户已被删除");
  };

  const toggleUserEditAccess = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, canEdit: !user.canEdit } : user
    ));
    toast.success("用户编辑权限已更新");
  };

  const toggleUserVerification = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, isVerified: !user.isVerified } : user
    ));
    toast.success("用户验证状态已更新");
  };

  const canUseWebsite = (user: User | null) => {
    return user && user.isVerified && !user.isDeleted;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFile: ToolFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
          previewUrl: event.target?.result as string,
        };
        setFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFileToTool = (categoryIndex: number, toolIndex: number, file: ToolFile) => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev];
      const tool = newCategories[categoryIndex].tools[toolIndex];
      tool.files = [...(tool.files || []), file];
      updateGeneratedCode(newCategories);
      return newCategories;
    });
    setSelectedFile(null);
  };

  const handleRemoveFileFromTool = (categoryIndex: number, toolIndex: number, fileId: string) => {
    setCategoriesWithTracking(prev => {
      const newCategories = [...prev];
      const tool = newCategories[categoryIndex].tools[toolIndex];
      tool.files = tool.files?.filter(f => f.id !== fileId) || [];
      updateGeneratedCode(newCategories);
      return newCategories;
    });
  };

  const handlePreviewFile = async (file: ToolFile) => {
    setPreviewFile(file);
    setShowFilePreviewDialog(true);
    
    if (file.type === 'application/pdf') {
      window.open(file.url, '_blank');
    } else if (file.type.startsWith('image/')) {
      // 图片预览保持不变
    } else {
      // 对于其他类型的文件，可以添加适当的预览逻辑
      console.log('Unsupported file type for preview');
    }
  };

  const renderPdfPage = async (pageNumber: number) => {
    if (pdfDocument && canvasRef.current) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context!,
        viewport: viewport
      };
      await page.render(renderContext).promise;
    }
  };

  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPdfPage(currentPage);
    }
  }, [pdfDocument, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const saveContentToSupabase = async () => {
    setIsSaving(true);
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
      .select();
    
    if (error) {
      console.error('Error saving content:', error);
      toast.error('保存失败，请重试');
    } else {
      toast.success('保存成功');
      setHasUnsavedChanges(false);
    }
    setIsSaving(false);
  };

  const loadContentFromSupabase = async () => {
    const { data, error } = await supabase
      .from('website_content')
      .select('content')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error loading content:', error);
    } else if (data) {
      try {
        const parsedContent = JSON.parse(data.content);
        setCategories(parsedContent.categories);
        setHeaderTitle(parsedContent.headerTitle);
        setHeaderDescription(parsedContent.headerDescription);
        setHeaderImage(parsedContent.headerImage);
        setHeaderImageCropComplete(parsedContent.headerImageCropComplete);
      } catch (parseError) {
        console.error('Error parsing content:', parseError);
      }
    }
  };

  useEffect(() => {
    loadContentFromSupabase();
  }, []);

  const handleSaveChanges = () => {
    setPreviousCategories(prev => [...prev, [...categories]]);
    saveContentToSupabase();
  };

  const handleOpenTutorial = (file: ToolFile) => {
    if (file.type === 'application/pdf') {
      window.open(file.url, '_blank');
    } else {
      handlePreviewFile(file);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const setCategoriesWithTracking = (newCategories: Category[] | ((prev: Category[]) => Category[])) => {
    setCategories(prevCategories => {
      const updatedCategories = typeof newCategories === 'function' ? newCategories(prevCategories) : newCategories;
      setHasUnsavedChanges(true);
      return updatedCategories;
    });
  };

  const handleUndo = () => {
    if (previousCategories.length > 0) {
      setCategories(previousCategories[previousCategories.length - 1]);
      setPreviousCategories(prev => prev.slice(0, -1));
      setHasUnsavedChanges(true);
    }
  };

  useEffect(() => {
    try {
      const compressedCategories = LZString.compressToUTF16(JSON.stringify(categories));
      const compressedUsers = LZString.compressToUTF16(JSON.stringify(users));
      localStorage.setItem('savedCategories', compressedCategories);
      localStorage.setItem('savedUsers', compressedUsers);
    } catch (error) {
      console.error('Error compressing data:', error);
    }
  }, [categories, users]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{headerTitle}</h1>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-sm text-gray-600">欢迎，{currentUser.nickname}</span>
                {currentUser.canEdit && (
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
                {editMode && (
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
            <div               className="space-y-4">
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
                        className={`overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${!editMode && canUseWebsite(currentUser) && tool.url ? 'cursor-pointer' : ''}`}
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
                            if (!editMode && canUseWebsite(currentUser) && tool.url) {
                              window.open(tool.url, '_blank', 'noopener,noreferrer');
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
                                      setCurrentEditingTool({ categoryIndex, toolIndex });
                                      toolFileInputRef.current?.click();
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
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="用户ID"
            />
            <Input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="密码"
            />
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
              type="text"
              value={registerId}
              onChange={(e) => setRegisterId(e.target.value)}
              placeholder="用户ID"
            />
            <Input
              type="text"
              value={registerNickname}
              onChange={(e) => setRegisterNickname(e.target.value)}
              placeholder="昵称"
            />
            <Input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="密码"
            />
            <Input
              type="text"
              value={registerRealName}
              onChange={(e) => setRegisterRealName(e.target.value)}
              placeholder="真实姓名"
            />
          </motion.div>
          <DialogFooter>
            <Button onClick={handleRegister}>注册</Button>
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
                src={previewFile.previewUrl}
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
                  <TableHead>ID</TableHead>
                  <TableHead>昵称</TableHead>
                  <TableHead>真实姓名</TableHead>
                  <TableHead>注册日期</TableHead>
                  <TableHead>已验证</TableHead>
                  <TableHead>可编辑</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter(user => !user.isDeleted).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.nickname}</TableCell>
                    <TableCell>{user.realName}</TableCell>
                    <TableCell>{new Date(user.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => toggleUserVerification(user.id)}
                        variant={user.isVerified ? "default" : "outline"}
                        size="sm"
                      >
                        {user.isVerified ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={user.canEdit}
                        onCheckedChange={() => toggleUserEditAccess(user.id)}
                        disabled={user.id === "001"}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        variant="destructive"
                        size="sm"
                        disabled={user.id === "001"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
}