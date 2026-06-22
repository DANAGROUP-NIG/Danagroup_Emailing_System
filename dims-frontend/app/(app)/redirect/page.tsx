/**
 * External Link Redirect Interstitial
 *
 * Security feature: Warns users before navigating to external URLs
 * - Validates URLs to prevent open redirects
 * - Displays the target domain clearly
 * - Requires user confirmation before proceeding
 * - Protects against phishing via malicious links in emails
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

// Allowed URL schemes
const ALLOWED_SCHEMES = ['http:', 'https:'];

// Blocked URL patterns (potential phishing attempts)
const BLOCKED_PATTERNS = [
  /^(javascript|data|vbscript|file|ftp|telnet|ldap|news|gopher):/i,
  /[<>"'`]/, // HTML/script injection attempts
  /\/\/.+@/, // Credentials in URL (user:pass@host)
];

interface ParsedUrl {
  url: string;
  isValid: boolean;
  isExternal: boolean;
  error?: string;
}

/**
 * Validate and sanitize the redirect URL
 */
function validateRedirectUrl(urlParam: string | null): ParsedUrl {
  if (!urlParam) {
    return { url: '', isValid: false, isExternal: false, error: 'No URL provided' };
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(urlParam);
  } catch {
    return { url: urlParam, isValid: false, isExternal: false, error: 'Invalid URL encoding' };
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(decodedUrl)) {
      return { url: decodedUrl, isValid: false, isExternal: false, error: 'Potentially malicious URL detected' };
    }
  }

  let url: URL;
  try {
    url = new URL(decodedUrl);
  } catch {
    // Try prepending https:// if no scheme provided
    try {
      url = new URL(`https://${decodedUrl}`);
    } catch {
      return { url: decodedUrl, isValid: false, isExternal: false, error: 'Invalid URL format' };
    }
  }

  // Validate scheme
  if (!ALLOWED_SCHEMES.includes(url.protocol)) {
    return { url: decodedUrl, isValid: false, isExternal: false, error: 'URL scheme not allowed' };
  }

  // Check if external (different hostname)
  const isExternal = url.hostname !== 'dims.danagroup.internal' && 
                    url.hostname !== window.location.hostname;

  // Validate hostname (must have at least one dot for external domains)
  if (isExternal && !url.hostname.includes('.')) {
    return { url: decodedUrl, isValid: false, isExternal: false, error: 'Invalid hostname' };
  }

  return { url: decodedUrl, isValid: true, isExternal };
}

function RedirectContent() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get('url');
  
  const { url, isValid, error } = validateRedirectUrl(urlParam);

  if (!isValid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
          </div>
          <CardDescription>
            This link cannot be opened because it may be unsafe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error || 'The URL provided is not valid or is not allowed.'}
          </p>
          <Button onClick={() => window.history.back()} variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  let displayUrl: string;
  try {
    const urlObj = new URL(url);
    displayUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    displayUrl = url;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ExternalLink className="h-6 w-6 text-amber-600" />
          <CardTitle>External Link Warning</CardTitle>
        </div>
        <CardDescription>
          You are about to leave the Dana Internal Mail System and visit an external website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700 mb-1">Destination:</p>
          <code className="break-all text-sm text-foreground block">
            {displayUrl}
          </code>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>Please note:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>External websites are not controlled by Dana Group</li>
            <li>Be cautious when entering personal information</li>
            <li>Verify the URL before proceeding</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => {
              // Additional validation before navigation
              if (isValid) {
                window.location.href = url;
              }
            }} 
            variant="primary"
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Continue to External Site
          </Button>
          <Button onClick={() => window.history.back()} variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel and Go Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RedirectPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }>
        <RedirectContent />
      </Suspense>
    </div>
  );
}
