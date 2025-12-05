"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { useToast } from "@/hooks/use-toast";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await subscribeNewsletter(formData);

      if (result && "error" in result) {
        toast({
          title: "Subscription failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result && "success" in result && result.success) {
        toast({
          title: "Success!",
          description: result.message || "Thank you for subscribing to our newsletter!",
        });
        setEmail(""); // Clear the input
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        type="email"
        placeholder="Enter your email"
        className="bg-background"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isSubmitting}
        required
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}

