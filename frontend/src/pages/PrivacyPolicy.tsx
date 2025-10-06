import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiLock, FiShield, FiStar, FiEye, FiZap, 
  FiCheckCircle, FiUsers, FiRefreshCw
} from 'react-icons/fi';
import './PrivacyPolicy.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-policy-page">
      <div className="container">
        <div className="privacy-header">
          <h1>Your Privacy Matters to Us</h1>
          <p className="privacy-subtitle">
            We're committed to protecting your data and being transparent about how we use it. 
            This policy explains everything in simple terms.
          </p>
          <div className="trust-badges">
            <div className="trust-badge">
              <FiLock className="badge-icon" />
              <span className="badge-text">Secure & Encrypted</span>
            </div>
            <div className="trust-badge">
              <FiShield className="badge-icon" />
              <span className="badge-text">GDPR Compliant</span>
            </div>
            <div className="trust-badge">
              <FiStar className="badge-icon" />
              <span className="badge-text">No Data Selling</span>
            </div>
          </div>
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="privacy-content">
          <section className="privacy-section intro-section">
            <h2><FiCheckCircle /> Our Promise to You</h2>
            <div className="promise-grid">
              <div className="promise-item">
                <FiLock className="promise-icon" />
                <h3>Your Data is Safe</h3>
                <p>We use bank-level encryption and security measures to protect your information. Your data is never sold or shared without your permission.</p>
              </div>
              <div className="promise-item">
                <FiEye className="promise-icon" />
                <h3>Complete Transparency</h3>
                <p>We believe you should know exactly what data we collect and why. No hidden practices or confusing terms.</p>
              </div>
              <div className="promise-item">
                <FiZap className="promise-icon" />
                <h3>You're in Control</h3>
                <p>You can access, modify, or delete your data anytime. Your privacy settings are always in your hands.</p>
              </div>
            </div>
            <div className="simple-explanation">
              <h3><FiCheckCircle style={{ display: 'inline', marginRight: '8px' }} /> In Simple Terms:</h3>
              <p>
                We only collect the information we need to make our survey platform work great for you. 
                We protect it like it's our own, and we give you full control over your data. 
                That's our commitment to you.
              </p>
            </div>
          </section>

          <section className="privacy-section">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following types of personal information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
              <li><strong>Profile Information:</strong> Any additional information you choose to provide in your profile</li>
              <li><strong>Contact Information:</strong> Information you provide when contacting us for support</li>
            </ul>

            <h3>2.2 Survey Data</h3>
            <ul>
              <li><strong>Survey Content:</strong> Questions, responses, and metadata from surveys you create or participate in</li>
              <li><strong>Response Data:</strong> Your answers to surveys, including any personal information you choose to share</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized data about survey performance and usage</li>
            </ul>

            <h3>2.3 Technical Information</h3>
            <ul>
              <li><strong>Usage Data:</strong> Information about how you use our service, including pages visited and features used</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Cookies and Tracking:</strong> Data collected through cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our survey platform</li>
              <li><strong>Account Management:</strong> To create and manage your account and authenticate your identity</li>
              <li><strong>Communication:</strong> To send you service-related notifications, updates, and support responses</li>
              <li><strong>Analytics:</strong> To analyze usage patterns and improve our service performance</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Information Sharing and Disclosure</h2>
            
            <h3>4.1 Public Surveys</h3>
            <p>
              When you create a public survey or participate in one, certain information may be visible to other users:
            </p>
            <ul>
              <li>Survey questions and aggregated response data</li>
              <li>Public analytics and statistics (anonymized)</li>
              <li>Your responses if you choose to participate non-anonymously</li>
            </ul>

            <h3>4.2 Service Providers</h3>
            <p>
              We may share your information with trusted third-party service providers who assist us in operating our platform, such as:
            </p>
            <ul>
              <li>Cloud hosting and storage providers</li>
              <li>Email service providers</li>
              <li>Analytics and monitoring services</li>
              <li>Customer support tools</li>
            </ul>

            <h3>4.3 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law or in response to valid legal requests, such as:
            </p>
            <ul>
              <li>Court orders or subpoenas</li>
              <li>Government investigations</li>
              <li>Protection of our rights and safety</li>
              <li>Prevention of fraud or illegal activities</li>
            </ul>
          </section>

          <section className="privacy-section security-section">
            <h2><FiShield /> How We Keep Your Data Safe</h2>
            <div className="security-highlight">
              <p className="security-intro">
                Your security is our top priority. Here's how we protect your information:
              </p>
            </div>
            
            <div className="security-measures">
              <div className="security-item">
                <FiLock className="security-icon" />
                <div className="security-content">
                  <h3>Military-Grade Encryption</h3>
                  <p>All your data is encrypted both when stored and when transmitted, using the same standards banks use.</p>
                </div>
              </div>
              
              <div className="security-item">
                <FiShield className="security-icon" />
                <div className="security-content">
                  <h3>Secure Infrastructure</h3>
                  <p>Our servers are hosted in secure, certified data centers with 24/7 monitoring and physical security.</p>
                </div>
              </div>
              
              <div className="security-item">
                <FiUsers className="security-icon" />
                <div className="security-content">
                  <h3>Limited Access</h3>
                  <p>Only authorized team members can access your data, and only when necessary to provide support.</p>
                </div>
              </div>
              
              <div className="security-item">
                <FiRefreshCw className="security-icon" />
                <div className="security-content">
                  <h3>Regular Updates</h3>
                  <p>We continuously update our security measures and conduct regular security audits.</p>
                </div>
              </div>
            </div>
            
            <div className="honest-note">
              <h3><FiCheckCircle style={{ display: 'inline', marginRight: '8px' }} /> Being Honest About Security</h3>
              <p>
                While we use industry-leading security practices, no online service can guarantee 100% security. 
                We're committed to being transparent about our security measures and will notify you immediately 
                if any security incident affects your data.
              </p>
            </div>
          </section>

          <section className="privacy-section">
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Specific retention periods include:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Retained until you delete your account</li>
              <li><strong>Survey Data:</strong> Retained as long as the survey remains active</li>
              <li><strong>Response Data:</strong> Retained according to survey creator's settings</li>
              <li><strong>Analytics Data:</strong> Retained in anonymized form for service improvement</li>
              <li><strong>Legal Requirements:</strong> Retained as required by applicable laws</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>7. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul>
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience on our platform:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for basic functionality and security</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
              <li><strong>Performance Cookies:</strong> Monitor and improve service performance</li>
            </ul>
            <p>
              You can control cookie settings through your browser preferences, but disabling certain cookies may affect functionality.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards, including:
            </p>
            <ul>
              <li>Standard contractual clauses approved by relevant authorities</li>
              <li>Adequacy decisions by competent data protection authorities</li>
              <li>Certification schemes and codes of conduct</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>10. Children's Privacy</h2>
            <p>
              Our service is not intended for children under the age of 13 (or the minimum age in your jurisdiction). We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child without parental consent, we will take steps to delete such information.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="privacy-section">
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
            </p>
            <ul>
              <li>Posting the updated policy on our website</li>
              <li>Sending you an email notification (if you have an account)</li>
              <li>Displaying a prominent notice on our platform</li>
            </ul>
            <p>
              Your continued use of our service after the effective date of the updated policy constitutes acceptance of the changes.
            </p>
          </section>

          <section className="privacy-section">
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> <a href="mailto:privacy@surveyplatform.com">privacy@surveyplatform.com</a></p>
              <p><strong>General Support:</strong> <Link to="/contact">Contact Form</Link></p>
              <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@surveyplatform.com">dpo@surveyplatform.com</a></p>
            </div>
            <p>
              We will respond to your inquiries within a reasonable timeframe and in accordance with applicable laws.
            </p>
          </section>

          <section className="privacy-section">
            <h2>13. Governing Law</h2>
            <p>
              This Privacy Policy is governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law principles. Any disputes arising from this policy will be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].
            </p>
          </section>
        </div>

        <div className="privacy-footer">
          <p>
            This Privacy Policy is effective as of the date listed above and applies to all users of our service.
          </p>
          <div className="footer-links">
            <Link to="/contact" className="footer-link">Contact Us</Link>
            <Link to="/" className="footer-link">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
