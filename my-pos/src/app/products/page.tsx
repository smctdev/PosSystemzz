"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Package,
  ArrowDown,
  ArrowUp,
  Ban,
  History,
} from "lucide-react";
import { apiService } from "@/lib/api/apiService";
import type { Product, ProductMovement } from "@/lib/api/types";
import { ErrorDisplay } from "@/components/error-display";
import { ProductOutModal } from "@/components/product-out-modal";
import { VoidProductOutModal } from "@/components/void-product-out-modal";
import { VoidedProductOutsHistoryModal } from "@/components/voided-product-outs-history-modal";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProductOutOpen, setIsProductOutOpen] = useState(false);
  const [voidMovement, setVoidMovement] = useState<ProductMovement | null>(
    null
  );
  const [isVoidHistoryOpen, setIsVoidHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    stock: "",
    price: "",
    category: "",
  });

  // 🎯 Fetch products and movements from API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch products and movements in parallel
      const [productsResponse, movementsResponse] = await Promise.all([
        apiService.products.getAll(),
        apiService.products.getMovements(),
      ]);

      if (productsResponse.success) {
        setProducts(productsResponse.products);
      } else {
        setError(productsResponse.error || "Failed to load products");
      }

      if (movementsResponse.success) {
        setMovements(movementsResponse.movements);
      } else if (!error) {
        // Only set error if we don't already have one from products
        setError(movementsResponse.error || "Failed to load product movements");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshProductsAndMovements = async () => {
    const [productsResponse, movementsResponse] = await Promise.all([
      apiService.products.getAll(),
      apiService.products.getMovements(),
    ]);
    if (productsResponse.success) {
      setProducts(productsResponse.products);
    }
    if (movementsResponse.success) {
      setMovements(movementsResponse.movements);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const productsIn = movements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0);
  const productsOut = movements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await apiService.products.create({
        name: newProduct.name,
        sku: newProduct.sku || undefined,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
      });

      if (result.success && result.product) {
        // Refresh products list
        const productsResponse = await apiService.products.getAll();
        if (productsResponse.success) {
          setProducts(productsResponse.products);
          setIsAddDialogOpen(false);
          setNewProduct({ name: "", sku: "", stock: "", price: "", category: "" });
        } else {
          setError(productsResponse.error || "Product created but failed to refresh list");
        }
      } else {
        setError(result.error || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setError(error instanceof Error ? error.message : "Failed to add product. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <DashboardShell
        title="Products"
        description="Manage inventory and track product movements"
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled variant="outline">
              <ArrowUp className="mr-2 h-4 w-4" />
              Product out
            </Button>
            <Button disabled variant="outline">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        }
      >
        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Products Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Movements Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Products"
      description="Manage inventory and track product movements"
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <ProductOutModal
            open={isProductOutOpen}
            onOpenChange={setIsProductOutOpen}
            products={products}
            onSuccess={refreshProductsAndMovements}
          />
          <Button variant="outline" onClick={() => setIsProductOutOpen(true)}>
            <ArrowUp className="mr-2 h-4 w-4" />
            Product out
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsVoidHistoryOpen(true)}
          >
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="Enter SKU"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="Enter category"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Product</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* Error Display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={fetchData}
        />
      )}

      {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Active products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock}</div>
              <p className="text-xs text-muted-foreground mt-1">Units in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products In</CardTitle>
              <ArrowDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{productsIn}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Out</CardTitle>
              <ArrowUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{productsOut}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>Current stock levels for all products</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock < 20 ? "destructive" : "secondary"}>
                          {product.stock} units
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₱{product.price.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Movements</CardTitle>
            <CardDescription>Track products coming in and going out</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Recorded by</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      No movements recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.date}</div>
                        <div className="text-sm text-muted-foreground">{movement.time}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{movement.product}</TableCell>
                    <TableCell>
                      <Badge
                        variant={movement.type === "in" ? "default" : "destructive"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {movement.type === "in" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {movement.type === "in" ? "In" : "Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{movement.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{movement.reason}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.type === "out" && movement.employeeName
                        ? movement.employeeName
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.type === "out" &&
                      movement.productId != null ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setVoidMovement(movement)}
                        >
                          <Ban className="mr-1.5 h-3.5 w-3.5" />
                          Void
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <VoidedProductOutsHistoryModal
          open={isVoidHistoryOpen}
          onOpenChange={setIsVoidHistoryOpen}
        />

        <VoidProductOutModal
          open={voidMovement !== null}
          onOpenChange={(open) => {
            if (!open) setVoidMovement(null);
          }}
          movement={voidMovement}
          onSuccess={refreshProductsAndMovements}
        />
    </DashboardShell>
  );
}

