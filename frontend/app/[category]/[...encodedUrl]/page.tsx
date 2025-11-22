import { ProcessFlow } from "@/components/process-flow";
import { normalizeUrl } from "@/lib/utils";

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; encodedUrl: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category, encodedUrl } = await params;
  const searchParamsResolved = await searchParams;

  // Reconstruct the URL from segments
  // Handle potential array from catch-all route
  const segments = Array.isArray(encodedUrl) ? encodedUrl : [encodedUrl];
  const rawPath = segments.join('/');
  
  // Decode the path
  let decodedUrl = rawPath;
  try {
    decodedUrl = decodeURIComponent(rawPath);
  } catch (e) {
    // If decoding fails (e.g. malformed URI sequence), use the raw path
    console.warn('Failed to decode URL:', rawPath, e);
  }
  
  // Normalize (ensure protocol, fix split protocols)
  decodedUrl = normalizeUrl(decodedUrl);

  // If there are search params in the outer URL, and the decoded URL doesn't already have them
  // (which it wouldn't if it wasn't encoded), we might want to append them.
  // However, distinguishing between search params for the app vs the target URL is ambiguous 
  // if not encoded. 
  // For now, we'll assume if the user pasted an unencoded URL with query params, 
  // Next.js parsed them into searchParams.
  // We can attempt to reconstruct them if the decoded URL doesn't look like a full URL with query.
  
  if (Object.keys(searchParamsResolved).length > 0) {
    try {
      const urlObj = new URL(decodedUrl);
      // Append params found in the address bar to the target URL
      Object.entries(searchParamsResolved).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => urlObj.searchParams.append(key, v));
        } else if (value) {
          urlObj.searchParams.append(key, value);
        }
      });
      decodedUrl = urlObj.toString();
    } catch {
      // If we can't parse the URL, just ignore the search params
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-50">
      <ProcessFlow category={category} url={decodedUrl} />
    </main>
  );
}
