import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  AVYO In-Gathering ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services (collectively, the "Service"). The AVYO In-Gathering app is a social networking platform designed to help users connect at events through profile matching, QR code networking, and location-based features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium mb-3 text-foreground">2.1 Personal Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect personal information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Profile information (photos, bio, interests, preferences)</li>
                  <li>Event registration and attendance information</li>
                  <li>Messages and communications sent through our platform</li>
                  <li>Payment information for event registration (processed securely)</li>
                </ul>

                <h3 className="text-xl font-medium mb-3 text-foreground">2.2 Location Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>We collect and use location data to:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                  <li>Show nearby events and venues on interactive maps</li>
                  <li>Provide directions to event locations</li>
                  <li>Enable location-based networking and matching at events</li>
                  <li>Verify event check-ins and attendance</li>
                  <li>Enhance user experience with location-relevant content</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Location data is collected only when you grant permission and can be disabled in your device settings at any time. We use both precise location (GPS) and approximate location services depending on the feature.
                </p>

                <h3 className="text-xl font-medium mb-3 text-foreground">2.3 Camera and QR Code Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>We access your device camera to:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4 ml-4">
                  <li>Scan QR codes for quick networking and profile sharing</li>
                  <li>Scan event check-in codes and registration links</li>
                  <li>Allow you to take and upload profile photos</li>
                  <li>Enable photo sharing within event conversations</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Camera access is only used when actively using these features. We do not store or access photos without your explicit permission. QR code scanning is processed locally on your device for security.
                </p>

                <h3 className="text-xl font-medium mb-3 text-foreground">2.4 Device Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We automatically collect certain device information including device type, operating system, unique device identifiers, mobile network information, and app usage analytics to improve our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">We use collected information to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide and maintain our networking and event services</li>
                  <li>Create and manage your user profile and account</li>
                  <li>Match you with other users at events based on shared interests</li>
                  <li>Process event registrations and payments</li>
                  <li>Send notifications about matches, messages, and event updates</li>
                  <li>Provide location-based services and event recommendations</li>
                  <li>Enable QR code networking and profile sharing</li>
                  <li>Facilitate messaging and communication between users</li>
                  <li>Improve our app functionality and user experience</li>
                  <li>Ensure platform safety and prevent fraudulent activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Information Sharing and Disclosure</h2>
                
                <h3 className="text-xl font-medium mb-3 text-foreground">4.1 With Other Users</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your profile information may be visible to other event attendees for networking purposes. You control what information is shared through your privacy settings.
                </p>

                <h3 className="text-xl font-medium mb-3 text-foreground">4.2 With Event Organizers</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Event organizers may access attendee information necessary for event management, including names, contact information, and attendance status.
                </p>

                <h3 className="text-xl font-medium mb-3 text-foreground">4.3 Service Providers</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We share information with trusted third-party service providers who help us operate our platform, including payment processors, cloud storage providers, and analytics services.
                </p>

                <h3 className="text-xl font-medium mb-3 text-foreground">4.4 Legal Requirements</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may disclose information when required by law, to protect our rights, or to ensure user safety.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, secure data transmission, and regular security assessments.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account and associated data at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Your Privacy Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Access, update, or delete your personal information</li>
                  <li>Control location sharing and camera access permissions</li>
                  <li>Opt out of marketing communications</li>
                  <li>Request data portability</li>
                  <li>Withdraw consent for data processing</li>
                  <li>File complaints with relevant data protection authorities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">9. International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Continued use of our service after changes constitutes acceptance of the revised policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong>AVYO In-Gathering</strong><br />
                    Email: privacy@avyo.com<br />
                    Address: [Your Company Address]<br />
                    Phone: [Your Contact Number]
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;