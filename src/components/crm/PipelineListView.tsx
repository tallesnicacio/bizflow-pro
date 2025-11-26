'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineListViewProps {
    pipeline: any;
    onOpportunityClick: (opportunity: any) => void;
}

type SortField = 'title' | 'value' | 'stage' | 'contact' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function PipelineListView({ pipeline, onOpportunityClick }: PipelineListViewProps) {
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState<string>('all');

    // Flatten opportunities from all stages
    const allOpportunities = useMemo(() => {
        if (!pipeline?.stages) return [];
        return pipeline.stages.flatMap((stage: any) =>
            stage.opportunities.map((opp: any) => ({
                ...opp,
                stageName: stage.name,
                stageColor: stage.color
            }))
        );
    }, [pipeline]);

    // Filter and Sort
    const filteredAndSortedOpportunities = useMemo(() => {
        let result = [...allOpportunities];

        // Filter by Stage
        if (stageFilter !== 'all') {
            result = result.filter(opp => opp.stageId === stageFilter);
        }

        // Filter by Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(opp =>
                opp.title.toLowerCase().includes(query) ||
                opp.contact?.name?.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === 'contact') {
                aValue = a.contact?.name || '';
                bValue = b.contact?.name || '';
            } else if (sortField === 'stage') {
                aValue = a.stageName || '';
                bValue = b.stageName || '';
            } else if (sortField === 'value') {
                aValue = Number(a.value);
                bValue = Number(b.value);
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allOpportunities, sortField, sortDirection, searchQuery, stageFilter]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="text-muted-foreground/50" />;
        return <ArrowUpDown size={14} className={cn("text-primary", sortDirection === 'desc' && "transform rotate-180")} />;
    };

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-full">
            {/* Filters Header */}
            <div className="p-4 border-b border-border flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar oportunidades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-muted-foreground" />
                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">Todos os Estágios</option>
                        {pipeline?.stages.map((stage: any) => (
                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                        ))}
                    </select>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                    {filteredAndSortedOpportunities.length} resultados
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('title')}>
                                <div className="flex items-center gap-2">Título <SortIcon field="title" /></div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('value')}>
                                <div className="flex items-center gap-2">Valor <SortIcon field="value" /></div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('contact')}>
                                <div className="flex items-center gap-2">Contato <SortIcon field="contact" /></div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('stage')}>
                                <div className="flex items-center gap-2">Estágio <SortIcon field="stage" /></div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('createdAt')}>
                                <div className="flex items-center gap-2">Criado em <SortIcon field="createdAt" /></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredAndSortedOpportunities.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    Nenhuma oportunidade encontrada
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedOpportunities.map((opp) => (
                                <tr
                                    key={opp.id}
                                    onClick={() => onOpportunityClick(opp)}
                                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {opp.title}
                                    </td>
                                    <td className="px-6 py-4 text-primary font-medium">
                                        R$ {Number(opp.value).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {opp.contact?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className="px-2 py-1 rounded-full text-xs font-medium border"
                                            style={{
                                                backgroundColor: `${opp.stageColor}20`,
                                                borderColor: opp.stageColor,
                                                color: opp.stageColor || 'inherit'
                                            }}
                                        >
                                            {opp.stageName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(opp.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
