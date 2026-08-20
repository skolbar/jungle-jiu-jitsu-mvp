"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Handshake, Instagram, MapPin, MessageCircle, Star, Ticket } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import type { Partner } from "@/lib/domain/partners"

export default function StudentPartnersPage() {
  const { user, isLoading } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Partner | null>(null)

  useEffect(() => {
    if (!user) return
    fetch("/api/partners")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Não foi possível carregar os parceiros."))))
      .then(setPartners)
      .catch(() => setPartners([]))
      .finally(() => setLoading(false))
  }, [user])

  const featured = useMemo(() => partners.filter((partner) => partner.is_featured), [partners])

  if (isLoading || loading) return null

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
        <section className="border-b border-border pb-6">
          <div className="flex items-center gap-3 text-primary"><Handshake className="h-6 w-6" /><span className="text-sm font-semibold uppercase tracking-wide">Comunidade Jungle</span></div>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">Parceiros Jungle</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Benefícios especiais de empresas que treinam junto com a nossa comunidade.</p>
        </section>

        {featured.length > 0 && <section className="space-y-4"><h2 className="text-lg font-semibold">Em destaque</h2><div className="grid gap-4 md:grid-cols-2">{featured.map((partner) => <PartnerCard key={partner.id} partner={partner} onOpen={() => setSelected(partner)} featured />)}</div></section>}

        <section className="space-y-4"><h2 className="text-lg font-semibold">Todos os parceiros</h2>{partners.length === 0 ? <EmptyState /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{partners.map((partner) => <PartnerCard key={partner.id} partner={partner} onOpen={() => setSelected(partner)} />)}</div>}</section>
      </main>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && <PartnerDialog partner={selected} />}
      </Dialog>
    </DashboardLayout>
  )
}

function EmptyState() { return <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-border px-6 text-center"><Handshake className="h-10 w-10 text-primary" /><h2 className="mt-4 font-semibold">Novos benefícios em breve</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">A academia está preparando a vitrine dos parceiros para a comunidade Jungle.</p></div> }

function PartnerCard({ partner, onOpen, featured = false }: { partner: Partner; onOpen: () => void; featured?: boolean }) {
  return <article className="overflow-hidden border border-border bg-card">
    <div className={featured ? "h-48 bg-muted" : "h-36 bg-muted"}>{partner.cover_url ? <img src={partner.cover_url} alt="" className="h-full w-full object-cover" /> : null}</div>
    <div className="space-y-3 p-4">
      <div className="flex items-start gap-3">{partner.logo_url ? <img src={partner.logo_url} alt="" className="h-12 w-12 rounded-md border object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">{partner.name[0]}</div>}<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-semibold">{partner.name}</h3>{partner.is_featured && <Star className="h-4 w-4 fill-primary text-primary" />}</div><p className="text-sm text-muted-foreground">{partner.category}</p></div></div>
      {partner.benefit_title && <div className="flex items-center gap-2 text-sm font-medium text-primary"><Ticket className="h-4 w-4" />{partner.benefit_title}</div>}
      <p className="line-clamp-2 text-sm text-muted-foreground">{partner.description}</p>
      <Button variant="outline" className="w-full" onClick={onOpen}>Ver parceiro</Button>
    </div>
  </article>
}

function PartnerDialog({ partner }: { partner: Partner }) {
  return <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0"><div className="h-52 bg-muted">{partner.cover_url && <img src={partner.cover_url} alt="" className="h-full w-full object-cover" />}</div><div className="space-y-5 p-6"><DialogHeader><div className="flex items-center gap-3">{partner.logo_url ? <img src={partner.logo_url} alt="" className="h-14 w-14 rounded-md border object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary text-xl font-bold text-primary-foreground">{partner.name[0]}</div>}<div><DialogTitle>{partner.name}</DialogTitle><DialogDescription>{partner.category}</DialogDescription></div></div></DialogHeader><p className="text-sm leading-6 text-muted-foreground">{partner.description}</p>{partner.benefit_title && <div className="border-l-4 border-primary bg-muted p-4"><div className="flex items-center gap-2 font-semibold"><Ticket className="h-4 w-4 text-primary" />{partner.benefit_title}</div>{partner.benefit_description && <p className="mt-1 text-sm text-muted-foreground">{partner.benefit_description}</p>}{partner.coupon_code && <Badge className="mt-3">Cupom: {partner.coupon_code}</Badge>}</div>}{partner.address && <div className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{partner.address}</div>}{partner.gallery_urls.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{partner.gallery_urls.map((url) => <img key={url} src={url} alt="" className="aspect-square w-full object-cover" />)}</div>}<div className="flex flex-wrap gap-2">{partner.whatsapp_url && <ActionLink href={partner.whatsapp_url} label="WhatsApp" icon={<MessageCircle className="h-4 w-4" />} />}{partner.instagram_url && <ActionLink href={partner.instagram_url} label="Instagram" icon={<Instagram className="h-4 w-4" />} />}{partner.website_url && <ActionLink href={partner.website_url} label="Visitar site" icon={<ExternalLink className="h-4 w-4" />} />}</div></div></DialogContent>
}

function ActionLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) { return <Button asChild><a href={href} target="_blank" rel="noreferrer">{icon}{label}</a></Button> }
