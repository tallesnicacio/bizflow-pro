'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { getAppointments, createAppointment } from '@/lib/calendar-actions';
import { getContacts } from '@/lib/crm-actions';
import { cn } from '@/lib/utils';

const TENANT_ID = 'demo-tenant-1';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function CalendarPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        duration: '60',
        contactId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [apptData, contactsData] = await Promise.all([
                getAppointments(TENANT_ID),
                getContacts(TENANT_ID)
            ]);
            setAppointments(apptData);
            setContacts(contactsData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    }

    function getDaysInMonth(date: Date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    }

    const { days, firstDay } = getDaysInMonth(currentDate);

    async function handleCreateAppointment(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const start = new Date(`${formData.date}T${formData.time}`);
            const end = new Date(start.getTime() + Number(formData.duration) * 60000);

            await createAppointment({
                title: formData.title,
                startTime: start,
                endTime: end,
                contactId: formData.contactId || undefined,
                tenantId: TENANT_ID,
            });
            setIsModalOpen(false);
            setFormData({ title: '', date: '', time: '', duration: '60', contactId: '' });
            await loadData();
        } catch (error) {
            console.error('Failed to create appointment', error);
        } finally {
            setIsLoading(false);
        }
    }

    function changeMonth(delta: number) {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    }

    function isSameDay(d1: Date, d2: Date) {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
                    <p className="text-muted-foreground">Gerencie compromissos e instalações</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-background rounded-md transition-colors"><ChevronLeft size={20} /></button>
                        <span className="px-4 font-medium min-w-[140px] text-center">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-background rounded-md transition-colors"><ChevronRight size={20} /></button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                    >
                        <Plus size={20} />
                        Novo Evento
                    </button>
                </div>
            </header>

            <div className="flex-1 glass-panel p-6 overflow-hidden flex flex-col">
                {/* Calendar Grid Header */}
                <div className="grid grid-cols-7 mb-4">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-muted/10 rounded-lg" />
                    ))}
                    {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dayAppointments = appointments.filter(a => isSameDay(new Date(a.startTime), date));
                        const isToday = isSameDay(new Date(), date);

                        return (
                            <div
                                key={day}
                                className={cn(
                                    "border border-border rounded-lg p-2 flex flex-col gap-1 transition-all hover:border-primary/50",
                                    isToday ? "bg-primary/5 border-primary/30" : "bg-card"
                                )}
                            >
                                <span className={cn(
                                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                )}>
                                    {day}
                                </span>
                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                    {dayAppointments.map(apt => (
                                        <div
                                            key={apt.id}
                                            className="text-[10px] p-1.5 rounded bg-primary/10 text-primary border-l-2 border-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                                            title={`${apt.title} - ${new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        >
                                            {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {apt.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Compromisso"
            >
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Título</label>
                        <input
                            required
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Visita Técnica"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Data</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Hora</label>
                            <input
                                required
                                type="time"
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Duração (min)</label>
                            <select
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                            >
                                <option value="30">30 min</option>
                                <option value="60">1 hora</option>
                                <option value="90">1.5 horas</option>
                                <option value="120">2 horas</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Contato (Opcional)</label>
                            <select
                                className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={formData.contactId}
                                onChange={e => setFormData({ ...formData, contactId: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Agendando...' : 'Agendar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
