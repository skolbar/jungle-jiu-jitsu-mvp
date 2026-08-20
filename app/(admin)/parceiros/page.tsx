"use client"

import { ChangeEvent, FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Handshake, ImagePlus, Pencil, Plus, Star, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import type { Partner } from "@/lib/domain/partners"
import { createClient } from "@/lib/supabase/client"

type PartnerForm = Omit<Partner, "id" | "created_at" | "updated_at" | "created_by"> & { valid_until: string }

const emptyForm = (): PartnerForm => ({
  name: "",
  slug: "",
  category: "",
  description: "",
  logo_url: null,
  cover_url: null,
  gallery_urls: [],
  benefit_title: "",
  benefit_description: "",
  coupon_code: null,
  whatsapp_url: null,
  instagram_url: null,
  website_url: null,
  address: null,
  is_featured: false,
  is_active: true,
  display_order: 0,
  valid_until: "",
})

const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

function optional(value: string | null) {
  return value ?? ""
}

export default function ParceirosPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [form, setForm] = useState<PartnerForm>(emptyForm)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) router.replace("/login")
  }, [isLoading, router, user])

  useEffect(() => {
    if (user?.role === "admin") void loadPartners()
  }, [user])

  async function loadPartners() {
    setLoading(true)
    try {
      const response = await fetch("/api/partners")
      if (!response.ok) throw new Error("Não foi possível carregar os parceiros.")
      setPartners(await response.json())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os parceiros.")
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setLogoFile(null)
    setCoverFile(null)
    setGalleryFiles([])
    setOpen(true)
  }

  function openEdit(partner: Partner) {
    setEditing(partner)
    setForm({ ...partner, valid_until: partner.valid_until ?? "" })
    setLogoFile(null)
    setCoverFile(null)
    setGalleryFiles([])
    setOpen(true)
  }

  function updateText(field: keyof PartnerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function onNameChange(value: string) {
    setForm((current) => ({ ...current, name: value, slug: editing ? current.slug : toSlug(value) }))
  }

  async function uploadFile(file: File, kind: "logo" | "cover" | "gallery") {
    if (!file.type.startsWith("image/")) throw new Error("Use apenas arquivos de imagem.")
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `partners/${kind}-${crypto.randomUUID()}.${extension}`
    const supabase = createClient()
    const { error } = await supabase.storage.from("partner-media").upload(path, file, { upsert: false, contentType: file.type })
    if (error) throw error
    return supabase.storage.from("partner-media").getPublicUrl(path).data.publicUrl
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const logoUrl = logoFile ? await uploadFile(logoFile, "logo") : form.logo_url
      const coverUrl = coverFile ? await uploadFile(coverFile, "cover") : form.cover_url
      const newGallery = await Promise.all(galleryFiles.map((file) => uploadFile(file, "gallery")))
      const payload = {
        ...form,
        logo_url: logoUrl || "",
        cover_url: coverUrl || "",
        gallery_urls: [...form.gallery_urls, ...newGallery],
        coupon_code: form.coupon_code || "",
        whatsapp_url: form.whatsapp_url || "",
        instagram_url: form.instagram_url || "",
        website_url: form.website_url || "",
        address: form.address || "",
        valid_until: form.valid_until || "",
      }
      const response = await fetch(editing ? `/api/partners/${editing.id}` : "/api/partners", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar o parceiro.")
      toast.success(editing ? "Parceiro atualizado." : "Parceiro cadastrado.")
      setOpen(false)
      await loadPartners()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o parceiro.")
    } finally {
      setSaving(false)
    }
  }

  async function removePartner(partner: Partner) {
    if (!window.confirm(`Excluir ${partner.name}? As imagens já enviadas não serão apagadas automaticamente.`)) return
    try {
      const response = await fetch(`/api/partners/${partner.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Não foi possível excluir o parceiro.")
      setPartners((items) => items.filter((item) => item.id !== partner.id))
      toast.success("Parceiro excluído.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o parceiro.")
    }
  }

  function addGalleryUrls(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []).slice(0, Math.max(0, 6 - form.gallery_urls.length))
    setGalleryFiles(selected)
  }

  if (isLoading || !user || loading) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Parceiros Jungle</h1>
            <p className="mt-1 text-muted-foreground">Divulgação de empresas da comunidade Jungle.</p>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Novo parceiro</Button>
        </div>

        {partners.length === 0 ? (
          <Card><CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <Handshake className="h-10 w-10 text-primary" />
            <div><h2 className="font-semibold">A vitrine está pronta</h2><p className="mt-1 text-sm text-muted-foreground">Cadastre a primeira empresa parceira para exibi-la aos alunos.</p></div>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Cadastrar parceiro</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {partners.map((partner) => (
              <Card key={partner.id} className="overflow-hidden">
                {partner.cover_url ? <img src={partner.cover_url} alt="" className="h-32 w-full object-cover" /> : <div className="h-32 bg-muted" />}
                <CardContent className="space-y-4 p-4">
                  <div className="flex gap-3">
                    {partner.logo_url ? <img src={partner.logo_url} alt="" className="h-12 w-12 rounded-md border object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">{partner.name.charAt(0)}</div>}
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate font-semibold">{partner.name}</h2>{partner.is_featured && <Star className="h-4 w-4 fill-primary text-primary" />}</div><p className="text-sm text-muted-foreground">{partner.category}</p></div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{partner.description || "Sem descrição cadastrada."}</p>
                  <div className="flex items-center justify-between text-xs"><span className={partner.is_active ? "font-medium text-emerald-600" : "font-medium text-muted-foreground"}>{partner.is_active ? "Ativo" : "Inativo"}</span><span>Ordem {partner.display_order}</span></div>
                  <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => openEdit(partner)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button variant="outline" size="icon" aria-label={`Excluir ${partner.name}`} onClick={() => removePartner(partner)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar parceiro" : "Novo parceiro"}</DialogTitle><DialogDescription>Os campos exibidos aqui aparecerão na vitrine para os alunos quando o parceiro estiver ativo.</DialogDescription></DialogHeader>
            <form className="space-y-5" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome da empresa *"><Input value={form.name} onChange={(event) => onNameChange(event.target.value)} required /></Field>
                <Field label="Categoria *"><Input value={form.category} onChange={(event) => updateText("category", event.target.value)} placeholder="Ex.: Alimentação, Saúde, Serviços" required /></Field>
                <Field label="Identificador da página *"><Input value={form.slug} onChange={(event) => updateText("slug", toSlug(event.target.value))} required /></Field>
                <Field label="Ordem de exibição"><Input type="number" min="0" value={form.display_order} onChange={(event) => setForm((current) => ({ ...current, display_order: Number(event.target.value || 0) }))} /></Field>
              </div>
              <Field label="Descrição"><Textarea value={form.description} onChange={(event) => updateText("description", event.target.value)} rows={3} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <UploadField label="Logo" file={logoFile} onChange={setLogoFile} />
                <UploadField label="Imagem de capa" file={coverFile} onChange={setCoverFile} />
              </div>
              <UploadField label="Galeria (até 6 imagens)" multiple file={galleryFiles[0] ?? null} onChange={addGalleryUrls} />
              {form.gallery_urls.length > 0 && <div className="flex flex-wrap gap-2">{form.gallery_urls.map((url) => <button type="button" onClick={() => setForm((current) => ({ ...current, gallery_urls: current.gallery_urls.filter((item) => item !== url) }))} key={url} className="h-14 w-14 overflow-hidden rounded border" title="Remover imagem"><img src={url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Título do benefício"><Input value={form.benefit_title} onChange={(event) => updateText("benefit_title", event.target.value)} /></Field><Field label="Cupom"><Input value={optional(form.coupon_code)} onChange={(event) => updateText("coupon_code", event.target.value)} /></Field></div>
              <Field label="Detalhes do benefício"><Textarea value={form.benefit_description} onChange={(event) => updateText("benefit_description", event.target.value)} rows={2} /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="WhatsApp"><Input type="url" value={optional(form.whatsapp_url)} onChange={(event) => updateText("whatsapp_url", event.target.value)} placeholder="https://wa.me/..." /></Field><Field label="Instagram"><Input type="url" value={optional(form.instagram_url)} onChange={(event) => updateText("instagram_url", event.target.value)} placeholder="https://instagram.com/..." /></Field><Field label="Site"><Input type="url" value={optional(form.website_url)} onChange={(event) => updateText("website_url", event.target.value)} placeholder="https://..." /></Field><Field label="Endereço"><Input value={optional(form.address)} onChange={(event) => updateText("address", event.target.value)} /></Field><Field label="Válido até"><Input type="date" value={form.valid_until} onChange={(event) => updateText("valid_until", event.target.value)} /></Field></div>
              <div className="flex flex-wrap gap-6 border-y py-4"><Toggle label="Parceiro ativo" checked={form.is_active} onChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))} /><Toggle label="Em destaque" checked={form.is_featured} onChange={(checked) => setForm((current) => ({ ...current, is_featured: checked }))} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar parceiro"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-medium"><span>{label}</span>{children}</label> }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={checked} onCheckedChange={onChange} />{label}</label> }
function UploadField({ label, file, onChange, multiple = false }: { label: string; file: File | null; onChange: (value: any) => void; multiple?: boolean }) { return <div className="grid gap-2"><Label>{label}</Label><label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:border-primary"><Upload className="h-4 w-4" />{file ? (multiple ? "Imagens selecionadas" : file.name) : "Selecionar imagem"}<Input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} onChange={(event) => onChange(multiple ? event : event.target.files?.[0] ?? null)} /></label></div> }
