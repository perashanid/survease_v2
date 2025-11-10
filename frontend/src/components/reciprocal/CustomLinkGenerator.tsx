import React, { useState, useEffect } from 'react';
import { generateCustomLink, getCustomLinks, deactivateCustomLink } from '../../services/api';
import './CustomLinkGenerator.css';

interface CustomLink {
  _id: string;
  token: string;
  surveyId: string;
  createdBy: string;
  expiresAt?: Date;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

interface CustomLinkGeneratorProps {
  surveyId: string;
}

const CustomLinkGenerator: React.FC<CustomLinkGeneratorProps> = ({ surveyId }) => {
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadCustomLinks();
  }, [surveyId]);

  const loadCustomLinks = async () => {
    try {
      setLoading(true);
      const customLinks = await getCustomLinks(surveyId);
      setLinks(customLinks);
    } catch (err) {
      console.error('Failed to load custom links:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const expiresAt = expirationDays > 0 
        ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      
      const newLink = await generateCustomLink(surveyId, expiresAt);
      setLinks([newLink, ...links]);
    } catch (err: any) {
      alert(err.message || 'Failed to generate custom link');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeactivate = async (linkId: string) => {
    if (!confirm('Are you sure you want to deactivate this link?')) return;
    
    try {
      await deactivateCustomLink(linkId);
      setLinks(links.map(link => 
        link._id === linkId ? { ...link, isActive: false } : link
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate link');
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/survey/custom/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getFullUrl = (token: string) => {
    return `${window.location.origin}/survey/custom/${token}`;
  };

  if (loading) {
    return <div className="custom-links-loading">Loading custom links...</div>;
  }

  return (
    <div className="custom-link-generator">
      <h3>Custom Survey Links</h3>
      <p className="custom-links-description">
        Generate custom links to share your survey. Responses from these links help you unlock other responses!
      </p>

      <div className="generate-section">
        <div className="expiration-input">
          <label htmlFor="expiration">Expiration (days):</label>
          <input
            id="expiration"
            type="number"
            min="0"
            max="365"
            value={expirationDays}
            onChange={(e) => setExpirationDays(parseInt(e.target.value) || 0)}
          />
          <span className="expiration-hint">
            {expirationDays === 0 ? 'Never expires' : `Expires in ${expirationDays} days`}
          </span>
        </div>
        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : '+ Generate New Link'}
        </button>
      </div>

      {links.length === 0 ? (
        <div className="no-links">
          <p>No custom links yet. Generate one to get started!</p>
        </div>
      ) : (
        <div className="custom-links-list">
          {links.map((link) => (
            <div key={link._id} className={`custom-link-card ${!link.isActive ? 'inactive' : ''}`}>
              <div className="link-header">
                <span className={`link-status ${link.isActive ? 'active' : 'inactive'}`}>
                  {link.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
                <span className="link-usage">
                  {link.usageCount} {link.usageCount === 1 ? 'use' : 'uses'}
                </span>
              </div>
              
              <div className="link-url">
                <input
                  type="text"
                  value={getFullUrl(link.token)}
                  readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(link.token)}
                >
                  {copiedToken === link.token ? '✓ Copied!' : 'Copy'}
                </button>
              </div>

              <div className="link-meta">
                <span>Created: {new Date(link.createdAt).toLocaleDateString()}</span>
                {link.expiresAt && (
                  <span>
                    Expires: {new Date(link.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {link.isActive && (
                <button
                  className="deactivate-button"
                  onClick={() => handleDeactivate(link._id)}
                >
                  Deactivate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomLinkGenerator;
