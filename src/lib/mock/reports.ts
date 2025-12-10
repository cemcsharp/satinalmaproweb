export const mockReportData = {
    talep: {
        summary: { total: 145, open: 32, completed: 113 },
        byUnit: [
            { name: "Bilgi İşlem", count: 45 },
            { name: "İdari İşler", count: 38 },
            { name: "Satın Alma", count: 25 },
            { name: "Üretim", count: 22 },
            { name: "Pazarlama", count: 15 },
        ],
        byPerson: [
            { name: "Ahmet Yılmaz", count: 28 },
            { name: "Ayşe Demir", count: 24 },
            { name: "Mehmet Kaya", count: 19 },
            { name: "Fatma Çelik", count: 15 },
            { name: "Ali Vural", count: 12 },
        ],
        trend: [
            { date: "2024-01", count: 12 },
            { date: "2024-02", count: 15 },
            { date: "2024-03", count: 18 },
            { date: "2024-04", count: 22 },
            { date: "2024-05", count: 25 },
            { date: "2024-06", count: 20 },
        ]
    },
    siparis: {
        summary: { total: 89, totalAmount: 2450000, budgetGap: -150000 },
        byMethod: [
            { name: "Doğrudan Temin", count: 45, amount: 450000 },
            { name: "Pazarlık Usulü", count: 25, amount: 850000 },
            { name: "Açık İhale", count: 12, amount: 1150000 },
            { name: "İstisna", count: 7, amount: 0 },
        ],
        byUnitSpend: [
            { name: "Üretim", amount: 950000, budget: 1000000 },
            { name: "Bilgi İşlem", amount: 650000, budget: 600000 },
            { name: "İdari İşler", amount: 450000, budget: 500000 },
            { name: "Pazarlama", amount: 250000, budget: 300000 },
        ],
        trend: [
            { date: "2024-01", amount: 150000 },
            { date: "2024-02", amount: 220000 },
            { date: "2024-03", amount: 180000 },
            { date: "2024-04", amount: 350000 },
            { date: "2024-05", amount: 420000 },
            { date: "2024-06", amount: 380000 },
        ]
    },
    sozlesme: {
        summary: { total: 42, active: 35, ended: 7, expiringSoon: 5 },
        byUnit: [
            { name: "İdari İşler", count: 15 },
            { name: "Bilgi İşlem", count: 12 },
            { name: "Üretim", count: 8 },
            { name: "Pazarlama", count: 7 },
        ],
        expiringList: [
            { name: "Temizlik Hizmet Alımı", date: "2024-07-15", unit: "İdari İşler" },
            { name: "Yazılım Lisans Yenileme", date: "2024-07-20", unit: "Bilgi İşlem" },
            { name: "Araç Kiralama", date: "2024-08-01", unit: "İdari İşler" },
            { name: "Hammadde Tedariği", date: "2024-08-10", unit: "Üretim" },
            { name: "Reklam Ajansı", date: "2024-08-15", unit: "Pazarlama" },
        ]
    },
    fatura: {
        summary: { total: 156, paid: 124, unpaid: 32, totalAmount: 3250000 },
        bySupplier: [
            { name: "TeknoMarket A.Ş.", amount: 850000 },
            { name: "Ofis Dünyası Ltd.", amount: 420000 },
            { name: "Hammaddeci A.Ş.", amount: 380000 },
            { name: "Lojistik Çözümleri", amount: 250000 },
            { name: "Enerji Dağıtım A.Ş.", amount: 180000 },
        ],
        statusTrend: [
            { date: "2024-01", paid: 150000, unpaid: 20000 },
            { date: "2024-02", paid: 180000, unpaid: 40000 },
            { date: "2024-03", paid: 220000, unpaid: 30000 },
            { date: "2024-04", paid: 250000, unpaid: 50000 },
            { date: "2024-05", paid: 280000, unpaid: 60000 },
            { date: "2024-06", paid: 300000, unpaid: 80000 },
        ]
    },
    degerlendirme: {
        summary: { total: 45, avgScore: 78 },
        byScore: [
            { range: "Mükemmel (90-100)", count: 8, label: "Beklentileri Aşıyor" },
            { range: "İyi (75-89)", count: 15, label: "Beklentileri Karşılıyor" },
            { range: "Orta (60-74)", count: 12, label: "Kabul Edilebilir" },
            { range: "Zayıf (40-59)", count: 7, label: "Ciddi Eksiklikler" },
            { range: "Kabul Edilemez (0-39)", count: 3, label: "Şartnameye Uygun Değil" },
        ],
        actions: [
            { type: "Yüksek Öncelikli Çalışmaya Devam", count: 8, color: "text-emerald-600" },
            { type: "Takip Edilerek Çalışmaya Devam", count: 15, color: "text-blue-600" },
            { type: "İyileştirme Planı Talep Edilmeli", count: 12, color: "text-amber-600" },
            { type: "Alternatif Araştırılmalı", count: 7, color: "text-orange-600" },
            { type: "İlişki Sonlandırılmalı", count: 3, color: "text-red-600" },
        ]
    }
};
