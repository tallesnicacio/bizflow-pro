'use client';

import { useState, useEffect } from 'react';
import { getPublicForm, submitPublicForm } from '@/lib/form-actions';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function PublicFormPage({ params }: { params: { slug: string } }) {
    const [form, setForm] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        loadForm();
    }, [params.slug]);

    async function loadForm() {
        try {
            const data = await getPublicForm(params.slug);
            setForm(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const result = await submitPublicForm(params.slug, formData);
            if (result.success) {
                setIsSuccess(true);
                setFormData({});
            } else {
                setError(result.error || 'Failed to submit form');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleInputChange(key: string, value: any) {
        setFormData(prev => ({ ...prev, [key]: value }));
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
    }

    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Form Not Found</h1>
                    <p className="text-gray-500 mt-2">This form does not exist or has been disabled.</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Received!</h2>
                    <p className="text-gray-600 mb-6">Thank you for contacting us. We will get back to you shortly.</p>
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="text-primary hover:underline"
                    >
                        Submit another response
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-primary px-6 py-4">
                    <h1 className="text-xl font-bold text-primary-foreground">{form.pipelineName}</h1>
                    <p className="text-primary-foreground/80 text-sm">Contact Form</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name / Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.title || ''}
                            onChange={e => handleInputChange('title', e.target.value)}
                            placeholder="Your Name or Subject"
                        />
                    </div>

                    {form.stage.fields.map((field: any) => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.formLabel || field.name}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {field.type === 'LONG_TEXT' ? (
                                <textarea
                                    required={field.required}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                                    value={formData[field.id] || ''}
                                    onChange={e => handleInputChange(field.id, e.target.value)}
                                />
                            ) : field.type === 'SELECT' || field.type === 'RADIO' ? (
                                <select
                                    required={field.required}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData[field.id] || ''}
                                    onChange={e => handleInputChange(field.id, e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    {/* Parse options if available */}
                                    {/* Simplified for now, assuming options would be stored/parsed */}
                                    <option value="Option 1">Option 1</option>
                                    <option value="Option 2">Option 2</option>
                                </select>
                            ) : (
                                <input
                                    required={field.required}
                                    type={field.type === 'NUMBER' || field.type === 'CURRENCY' ? 'number' : 'text'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={formData[field.id] || ''}
                                    onChange={e => handleInputChange(field.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
