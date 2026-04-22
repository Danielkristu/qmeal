"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { MenuItem } from "@/lib/types"

interface MenuManagerProps {
  items: MenuItem[]
  onRefresh: () => void
}

export function MenuManager({ items, onRefresh }: MenuManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Makanan",
  })

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
    })
    setIsOpen(true)
  }

  const openNew = () => {
    setEditingItem(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Makanan",
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = "/api/merchant/menu"
      const method = editingItem ? "PATCH" : "POST"
      const body = {
        ...(editingItem ? { id: editingItem.id } : {}),
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(`Menu berhasil di${editingItem ? "update" : "tambah"}`)
        setIsOpen(false)
        onRefresh()
      } else {
        const err = await res.json()
        toast.error(err.error || "Gagal menyimpan menu")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus menu "${name}"?`)) return
    
    try {
      const res = await fetch(`/api/merchant/menu?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Menu berhasil dihapus")
        onRefresh()
      } else {
        toast.error("Gagal menghapus menu")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  return (
    <div className="space-y-4 max-w-4xl max-h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Menu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu" : "Tambah Menu Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Menu</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga (Rp)</Label>
                  <Input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <select 
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Makanan" className="bg-background">Makanan</option>
                    <option value="Minuman" className="bg-background">Minuman</option>
                    <option value="Snack" className="bg-background">Snack</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Menu"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50 flex-1 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border/50 sticky top-0">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Harga</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-border/10 hover:bg-muted/20">
                <td className="p-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</div>
                </td>
                <td className="p-3"><Badge variant="outline">{item.category}</Badge></td>
                <td className="p-3">Rp {item.price.toLocaleString("id-ID")}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-blue-500">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, item.name)} className="h-8 w-8 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada menu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
