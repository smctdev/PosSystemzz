"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Plus, Minus, ShoppingCart, X, LogOut, Trash2, PackagePlus, CheckCircle2, Edit, Printer, History, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { withRole } from "@/components/hoc";
import type { User } from "@/lib/api/types";

// Store information for receipts
const STORE_INFO = {
  name: "AJT Store",
  address: "UB Main Street",
  phone: "(123) 456-7890",
};

import { apiService } from "@/lib/api/apiService";
import type { Product, CartItem, Transaction } from "@/lib/api/types";

interface KitchenOrder {
  id: string;
  receiptNumber: string;
  customerName: string;
  items: CartItem[];
  total: number;
  timestamp: number;
  time: string;
  date: string;
  status: "preparing" | "completed";
}

interface ProductCardProps {
  product: Product;
  cartItem: CartItem | undefined;
  inStock: boolean;
  onAddToCart: (quantity: number) => void;
  onEdit: (product: Product) => void;
}

function ProductCard({ product, cartItem, inStock, onAddToCart, onEdit }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Product Image */}
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
            <img
              src={(product as any).image || "https://via.placeholder.com/400x400?text=No+Image"}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.currentTarget.src = "https://via.placeholder.com/400x400?text=No+Image";
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">₱{product.price.toFixed(2)}</p>
              <Badge
                variant={inStock ? "secondary" : "destructive"}
                className="mt-1"
              >
                {inStock ? `Stock: ${product.stock}` : "Out of Stock"}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={!inStock || quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(val, product.stock)));
                }}
                className="w-20 text-center"
                disabled={!inStock}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={!inStock || quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => {
                onAddToCart(quantity);
                setQuantity(1);
              }}
              disabled={!inStock}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              {cartItem ? `Add ${quantity} More` : `Add ${quantity} to Cart`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CashierPage({ user }: { user?: User }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isCheckoutSuccessOpen, setIsCheckoutSuccessOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [isVoidSuccessOpen, setIsVoidSuccessOpen] = useState(false);
  const [isVoidPasswordDialogOpen, setIsVoidPasswordDialogOpen] = useState(false);
  const [voidPassword, setVoidPassword] = useState("");
  const [voidPasswordError, setVoidPasswordError] = useState("");
  const [voidingIndex, setVoidingIndex] = useState<number | null>(null);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [purchaseHistory, setPurchaseHistory] = useState<Transaction[]>([]);
  const [receiptData, setReceiptData] = useState<{
    items: CartItem[];
    customerName: string;
    total: number;
    receiptNumber: string;
    date: string;
    time: string;
  } | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
  });
  const [newProductImagePreview, setNewProductImagePreview] = useState<string>("");
  const [editProduct, setEditProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
  });
  const [editProductImagePreview, setEditProductImagePreview] = useState<string>("");
  const [categories, setCategories] = useState<string[]>(["Electronics", "Clothing", "Home"]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 🎯 Load products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiService.products.getAll();
        if (response.success) {
          setProducts(response.products);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        // Fallback to localStorage if API fails
        const storedProducts = localStorage.getItem("cashierProducts");
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        }
      }
    };
    fetchProducts();
  }, []);

  // Load categories from localStorage on mount
  useEffect(() => {
    const storedCategories = localStorage.getItem("productCategories");
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      // Initialize with default categories from products
      const defaultCategories = Array.from(new Set(products.map((p: Product) => p.category)));
      setCategories(defaultCategories);
      localStorage.setItem("productCategories", JSON.stringify(defaultCategories));
    }
  }, [products]);

  // Get all categories (stored + from products) for display
  const allCategories = ["All", ...Array.from(new Set([...categories, ...products.map((p: Product) => p.category)]))];

  // Filter products based on search and category
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle add category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      const updatedCategories = [...categories, newCategoryName.trim()];
      setCategories(updatedCategories);
      localStorage.setItem("productCategories", JSON.stringify(updatedCategories));
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
    }
  };

  // Handle image file upload and convert to base64
  const handleImageUpload = (file: File, setImage: (value: string) => void, setPreview: (value: string) => void) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    const productImage = (product as any).image || "";
    setEditProduct({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      image: productImage,
    });
    setEditProductImagePreview(productImage);
    setIsEditProductOpen(true);
  };

  // Handle update product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const result = await apiService.products.update({
        id: editingProduct.id,
        name: editProduct.name,
        price: parseFloat(editProduct.price),
        stock: parseInt(editProduct.stock),
        category: editProduct.category,
        image: editProduct.image || "",
      });

      if (result.success && result.product) {
        // Refresh products list
        const productsResponse = await apiService.products.getAll();
        if (productsResponse.success) {
          setProducts(productsResponse.products);
        }
        
        setIsEditProductOpen(false);
        setEditingProduct(null);
        setEditProduct({ name: "", price: "", stock: "", category: "", image: "" });
        setEditProductImagePreview("");
        alert("Product updated successfully!");
      } else {
        alert(result.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert(error instanceof Error ? error.message : "Failed to update product. Please try again.");
    }
  };

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity }];
    });
    setIsCartOpen(true);
  };

  // Update quantity
  const updateQuantity = (id: number, change: number) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item.id === id);
      if (!item) return prevCart;

      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== id);
      }
      return prevCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  // Remove item from cart
  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Generate receipt number
  const generateReceiptNumber = () => {
    return `REC-${Date.now().toString().slice(-8)}`;
  };

  // Handle checkout confirmation
  const handleCheckoutConfirm = async () => {
    if (!customerName.trim()) {
      return;
    }

    setIsCheckoutDialogOpen(false);
    setIsProcessingCheckout(true);
    setIsCartOpen(false);
    
    try {
      // 🎯 Create transaction via API
      const result = await apiService.transactions.create({
        customerName: customerName.trim(),
        items: cart,
        total: total,
      });

      if (result.success && result.transaction) {
        const tx = result.transaction;

        // Store total for success dialog
        setCheckoutTotal(total);

        // Prepare receipt data
        const receiptInfo = {
          items: tx.items,
          customerName: tx.customerName,
          total: tx.total,
          receiptNumber: tx.receiptNumber,
          date: tx.date,
          time: tx.time,
        };
        setReceiptData(receiptInfo);

        // Add to purchase history
        setPurchaseHistory((prev) => [tx, ...prev]);

        // Add to kitchen orders (for kitchen dashboard)
        try {
          const kitchenOrder: KitchenOrder = {
            id: tx.id,
            receiptNumber: tx.receiptNumber,
            customerName: tx.customerName,
            items: tx.items,
            total: tx.total,
            timestamp: tx.timestamp,
            time: tx.time,
            date: tx.date,
            status: "preparing", // New orders start as "preparing"
          };
          
          // Note: Kitchen orders are now handled via API - transactions automatically have kitchenStatus
          // No need to save to localStorage anymore
        } catch (error) {
          console.error("Error processing kitchen order:", error);
        }
        
        // Clear cart and reset
        setCart([]);
        setCustomerName("");
        setIsProcessingCheckout(false);
        
        // Show success dialog first, then receipt
        setIsCheckoutSuccessOpen(true);
      } else {
        alert(result.error || "Failed to process checkout");
        setIsProcessingCheckout(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Failed to process checkout. Please try again.");
      setIsProcessingCheckout(false);
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    if (receiptData) {
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                width: 80mm;
                margin: 0;
                padding: 5mm 8mm;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                color: black;
                background: white;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 1px dashed #000;
                padding-bottom: 8px;
              }
              .store-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 4px;
              }
              .store-info {
                font-size: 10px;
                margin: 2px 0;
              }
              .receipt-info {
                text-align: center;
                margin: 8px 0;
                font-size: 10px;
              }
              .receipt-info div {
                margin: 3px 0;
              }
              .separator {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }
              .items {
                margin: 8px 0;
              }
              .item {
                margin: 6px 0;
                font-size: 11px;
              }
              .item-name {
                font-weight: bold;
                margin-bottom: 2px;
              }
              .item-details {
                font-size: 10px;
                color: #555;
                margin-bottom: 4px;
              }
              .item-total {
                text-align: right;
                font-weight: bold;
              }
              .total-section {
                text-align: center;
                margin: 10px 0;
                border-top: 1px dashed #000;
                padding-top: 8px;
              }
              .total-label {
                font-size: 11px;
                margin-bottom: 4px;
              }
              .total-amount {
                font-size: 18px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px dashed #000;
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="store-name">${STORE_INFO.name}</div>
              <div class="store-info">${STORE_INFO.address}</div>
              <div class="store-info">Phone: ${STORE_INFO.phone}</div>
            </div>
            <div class="receipt-info">
              <div><strong>${receiptData.receiptNumber}</strong></div>
              <div>Date: ${receiptData.date}</div>
              <div>Time: ${receiptData.time}</div>
              <div>Customer: ${receiptData.customerName}</div>
            </div>
            <div class="separator"></div>
            <div class="items">
              <div style="text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 11px;">ITEMS</div>
              ${receiptData.items.map(item => `
                <div class="item">
                  <div class="item-name">${item.name}</div>
                  <div class="item-details">${item.quantity} x ₱${item.price.toFixed(2)}</div>
                  <div class="item-total">₱${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              `).join('')}
            </div>
            <div class="separator"></div>
            <div class="total-section">
              <div class="total-label">TOTAL</div>
              <div class="total-amount">₱${receiptData.total.toFixed(2)}</div>
            </div>
            <div class="separator"></div>
            <div class="footer">
              <div>Thank you for your purchase!</div>
              <div>Please come again</div>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Handle view receipt (from success dialog)
  const handleViewReceipt = () => {
    setIsCheckoutSuccessOpen(false);
    setIsReceiptOpen(true);
  };

  // Handle void transaction - opens password dialog first
  const handleVoidTransaction = (index: number) => {
    setVoidingIndex(index);
    setVoidPassword("");
    setVoidPasswordError("");
    setIsVoidPasswordDialogOpen(true);
  };

  // Verify admin password for void
  const handleVoidPasswordVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, using "admin123" as password
    // In production, this would verify against a backend
    if (voidPassword === "admin123") {
      setIsVoidPasswordDialogOpen(false);
      setIsVoidDialogOpen(true);
      setVoidPassword("");
      setVoidPasswordError("");
    } else {
      setVoidPasswordError("Incorrect password. Please try again.");
      setVoidPassword("");
    }
  };

  // Confirm void transaction
  const confirmVoidTransaction = () => {
    if (voidingIndex !== null) {
      setPurchaseHistory((prev) => prev.filter((_, i) => i !== voidingIndex));
      setIsVoidDialogOpen(false);
      setVoidingIndex(null);
      
      // Show success dialog
      setIsVoidSuccessOpen(true);
    }
  };

  // Handle checkout button click (opens dialog)
  const handleCheckout = () => {
    setIsCheckoutDialogOpen(true);
  };

  // Auto-close logout dialog after 2 seconds and redirect
  useEffect(() => {
    if (logoutDialogOpen) {
      const timer = setTimeout(() => {
        setLogoutDialogOpen(false);
        // Clear user data from localStorage
        localStorage.removeItem("user");
        router.push("/login");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [logoutDialogOpen, router]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call logout API
      await apiService.auth.logout();
      
      // Show success dialog
      setIsLoggingOut(false);
      setLogoutDialogOpen(true);
    } catch (error) {
      // Even if API fails, still logout locally
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      setLogoutDialogOpen(true);
    }
  };

  // Handle add product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await apiService.products.create({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        image: newProduct.image || "",
      });

      if (result.success && result.product) {
        // Refresh products list
        const productsResponse = await apiService.products.getAll();
        if (productsResponse.success) {
          setProducts(productsResponse.products);
        }
        
        // Close dialog and reset form
        setIsAddProductOpen(false);
        setNewProduct({ name: "", price: "", stock: "", category: "", image: "" });
        setNewProductImagePreview("");
        alert("Product added successfully!");
      } else {
        alert(result.error || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert(error instanceof Error ? error.message : "Failed to add product. Please try again.");
    }
  };

  if (isLoading || isProcessingCheckout) {
    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          {isProcessingCheckout && (
            <div className="flex flex-col items-center justify-center text-center mb-8">
              <div className="mb-4">
                <Spinner size="lg" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Processing Checkout...</h2>
              <p className="text-muted-foreground">Please wait while we process your order</p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div>
                      <Skeleton className="h-8 w-24 mb-2" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded" />
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-9 rounded" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-pink-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cashier</h1>
            <p className="text-sm text-muted-foreground">Point of Sale</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Add a new product to the inventory
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProduct}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="product-price">Price</Label>
                        <Input
                          id="product-price"
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-stock">Stock</Label>
                        <Input
                          id="product-stock"
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="product-category">Category</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                        required
                      >
                        <SelectTrigger id="product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="product-image">Product Image</Label>
                      <Input
                        id="product-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, (value) => setNewProduct({ ...newProduct, image: value }), setNewProductImagePreview);
                          }
                        }}
                      />
                      {newProductImagePreview && (
                        <div className="mt-2">
                          <img
                            src={newProductImagePreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Product</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                  <DialogDescription>
                    Update product information
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProduct}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-product-name">Product Name</Label>
                      <Input
                        id="edit-product-name"
                        value={editProduct.name}
                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-product-price">Price</Label>
                        <Input
                          id="edit-product-price"
                          type="number"
                          step="0.01"
                          value={editProduct.price}
                          onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-product-stock">Stock</Label>
                        <Input
                          id="edit-product-stock"
                          type="number"
                          value={editProduct.stock}
                          onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-product-category">Category</Label>
                      <Select
                        value={editProduct.category}
                        onValueChange={(value) => setEditProduct({ ...editProduct, category: value })}
                        required
                      >
                        <SelectTrigger id="edit-product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-product-image">Product Image</Label>
                      <Input
                        id="edit-product-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, (value) => setEditProduct({ ...editProduct, image: value }), setEditProductImagePreview);
                          }
                        }}
                      />
                      {editProductImagePreview && (
                        <div className="mt-2">
                          <img
                            src={editProductImagePreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditProductOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Product</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="mr-2 h-4 w-4" />
              History
              {purchaseHistory.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {purchaseHistory.length}
                </Badge>
              )}
            </Button>
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Cart
                  {cartItemCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-gray-200">
                <SheetHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                  <SheetTitle>Shopping Cart</SheetTitle>
                  <SheetDescription>
                    {cartItemCount} item{cartItemCount !== 1 ? "s" : ""} in cart
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col flex-1 min-h-0 px-6">
                  <ScrollArea 
                    className={cn(
                      "pr-4",
                      cart.length > 3 ? "max-h-[calc(100vh-280px)]" : "flex-1"
                    )}
                  >
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center py-12">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4 py-4">
                        {cart.map((item) => (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium">{item.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    ₱{item.price.toFixed(2)} each
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, -1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="font-medium">
                                  ₱{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {cart.length > 0 && (
                    <div className="border-t pt-4 pb-6 space-y-4 flex-shrink-0">
                      <div className="space-y-2">
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>₱{total.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleCheckout}
                        className="w-full"
                        size="lg"
                      >
                        Checkout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Category Filter Buttons */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {allCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCategoryOpen(true)}
              className="text-sm"
            >
              <Tag className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product: Product) => {
              const cartItem = cart.find((item) => item.id === product.id);
              const inStock = product.stock > 0;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartItem={cartItem}
                  inStock={inStock}
                  onAddToCart={(quantity) => addToCart(product, quantity)}
                  onEdit={handleEditProduct}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Dialog - Customer Name */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Enter customer name for the receipt
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkout-customer-name">Customer Name</Label>
                <Input
                  id="checkout-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customerName.trim()) {
                      handleCheckoutConfirm();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCheckoutDialogOpen(false);
                setCustomerName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckoutConfirm}
              disabled={!customerName.trim()}
              size="lg"
            >
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Success Dialog */}
      <Dialog open={isCheckoutSuccessOpen} onOpenChange={setIsCheckoutSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-2xl">Checkout Successful!</DialogTitle>
              <DialogDescription className="text-base">
                Your order has been processed successfully
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col items-center space-y-2">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-foreground">
                ₱{checkoutTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              onClick={() => setIsCheckoutSuccessOpen(false)}
              variant="outline"
              className="w-full sm:w-auto"
              size="lg"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={handleViewReceipt}
              className="w-full sm:w-auto"
              size="lg"
            >
              View Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto print:max-w-[80mm] print:p-2 print:mx-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 print:space-y-2">
            {/* Store Header */}
            <div className="text-center border-b pb-4 print:border-b-0 print:pb-2">
              <h2 className="text-2xl font-bold print:text-lg print:font-bold">{STORE_INFO.name}</h2>
              <p className="text-sm text-muted-foreground print:text-xs">{STORE_INFO.address}</p>
              <p className="text-sm text-muted-foreground print:text-xs">Phone: {STORE_INFO.phone}</p>
            </div>

            {/* Receipt Info */}
            {receiptData && (
              <>
                <div className="space-y-2 border-b pb-4 print:space-y-1 print:border-b-0 print:pb-2 print:text-xs">
                  <div className="flex justify-between print:justify-center print:flex-col print:items-center print:gap-0.5">
                    <span className="text-muted-foreground print:hidden">Receipt #:</span>
                    <span className="font-medium print:font-bold print:text-center">{receiptData.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between print:justify-center print:flex-col print:items-center print:gap-0.5">
                    <span className="text-muted-foreground print:hidden">Date:</span>
                    <span className="font-medium print:text-center">{receiptData.date}</span>
                  </div>
                  <div className="flex justify-between print:justify-center print:flex-col print:items-center print:gap-0.5">
                    <span className="text-muted-foreground print:hidden">Time:</span>
                    <span className="font-medium print:text-center">{receiptData.time}</span>
                  </div>
                  <div className="flex justify-between print:justify-center print:flex-col print:items-center print:gap-0.5">
                    <span className="text-muted-foreground print:hidden">Customer:</span>
                    <span className="font-medium print:text-center">{receiptData.customerName}</span>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-dashed print:border-t print:border-dashed print:my-2"></div>

                {/* Items */}
                <div className="space-y-2 border-b pb-4 print:space-y-1 print:border-b-0 print:pb-2">
                  <h3 className="font-semibold text-sm print:text-xs print:font-bold print:text-center print:mb-1">ITEMS</h3>
                  {receiptData.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm print:text-xs print:flex-col print:gap-0.5">
                      <div className="flex-1 print:flex-none">
                        <p className="font-medium print:font-normal print:text-left">{item.name}</p>
                        <p className="text-muted-foreground print:text-xs print:text-left">
                          {item.quantity} x ₱{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium print:font-bold print:text-right print:mt-0.5">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Separator */}
                <div className="border-t border-dashed print:border-t print:border-dashed print:my-2"></div>

                {/* Total */}
                <div className="space-y-2 border-t pt-4 print:space-y-0 print:border-t-0 print:pt-2">
                  <div className="flex justify-between text-lg font-bold print:text-base print:justify-center print:flex-col print:items-center print:gap-1">
                    <span className="print:text-sm">TOTAL:</span>
                    <span className="print:text-xl print:font-bold">₱{receiptData.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-dashed print:border-t print:border-dashed print:my-2"></div>

                {/* Footer */}
                <div className="text-center border-t pt-4 print:border-t-0 print:pt-2 print:space-y-1">
                  <p className="text-xs text-muted-foreground print:text-xs">
                    Thank you for your purchase!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 print:mt-0 print:text-xs">
                    Please come again
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="sm:justify-center gap-2 print:hidden">
            <Button
              onClick={() => setIsReceiptOpen(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handlePrintReceipt}
              className="w-full sm:w-auto"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 bg-pink-200">
          <SheetHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <SheetTitle>Purchase History</SheetTitle>
            <SheetDescription>
              View all completed transactions
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, receipt #, date, or items..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
          <div className="flex flex-col flex-1 min-h-0 px-6">
            {(() => {
              // Filter purchase history based on search query
              const filteredHistory = purchaseHistory.filter((purchase) => {
                if (!historySearchQuery.trim()) return true;
                const query = historySearchQuery.toLowerCase();
                return (
                  purchase.customerName.toLowerCase().includes(query) ||
                  purchase.receiptNumber.toLowerCase().includes(query) ||
                  purchase.date.toLowerCase().includes(query) ||
                  purchase.time.toLowerCase().includes(query) ||
                  purchase.items.some((item) =>
                    item.name.toLowerCase().includes(query)
                  )
                );
              });

              if (purchaseHistory.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No purchase history</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Completed transactions will appear here
                    </p>
                  </div>
                );
              }

              if (filteredHistory.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try searching with different keywords
                    </p>
                  </div>
                );
              }

              return (
                <ScrollArea
                  className={cn(
                    "pr-4",
                    filteredHistory.length > 2 ? "max-h-[calc(100vh-280px)]" : "flex-1"
                  )}
                >
                  <div className="space-y-4 py-4">
                    {filteredHistory.map((purchase) => {
                      // Find the original index in purchaseHistory for void functionality
                      const originalIndex = purchaseHistory.findIndex(
                        (p) => p.receiptNumber === purchase.receiptNumber && p.timestamp === purchase.timestamp
                      );
                      return (
                        <Card key={originalIndex !== -1 ? originalIndex : purchase.receiptNumber} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between border-b pb-3">
                                <div>
                                  <p className="font-semibold text-sm text-muted-foreground">
                                    Receipt #{purchase.receiptNumber}
                                  </p>
                                  <p className="font-medium text-lg">{purchase.customerName}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">{purchase.date}</p>
                                  <p className="text-sm text-muted-foreground">{purchase.time}</p>
                                </div>
                              </div>

                              {/* Items */}
                              <div className="space-y-2">
                                {purchase.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between text-sm"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {item.quantity} x ₱{item.price.toFixed(2)}
                                      </p>
                                    </div>
                                    <p className="font-medium">
                                      ₱{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Total */}
                              <div className="flex justify-between items-center border-t pt-3">
                                <span className="font-semibold">Total:</span>
                                <span className="text-lg font-bold">
                                  ₱{purchase.total.toFixed(2)}
                                </span>
                              </div>

                              {/* Void Button */}
                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleVoidTransaction(originalIndex !== -1 ? originalIndex : purchaseHistory.indexOf(purchase))}
                                  className="h-8"
                                >
                                  <X className="mr-2 h-3 w-3" />
                                  Void Transaction
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={isVoidPasswordDialogOpen} onOpenChange={setIsVoidPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Password Required</DialogTitle>
            <DialogDescription>
              Please enter the admin password to void this transaction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVoidPasswordVerify}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="void-admin-password">Password</Label>
                <Input
                  id="void-admin-password"
                  type="password"
                  value={voidPassword}
                  onChange={(e) => {
                    setVoidPassword(e.target.value);
                    setVoidPasswordError("");
                  }}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                />
                {voidPasswordError && (
                  <p className="text-sm text-destructive">{voidPasswordError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsVoidPasswordDialogOpen(false);
                  setVoidPassword("");
                  setVoidPasswordError("");
                  setVoidingIndex(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Verify</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Void Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to void this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {voidingIndex !== null && purchaseHistory[voidingIndex] && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receipt #:</span>
                <span className="font-medium">{purchaseHistory[voidingIndex].receiptNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{purchaseHistory[voidingIndex].customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">₱{purchaseHistory[voidingIndex].total.toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsVoidDialogOpen(false);
                setVoidingIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmVoidTransaction}
            >
              Void Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category that can be used when adding products.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setNewCategoryName("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isVoidSuccessOpen} onOpenChange={setIsVoidSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-2xl">Transaction Voided!</DialogTitle>
              <DialogDescription className="text-base">
                The transaction has been successfully voided
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => setIsVoidSuccessOpen(false)}
              className="w-full sm:w-auto"
              size="lg"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Success Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center justify-center">
                <Image
                  src="/logout.gif"
                  alt="Logout"
                  width={80}
                  height={80}
                  className="rounded-full"
                  unoptimized
                />
              </div>
              <DialogTitle className="text-2xl">Logged Out Successfully!</DialogTitle>
              <DialogDescription className="text-base">
                You have been logged out. Redirecting to login page...
              </DialogDescription>
              <p className="text-lg text-blue-500 font-bold mt-1">
                Please wait
              </p>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Protect cashier page - only admin and cashier can access
export default withRole(CashierPage, ['admin', 'cashier']);
