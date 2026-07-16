'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { contactsApi } from '@/lib/api/contacts';

export default function ContactsSettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: number; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0] || null);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsImporting(true);
      setImportResult(null);
      const res = await contactsApi.importCsv(file);
      setImportResult({ success: res.data.imported });
      setFile(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setImportResult({ error: e.response?.data?.message || e.message || 'Failed to import contacts' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Personal Contacts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Import contacts from a CSV file to quickly find them when composing emails.
        </p>
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4">Import CSV</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isImporting}
              />
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border rounded-lg border-dashed">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground flex-1 truncate">
                  {file ? file.name : 'Select a CSV file...'}
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="shrink-0 w-full sm:w-auto"
            >
              {isImporting ? 'Importing...' : 'Import Contacts'}
              {!isImporting && <Upload className="ml-2 h-4 w-4" />}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            The CSV file should contain columns for <span className="font-semibold">Name</span> and <span className="font-semibold">Email</span>.
          </p>
        </div>

        {importResult?.success !== undefined && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            Successfully imported {importResult.success} contact(s).
          </div>
        )}
        
        {importResult?.error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {importResult.error}
          </div>
        )}
      </div>
    </div>
  );
}
