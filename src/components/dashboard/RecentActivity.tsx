import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShoppingCart, UserPlus } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string;
    date: Date;
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
    return (
        <div className="bg-card border border-border rounded-xl shadow-sm h-full">
            <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-lg">Atividade Recente</h3>
            </div>
            <div className="p-6">
                <div className="space-y-6">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
                    ) : (
                        activities.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className={`mt-1 p-2 rounded-full h-fit ${item.type === 'ORDER' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {item.type === 'ORDER' ? <ShoppingCart size={16} /> : <UserPlus size={16} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: ptBR })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
