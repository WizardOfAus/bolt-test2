import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchAccessLogs();
  }, []);

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching documents');
    } else {
      setDocuments(data || []);
    }
  }

  async function fetchAccessLogs() {
    const { data, error } = await supabase
      .from('document_access')
      .select('*')
      .order('accessed_at', { ascending: false });

    if (error) {
      toast.error('Error fetching access logs');
    } else {
      setAccessLogs(data || []);
    }
  }

  async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            name: file.name,
            file_path: fileName,
            size: file.size,
          },
        ]);

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully!');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Error uploading document: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(id: string, path: string) {
    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .match({ id });

      if (dbError) throw dbError;

      toast.success('Document deleted successfully!');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Error deleting document: ' + error.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Upload Document</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">
            <Upload className="h-5 w-5 mr-2" />
            Choose PDF
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={uploadDocument}
              disabled={uploading}
            />
          </label>
          {uploading && <p className="text-gray-500">Uploading...</p>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Documents</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{Math.round(doc.size / 1024)} KB</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Access Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accessed At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accessLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{log.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(log.accessed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}