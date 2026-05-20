"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { approveStep, rejectStep } from "@/app/actions/admin-approvers";

interface ApproverActionButtonsProps {
  bookingId: string;
  stepId: string;
  status: string;
  onSuccess?: (action: "approve" | "reject", comment?: string) => void;
}

export function ApproverActionButtons({
  bookingId,
  stepId,
  status,
  onSuccess,
}: ApproverActionButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  if (status !== "pending") return null;

  const handleApprove = async () => {
    const trimmedComment = approvalComment.trim();

    if (!trimmedComment) {
      toast.error("請填寫備注意見；若無意見請填「無」");
      return;
    }

    setIsLoading(true);
    try {
      await approveStep(bookingId, stepId, trimmedComment);
      toast.success("已核准此階段");
      setIsApproveDialogOpen(false);
      setApprovalComment("");
      router.refresh();
      onSuccess?.("approve", trimmedComment);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "核准失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectStep(bookingId, stepId, rejectionReason);
      toast.success("已拒絕預約");
      setIsRejectDialogOpen(false);
      router.refresh();
      onSuccess?.("reject", rejectionReason.trim() || undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "拒絕失敗");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <AlertDialog
        open={isApproveDialogOpen}
        onOpenChange={(open) => {
          setIsApproveDialogOpen(open);
          if (!open) setApprovalComment("");
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            同意
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>備注意見</AlertDialogTitle>
            <AlertDialogDescription>
              請填寫此階段的審查備註。若同意且沒有其他意見，請填寫「無」。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="approval-comment">備注意見</Label>
            <Textarea
              id="approval-comment"
              placeholder="若無意見請填「無」"
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={(event) => {
                event.preventDefault();
                void handleApprove();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              確認同意
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={isLoading}>
            拒絕
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>拒絕預約申請</AlertDialogTitle>
            <AlertDialogDescription>
              拒絕後，整個預約將被拒絕。您可以填寫拒絕原因（選填）。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="reason">拒絕原因</Label>
            <Textarea
              id="reason"
              placeholder="例如：該時段已有內部會議..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              確認拒絕
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
