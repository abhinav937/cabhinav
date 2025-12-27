import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: string;
  abstract?: string;
  doi?: string;
  pdf?: string;
  url?: string;
}

const Publications: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    const API_URL = "https://api.cabhinav.com/api/server.js";

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const articles = data.data?.articles || data.articles || [];

      if (!articles || articles.length === 0) {
        setError("No publications found.");
        setLoading(false);
        return;
      }

      // Sort articles by year in descending order (newest first)
      const sortedArticles = articles.sort((a: any, b: any) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
      });

      setPublications(sortedArticles);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching publications:", error);
      setError("Failed to load publications. Please try again later.");
      setLoading(false);
    }
  };

  const highlightAuthor = (authors: string) => {
    return authors.replace(
      /Abhinav Chinnusamy/g,
      '<strong class="text-white">Abhinav Chinnusamy</strong>'
    );
  };

  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-gray-900 border border-gray-700 rounded-lg p-6 animate-pulse">
          <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-16 mb-4"></div>
          <div className="flex gap-4">
            <div className="h-8 bg-gray-700 rounded w-16"></div>
            <div className="h-8 bg-gray-700 rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <Helmet>
        <title>Publications - Abhinav Chinnusamy</title>
        <meta name="description" content="Academic publications and research papers by Abhinav Chinnusamy - Graduate Researcher in Power Electronics at UW-Madison." />
        <meta name="keywords" content="Abhinav Chinnusamy, Publications, Research Papers, Power Electronics, IEEE, Academic Publications, GaN, Solid State Circuit Breakers" />
        <link rel="canonical" href="https://cabhinav.com/publications/" />
      </Helmet>

      <div className="min-h-screen bg-black text-gray-300 font-mono">
        {/* Header */}
        <header className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Publications Archive
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Academic research and publications in power electronics, circuit design, and engineering.
            </p>
          </div>
        </header>

        {/* Publications Content */}
        <main className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            {loading && <SkeletonLoader />}

            {error && (
              <div className="text-center py-12">
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto">
                  <span className="material-symbols-outlined text-red-400 text-3xl mb-4 block">error</span>
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={fetchPublications}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && publications.length > 0 && (
              <div className="space-y-4">
                {publications.map((publication, index) => (
                  <article
                    key={index}
                    className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-300"
                  >
                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-2 text-white leading-tight">
                      {publication.title || "Untitled"}
                    </h3>

                    {/* Authors */}
                    <p
                      className="text-gray-400 mb-3 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: highlightAuthor(publication.authors || "Unknown Authors") }}
                    />

                    {/* Venue and Year */}
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                      {publication.venue && (
                        <span className="text-gray-300 font-medium">
                          {publication.venue}
                        </span>
                      )}
                      {publication.year && (
                        <span className="text-gray-500 bg-gray-800 px-2 py-1 rounded text-xs">
                          {publication.year}
                        </span>
                      )}
                    </div>

                    {/* Abstract */}
                    {publication.abstract && (
                      <p className="text-gray-400 mb-4 leading-relaxed text-sm border-l-2 border-gray-700 pl-4">
                        {publication.abstract}
                      </p>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-3">
                      {publication.doi && (
                        <a
                          href={publication.doi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded transition-colors duration-200"
                        >
                          <span className="material-symbols-outlined text-sm">link</span>
                          DOI
                        </a>
                      )}
                      {publication.pdf && (
                        <a
                          href={publication.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded transition-colors duration-200"
                        >
                          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                          PDF
                        </a>
                      )}
                      {publication.url && (
                        <a
                          href={publication.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded transition-colors duration-200"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Link
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Publications;
