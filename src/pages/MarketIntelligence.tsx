// ============================================================
// AMAN CEMENT CRM — Market Intelligence Dashboard
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTerritories } from '@/hooks/useTerritories';
import {
    useMarketSize,
    useBrandShare,
    useVisitIntel,
    useRealtimeMarketIntel,
    type MarketIntelFilters
} from '@/hooks/useMarketIntel';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp,
    Store,
    MapPin,
    Target,
    AlertTriangle,
    Building2,
    PieChart as PieChartIcon
} from 'lucide-react';
import { format } from 'date-fns';

const BRAND_COLORS: Record<string, string> = {
    'AMAN CEMENT': '#C41E3A', // Official Brand Color
    'Shah Cement': '#3A9EFF',
    'Crown Cement': '#9B6BFF',
    'Heidelberg': '#2ECC71',
    'Premier Cement': '#F39C12',
    'Meghna Cement': '#E74C5E',
    'Unknown': '#8B9CB8'
};

export function MarketIntelligence() {
    const { data: territories } = useTerritories();
    const [selectedTerritory, setSelectedTerritory] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const filters: MarketIntelFilters = {
        territory_id: selectedTerritory,
        date_range: dateRange?.from && dateRange?.to ? [dateRange.from, dateRange.to] : undefined
    };

    // Realtime hook initialization
    useRealtimeMarketIntel();

    const { data: marketSize, isLoading: loadingSize } = useMarketSize(filters);
    const { data: brandShare, isLoading: loadingBrand } = useBrandShare(filters);
    const { data: visitIntel, isLoading: loadingVisit } = useVisitIntel(filters);

    const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

    // Auto-select first territory if none selected
    if (territories && territories.length > 0 && !selectedTerritory) {
        setSelectedTerritory(territories[0].id);
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header and Master Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#F0F4F8] flex items-center gap-2">
                        <PieChartIcon className="w-6 h-6 text-[#C41E3A]" />
                        Market Intelligence
                    </h2>
                    <p className="text-[#8B9CB8] mt-1">
                        Real-time competitor tracking and territory market sizing
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="w-64">
                        <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
                            <SelectTrigger className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                                <MapPin className="w-4 h-4 mr-2 text-[#3A9EFF]" />
                                <SelectValue placeholder="Select Territory" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0A2A5C] border-white/10">
                                {territories?.map(t => (
                                    <SelectItem key={t.id} value={t.id} className="text-[#F0F4F8]">
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="hidden sm:block">
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    </div>
                </div>
            </div>

            {!selectedTerritory ? (
                <div className="flex justify-center items-center h-64 bg-[#0A2A5C] rounded-xl border border-white/10">
                    <p className="text-[#8B9CB8]">Please select a territory to view intelligence data.</p>
                </div>
            ) : (
                <>
                    {/* SECTION A: Market Size KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            icon={<Store className="w-5 h-5" />}
                            label="Potential Market Cap (Bags)"
                            value={marketSize ? formatNumber(marketSize.total_market_volume) : '...'}
                            subtext="Estimated total territory monthly volume"
                            color="#3A9EFF"
                        />
                        <MetricCard
                            icon={<Target className="w-5 h-5" />}
                            label="Our Captured Share"
                            value={marketSize && marketSize.total_market_volume > 0
                                ? `${((marketSize.our_volume / marketSize.total_market_volume) * 100).toFixed(1)}%`
                                : '0%'}
                            subtext={`${formatNumber(marketSize?.our_volume || 0)} bags monthly`}
                            color="#2ECC71"
                        />
                        <MetricCard
                            icon={<Building2 className="w-5 h-5" />}
                            label="Known Active Projects"
                            value={marketSize?.active_projects || 0}
                            subtext="Under construction"
                            color="#D4A843"
                        />
                        <MetricCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="Total Mapped Shops"
                            value={marketSize?.total_shops || 0}
                            subtext="Dealers & Retailers"
                            color="#9B6BFF"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* SECTION B: Brand Share Pie Chart */}
                        <Card className="bg-[#0A2A5C] border-white/10 lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-[#F0F4F8] text-lg flex items-center gap-2">
                                    <PieChartIcon className="w-5 h-5 text-[#3A9EFF]" />
                                    Brand Dominance (Est. Volume)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-72 flex justify-center items-center relative">
                                {loadingBrand ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3A9EFF]"></div>
                                ) : brandShare && brandShare.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={brandShare}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="est_volume"
                                                nameKey="brand"
                                            >
                                                {brandShare.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[entry.brand] || BRAND_COLORS['Unknown']} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#061A3A', border: '1px solid rgba(255,255,255,0.1)' }}
                                                itemStyle={{ color: '#F0F4F8' }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-[#8B9CB8]">No brand data found for this territory.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* SECTION B (cont): Brand Metrics Table */}
                        <Card className="bg-[#0A2A5C] border-white/10 lg:col-span-2 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-[#F0F4F8] text-lg flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-[#2ECC71]" />
                                    Competitor Share Analysis
                                </CardTitle>
                            </CardHeader>
                            <div className="overflow-x-auto p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-[#0F3460] text-xs uppercase text-[#8B9CB8]">
                                        <tr>
                                            <th className="px-4 py-3">Brand</th>
                                            <th className="px-4 py-3">Vol (Bags)</th>
                                            <th className="px-4 py-3">Share %</th>
                                            <th className="px-4 py-3">Primary Shops</th>
                                            <th className="px-4 py-3 w-48">Dominance Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 bg-[#0A2A5C]">
                                        {brandShare?.slice(0, 5).map((b) => {
                                            const sharePct = marketSize?.total_market_volume
                                                ? ((b.est_volume / marketSize.total_market_volume) * 100).toFixed(1)
                                                : 0;
                                            return (
                                                <tr key={b.brand} className="hover:bg-white/5 transition-colors text-sm">
                                                    <td className="px-4 py-3 font-medium text-[#F0F4F8] flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS[b.brand] || BRAND_COLORS['Unknown'] }}></span>
                                                        {b.brand}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#F0F4F8]">{formatNumber(b.est_volume)}</td>
                                                    <td className="px-4 py-3 text-[#3A9EFF] font-bold">{sharePct}%</td>
                                                    <td className="px-4 py-3 text-[#F0F4F8]">{b.primary_shops}</td>
                                                    <td className="px-4 py-3 text-[#8B9CB8] truncate max-w-xs" title={b.dominance_reason}>
                                                        {b.dominance_reason || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!brandShare || brandShare.length === 0) && !loadingBrand && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-[#8B9CB8]">No competitors logged yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* SECTION E: Recent Field Sentiment Alerts */}
                        <Card className="bg-[#0A2A5C] border-white/10">
                            <CardHeader>
                                <CardTitle className="text-[#F0F4F8] text-lg flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-[#FFC107]" />
                                    Recent Sentiment Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {loadingVisit ? (
                                    <p className="text-[#8B9CB8]">Loading alerts...</p>
                                ) : visitIntel?.sentiments && visitIntel.sentiments.length > 0 ? (
                                    visitIntel.sentiments.slice(0, 5).map((s, idx) => (
                                        <div key={idx} className="flex flex-col p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-[#F0F4F8]">{s.shop_name}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs text-white ${s.sentiment_score <= 2 ? 'bg-[#C41E3A]' :
                                                    s.sentiment_score >= 4 ? 'bg-[#2ECC71]' : 'bg-[#D4A843]'
                                                    }`}>
                                                    {s.sentiment_score <= 2 ? 'Negative' : s.sentiment_score >= 4 ? 'Positive' : 'Neutral'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#8B9CB8] mb-1">
                                                <span className="font-medium text-[#F0F4F8]">Feedback: </span>
                                                {s.complaint || 'No detailed feedback.'}
                                            </p>
                                            {s.praised_competitor && (
                                                <p className="text-xs text-[#E74C5E]">Praised {s.praised_competitor} instead.</p>
                                            )}
                                            <p className="text-xs text-[#4A5B7A] mt-2 text-right">
                                                {format(new Date(s.visit_date), 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-[#4A5B7A]">
                                        No sentiment alerts recorded recently.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* SECTION C: Pricing Intelligence */}
                        <Card className="bg-[#0A2A5C] border-white/10">
                            <CardHeader>
                                <CardTitle className="text-[#F0F4F8] text-lg flex items-center gap-2">
                                    <BarChart className="w-5 h-5 text-[#2ECC71]" />
                                    Pricing Flash (Retail BDT)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {visitIntel?.pricing && visitIntel.pricing.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-[#0F3460] text-xs uppercase text-[#8B9CB8]">
                                                <tr>
                                                    <th className="px-3 py-2 rounded-tl-lg">Brand</th>
                                                    <th className="px-3 py-2">Retail</th>
                                                    <th className="px-3 py-2">Dealer</th>
                                                    <th className="px-3 py-2 rounded-tr-lg">From Shop</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-[#F0F4F8]">
                                                {visitIntel.pricing.slice(0, 5).map((p, idx) => (
                                                    <tr key={idx} className="hover:bg-white/5">
                                                        <td className="px-3 py-2 font-medium">{p.brand}</td>
                                                        <td className="px-3 py-2 text-[#2ECC71]">৳ {p.retail_price}</td>
                                                        <td className="px-3 py-2 text-[#3A9EFF]">৳ {p.dealer_price}</td>
                                                        <td className="px-3 py-2 text-[#8B9CB8] truncate max-w-xs">{p.shop_name}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-[#4A5B7A]">
                                        No pricing flashes reported in the selected range.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* SECTION F: Sales Rep Visit Performance */}
                    <Card className="bg-[#0A2A5C] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-[#F0F4F8] text-lg flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#9B6BFF]" />
                                Sales Rep Visit Coverage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingVisit ? (
                                <p className="text-[#8B9CB8]">Loading rep visit data...</p>
                            ) : visitIntel?.rep_shop_visits && visitIntel.rep_shop_visits.length > 0 ? (
                                <div className="space-y-6">
                                    {visitIntel.rep_shop_visits.map((repData: any, idx: number) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                            {/* Rep Header */}
                                            <div className="bg-[#0F3460] px-4 py-3 flex items-center justify-between border-b border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#9B6BFF]/20 text-[#9B6BFF] flex items-center justify-center font-bold">
                                                        {repData.rep_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[#F0F4F8] font-semibold">{repData.rep_name}</h3>
                                                        <p className="text-xs text-[#8B9CB8]">Total Visits: {repData.total_visits}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-[#F0F4F8]">
                                                        Coverage: <span className="font-bold text-[#3A9EFF]">{repData.unique_shops_visited}</span>
                                                        <span className="text-[#8B9CB8]"> / {repData.total_assigned_shops} Shops</span>
                                                    </div>
                                                    <p className="text-xs text-[#8B9CB8]">
                                                        ({repData.total_assigned_shops > 0 ? Math.round((repData.unique_shops_visited / repData.total_assigned_shops) * 100) : 0}% Coverage)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Shops Inner Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="text-[11px] uppercase text-[#8B9CB8] border-b border-white/5">
                                                        <tr>
                                                            <th className="px-4 py-2">Shop Name</th>
                                                            <th className="px-4 py-2 text-center">Visits</th>
                                                            <th className="px-4 py-2">Outcome Summary</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 text-[#F0F4F8]">
                                                        {repData.shopsDetails?.map((shop: any, sIdx: number) => (
                                                            <tr key={sIdx} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-2 font-medium">{shop.shop_name}</td>
                                                                <td className="px-4 py-2 text-center text-[#2ECC71]">{shop.visit_count}</td>
                                                                <td className="px-4 py-2 text-[#E74C5E] text-xs max-w-[200px] truncate" title={shop.outcomes}>
                                                                    {shop.outcomes || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-[#4A5B7A]">
                                    No shop visits recorded by sales reps in this range.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

// Reusable Metric Card
interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext: string;
    color: string;
}

function MetricCard({ icon, label, value, subtext, color }: MetricCardProps) {
    return (
        <Card className="bg-[#0A2A5C] border-white/10 hover:border-white/20 transition-all">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}20` }}
                    >
                        <span style={{ color }}>{icon}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-[#F0F4F8]">{value}</p>
                        <p className="text-[#8B9CB8] text-xs mt-0.5">{label}</p>
                    </div>
                </div>
                <p className="text-[#8B9CB8] text-[11px] mt-3">{subtext}</p>
            </CardContent>
        </Card>
    );
}
