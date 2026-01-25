"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ContactChat from "@/components/ContactChat";
import { sendContactEmail } from "@/app/actions/contact";
import { trackMetaEvent } from "@/components/analytics/MetaPixel";
import TranslatableText from "@/components/ui/TranslatableText";

// Note: Metadata for client components should be in a parent server component
// This is handled by the page wrapper if needed

export default function ContactPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Auto-fill form data from user session
  useEffect(() => {
    if (session?.user) {
      const userName = session.user.name || "";
      const userEmail = session.user.email || "";
      
      // Split name into first and last name
      const nameParts = userName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData((prev) => ({
        ...prev,
        email: userEmail,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
      }));
    }
  }, [session]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await sendContactEmail(formData);
      
      if (result.success) {
        setIsSubmitted(true);
        setSubmitError("");
        
        // Track Lead event with Meta Pixel
        try {
          trackMetaEvent('Lead', {
            content_name: formData.subject,
            content_category: 'Contact Form',
          });
        } catch (trackError) {
          console.error('[Contact] Meta Pixel tracking error:', trackError);
        }
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
          });
        }, 3000);
      } else {
        setSubmitError(result.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-brand-h1 font-headline text-brand-blue mb-4 text-center">
              <TranslatableText text="Contact Us" />
            </h1>
            <p className="text-center text-brand-blue/80 mb-12 max-w-2xl mx-auto">
              <TranslatableText text="Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible." />
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column - Contact Information */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-brand-h2 font-headline text-brand-blue mb-2">
                    <TranslatableText text="Get in Touch" />
                  </h2>
                  <p className="text-brand-blue/80">
                    <TranslatableText text="We are here to help you elevate your style." />
                  </p>
                </div>

                {/* Contact Cards */}
                <div className="space-y-4">
                  {/* Email Card */}
                  <Card className="border border-gray-200 hover:border-brand-teal/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-brand-teal/10 p-3 rounded-lg">
                          <Mail className="h-6 w-6 text-brand-teal" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-brand-h3 font-headline text-brand-blue mb-1">
                            <TranslatableText text="Email" />
                          </h3>
                          <a
                            href="mailto:support@focusrobin.com"
                            className="text-brand-teal hover:underline"
                          >
                            support@focusrobin.com
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Phone Card */}
                  <Card className="border border-gray-200 hover:border-brand-teal/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-brand-teal/10 p-3 rounded-lg">
                          <Phone className="h-6 w-6 text-brand-teal" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-brand-h3 font-headline text-brand-blue mb-1">
                            <TranslatableText text="Phone" />
                          </h3>
                          <a
                            href="tel:+37060966069"
                            className="text-brand-blue hover:text-brand-teal transition-colors"
                          >
                            +370 609 66069
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Chat Card */}
                  <Card className="border border-gray-200 hover:border-brand-teal/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-brand-teal/10 p-3 rounded-lg">
                          <MessageCircle className="h-6 w-6 text-brand-teal" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-brand-h3 font-headline text-brand-blue mb-1">
                            <TranslatableText text="Live Chat" />
                          </h3>
                          <p className="text-brand-blue/80 text-sm mb-3">
                          <TranslatableText text="Need assistance? Contact support or chat with a stylist for instant advice." />
                          </p>
                          <Link href="/chat" prefetch={true}>
                            <Button
                              variant="outline"
                              className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                            >
                              <TranslatableText text="Start Chat" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Office Address */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                  <MapPin className="h-5 w-5 text-brand-blue/60 mt-0.5" />
                  <div>
                    <p className="text-sm text-brand-blue/80 font-semibold mb-1">
                      <TranslatableText text="Office Address" />
                    </p>
                    <p className="text-sm text-brand-blue/80">
                      Kaunas, Lithuania
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div>
                <Card className="border border-gray-200">
                  <CardContent className="p-6 sm:p-8">
                    {isSubmitted ? (
                      <div className="text-center py-8">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                          <h3 className="text-brand-h3 font-headline text-brand-blue mb-2">
                            <TranslatableText text="Message Sent!" />
                          </h3>
                          <p className="text-brand-blue/80">
                            <TranslatableText text="Thank you for contacting us. We'll get back to you soon." />
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* First Name & Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label
                              htmlFor="firstName"
                              className="text-brand-blue font-semibold mb-2 block"
                            >
                              First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) =>
                                handleInputChange("firstName", e.target.value)
                              }
                              className={`bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal ${
                                errors.firstName ? "border-red-500" : ""
                              }`}
                              placeholder="John"
                            />
                            {errors.firstName && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label
                              htmlFor="lastName"
                              className="text-brand-blue font-semibold mb-2 block"
                            >
                              Last Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) =>
                                handleInputChange("lastName", e.target.value)
                              }
                              className={`bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal ${
                                errors.lastName ? "border-red-500" : ""
                              }`}
                              placeholder="Doe"
                            />
                            {errors.lastName && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <Label
                            htmlFor="email"
                            className="text-brand-blue font-semibold mb-2 block"
                          >
                            Email Address <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className={`bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal ${
                              errors.email ? "border-red-500" : ""
                            }`}
                            placeholder="john.doe@example.com"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>

                        {/* Phone (Optional) */}
                        <div>
                          <Label
                            htmlFor="phone"
                            className="text-brand-blue font-semibold mb-2 block"
                          >
                            Phone Number <span className="text-brand-blue/60 text-sm font-normal">(Optional)</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            className="bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal"
                            placeholder="+370 609 66069"
                          />
                        </div>

                        {/* Subject */}
                        <div>
                          <Label
                            htmlFor="subject"
                            className="text-brand-blue font-semibold mb-2 block"
                          >
                            Subject <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.subject}
                            onValueChange={(value) =>
                              handleInputChange("subject", value)
                            }
                          >
                            <SelectTrigger
                              className={`bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal ${
                                errors.subject ? "border-red-500" : ""
                              }`}
                            >
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="order-support">
                                Order Support
                              </SelectItem>
                              <SelectItem value="product-inquiry">
                                Product Inquiry
                              </SelectItem>
                              <SelectItem value="returns">Returns</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.subject && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.subject}
                            </p>
                          )}
                        </div>

                        {/* Message */}
                        <div>
                          <Label
                            htmlFor="message"
                            className="text-brand-blue font-semibold mb-2 block"
                          >
                            Message <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) =>
                              handleInputChange("message", e.target.value)
                            }
                            rows={6}
                            className={`bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal resize-none ${
                              errors.message ? "border-red-500" : ""
                            }`}
                            placeholder="Tell us how we can help you..."
                          />
                          {errors.message && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.message}
                            </p>
                          )}
                        </div>

                        {/* Error Message */}
                        {submitError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm">{submitError}</p>
                          </div>
                        )}

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? <TranslatableText text="Sending..." /> : <TranslatableText text="Send Message" />}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ContactChat />
    </div>
  );
}

