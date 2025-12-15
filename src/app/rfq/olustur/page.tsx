"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { formatNumberTR } from "@/lib/format";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

type RequestItem = { id: string; name: string; quantity: number; unit: string };
type RequestSummary = { id: string; barcode: string; subject: string; budget: number; unit: string; status: string; currency: string; items: RequestItem[] };
type Supplier = { id: string; name: string; email: string; contactName?: string; categoryId?: string; categoryName?: string };

function RfqOlusturContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRequestId = searchParams.get("requestId") || "";
    const initialRequestBarcode = searchParams.get("requestBarcode") || "";
    const { show } = useToast();

    // Request Linking State
    const [linkedRequestBarcode, setLinkedRequestBarcode] = useState(initialRequestBarcode);
    const [linkedRequestDetail, setLinkedRequestDetail] = useState<RequestSummary | null>(null);
    const [requestSearchResults, setRequestSearchResults] = useState<RequestSummary[]>([]);
    const [requestSearchOpen, setRequestSearchOpen] = useState(false);
    const [requestSearchLoading, setRequestSearchLoading] = useState(false);
    const [requestValidity, setRequestValidity] = useState<"unknown" | "checking" | "valid" | "invalid">("unknown");

    // Suppliers State
    const [registeredSuppliers, setRegisteredSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
    const [manualEmails, setManualEmails] = useState("");
    const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
    const [suppliersLoading, setSuppliersLoading] = useState(false);

    // RFQ Form State
    const [title, setTitle] = useState("");
    const [deadline, setDeadline] = useState("");
    const [validityDays, setValidityDays] = useState(7);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    // Company & Delivery Address State
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
    const [deliveryAddresses, setDeliveryAddresses] = useState<{ id: string; name: string; address: string; isDefault: boolean }[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState("");

    // Category Matching State
    const [categories, setCategories] = useState<{ id: string, name: string, parentId: string | null }[]>([]);
    const [itemCategories, setItemCategories] = useState<Record<string, string>>({}); // itemId -> categoryId


    // Fetch data
    useEffect(() => {
        // Suppliers
        setSuppliersLoading(true);
        fetch("/api/tedarikci?pageSize=100&active=true")
            .then(r => r.json())
            .then(data => {
                const items = data.items || data || [];
                const supplierArray = Array.isArray(items) ? items : [];
                setRegisteredSuppliers(supplierArray.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    email: s.email || "",
                    contactName: s.contactName,
                    categoryId: s.categoryId, // New field from API
                    categoryName: s.category?.name // New field from API
                })));
            })
            .catch(console.error)
            .finally(() => setSuppliersLoading(false));

        // Categories
        fetch("/api/tedarikci/kategori")
            .then(r => r.json())
            .then(data => {
                const flat: any[] = [];
                const traverse = (nodes: any[]) => {
                    if (!Array.isArray(nodes)) return;
                    nodes.forEach(n => {
                        flat.push({ id: n.id, name: n.name, parentId: n.parentId });
                        if (n.children && Array.isArray(n.children)) traverse(n.children);
                    });
                };
                if (Array.isArray(data)) {
                    traverse(data);
                }
                setCategories(flat);
            })
            .catch(console.error);

        // Companies (Fatura Carileri)
        fetch("/api/options")
            .then(r => r.json())
            .then(data => {
                const firmaList = data.firma || [];
                setCompanies(firmaList.map((c: any) => ({ id: c.id, name: c.label })));
                // Set default if only one
                if (firmaList.length === 1) setSelectedCompanyId(firmaList[0].id);
            })
            .catch(console.error);

        // Delivery Addresses
        fetch("/api/delivery-addresses?active=true")
            .then(r => r.json())
            .then(data => {
                const items = data.items || [];
                setDeliveryAddresses(items);
                // Auto-select default
                const defaultAddr = items.find((a: any) => a.isDefault);
                if (defaultAddr) setSelectedDeliveryAddressId(defaultAddr.id);
                else if (items.length === 1) setSelectedDeliveryAddressId(items[0].id);
            })
            .catch(console.error);
    }, []);

    // Fetch initial request if ID is provided via URL
    useEffect(() => {
        if (initialRequestId) {
            fetch(`/api/talep/${encodeURIComponent(initialRequestId)}`)
                .then(r => r.json())
                .then(val => {
                    if (val && !val.error) {
                        setLinkedRequestDetail({
                            id: val.id,
                            barcode: val.barcode,
                            subject: val.subject,
                            budget: val.budget,
                            unit: val.unit || "",
                            status: val.status || "",
                            currency: val.currency || "TL",
                            items: (val.items || []).map((i: any) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit || "Adet" }))
                        });
                        setLinkedRequestBarcode(val.barcode);
                        setTitle(`${val.subject} İçin Fiyat Araştırması`);
                        const d = new Date();
                        d.setDate(d.getDate() + validityDays);
                        setDeadline(d.toISOString().slice(0, 10));
                        setRequestValidity("valid");
                    }
                });
        }
    }, [initialRequestId]);

    // Update deadline when validityDays changes
    useEffect(() => {
        if (linkedRequestDetail) {
            const d = new Date();
            d.setDate(d.getDate() + validityDays);
            setDeadline(d.toISOString().slice(0, 10));
        }
    }, [validityDays, linkedRequestDetail]);

    // Request Barcode Search
    useEffect(() => {
        if (!linkedRequestBarcode || linkedRequestBarcode.length < 3 || linkedRequestDetail) {
            setRequestSearchResults([]);
            setRequestSearchOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setRequestSearchLoading(true);
            try {
                const res = await fetch(`/api/talep?search=${encodeURIComponent(linkedRequestBarcode)}&pageSize=5`);
                const json = await res.json();
                const items = json.items || [];
                setRequestSearchResults(items.map((r: any) => ({
                    id: r.id,
                    barcode: r.barcode,
                    subject: r.subject,
                    budget: r.budget,
                    unit: r.unit || "",
                    status: r.status || "",
                    currency: r.currency || "TL",
                    items: (r.items || []).map((i: any) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit || "Adet" }))
                })));
                setRequestSearchOpen(items.length > 0);
            } catch (e) {
                console.error(e);
            } finally {
                setRequestSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [linkedRequestBarcode, linkedRequestDetail]);

    const selectRequest = async (req: RequestSummary) => {
        // Set basic info first (UI feedback)
        setLinkedRequestBarcode(req.barcode);
        setTitle(`${req.subject} İçin Fiyat Araştırması`);
        setRequestSearchOpen(false);
        setLinkedRequestDetail(null); // Clear old detail while loading
        setRequestSearchLoading(true);

        try {
            // Fetch full details including ITEMS
            const res = await fetch(`/api/talep/${req.id}`);
            const val = await res.json();

            if (val && !val.error) {
                setLinkedRequestDetail({
                    id: val.id,
                    barcode: val.barcode,
                    subject: val.subject,
                    budget: val.budget,
                    unit: val.unit || "",
                    status: val.status || "",
                    currency: val.currency || "TL",
                    items: (val.items || []).map((i: any) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit || "Adet" }))
                });
                setRequestValidity("valid");

                const d = new Date();
                d.setDate(d.getDate() + validityDays);
                setDeadline(d.toISOString().slice(0, 10));
            }
        } catch (e) {
            console.error("Detail fetch failed", e);
            show({ title: "Detaylar alınamadı", variant: "error" });
        } finally {
            setRequestSearchLoading(false);
        }
    };

    const clearRequest = () => {
        setLinkedRequestDetail(null);
        setLinkedRequestBarcode("");
        setTitle("");
        setRequestValidity("unknown");
    };

    const toggleSupplier = (id: string) => {
        setSelectedSupplierIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const { suggestedSuppliers, otherSuppliers } = useMemo(() => {
        let filtered = registeredSuppliers;

        // Search Filter
        if (supplierSearchQuery) {
            const q = supplierSearchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
            );
        }

        // Category Matching
        // Get set of selected category IDs
        const selectedCatIds = new Set(Object.values(itemCategories).filter(Boolean));

        if (selectedCatIds.size === 0) {
            return { suggestedSuppliers: [], otherSuppliers: filtered };
        }

        const suggested: Supplier[] = [];
        const others: Supplier[] = [];

        filtered.forEach(s => {
            if (s.categoryId && selectedCatIds.has(s.categoryId)) {
                suggested.push(s);
            } else {
                others.push(s);
            }
        });

        // Sort suggested by name
        suggested.sort((a, b) => a.name.localeCompare(b.name));
        others.sort((a, b) => a.name.localeCompare(b.name));

        return { suggestedSuppliers: suggested, otherSuppliers: others };
    }, [registeredSuppliers, supplierSearchQuery, itemCategories]);

    // Select all suggested suppliers
    const selectAllSuggested = () => {
        const suggestedIds = suggestedSuppliers.map(s => s.id);
        setSelectedSupplierIds(prev => {
            const newSet = new Set([...prev, ...suggestedIds]);
            return Array.from(newSet);
        });
    };

    // Check if all suggested are already selected
    const allSuggestedSelected = suggestedSuppliers.length > 0 &&
        suggestedSuppliers.every(s => selectedSupplierIds.includes(s.id));

    const totalItems = linkedRequestDetail?.items.length || 0;
    const totalBudget = linkedRequestDetail?.budget || 0;

    const handleSubmit = async () => {
        if (!linkedRequestDetail) return show({ title: "Talep seçmelisiniz", variant: "warning" });
        if (!title) return show({ title: "Başlık zorunlu", variant: "warning" });
        if (!deadline) return show({ title: "Son teklif tarihi zorunlu", variant: "warning" });

        // Collect all suppliers
        const allSuppliers: { id?: string; email: string; name?: string }[] = [];

        // Add registered suppliers
        selectedSupplierIds.forEach(id => {
            const sup = registeredSuppliers.find(s => s.id === id);
            if (sup && sup.email) {
                allSuppliers.push({ id: sup.id, email: sup.email, name: sup.name });
            }
        });

        // Add manual emails
        if (manualEmails.trim()) {
            const emails = manualEmails.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
            const invalid = emails.filter(e => !/^\S+@\S+\.\S+$/.test(e));
            if (invalid.length > 0) return show({ title: "Geçersiz E-postalar", description: invalid.join(", "), variant: "warning" });
            emails.forEach(email => {
                if (!allSuppliers.some(s => s.email === email)) {
                    allSuppliers.push({ email });
                }
            });
        }

        if (allSuppliers.length === 0) {
            return show({ title: "En az bir tedarikçi seçin veya e-posta girin", variant: "warning" });
        }

        setLoading(true);
        try {
            const res = await fetch("/api/rfq", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    deadline,
                    notes,
                    requestIds: [linkedRequestDetail.id],
                    suppliers: allSuppliers,
                    itemCategories,
                    companyId: selectedCompanyId || null,
                    deliveryAddressId: selectedDeliveryAddressId || null
                })
            });

            const json = await res.json();
            if (res.ok) {
                show({ title: "RFQ Oluşturuldu", description: `Kod: ${json.rfxCode}. ${allSuppliers.length} tedarikçiye davet gönderildi.`, variant: "success" });
                router.push("/rfq/liste");
            } else {
                throw new Error(json.error || json.message || "failed");
            }
        } catch (e: any) {
            show({ title: "Hata", description: e.message, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
            <PageHeader
                title="Yeni RFQ Oluştur"
                description="Onaylanmış talepten tedarikçilere fiyat teklifi isteği gönderin."
                actions={
                    <Badge variant="info" className="text-sm">
                        {selectedSupplierIds.length + (manualEmails.trim() ? manualEmails.split(/[\n,;]+/).filter(Boolean).length : 0)} Tedarikçi Seçili
                    </Badge>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol: Talep ve Ayarlar */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Talep Arama Kartı */}
                    <Card title="Bağlı Talep" className="p-5">
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    label="Talep Barkodu / Konusu"
                                    placeholder="Talep aramak için yazın..."
                                    value={linkedRequestBarcode}
                                    onChange={e => {
                                        setLinkedRequestBarcode(e.target.value);
                                        if (linkedRequestDetail) clearRequest();
                                    }}
                                    disabled={!!linkedRequestDetail}
                                />
                                {requestSearchLoading && (
                                    <div className="absolute right-3 top-9 text-xs text-slate-400">Aranıyor...</div>
                                )}

                                {/* Search Results Dropdown */}
                                {requestSearchOpen && requestSearchResults.length > 0 && !linkedRequestDetail && (
                                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                        {requestSearchResults.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => selectRequest(r)}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-mono font-bold text-blue-700">{r.barcode}</span>
                                                    <Badge variant={r.status?.toLowerCase().includes("onay") ? "success" : "default"} className="text-xs">{r.status}</Badge>
                                                </div>
                                                <div className="text-sm text-slate-600 truncate">{r.subject}</div>
                                                <div className="text-xs text-slate-400 mt-1">{r.unit} • {formatNumberTR(r.budget)} {r.currency}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Request Detail */}
                            {linkedRequestDetail && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-lg font-bold text-blue-800">{linkedRequestDetail.barcode}</div>
                                            <div className="text-sm text-slate-700">{linkedRequestDetail.subject}</div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={clearRequest} className="text-red-500 hover:bg-red-50">
                                            Değiştir
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                        <div>
                                            <span className="text-slate-500">Birim:</span>
                                            <span className="ml-2 font-medium">{linkedRequestDetail.unit}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Bütçe:</span>
                                            <span className="ml-2 font-medium">{formatNumberTR(linkedRequestDetail.budget)} {linkedRequestDetail.currency}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Durum:</span>
                                            <Badge variant="success" className="ml-2">{linkedRequestDetail.status}</Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Talep Kalemleri */}
                    {linkedRequestDetail && (
                        <Card title={`Talep Kalemleri (${totalItems} Ürün)`} className="p-0 overflow-hidden">
                            <TableContainer>
                                <Table>
                                    <THead>
                                        <TR>
                                            <TH className="bg-slate-50 pl-4 w-12">#</TH>
                                            <TH className="bg-slate-50">Ürün/Hizmet Adı</TH>
                                            <TH className="bg-slate-50 w-64">Kategori</TH>
                                            <TH className="bg-slate-50 text-right w-24">Miktar</TH>
                                            <TH className="bg-slate-50 pr-4 w-24">Birim</TH>
                                        </TR>
                                    </THead>
                                    <TBody>
                                        {linkedRequestDetail.items.map((item, idx) => (
                                            <TR key={item.id}>
                                                <TD className="pl-4 text-slate-500">{idx + 1}</TD>
                                                <TD className="font-medium">{item.name}</TD>
                                                <TD>
                                                    <select
                                                        className="w-full text-sm border-slate-200 rounded-md focus:ring-blue-500 max-w-[250px]"
                                                        value={itemCategories[item.id] || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setItemCategories(prev => ({ ...prev, [item.id]: val }));

                                                            // Auto select category for other same-named items (smart UX)
                                                            const sameItems = linkedRequestDetail.items.filter(i => i.name === item.name && i.id !== item.id);
                                                            if (sameItems.length > 0) {
                                                                const updates: Record<string, string> = {};
                                                                sameItems.forEach(si => updates[si.id] = val);
                                                                if (Object.keys(updates).length) setItemCategories(prev => ({ ...prev, ...updates }));
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Seçiniz...</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </TD>
                                                <TD className="text-right font-mono">{item.quantity}</TD>
                                                <TD className="pr-4 text-slate-600">{item.unit}</TD>
                                            </TR>
                                        ))}
                                    </TBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    )}

                    {/* RFQ Ayarları */}
                    <Card title="RFQ Bilgileri" className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="RFQ Başlığı"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Fiyat araştırması başlığı..."
                                className="md:col-span-2"
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Teklif Süresi</label>
                                <div className="flex gap-2 items-center">
                                    <Select value={String(validityDays)} onChange={e => setValidityDays(Number(e.target.value))}>
                                        <option value="3">3 Gün</option>
                                        <option value="5">5 Gün</option>
                                        <option value="7">7 Gün</option>
                                        <option value="10">10 Gün</option>
                                        <option value="14">14 Gün</option>
                                        <option value="21">21 Gün</option>
                                        <option value="30">30 Gün</option>
                                    </Select>
                                </div>
                            </div>
                            <Input
                                label="Son Teklif Tarihi"
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                            />
                            <Input
                                label="Ek Notlar (Opsiyonel)"
                                multiline
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Teslimat koşulları, özel gereksinimler..."
                                className="md:col-span-2"
                            />
                        </div>

                        {/* Teslimat ve Fatura Bilgileri */}
                        <div className="border-t border-slate-200 pt-4 mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Teslimat ve Fatura Bilgileri</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Teslimat Adresi</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={selectedDeliveryAddressId}
                                        onChange={e => setSelectedDeliveryAddressId(e.target.value)}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {deliveryAddresses.map(addr => (
                                            <option key={addr.id} value={addr.id}>
                                                {addr.name} {addr.isDefault ? "(★ Varsayılan)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedDeliveryAddressId && (
                                        <p className="text-xs text-slate-500 mt-1 truncate">
                                            {deliveryAddresses.find(a => a.id === selectedDeliveryAddressId)?.address}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fatura Carisi</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={selectedCompanyId}
                                        onChange={e => setSelectedCompanyId(e.target.value)}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sağ: Tedarikçi Seçimi */}
                <div className="space-y-6">
                    <Card title="Kayıtlı Tedarikçiler" className="p-4">
                        <div className="space-y-3">
                            <Input
                                placeholder="Tedarikçi ara..."
                                value={supplierSearchQuery}
                                onChange={e => setSupplierSearchQuery(e.target.value)}
                            />

                            {suppliersLoading ? (
                                <div className="text-center py-4 text-slate-500">Yükleniyor...</div>
                            ) : (
                                <div className="max-h-80 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                    {/* Suggested Section */}
                                    {suggestedSuppliers.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-between gap-2">
                                                <span className="bg-emerald-100 px-2 py-0.5 rounded-full">✨ Önerilenler ({suggestedSuppliers.length})</span>
                                                {!allSuggestedSelected && (
                                                    <button
                                                        type="button"
                                                        onClick={selectAllSuggested}
                                                        className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 transition-colors font-semibold"
                                                    >
                                                        Tümünü Seç
                                                    </button>
                                                )}
                                            </div>
                                            {suggestedSuppliers.map(sup => (
                                                <label key={sup.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedSupplierIds.includes(sup.id)
                                                    ? "bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-200"
                                                    : "bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30"
                                                    }`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSupplierIds.includes(sup.id)}
                                                        onChange={() => toggleSupplier(sup.id)}
                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-800 truncate">{sup.name}</div>
                                                        <div className="flex justify-between items-center mt-0.5">
                                                            <div className="text-xs text-slate-500 truncate">{sup.email}</div>
                                                            <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{sup.categoryName}</div>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* No category selected warning */}
                                    {linkedRequestDetail && Object.values(itemCategories).filter(Boolean).length === 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                                            <span className="font-medium">💡 İpucu:</span> Kalemler için kategori seçerseniz uygun tedarikçiler otomatik önerilir.
                                        </div>
                                    )}

                                    {/* Others Section */}
                                    <div className="space-y-2">
                                        {suggestedSuppliers.length > 0 && (
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Diğer Tedarikçiler ({otherSuppliers.length})</div>
                                        )}

                                        {otherSuppliers.length === 0 && suggestedSuppliers.length === 0 ? (
                                            <div className="text-center py-4 text-slate-400 text-sm">Kayıtlı tedarikçi bulunamadı</div>
                                        ) : (
                                            otherSuppliers.map(sup => (
                                                <label key={sup.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedSupplierIds.includes(sup.id)
                                                    ? "bg-blue-50 border-blue-300 shadow-sm"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                                    }`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSupplierIds.includes(sup.id)}
                                                        onChange={() => toggleSupplier(sup.id)}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-800 truncate">{sup.name}</div>
                                                        <div className="text-xs text-slate-500 truncate">{sup.email}</div>
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Manuel E-posta Ekle" className="p-4">
                        <div className="space-y-3">
                            <Input
                                multiline
                                rows={4}
                                placeholder="Her satıra bir e-posta...&#10;ornek@firma.com&#10;tedarikci@sirket.com"
                                value={manualEmails}
                                onChange={e => setManualEmails(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">Kayıtlı olmayan tedarikçiler için manuel e-posta ekleyin.</p>
                        </div>
                    </Card>

                    <div className="sticky bottom-4 space-y-3">
                        <div className="bg-slate-100 rounded-lg p-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Toplam Kalem:</span>
                                <span className="font-bold">{totalItems}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Tahmini Bütçe:</span>
                                <span className="font-bold">{formatNumberTR(totalBudget)} {linkedRequestDetail?.currency || "TL"}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 mt-2 pt-2">
                                <span className="text-slate-600">Tedarikçi Sayısı:</span>
                                <span className="font-bold text-blue-600">
                                    {selectedSupplierIds.length + (manualEmails.trim() ? manualEmails.split(/[\n,;]+/).filter(Boolean).length : 0)}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="gradient"
                            size="lg"
                            className="w-full shadow-xl"
                            onClick={handleSubmit}
                            loading={loading}
                            disabled={!linkedRequestDetail || (selectedSupplierIds.length === 0 && !manualEmails.trim())}
                        >
                            RFQ Oluştur ve Davetleri Gönder
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Wrapper with Suspense for useSearchParams
export default function RfqOlusturPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor...</div>}>
            <RfqOlusturContent />
        </Suspense>
    );
}
