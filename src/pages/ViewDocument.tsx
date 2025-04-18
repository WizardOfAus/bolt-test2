import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Document, Page, pdfjs } from 'react-pdf';
import toast from 'react-hot-toast';
import { FileX, Mail } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ViewDocument() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already submitted email (using localStorage)
    const storedEmail = localStorage.getItem('document_access_email');
    if (storedEmail) {
      setHasAccess(true);
      setEmail(storedEmail);
    }
    
    // Only fetch the document if the user has access
    if (hasAccess) {
      fetchDocument();
      
      // Set up an interval to refresh the URL every 10 minutes
      const refreshInterval = setInterval(() => {
        fetchDocument();
      }, 10 * 60 * 1000); // 10 minutes in milliseconds
      
      return () => clearInterval(refreshInterval);
    } else {
      setLoading(false);
    }
  }, [id, hasAccess]);

  async function fetchDocument() {
    try {
      // Get the latest document
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (documentsError) throw documentsError;

      if (!documents) {
        toast.error("No documents found in the database");
        setLoading(false);
        return;
      }

      // Then get the signed URL with short expiration (10 minutes)
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .createSignedUrl(documents.file_path, 600); // 600 seconds = 10 minutes

      if (fileError) throw fileError;

      setPdfUrl(fileData.signedUrl);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading document:', error);
      toast.error('Error loading document: ' + error.message);
      setLoading(false);
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Disable right-click on PDF
  const preventRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast("Right click is disabled for document security", { 
      icon: '🔒',
      duration: 2000
    });
    return false;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitting(true);
    
    try {
      // Collect user agent and IP information
      const userAgent = navigator.userAgent;
      let ipAddress = "unknown";
      
      try {
        // Try to get IP address from an external service
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.error("Could not fetch IP address:", ipError);
      }
      
      // Log access with additional information
      const { error } = await supabase
        .from('document_access')
        .insert([{ 
          email, 
          accessed_at: new Date().toISOString(),
          user_agent: userAgent,
          ip_address: ipAddress
        }]);

      if (error) {
        throw error;
      }

      // Store email in localStorage to remember this user
      localStorage.setItem('document_access_email', email);
      
      // Set access flag to true to trigger document fetching
      setHasAccess(true);
      
      toast.success('Access granted!');
    } catch (error: any) {
      console.error('Access logging error:', error);
      toast.error(error.message || 'An error occurred');
      setEmailSubmitting(false);
    }
  };

  if (loading && hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white p-8 rounded-lg shadow max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome to Daniel's Portfolio</h2>
        <p className="text-gray-600 mb-6 text-center">Please enter your email to access the portfolio document.</p>
        
        <form onSubmit={handleEmailSubmit} className="w-full max-w-md">
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            disabled={emailSubmitting}
          >
            {emailSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Access Portfolio
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div onContextMenu={preventRightClick} className="select-none max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
      <div className="mb-4 bg-blue-50 p-3 rounded text-blue-700 text-sm">
        <p>Any questions or issues, please email me at helpfuldyz@gmail.com</p>
      </div>
      {pdfUrl ? (
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          options={{
            cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts`,
          }}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              className="mb-4"
              renderTextLayer={false}
              renderAnnotationLayer={false}
              scale={1.0}
            />
          ))}
        </Document>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <FileX className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">Document Not Available</h3>
          <p className="text-gray-600 mt-2">The document could not be loaded. Please try again later.</p>
        </div>
      )}
    </div>
  );
}