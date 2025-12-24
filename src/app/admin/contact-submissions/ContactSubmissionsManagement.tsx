"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getContactSubmissions,
  markContactSubmissionAsRead,
  deleteContactSubmission,
} from "@/app/actions/contactSubmissions";
import { Mail, Phone, Calendar, MessageSquare, Trash2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactSubmissionsManagementProps {
  initialSubmissions: ContactSubmission[];
}

const getSubjectLabel = (subject: string): string => {
  const subjects: Record<string, string> = {
    "order-support": "Order Support",
    "product-inquiry": "Product Inquiry",
    "returns": "Returns",
    "other": "Other",
  };
  return subjects[subject] || subject;
};

export default function ContactSubmissionsManagement({
  initialSubmissions,
}: ContactSubmissionsManagementProps) {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>(initialSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const result = await getContactSubmissions();
      if (result.success && result.submissions) {
        setSubmissions(result.submissions);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (submissionId: string) => {
    const result = await markContactSubmissionAsRead(submissionId);
    if (result.success) {
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, read: true } : sub))
      );
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission({ ...selectedSubmission, read: true });
      }
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) {
      return;
    }

    const result = await deleteContactSubmission(submissionId);
    if (result.success) {
      setSubmissions((prev) => prev.filter((sub) => sub.id !== submissionId));
      if (selectedSubmission?.id === submissionId) {
        setIsDialogOpen(false);
        setSelectedSubmission(null);
      }
    } else {
      alert(result.error || "Failed to delete submission");
    }
  };

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsDialogOpen(true);
    if (!submission.read) {
      handleMarkAsRead(submission.id);
    }
  };

  const unreadCount = submissions.filter((sub) => !sub.read).length;

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Contact Submissions</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage contact form submissions
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No contact submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card
                key={submission.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !submission.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => handleViewSubmission(submission)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {submission.firstName} {submission.lastName}
                        </h3>
                        {!submission.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                        <Badge variant="outline">{getSubjectLabel(submission.subject)}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <a
                            href={`mailto:${submission.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {submission.email}
                          </a>
                        </div>
                        {submission.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <a
                              href={`tel:${submission.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              {submission.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(submission.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.message}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(submission.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Submission Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Contact Submission from {selectedSubmission?.firstName}{" "}
                {selectedSubmission?.lastName}
              </DialogTitle>
              <DialogDescription>
                Submitted{" "}
                {selectedSubmission &&
                  formatDistanceToNow(new Date(selectedSubmission.createdAt), {
                    addSuffix: true,
                  })}
              </DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Name</label>
                    <p className="mt-1">
                      {selectedSubmission.firstName} {selectedSubmission.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Subject</label>
                    <p className="mt-1">{getSubjectLabel(selectedSubmission.subject)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Email</label>
                    <p className="mt-1">
                      <a
                        href={`mailto:${selectedSubmission.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedSubmission.email}
                      </a>
                    </p>
                  </div>
                  {selectedSubmission.phone && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">Phone</label>
                      <p className="mt-1">
                        <a
                          href={`tel:${selectedSubmission.phone}`}
                          className="text-primary hover:underline"
                        >
                          {selectedSubmission.phone}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Message</label>
                  <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedSubmission.message}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedSubmission.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = `mailto:${selectedSubmission.email}?subject=Re: ${getSubjectLabel(selectedSubmission.subject)}`;
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reply via Email
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

